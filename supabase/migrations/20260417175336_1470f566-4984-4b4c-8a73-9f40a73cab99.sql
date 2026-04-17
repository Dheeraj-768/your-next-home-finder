
-- =========================================
-- 1. TABLES
-- =========================================

CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pg_id uuid NOT NULL REFERENCES public.pg_listings(id) ON DELETE CASCADE,
  room_number text NOT NULL,
  total_beds int NOT NULL CHECK (total_beds > 0 AND total_beds <= 20),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pg_id, room_number)
);

CREATE TYPE bed_status AS ENUM ('available', 'reserved', 'booked');
CREATE TYPE reservation_status AS ENUM ('active', 'expired', 'completed', 'cancelled');
CREATE TYPE bed_booking_status AS ENUM ('pending', 'confirmed', 'cancelled');

CREATE TABLE public.beds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  bed_number int NOT NULL,
  status bed_status NOT NULL DEFAULT 'available',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, bed_number)
);
CREATE INDEX idx_beds_room_id ON public.beds(room_id);
CREATE INDEX idx_beds_status ON public.beds(status);

CREATE TABLE public.bed_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bed_id uuid NOT NULL REFERENCES public.beds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  status reservation_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_reservations_expires_at ON public.bed_reservations(expires_at) WHERE status = 'active';
CREATE INDEX idx_reservations_user ON public.bed_reservations(user_id);
CREATE INDEX idx_reservations_bed ON public.bed_reservations(bed_id);
-- Only one active reservation per bed at a time
CREATE UNIQUE INDEX idx_one_active_reservation_per_bed
  ON public.bed_reservations(bed_id) WHERE status = 'active';

CREATE TABLE public.bed_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bed_id uuid NOT NULL REFERENCES public.beds(id) ON DELETE RESTRICT,
  reservation_id uuid REFERENCES public.bed_reservations(id) ON DELETE SET NULL,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  status bed_booking_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_bed_bookings_user ON public.bed_bookings(user_id);
CREATE INDEX idx_bed_bookings_bed ON public.bed_bookings(bed_id);

-- =========================================
-- 2. ENABLE RLS
-- =========================================
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bed_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bed_bookings ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 3. RLS POLICIES
-- =========================================

-- rooms
CREATE POLICY "Anyone can view rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Owners manage own rooms" ON public.rooms FOR ALL
  USING (EXISTS (SELECT 1 FROM public.pg_listings WHERE id = rooms.pg_id AND owner_id = auth.uid())
         OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pg_listings WHERE id = rooms.pg_id AND owner_id = auth.uid())
              OR public.has_role(auth.uid(), 'admin'));

-- beds (status changes go through SECURITY DEFINER functions; deny direct UPDATE except for owners)
CREATE POLICY "Anyone can view beds" ON public.beds FOR SELECT USING (true);
CREATE POLICY "Owners manage own beds" ON public.beds FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.rooms r
    JOIN public.pg_listings p ON p.id = r.pg_id
    WHERE r.id = beds.room_id AND (p.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.rooms r
    JOIN public.pg_listings p ON p.id = r.pg_id
    WHERE r.id = beds.room_id AND (p.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  ));

