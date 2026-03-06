import { supabase } from '@/integrations/supabase/client';
import {
  ExtractedDetails,
  VerificationResult,
  VerificationCheck,
  ProductStatus,
} from '@/types/product';

async function validateFSSAILicenseFromDB(licenseNumber: string) {
  const { data } = await supabase
    .from('fssai_licenses')
    .select('*')
    .eq('license_number', licenseNumber)
    .maybeSingle();
  return data;
}

/**
 * Verifies product based solely on FSSAI license number.
 * If license exists in DB and is active -> genuine (100).
 * Otherwise -> fake (0).
 */
export async function verifyProduct(
  details: ExtractedDetails
): Promise<VerificationResult & { companyName?: string }> {
  const checks: VerificationCheck[] = [];
  let companyName: string | undefined;
  let trustScore = 0;
  let status: ProductStatus = 'fake';

  if (!details.licenseNumber || details.licenseNumber.trim().length < 10) {
    checks.push({
      name: 'FSSAI License',
      passed: false,
      message: 'No valid FSSAI license number found',
      severity: 'error',
    });
    return {
      isValid: false,
      trustScore: 0,
      status: 'fake',
      checks,
      recommendations: ['Ensure FSSAI license number (14 digits) is visible on the product label.'],
      warnings: ['FSSAI license is required for food products in India.'],
    };
  }

  const licenseNumber = details.licenseNumber.replace(/\s/g, '').replace(/^0+/, '').padStart(14, '0');
  const license = await validateFSSAILicenseFromDB(licenseNumber);

  if (license) {
    companyName = license.company_name;
    if (license.status === 'active') {
      trustScore = 100;
      status = 'genuine';
      checks.push({
        name: 'FSSAI License',
        passed: true,
        message: `Valid license verified for ${license.company_name}`,
        severity: 'info',
      });
    } else if (license.status === 'expired') {
      trustScore = 0;
      status = 'fake';
      checks.push({
        name: 'FSSAI License',
        passed: false,
        message: `License expired on ${license.valid_until || 'N/A'}`,
        severity: 'error',
      });
    } else {
      trustScore = 0;
      status = 'fake';
      checks.push({
        name: 'FSSAI License',
        passed: false,
        message: 'License has been revoked',
        severity: 'error',
      });
    }
  } else {
    checks.push({
      name: 'FSSAI License',
      passed: false,
      message: 'License number not found in database',
      severity: 'error',
    });
  }

  const productName = details.productName || companyName || 'Unknown Product';
  const manufacturer = details.manufacturer || companyName || 'Unknown';

  // Use upsert so repeated scans of the same license number update the
  // existing row instead of inserting a new duplicate every time.
  await supabase.from('products').upsert(
    {
      name: productName,
      manufacturer,
      license_number: licenseNumber,
      batch_number: details.batchNumber || null,
      status,
      trust_score: trustScore,
      verification_source: 'system',
      verified_at: new Date().toISOString(),
    },
    { onConflict: 'license_number' }
  );

  return {
    isValid: status === 'genuine',
    trustScore,
    status,
    checks,
    recommendations:
      status === 'genuine'
        ? ['Product verified. Always buy from authorized retailers.']
        : ['Do not purchase. Report suspicious products.'],
    warnings: status === 'fake' ? ['FSSAI verification failed.'] : [],
    companyName,
  };
}
