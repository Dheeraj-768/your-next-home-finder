
-- 1. Unique constraint to prevent duplicate bookings
ALTER TABLE public.bookings ADD CONSTRAINT bookings_user_pg_unique UNIQUE (user_id, pg_id);

-- 2. RLS policy: owners can update bookings for their PGs (accept/reject)
CREATE POLICY "Owners can update bookings for their PGs"
ON public.bookings
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM pg_listings
    WHERE pg_listings.id = bookings.pg_id
    AND pg_listings.owner_id = auth.uid()
  )
);

-- 3. Payment-proofs storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view payment proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs');

-- 4. Owners can update payments for their PGs (verify/reject)
CREATE POLICY "Owners can update payments for their PGs"
ON public.payments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM pg_listings
    WHERE pg_listings.id = payments.pg_id
    AND pg_listings.owner_id = auth.uid()
  )
);

-- 5. Trigger: auto-create notification on new payment
CREATE OR REPLACE FUNCTION public.notify_owner_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _owner_id uuid;
  _pg_title text;
  _user_email text;
BEGIN
  SELECT owner_id, title INTO _owner_id, _pg_title
  FROM public.pg_listings WHERE id = NEW.pg_id;

  SELECT email INTO _user_email
  FROM public.profiles WHERE id = NEW.user_id;

  IF _owner_id IS NOT NULL THEN
    INSERT INTO public.notifications (owner_id, message)
    VALUES (
      _owner_id,
      'Room ' || COALESCE(NEW.room_number, '—') || ' - ' || COALESCE(_user_email, 'User') || ' paid ₹' || NEW.amount || ' for ' || COALESCE(_pg_title, 'PG')
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER payment_notification_trigger
AFTER INSERT ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.notify_owner_on_payment();
