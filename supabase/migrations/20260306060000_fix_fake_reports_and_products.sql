-- Combined migration: create fake_reports table (if not done already) and
-- also apply the products deduplication + unique index from the previous pending migration.

-- ── 1. fake_reports table ──────────────────────────────────────────────────

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

ALTER TABLE public.fake_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing insert policy if it was already created with wrong scope
DROP POLICY IF EXISTS "Authenticated users can create reports" ON public.fake_reports;

-- Allow ANYONE (including anonymous users) to submit a fake report
CREATE POLICY "Anyone can create reports"
  ON public.fake_reports FOR INSERT
  WITH CHECK (true);

-- Anyone can read reports (for admin dashboard)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'fake_reports' AND policyname = 'Anyone can read reports'
  ) THEN
    CREATE POLICY "Anyone can read reports"
      ON public.fake_reports FOR SELECT
      USING (true);
  END IF;
END $$;

-- Only admins can update reports
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'fake_reports' AND policyname = 'Admins can update reports'
  ) THEN
    CREATE POLICY "Admins can update reports"
      ON public.fake_reports FOR UPDATE TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Only admins can delete reports
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'fake_reports' AND policyname = 'Admins can delete reports'
  ) THEN
    CREATE POLICY "Admins can delete reports"
      ON public.fake_reports FOR DELETE TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- ── 2. Products deduplication + unique index ───────────────────────────────

-- Delete older duplicate products (keep newest per license_number)
DELETE FROM public.products
WHERE id NOT IN (
  SELECT DISTINCT ON (license_number) id
  FROM public.products
  ORDER BY license_number, created_at DESC
);

-- Add unique partial index on license_number (non-null only)
CREATE UNIQUE INDEX IF NOT EXISTS products_license_number_unique
  ON public.products (license_number)
  WHERE license_number IS NOT NULL;
