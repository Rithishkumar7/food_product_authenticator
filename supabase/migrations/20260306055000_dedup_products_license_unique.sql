-- Remove duplicate products rows keeping only the most recently-created one
-- per license_number, then add a unique constraint so future upserts work correctly.

-- Step 1: Delete older duplicates (keep the row with the latest created_at per license_number)
DELETE FROM public.products
WHERE id NOT IN (
  SELECT DISTINCT ON (license_number) id
  FROM public.products
  ORDER BY license_number, created_at DESC
);

-- Step 2: Add unique constraint on license_number (only for non-null values)
CREATE UNIQUE INDEX products_license_number_unique
  ON public.products (license_number)
  WHERE license_number IS NOT NULL;
