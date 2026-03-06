import { useState, useRef } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useSubmitFakeReport } from '@/hooks/useProducts';
import { AlertTriangle, Send, Shield, CheckCircle, Upload, X, ImageIcon } from 'lucide-react';

const ReportPage = () => {
  const [productName, setProductName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState('');
  const [purchaseLocation, setPurchaseLocation] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [productImage, setProductImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const submitReport = useSubmitFakeReport();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productName.trim() || !brandName.trim() || !reason.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    submitReport.mutate(
      {
        product_name: productName.trim(),
        brand_name: brandName.trim(),
        reason: reason.trim(),
        evidence: evidence.trim() || undefined,
        purchase_location: purchaseLocation.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast({
            title: "Report submitted successfully",
            description: "Thank you for helping protect consumers. An admin will review your report shortly.",
          });
          setIsSubmitted(true);
        },
        onError: (err: any) => {
          toast({
            title: "Failed to submit report",
            description: err.message || "Something went wrong. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleImageFile = (file: File | null) => {
    if (!file || !file.type.startsWith('image/')) return;
    setProductImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setProductName('');
    setBrandName('');
    setReason('');
    setEvidence('');
    setPurchaseLocation('');
    setProductImage(null);
    setImagePreview(null);
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 py-8 md:py-12">
          <div className="container mx-auto px-4">
            <Card className="max-w-lg mx-auto text-center">
              <CardContent className="pt-12 pb-8">
                <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-success" />
                </div>
                <h2 className="text-2xl font-display font-bold text-foreground mb-3">
                  Report Submitted Successfully
                </h2>
                <p className="text-muted-foreground mb-6">
                  Thank you for helping us maintain food safety.
                  Our admin team will review your report within 24-48 hours.
                </p>
                <Button onClick={handleReset}>Submit Another Report</Button>
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
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-danger/10 text-danger mb-4">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Report Fake Product</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
              Report a Suspicious Food Product
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Help protect other consumers by reporting fake or suspicious food products.
            </p>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Report Details
              </CardTitle>
              <CardDescription>
                Please provide as much detail as possible to help us investigate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="productName">Product Name *</Label>
                    <Input
                      id="productName"
                      placeholder="e.g., Organic Basmati Rice"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brandName">Brand Name *</Label>
                    <Input
                      id="brandName"
                      placeholder="e.g., Natural Foods Co"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchaseLocation">Where did you purchase?</Label>
                  <Input
                    id="purchaseLocation"
                    placeholder="e.g., Local market, Online store"
                    value={purchaseLocation}
                    onChange={(e) => setPurchaseLocation(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Reporting *</Label>
                  <Textarea
                    id="reason"
                    placeholder="Describe why you believe this food product is fake or suspicious..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="evidence">Additional Evidence</Label>
                  <Textarea
                    id="evidence"
                    placeholder="Any additional details, observations, or evidence..."
                    value={evidence}
                    onChange={(e) => setEvidence(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Product Image Upload */}
                <div className="space-y-2">
                  <Label>Product Photo <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  {!imagePreview ? (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingImage(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setIsDraggingImage(false); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingImage(false);
                        handleImageFile(e.dataTransfer.files[0] ?? null);
                      }}
                      className={`flex flex-col items-center justify-center gap-2 w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 select-none ${
                        isDraggingImage
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 hover:bg-muted/40'
                      }`}
                    >
                      <div className={`p-3 rounded-full transition-colors ${
                        isDraggingImage ? 'bg-primary/20' : 'bg-muted'
                      }`}>
                        <Upload className={`w-5 h-5 ${
                          isDraggingImage ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <p className="text-sm text-foreground font-medium">
                        <span className="text-primary">Click to upload</span> or drag &amp; drop
                      </p>
                      <p className="text-xs text-muted-foreground">PNG, JPG or JPEG (max 10 MB)</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageFile(e.target.files?.[0] ?? null)}
                      />
                    </div>
                  ) : (
                    <div className="relative w-full rounded-xl overflow-hidden border border-border bg-muted">
                      <img
                        src={imagePreview}
                        alt="Product photo preview"
                        className="w-full max-h-56 object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => { setProductImage(null); setImagePreview(null); }}
                        className="absolute top-2 right-2 p-1.5 bg-background/90 hover:bg-background rounded-full shadow transition-colors"
                        aria-label="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-1.5 px-3 py-2 border-t border-border bg-background/70">
                        <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate">{productImage?.name}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <Button type="submit" size="lg" className="w-full" disabled={submitReport.isPending}>
                    {submitReport.isPending ? "Submitting Report..." : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Report
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ReportPage;
