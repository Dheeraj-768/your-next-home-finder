
-- Create payments table
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pg_id uuid NOT NULL,
  room_number text,
  amount numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  proof_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  payment_date timestamptz
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can view payments for their PGs"
  ON public.payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM pg_listings WHERE pg_listings.id = payments.pg_id AND pg_listings.owner_id = auth.uid()
  ));

CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update payments"
  ON public.payments FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all notifications"
  ON public.notifications FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
