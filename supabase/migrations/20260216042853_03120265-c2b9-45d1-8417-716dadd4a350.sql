
-- Allow anyone to insert FSSAI licenses
CREATE POLICY "Anyone can insert licenses"
ON public.fssai_licenses
FOR INSERT
WITH CHECK (true);
