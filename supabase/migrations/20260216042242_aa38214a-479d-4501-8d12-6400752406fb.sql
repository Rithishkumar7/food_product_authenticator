
-- Allow anyone to insert products (no auth required)
CREATE POLICY "Anyone can insert products"
ON public.products
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update products (for report counts etc)
CREATE POLICY "Anyone can update products"
ON public.products
FOR UPDATE
USING (true);
