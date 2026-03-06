import { useState } from 'react';
import { ExtractedDetails } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Package } from 'lucide-react';

interface ManualEntryFormProps {
   onSubmit: (details: ExtractedDetails) => void;
   isProcessing?: boolean;
}

export function ManualEntryForm({ onSubmit, isProcessing = false }: ManualEntryFormProps) {
   const [licenseNumber, setLicenseNumber] = useState('');
   const [productName, setProductName] = useState('');
   const [error, setError] = useState('');

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!licenseNumber.trim()) {
         setError('FSSAI License Number is required');
         return;
      }
      setError('');
      onSubmit({
         licenseNumber: licenseNumber.trim(),
         productName: productName.trim() || undefined,
      });
   };

   return (
      <Card className="max-w-xl mx-auto">
         <CardHeader>
            <CardTitle>Enter FSSAI Details</CardTitle>
            <CardDescription>
               Enter the FSSAI license number from the product label to verify authenticity.
            </CardDescription>
         </CardHeader>
         <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
               <div className="space-y-2">
                  <Label htmlFor="productName" className="flex items-center gap-2">
                     <Package className="w-4 h-4 text-muted-foreground" />
                     Brand / Product Name
                  </Label>
                  <Input
                     id="productName"
                     placeholder="e.g., Amul Butter"
                     value={productName}
                     onChange={(e) => setProductName(e.target.value)}
                     disabled={isProcessing}
                  />
               </div>

               <div className="space-y-2">
                  <Label htmlFor="licenseNumber" className="flex items-center gap-2">
                     <FileText className="w-4 h-4 text-muted-foreground" />
                     FSSAI License Number *
                  </Label>
                  <Input
                     id="licenseNumber"
                     placeholder="e.g., 10020021000123"
                     value={licenseNumber}
                     onChange={(e) => { setLicenseNumber(e.target.value); setError(''); }}
                     disabled={isProcessing}
                     className={error ? 'border-danger' : ''}
                  />
                  {error && <p className="text-sm text-danger">{error}</p>}
               </div>

               <Button type="submit" className="w-full" size="lg" disabled={isProcessing}>
                  {isProcessing ? (
                     <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Verifying...
                     </>
                  ) : (
                     'Verify Product'
                  )}
               </Button>
            </form>
         </CardContent>
      </Card>
   );
}
