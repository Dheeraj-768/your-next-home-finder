
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'pg_owner', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS on user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PG Listings
CREATE TABLE public.pg_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  price NUMERIC NOT NULL,
  amenities TEXT[] DEFAULT '{}',
  gender TEXT DEFAULT 'any',
  occupancy TEXT DEFAULT 'Single',
  vacancies INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pg_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view verified listings" ON public.pg_listings
  FOR SELECT USING (verified = true OR owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can create listings" ON public.pg_listings
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update own listings" ON public.pg_listings
  FOR UPDATE USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can delete own listings" ON public.pg_listings
  FOR DELETE USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

-- PG Images
CREATE TABLE public.pg_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pg_id UUID REFERENCES public.pg_listings(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  is_360 BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pg_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view images" ON public.pg_images FOR SELECT USING (true);
CREATE POLICY "Owners can manage images" ON public.pg_images
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.pg_listings WHERE id = pg_id AND owner_id = auth.uid())
  );
CREATE POLICY "Owners can delete images" ON public.pg_images
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.pg_listings WHERE id = pg_id AND owner_id = auth.uid())
  );

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  pg_id UUID REFERENCES public.pg_listings(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pg_listings_updated_at BEFORE UPDATE ON public.pg_listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for PG images
INSERT INTO storage.buckets (id, name, public) VALUES ('pg-images', 'pg-images', true);

CREATE POLICY "Anyone can view pg images" ON storage.objects FOR SELECT USING (bucket_id = 'pg-images');
CREATE POLICY "Authenticated users can upload pg images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'pg-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete own pg images" ON storage.objects
  FOR DELETE USING (bucket_id = 'pg-images' AND auth.uid()::text = (storage.foldername(name))[1]);
