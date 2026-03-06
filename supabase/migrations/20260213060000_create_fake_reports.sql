-- Create fake_reports table for user-submitted reports
CREATE TABLE IF NOT EXISTS public.fake_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  evidence TEXT,
  purchase_location TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'confirmed', 'rejected')),
  reporter_id UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fake_reports ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can insert reports
CREATE POLICY "Authenticated users can create reports"
  ON public.fake_reports FOR INSERT TO authenticated
  WITH CHECK (true);

-- Anyone can read reports (for admin dashboard)
CREATE POLICY "Anyone can read reports"
  ON public.fake_reports FOR SELECT
  USING (true);

-- Only admins can update reports (review/resolve)
CREATE POLICY "Admins can update reports"
  ON public.fake_reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete reports
CREATE POLICY "Admins can delete reports"
  ON public.fake_reports FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
