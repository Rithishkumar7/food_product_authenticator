export type ProductStatus = 'genuine' | 'suspicious' | 'fake' | 'pending';
export type VerificationSource = 'system' | 'admin' | 'user';

export interface Product {
  id: string;
  name: string;
  manufacturer: string;
  licenseNumber: string;
  batchNumber: string;
  licenseDate: string;
  imageUrl?: string;
  trustScore: number;
  status: ProductStatus;
  isAdminVerified: boolean;
  verificationSource: VerificationSource;
  verifiedAt?: string;
  reportCount: number;
  createdAt: string;
  extractedDetails?: ExtractedDetails;
}

export interface ExtractedDetails {
  licenseNumber?: string;
  manufacturer?: string;
  batchNumber?: string;
  licenseDate?: string;
  productName?: string;
  ingredients?: string[];
  netWeight?: string;
  mrp?: string;
}

export interface VerificationResult {
  isValid: boolean;
  trustScore: number;
  status: ProductStatus;
  checks: VerificationCheck[];
  recommendations: string[];
  warnings: string[];
}

export interface VerificationCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

export interface FakeReport {
  id: string;
  productId: string;
  reportedBy: string;
  reason: string;
  evidence?: string;
  status: 'pending' | 'confirmed' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface FSSAILicense {
  licenseNumber: string;
  companyName: string;
  address: string;
  validUntil: string;
  status: 'active' | 'expired' | 'revoked';
}
