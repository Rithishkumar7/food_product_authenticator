import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Package, Plus, ShieldCheck } from 'lucide-react';

const AddProductPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    productName: '',
    manufacturer: '',
    licenseNumber: '',
    batchNumber: '',
    address: '',
    validUntil: '',
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productName.trim() || !form.manufacturer.trim() || !form.licenseNumber.trim()) {
      toast({ title: 'Missing fields', description: 'Product name, manufacturer, and FSSAI license number are required.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Add to fssai_licenses table
      const { error: licError } = await supabase.from('fssai_licenses').insert({
        license_number: form.licenseNumber.trim(),
        company_name: form.manufacturer.trim(),
        address: form.address.trim() || null,
        valid_until: form.validUntil.trim() || null,
        status: 'active',
      });

      if (licError && !licError.message.includes('duplicate')) {
        throw licError;
      }

      // Add to products table
      const { error: prodError } = await supabase.from('products').insert({
        name: form.productName.trim(),
        manufacturer: form.manufacturer.trim(),
        license_number: form.licenseNumber.trim(),
        batch_number: form.batchNumber.trim() || null,
        status: 'genuine',
        trust_score: 100,
        verification_source: 'user',
        verified_at: new Date().toISOString(),
      });

      if (prodError) throw prodError;

      toast({ title: 'Product added!', description: `${form.productName} has been registered successfully.` });
      setForm({ productName: '', manufacturer: '', licenseNumber: '', batchNumber: '', address: '', validUntil: '' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to add product.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Product</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
              Register a Food Product
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Add a verified food product with its FSSAI license details to our database for future verification.
            </p>
          </div>

          <Card className="max-w-xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Product Details
              </CardTitle>
              <CardDescription>
                Fields marked with * are required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="productName">Product Name *</Label>
                  <Input
                    id="productName"
                    placeholder="e.g., Amul Butter"
                    value={form.productName}
                    onChange={(e) => update('productName', e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer / Company *</Label>
                  <Input
                    id="manufacturer"
                    placeholder="e.g., Gujarat Cooperative Milk Marketing Federation"
                    value={form.manufacturer}
                    onChange={(e) => update('manufacturer', e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="licenseNumber" className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                    FSSAI License Number *
                  </Label>
                  <Input
                    id="licenseNumber"
                    placeholder="e.g., 10020021000123"
                    value={form.licenseNumber}
                    onChange={(e) => update('licenseNumber', e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="batchNumber">Batch Number</Label>
                    <Input
                      id="batchNumber"
                      placeholder="e.g., BT20240101"
                      value={form.batchNumber}
                      onChange={(e) => update('batchNumber', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="validUntil">License Valid Until</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={form.validUntil}
                      onChange={(e) => update('validUntil', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Manufacturer Address</Label>
                  <Input
                    id="address"
                    placeholder="e.g., Anand, Gujarat, India"
                    value={form.address}
                    onChange={(e) => update('address', e.target.value)}
                    disabled={loading}
                  />
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Adding Product...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product to Database
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AddProductPage;
