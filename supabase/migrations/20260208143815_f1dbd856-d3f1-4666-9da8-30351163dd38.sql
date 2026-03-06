
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
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

-- RLS for user_roles: authenticated can read their own
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  license_number TEXT,
  batch_number TEXT,
  license_date DATE,
  trust_score INTEGER DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('genuine', 'suspicious', 'fake', 'pending')),
  is_admin_verified BOOLEAN DEFAULT FALSE,
  verification_source TEXT DEFAULT 'system' CHECK (verification_source IN ('system', 'admin', 'user')),
  verified_at TIMESTAMPTZ,
  report_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Anyone can read products (public feature)
CREATE POLICY "Anyone can read products" ON public.products
  FOR SELECT USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert products" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update
CREATE POLICY "Admins can update products" ON public.products
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete products" ON public.products
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- FSSAI Licenses table
CREATE TABLE public.fssai_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_number TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  address TEXT,
  valid_until DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fssai_licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read licenses" ON public.fssai_licenses
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage licenses" ON public.fssai_licenses
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Blacklisted brands table
CREATE TABLE public.blacklisted_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.blacklisted_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read blacklist" ON public.blacklisted_brands
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage blacklist" ON public.blacklisted_brands
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Seed FSSAI licenses
INSERT INTO public.fssai_licenses (license_number, company_name, address, valid_until, status) VALUES
  ('10020021000123', 'Organic Foods India Pvt Ltd', 'Plot 45, Industrial Area, Pune, Maharashtra', '2026-12-31', 'active'),
  ('10020021000456', 'Fresh Harvest Foods', 'Block C, Food Park, Hyderabad, Telangana', '2025-06-30', 'active'),
  ('10020021000789', 'Nature''s Best Products', 'Unit 12, MIDC, Mumbai, Maharashtra', '2024-03-15', 'expired'),
  ('10020021001122', 'Green Valley Organics', 'Survey 89, Agri Zone, Bangalore, Karnataka', '2027-09-20', 'active'),
  ('10020021001455', 'Pure Earth Foods', 'Plot 78, SEZ, Chennai, Tamil Nadu', '2023-01-01', 'revoked');

-- Seed blacklisted brands
INSERT INTO public.blacklisted_brands (brand_name) VALUES
  ('FakeOrganic Foods'),
  ('Counterfeit Naturals'),
  ('Fraud Foods Inc'),
  ('Bogus Brands Co');

-- Seed sample products
INSERT INTO public.products (name, manufacturer, license_number, batch_number, license_date, trust_score, status, is_admin_verified, verification_source, report_count) VALUES
  ('Organic Basmati Rice', 'Organic Foods India Pvt Ltd', '10020021000123', 'BATCH2024A001', '2024-01-15', 95, 'genuine', true, 'admin', 0),
  ('Premium Wheat Flour', 'Fresh Harvest Foods', '10020021000456', 'WHT2024B045', '2024-02-20', 88, 'genuine', true, 'admin', 1),
  ('Pure Mustard Oil', 'Green Valley Organics', '10020021001122', 'OIL2024G456', '2024-03-01', 92, 'genuine', true, 'admin', 0),
  ('Suspicious Spice Mix', 'Nature''s Best Products', '10020021000789', 'SPX2024A456', '2023-08-15', 45, 'suspicious', false, 'system', 8);
