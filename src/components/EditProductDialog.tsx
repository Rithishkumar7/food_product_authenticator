import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Product } from '@/types/product';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EditProductDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: {
    name?: string;
    manufacturer?: string;
    license_number?: string;
    batch_number?: string | null;
    trust_score?: number;
    status?: string;
  }) => Promise<void>;
}

export function EditProductDialog({
  product,
  open,
  onOpenChange,
  onSave,
}: EditProductDialogProps) {
  const [form, setForm] = useState({
    name: '',
    manufacturer: '',
    licenseNumber: '',
    batchNumber: '',
    trustScore: '100',
    status: 'genuine',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        manufacturer: product.manufacturer,
        licenseNumber: product.licenseNumber || '',
        batchNumber: product.batchNumber || '',
        trustScore: String(product.trustScore ?? 100),
        status: product.status || 'genuine',
      });
    }
  }, [product]);

  const update = (field: string, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const trustScore = Math.min(100, Math.max(0, parseInt(form.trustScore, 10) || 100));
    setSaving(true);
    try {
      await onSave(product.id, {
        name: form.name.trim(),
        manufacturer: form.manufacturer.trim(),
        license_number: form.licenseNumber.trim() || undefined,
        batch_number: form.batchNumber.trim() || null,
        trust_score: trustScore,
        status: form.status,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>Update product details and trust score.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Product Name</Label>
            <Input
              id="edit-name"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              disabled={saving}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-manufacturer">Manufacturer</Label>
            <Input
              id="edit-manufacturer"
              value={form.manufacturer}
              onChange={(e) => update('manufacturer', e.target.value)}
              disabled={saving}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-license">FSSAI License Number</Label>
            <Input
              id="edit-license"
              value={form.licenseNumber}
              onChange={(e) => update('licenseNumber', e.target.value)}
              disabled={saving}
              placeholder="14 digits"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-batch">Batch Number</Label>
            <Input
              id="edit-batch"
              value={form.batchNumber}
              onChange={(e) => update('batchNumber', e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-trust">Trust Score (0–100)</Label>
            <Input
              id="edit-trust"
              type="number"
              min={0}
              max={100}
              value={form.trustScore}
              onChange={(e) => update('trustScore', e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => update('status', v)}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="genuine">Genuine</SelectItem>
                <SelectItem value="suspicious">Suspicious</SelectItem>
                <SelectItem value="fake">Fake</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
