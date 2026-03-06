import { VerificationResult, ExtractedDetails } from '@/types/product';
import { TrustScore } from './TrustScore';
import { StatusBadge } from './StatusBadge';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  FileText,
  Building2,
  Hash,
  Calendar,
  ShieldCheck,
  AlertOctagon,
  Scale,
  Tag,
  Leaf
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface VerificationResultsProps {
  result: VerificationResult;
  details: ExtractedDetails;
  onReport?: () => void;
  onReset?: () => void;
}

export function VerificationResults({ result, details, onReport, onReset }: VerificationResultsProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="w-4 h-4 text-danger" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      default:
        return <CheckCircle className="w-4 h-4 text-success" />;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Main Result Card */}
      <Card className={cn(
        "border-2 overflow-hidden",
        result.status === 'genuine' && "border-success/30",
        result.status === 'suspicious' && "border-warning/30",
        result.status === 'fake' && "border-danger/30"
      )}>
        <div className={cn(
          "p-6",
          result.status === 'genuine' && "bg-success/5",
          result.status === 'suspicious' && "bg-warning/5",
          result.status === 'fake' && "bg-danger/5"
        )}>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <TrustScore score={result.trustScore} size="lg" />
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <h3 className="text-2xl font-display font-bold text-foreground">
                  Verification Complete
                </h3>
                <StatusBadge status={result.status} size="lg" />
              </div>
              <p className="text-muted-foreground">
                {result.status === 'genuine' && "This food product has passed our FSSAI verification checks."}
                {result.status === 'suspicious' && "This food product requires further investigation."}
                {result.status === 'fake' && "This food product failed FSSAI verification. Do not purchase."}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Extracted Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-primary" />
            Extracted Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {details.productName && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Product Name</p>
                  <p className="font-medium">{details.productName}</p>
                </div>
              </div>
            )}
            {details.manufacturer && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Manufacturer</p>
                  <p className="font-medium">{details.manufacturer}</p>
                </div>
              </div>
            )}
            {details.licenseNumber && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <ShieldCheck className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">FSSAI License</p>
                  <p className="font-medium font-mono">{details.licenseNumber}</p>
                </div>
              </div>
            )}
            {details.batchNumber && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Hash className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Batch Number</p>
                  <p className="font-medium font-mono">{details.batchNumber}</p>
                </div>
              </div>
            )}
            {details.licenseDate && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">License Date</p>
                  <p className="font-medium">{details.licenseDate}</p>
                </div>
              </div>
            )}
            {details.mrp && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Tag className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">MRP</p>
                  <p className="font-medium">{details.mrp}</p>
                </div>
              </div>
            )}
            {details.netWeight && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Scale className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Net Weight</p>
                  <p className="font-medium">{details.netWeight}</p>
                </div>
              </div>
            )}
          </div>
          {details.ingredients && details.ingredients.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50">
              <div className="flex items-start gap-3">
                <Leaf className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Ingredients</p>
                  <p className="text-sm font-medium">{details.ingredients.join(', ')}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Checks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Verification Checks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {result.checks.map((check, index) => (
              <div 
                key={index}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border",
                  check.passed 
                    ? "bg-success/5 border-success/20" 
                    : check.severity === 'warning'
                      ? "bg-warning/5 border-warning/20"
                      : "bg-danger/5 border-danger/20"
                )}
              >
                {getSeverityIcon(check.passed ? 'info' : check.severity)}
                <div className="flex-1">
                  <p className="font-medium text-sm">{check.name}</p>
                  <p className="text-xs text-muted-foreground">{check.message}</p>
                </div>
                {check.passed ? (
                  <span className="text-xs font-medium text-success">PASSED</span>
                ) : (
                  <span className={cn(
                    "text-xs font-medium",
                    check.severity === 'warning' ? "text-warning" : "text-danger"
                  )}>FAILED</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <Card className="border-danger/30">
          <CardHeader className="bg-danger/5">
            <CardTitle className="flex items-center gap-2 text-lg text-danger">
              <AlertOctagon className="w-5 h-5" />
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="space-y-2">
              {result.warnings.map((warning, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-danger mt-0.5 shrink-0" />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="w-5 h-5 text-primary" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {result.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={onReset} variant="outline" size="lg">
          Verify Another Product
        </Button>
        {result.status !== 'genuine' && (
          <Button onClick={onReport} variant="destructive" size="lg">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Report This Product
          </Button>
        )}
      </div>
    </div>
  );
}
