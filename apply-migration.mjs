/**
 * Run this script to apply the fake_reports migration to your Supabase project.
 * Usage:
 *   node apply-migration.mjs YOUR_SUPABASE_ACCESS_TOKEN
 *
 * Get your access token from:
 *   https://supabase.com/dashboard/account/tokens
 */

const PROJECT_REF = 'klgkwiyopulsmszhgtmw';
const token = process.argv[2];

if (!token) {
  console.error('❌  Usage: node apply-migration.mjs <SUPABASE_ACCESS_TOKEN>');
  console.error('   Get your token from: https://supabase.com/dashboard/account/tokens');
  process.exit(1);
}

const sql = `
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

-- Drop old restricted policy if it exists
DROP POLICY IF EXISTS "Authenticated users can create reports" ON public.fake_reports;
DROP POLICY IF EXISTS "Anyone can create reports" ON public.fake_reports;
DROP POLICY IF EXISTS "Anyone can read reports" ON public.fake_reports;
DROP POLICY IF EXISTS "Admins can update reports" ON public.fake_reports;
DROP POLICY IF EXISTS "Admins can delete reports" ON public.fake_reports;

-- Allow ANYONE (including anonymous) to submit reports
CREATE POLICY "Anyone can create reports"
  ON public.fake_reports FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read reports"
  ON public.fake_reports FOR SELECT USING (true);

CREATE POLICY "Admins can update reports"
  ON public.fake_reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete reports"
  ON public.fake_reports FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── 2. Products deduplication + unique index ───────────────────────────────
DELETE FROM public.products
WHERE id NOT IN (
  SELECT DISTINCT ON (license_number) id
  FROM public.products
  ORDER BY license_number, created_at DESC
);

CREATE UNIQUE INDEX IF NOT EXISTS products_license_number_unique
  ON public.products (license_number)
  WHERE license_number IS NOT NULL;
`;

async function run() {
  console.log('🚀  Applying migration to project:', PROJECT_REF);
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error('❌  API error:', res.status, JSON.stringify(body, null, 2));
    process.exit(1);
  }

  console.log('✅  Migration applied successfully!');
  console.log('    Response:', JSON.stringify(body, null, 2));
}

run().catch((err) => {
  console.error('❌  Unexpected error:', err.message);
  process.exit(1);
});
