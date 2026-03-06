import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ImageUpload } from '@/components/ImageUpload';
import { ManualEntryForm } from '@/components/ManualEntryForm';
import { VerificationResults } from '@/components/VerificationResults';
import { ReportDialog } from '@/components/ReportDialog';
import { performOCR, prewarmOCR } from '@/lib/ocr';
import { verifyProduct } from '@/lib/verification';
import { ExtractedDetails, VerificationResult } from '@/types/product';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Camera, CheckCircle, Zap, FileText, Edit } from 'lucide-react';

const VerifyPage = () => {
  useEffect(() => { prewarmOCR(); }, []);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [extractedDetails, setExtractedDetails] = useState<ExtractedDetails | null>(null);
  const [rawOcrText, setRawOcrText] = useState<string | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);

  const handleImageSelect = async (file: File) => {
    setIsProcessing(true);
    setResult(null);
    setRawOcrText(null);
    setOcrProgress('Preprocessing image...');

    try {
      const { details, rawText } = await performOCR(file, (msg) => setOcrProgress(msg));
      setExtractedDetails(details);
      setRawOcrText(rawText);

      setOcrProgress('Verifying product details...');
      const verificationResult = await verifyProduct(details);
      // Update product name from DB if found
      if (verificationResult.companyName && !details.productName) {
        details.productName = verificationResult.companyName;
        setExtractedDetails({ ...details });
      }
      setResult(verificationResult);
    } catch (error) {
      console.error('Verification failed:', error);
      setOcrProgress('OCR failed. Please try with a clearer image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualEntry = async (details: ExtractedDetails) => {
    setIsProcessing(true);
    setResult(null);
    setRawOcrText(null);
    setOcrProgress('Verifying product details...');

    try {
      setExtractedDetails(details);
      const verificationResult = await verifyProduct(details);
      if (verificationResult.companyName && !details.productName) {
        details.productName = verificationResult.companyName;
        setExtractedDetails({ ...details });
      }
      setResult(verificationResult);
    } catch (error) {
      console.error('Verification failed:', error);
      setOcrProgress('Verification failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setExtractedDetails(null);
    setRawOcrText(null);
    setOcrProgress('');
  };

  const steps = [
    {
      icon: Camera,
      title: 'Upload Image',
      description: 'Take a clear photo of the product label'
    },
    {
      icon: Zap,
      title: 'OCR Analysis',
      description: 'Tesseract OCR extracts text & numbers'
    },
    {
      icon: CheckCircle,
      title: 'Verification',
      description: 'Get instant trust score and status'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Product Verification</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
              Verify Product Authenticity
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Verify food products by scanning the label or entering details manually.
              Our system validates FSSAI licenses, certifications, and manufacturer information.
            </p>
          </div>

          {/* Steps */}
          {!result && (
            <div className="grid md:grid-cols-3 gap-4 mb-10 max-w-3xl mx-auto">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <step.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Verification Methods - Tabs */}
          {!result && (
            <Tabs defaultValue="scan" className="max-w-2xl mx-auto">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="scan" className="gap-2">
                  <Camera className="w-4 h-4" />
                  Scan Image
                </TabsTrigger>
                <TabsTrigger value="manual" className="gap-2">
                  <Edit className="w-4 h-4" />
                  Manual Entry
                </TabsTrigger>
              </TabsList>

              <TabsContent value="scan">
                <Card>
                  <CardHeader>
                    <CardTitle>Upload Product Label</CardTitle>
                    <CardDescription>
                      Upload a clear image of the product's back side showing FSSAI license,
                      batch number, and other details. Ensure numbers are clearly visible.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ImageUpload
                      onImageSelect={handleImageSelect}
                      isProcessing={isProcessing}
                    />
                    {isProcessing && ocrProgress && (
                      <p className="text-center text-sm text-primary mt-4 animate-pulse">
                        {ocrProgress}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="manual">
                <ManualEntryForm
                  onSubmit={handleManualEntry}
                  isProcessing={isProcessing}
                />
                {isProcessing && ocrProgress && (
                  <p className="text-center text-sm text-primary mt-4 animate-pulse">
                    {ocrProgress}
                  </p>
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Raw OCR Text (debug/transparency) */}
          {rawOcrText && result && (
            <Card className="max-w-2xl mx-auto mb-6 mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="w-4 h-4 text-primary" />
                  OCR Extracted Text
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono text-muted-foreground max-h-48 overflow-y-auto">
                  {rawOcrText}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Results Section */}
          {result && extractedDetails && (
            <VerificationResults
              result={result}
              details={extractedDetails}
              onReport={() => setShowReportDialog(true)}
              onReset={handleReset}
            />
          )}
        </div>
      </main>

      <Footer />

      <ReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        productName={extractedDetails?.productName}
      />
    </div>
  );
};

export default VerifyPage;
