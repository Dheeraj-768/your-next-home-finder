
-- Create bookings table
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pg_id uuid NOT NULL REFERENCES public.pg_listings(id) ON DELETE CASCADE,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

-- Owners/admins can view bookings for their PGs
CREATE POLICY "Owners can view bookings for their PGs"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pg_listings
      WHERE pg_listings.id = bookings.pg_id
        AND pg_listings.owner_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

-- Users can create bookings
CREATE POLICY "Users can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete own bookings
CREATE POLICY "Users can delete own bookings"
  ON public.bookings FOR DELETE
  USING (auth.uid() = user_id);

-- Add amenity columns to pg_listings
ALTER TABLE public.pg_listings
  ADD COLUMN IF NOT EXISTS wifi boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS water boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS food boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ac boolean DEFAULT false;

-- Update review policy: only allow reviews if user has a booking
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
CREATE POLICY "Users can create reviews if booked"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.user_id = auth.uid()
        AND bookings.pg_id = reviews.pg_id
    )
  );