-- bed_reservations
CREATE POLICY "Users view own reservations" ON public.bed_reservations FOR SELECT
  USING (user_id = auth.uid()
         OR EXISTS (SELECT 1 FROM public.beds b JOIN public.rooms r ON r.id = b.room_id
                    JOIN public.pg_listings p ON p.id = r.pg_id
                    WHERE b.id = bed_reservations.bed_id AND p.owner_id = auth.uid())
         OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users cancel own reservations" ON public.bed_reservations FOR UPDATE
  USING (user_id = auth.uid());
-- INSERT goes via reserve_bed() SECURITY DEFINER only (no direct insert policy)

-- bed_bookings
CREATE POLICY "Users view own bed bookings" ON public.bed_bookings FOR SELECT
  USING (user_id = auth.uid()
         OR EXISTS (SELECT 1 FROM public.beds b JOIN public.rooms r ON r.id = b.room_id
                    JOIN public.pg_listings p ON p.id = r.pg_id
                    WHERE b.id = bed_bookings.bed_id AND p.owner_id = auth.uid())
         OR public.has_role(auth.uid(), 'admin'));

-- =========================================
-- 4. AUTO-GENERATE BEDS WHEN ROOM IS CREATED
-- =========================================
CREATE OR REPLACE FUNCTION public.generate_beds_for_room()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE i int;
BEGIN
  FOR i IN 1..NEW.total_beds LOOP
    INSERT INTO public.beds (room_id, bed_number) VALUES (NEW.id, i);
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_beds
AFTER INSERT ON public.rooms
FOR EACH ROW EXECUTE FUNCTION public.generate_beds_for_room();

-- =========================================
-- 5. ATOMIC RESERVE BED (race-condition safe)
-- =========================================
CREATE OR REPLACE FUNCTION public.reserve_bed(_bed_id uuid)
RETURNS public.bed_reservations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _bed public.beds;
  _res public.bed_reservations;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- Lock bed row to prevent races
  SELECT * INTO _bed FROM public.beds WHERE id = _bed_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Bed not found'; END IF;

  -- Cancel this user's other active reservations (one selection at a time)
  UPDATE public.bed_reservations
    SET status = 'cancelled'
    WHERE user_id = _uid AND status = 'active' AND bed_id <> _bed_id;
  -- Free those beds
  UPDATE public.beds SET status = 'available', updated_at = now()
    WHERE id IN (SELECT bed_id FROM public.bed_reservations
                 WHERE user_id = _uid AND status = 'cancelled' AND bed_id <> _bed_id)
    AND status = 'reserved';

  IF _bed.status <> 'available' THEN
    RAISE EXCEPTION 'Bed is not available' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.bed_reservations (bed_id, user_id, expires_at, status)
  VALUES (_bed_id, _uid, now() + interval '3 minutes', 'active')
  RETURNING * INTO _res;

  UPDATE public.beds SET status = 'reserved', updated_at = now() WHERE id = _bed_id;

  RETURN _res;
END;
$$;

-- =========================================
-- 6. RELEASE OWN RESERVATION
-- =========================================
CREATE OR REPLACE FUNCTION public.release_reservation(_reservation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _res public.bed_reservations;
BEGIN
  SELECT * INTO _res FROM public.bed_reservations
    WHERE id = _reservation_id AND user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  IF _res.status = 'active' THEN
    UPDATE public.bed_reservations SET status = 'cancelled' WHERE id = _reservation_id;
    UPDATE public.beds SET status = 'available', updated_at = now()
      WHERE id = _res.bed_id AND status = 'reserved';
  END IF;
END;
$$;

-- =========================================
-- 7. CONFIRM BOOKING (after payment proof submitted)
-- =========================================
CREATE OR REPLACE FUNCTION public.confirm_bed_booking(_reservation_id uuid, _payment_id uuid)
RETURNS public.bed_bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _res public.bed_reservations;
  _bk public.bed_bookings;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO _res FROM public.bed_reservations
    WHERE id = _reservation_id AND user_id = _uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reservation not found'; END IF;
  IF _res.status <> 'active' THEN RAISE EXCEPTION 'Reservation no longer active'; END IF;
  IF _res.expires_at < now() THEN RAISE EXCEPTION 'Reservation expired'; END IF;

  UPDATE public.bed_reservations SET status = 'completed' WHERE id = _reservation_id;
  UPDATE public.beds SET status = 'booked', updated_at = now() WHERE id = _res.bed_id;

  INSERT INTO public.bed_bookings (user_id, bed_id, reservation_id, payment_id, status)
  VALUES (_uid, _res.bed_id, _reservation_id, _payment_id, 'pending')
  RETURNING * INTO _bk;

  RETURN _bk;
END;
$$;

-- =========================================
-- 8. CLEANUP EXPIRED RESERVATIONS
-- =========================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _count int;
BEGIN
  WITH expired AS (
    UPDATE public.bed_reservations
      SET status = 'expired'
      WHERE status = 'active' AND expires_at < now()
      RETURNING bed_id
  )
  UPDATE public.beds SET status = 'available', updated_at = now()
    WHERE id IN (SELECT bed_id FROM expired) AND status = 'reserved';
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

-- =========================================
-- 9. REALTIME
-- =========================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.beds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bed_reservations;

-- =========================================
-- 10. CRON JOB (every 30s)
-- =========================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'cleanup-expired-bed-reservations',
  '30 seconds',
  $$ SELECT public.cleanup_expired_reservations(); $$
);
