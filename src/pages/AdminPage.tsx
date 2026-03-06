import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useProducts, useUpdateProduct, useFakeReports, useUpdateFakeReport } from '@/hooks/useProducts';
import { EditProductDialog } from '@/components/EditProductDialog';
import { Product } from '@/types/product';
import { Package, Plus, ShieldCheck, LogOut, Lock, Pencil, FileWarning, CheckCircle2, Ban, ChevronDown, ChevronUp } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const AdminPage = () => {
  const { isAdmin, loading, login, logout } = useAdminAuth();
  const { toast } = useToast();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: reports = [], isLoading: reportsLoading } = useFakeReports();
  const updateProduct = useUpdateProduct();
  const updateReport = useUpdateFakeReport();
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [form, setForm] = useState({
    productName: '',
    manufacturer: '',
    licenseNumber: '',
    batchNumber: '',
    address: '',
    validUntil: '',
    trustScore: '100',
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    const { error } = await login(loginForm.email, loginForm.password);
    setLoginLoading(false);
    if (error) {
      toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Welcome back', description: 'You are logged in as admin.' });
    }
  };

  const handleLogout = async () => {
    await logout();
    toast({ title: 'Logged out' });
  };

  const handleEditSave = async (id: string, updates: {
    name?: string;
    manufacturer?: string;
    license_number?: string;
    batch_number?: string | null;
    trust_score?: number;
    status?: string;
  }) => {
    await updateProduct.mutateAsync({ id, ...updates });
    toast({ title: 'Product updated' });
    setEditDialogOpen(false);
    setEditProduct(null);
  };

  // ── Report action handler ────────────────────────────────────────────────
  const handleReportAction = async (reportId: string, action: 'confirm' | 'reject', productName: string, brandName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const now = new Date().toISOString();
    const notes = adminNotes[reportId] ?? '';

    await updateReport.mutateAsync({
      id: reportId,
      status: action === 'confirm' ? 'confirmed' : 'rejected',
      admin_notes: notes || null,
      reviewed_by: user?.id ?? undefined,
      reviewed_at: now,
    });

    if (action === 'confirm') {
      // Find matching product and reduce trust score by 20 (min 0)
      const matched = products.find(
        (p) =>
          p.name.toLowerCase().includes(productName.toLowerCase()) ||
          productName.toLowerCase().includes(p.name.toLowerCase()) ||
          p.manufacturer.toLowerCase().includes(brandName.toLowerCase()) ||
          brandName.toLowerCase().includes(p.manufacturer.toLowerCase())
      );
      if (matched) {
        const newScore = Math.max(0, (matched.trustScore ?? 50) - 20);
        const newStatus = newScore <= 20 ? 'fake' : newScore <= 50 ? 'suspicious' : matched.status;
        await updateProduct.mutateAsync({
          id: matched.id,
          trust_score: newScore,
          status: newStatus,
        });
        toast({
          title: 'Report confirmed',
          description: `Trust score for "${matched.name}" reduced to ${newScore}${newStatus !== matched.status ? ` and status changed to "${newStatus}"` : ''}.`,
        });
      } else {
        toast({ title: 'Report confirmed', description: 'No matching product found to adjust score.' });
      }
    } else {
      toast({ title: 'Report rejected' });
    }

    setExpandedReport(null);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productName.trim() || !form.manufacturer.trim() || !form.licenseNumber.trim()) {
      toast({ title: 'Missing fields', description: 'Product name, manufacturer, and FSSAI license number are required.', variant: 'destructive' });
      return;
    }

    const trustScore = Math.min(100, Math.max(0, parseInt(form.trustScore, 10) || 100));

    setAddLoading(true);
    try {
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

      const { error: prodError } = await supabase.from('products').insert({
        name: form.productName.trim(),
        manufacturer: form.manufacturer.trim(),
        license_number: form.licenseNumber.trim(),
        batch_number: form.batchNumber.trim() || null,
        status: 'genuine',
        trust_score: trustScore,
        verification_source: 'admin',
        verified_at: new Date().toISOString(),
        is_admin_verified: true,
      });

      if (prodError) throw prodError;

      toast({ title: 'Product added', description: `${form.productName} has been registered with trust score ${trustScore}.` });
      setForm({ ...form, productName: '', manufacturer: '', licenseNumber: '', batchNumber: '', address: '', validUntil: '', trustScore: '100' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add product.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setAddLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 py-12 md:py-20">
          <div className="container mx-auto px-4 max-w-sm">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 text-primary">
                  <Lock className="w-5 h-5" />
                  <CardTitle>Admin Login</CardTitle>
                </div>
                <CardDescription>Sign in to add products and manage trust scores.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
                      disabled={loginLoading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                      disabled={loginLoading}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loginLoading}>
                    {loginLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    ) : (
                      'Sign in'
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
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">Add products and set trust scores.</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Add Product
              </CardTitle>
              <CardDescription>Only admins can add products. Set trust score (0–100) for users.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="productName">Product Name *</Label>
                  <Input
                    id="productName"
                    placeholder="e.g., Amul Butter"
                    value={form.productName}
                    onChange={(e) => update('productName', e.target.value)}
                    disabled={addLoading}
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
                    disabled={addLoading}
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
                    disabled={addLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trustScore">Trust Score (0–100)</Label>
                  <Input
                    id="trustScore"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="100"
                    value={form.trustScore}
                    onChange={(e) => update('trustScore', e.target.value)}
                    disabled={addLoading}
                  />
                  <p className="text-xs text-muted-foreground">Helps users assess product authenticity. Default: 100.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="batchNumber">Batch Number</Label>
                    <Input
                      id="batchNumber"
                      placeholder="e.g., BT20240101"
                      value={form.batchNumber}
                      onChange={(e) => update('batchNumber', e.target.value)}
                      disabled={addLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="validUntil">License Valid Until</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={form.validUntil}
                      onChange={(e) => update('validUntil', e.target.value)}
                      disabled={addLoading}
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
                    disabled={addLoading}
                  />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={addLoading}>
                  {addLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-primary" />
                Edit Products
              </CardTitle>
              <CardDescription>View and edit existing products. Change trust score and status.</CardDescription>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <p className="text-muted-foreground text-sm py-6">Loading products...</p>
              ) : products.length === 0 ? (
                <p className="text-muted-foreground text-sm py-6">No products yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Manufacturer</TableHead>
                        <TableHead>FSSAI</TableHead>
                        <TableHead>Trust</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{p.manufacturer}</TableCell>
                          <TableCell className="font-mono text-xs">{p.licenseNumber || '-'}</TableCell>
                          <TableCell>{p.trustScore ?? '-'}</TableCell>
                          <TableCell>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                              p.status === 'genuine' ? 'bg-green-100 text-green-800' :
                              p.status === 'suspicious' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {p.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditProduct(p);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Reports Section ───────────────────────────────────────────── */}
          <Card className="mt-10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileWarning className="w-5 h-5 text-destructive" />
                User Reports
                {reports.filter((r) => r.status === 'pending').length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-destructive text-destructive-foreground">
                    {reports.filter((r) => r.status === 'pending').length} pending
                  </span>
                )}
              </CardTitle>
              <CardDescription>Review and action user-submitted fake product reports. Approving a report automatically reduces the product's trust score by 20 points.</CardDescription>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <p className="text-muted-foreground text-sm py-6">Loading reports...</p>
              ) : reports.length === 0 ? (
                <p className="text-muted-foreground text-sm py-6">No reports submitted yet.</p>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => {
                    const isExpanded = expandedReport === report.id;
                    const isPending = report.status === 'pending';
                    const statusColors: Record<string, string> = {
                      pending: 'bg-yellow-100 text-yellow-800',
                      reviewed: 'bg-blue-100 text-blue-800',
                      confirmed: 'bg-red-100 text-red-800',
                      rejected: 'bg-gray-100 text-gray-600',
                    };
                    return (
                      <div key={report.id} className="border rounded-lg overflow-hidden">
                        {/* Header row */}
                        <button
                          type="button"
                          onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/60 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[report.status] ?? 'bg-muted text-muted-foreground'}`}>
                              {report.status}
                            </span>
                            <span className="font-medium text-sm truncate">{report.product_name}</span>
                            <span className="text-xs text-muted-foreground truncate hidden sm:block">by {report.brand_name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-xs text-muted-foreground hidden md:block">
                              {new Date(report.created_at).toLocaleDateString()}
                            </span>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                          </div>
                        </button>

                        {/* Expanded detail panel */}
                        {isExpanded && (
                          <div className="px-4 py-4 border-t space-y-4">
                            <div className="grid sm:grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-0.5">Product</p>
                                <p className="font-medium">{report.product_name}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-0.5">Brand</p>
                                <p>{report.brand_name}</p>
                              </div>
                              {report.purchase_location && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-0.5">Purchase Location</p>
                                  <p>{report.purchase_location}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-0.5">Submitted</p>
                                <p>{new Date(report.created_at).toLocaleString()}</p>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Reason</p>
                              <p className="text-sm bg-muted rounded-md px-3 py-2">{report.reason}</p>
                            </div>

                            {report.admin_notes && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Admin Notes</p>
                                <p className="text-sm bg-muted rounded-md px-3 py-2 text-muted-foreground">{report.admin_notes}</p>
                              </div>
                            )}

                            {isPending && (
                              <>
                                <div className="space-y-1">
                                  <Label htmlFor={`notes-${report.id}`} className="text-xs">Admin Notes (optional)</Label>
                                  <Textarea
                                    id={`notes-${report.id}`}
                                    placeholder="Add a note about this report..."
                                    rows={2}
                                    value={adminNotes[report.id] ?? ''}
                                    onChange={(e) =>
                                      setAdminNotes((prev) => ({ ...prev, [report.id]: e.target.value }))
                                    }
                                  />
                                </div>
                                <div className="flex gap-3">
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleReportAction(report.id, 'confirm', report.product_name, report.brand_name)}
                                    disabled={updateReport.isPending || updateProduct.isPending}
                                  >
                                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                    Approve &amp; Reduce Score
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleReportAction(report.id, 'reject', report.product_name, report.brand_name)}
                                    disabled={updateReport.isPending || updateProduct.isPending}
                                  >
                                    <Ban className="w-4 h-4 mr-1.5" />
                                    Reject
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <EditProductDialog
            product={editProduct}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onSave={handleEditSave}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminPage;
