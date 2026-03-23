import Tesseract from 'tesseract.js';
import { ExtractedDetails } from '@/types/product';

const TARGET_SIZE = 1800; // larger = more detail for Tesseract
let cachedWorker: Tesseract.Worker | null = null;
let prewarmPromise: Promise<Tesseract.Worker> | null = null;

async function getWorker(): Promise<Tesseract.Worker> {
  if (cachedWorker) return cachedWorker;
  if (prewarmPromise) return prewarmPromise;
  prewarmPromise = (async () => {
    const worker = await Tesseract.createWorker('eng');
    await worker.setParameters({
      // SPARSE_TEXT handles mixed-layout labels much better than AUTO
      tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
      // Preserve digits; reduce garbage character output
      tessedit_char_whitelist: '',
    });
    cachedWorker = worker;
    return worker;
  })();
  return prewarmPromise;
}

export function prewarmOCR(): void {
  getWorker();
}

function preprocessImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = Math.max(img.width, img.height);
      const scale = Math.max(1, TARGET_SIZE / maxDim);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(url); return; }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Compute average brightness to detect dark backgrounds
      let totalBrightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        totalBrightness += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      const avgBrightness = totalBrightness / (data.length / 4);
      const isDark = avgBrightness < 100;

      // Apply contrast enhancement (not hard binarization — preserves anti-aliased edges)
      const contrast = 1.8;
      for (let i = 0; i < data.length; i += 4) {
        let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        // Invert dark backgrounds so text becomes dark on light
        if (isDark) gray = 255 - gray;
        const enhanced = Math.max(0, Math.min(255, ((gray / 255 - 0.5) * contrast + 0.5) * 255));
        data[i] = data[i + 1] = data[i + 2] = enhanced;
        // alpha unchanged
      }

      ctx.putImageData(imageData, 0, 0);
      const result = canvas.toDataURL('image/png');
      URL.revokeObjectURL(url);
      resolve(result);
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

// Conservative substitution — only very safe OCR confusables for digit sequences
function toDigits(s: string): string {
  return s
    .replace(/[oOQ]/g, '0')
    .replace(/[lI|!]/g, '1')
    .replace(/[zZ]/g, '2')
    .replace(/[sS$]/g, '5')   // $ can look like 5
    .replace(/[bB]/g, '8')
    .replace(/\D/g, '');
}

// Join space-separated digit groups then extract a 14-digit FSSAI number
function normaliseFSSAICandidate(raw: string): string | undefined {
  // Remove spaces between digit groups to handle "1002 0021 0001 23" style
  const joined = raw.replace(/\s+/g, '');
  const digits = toDigits(joined);
  if (digits.length >= 12 && digits.length <= 16) {
    const trimmed = digits.slice(0, 14).padStart(14, '0').slice(-14);
    return trimmed;
  }
  return undefined;
}

function extractFSSAINumber(text: string): string | undefined {
  // Patterns ordered by specificity — most specific first
  const contextPatterns = [
    // FSSAI Lic No. / FSSAI License Number / FSSAI Reg No.
    /FSSAI\s*(?:Lic(?:ense|ence)?\.?\s*)?(?:No\.?|Number|Reg\.?\s*No\.?)?\s*:?\s*([\d\s oOQlI|!sSbB]{11,22})/i,
    // "License No" or "Lic. No" preceded by any text
    /Lic(?:ense|ence)?\.?\s*No\.?\s*:?\s*([\d\s oOQlI|!sSbB]{11,22})/i,
    /Reg(?:istration)?\.?\s*No\.?\s*:?\s*([\d\s oOQlI|!sSbB]{11,22})/i,
  ];

  for (const pattern of contextPatterns) {
    const m = text.match(pattern);
    if (m) {
      const result = normaliseFSSAICandidate(m[1]);
      if (result) return result;
    }
  }

  // Fallback: scan all contiguous digit-like blocks of 12-16 chars
  const blocks = text.match(/[\d oOQlI|!sSbB]{12,20}/g) ?? [];
  for (const block of blocks) {
    // Only try blocks that are mostly digits/digit-lookalikes
    if (/[a-df-ruw-z]/i.test(block)) continue; // skip if real letters present
    const result = normaliseFSSAICandidate(block);
    if (result) return result;
  }

  // Last resort: any 12-14 digit sequence
  const sequences = text.match(/\d[\d\s]{10,13}\d/g) ?? [];
  for (const seq of sequences) {
    const digits = seq.replace(/\s/g, '');
    if (digits.length >= 12 && digits.length <= 14) {
      return digits.padStart(14, '0').slice(-14);
    }
  }

  return undefined;
}

function extractBatchNumber(text: string): string | undefined {
  const patterns = [
    /(?:Batch|Lot|Mfg\.?\s*Batch)\s*(?:No\.?|Code|Number)?\s*:?\s*([A-Z0-9][\w/-]{2,20})/i,
    /B\.?\s*No\.?\s*:?\s*([A-Z0-9][\w/-]{2,20})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim();
  }
  return undefined;
}

function extractLicenseDate(text: string): string | undefined {
  const patterns = [
    /(?:Mfg\.?|Manufactured|Mfg\.?\s*Date|Date\s*of\s*Mfg\.?)\s*:?\s*([\d]{1,2}[/-][\d]{1,2}[/-][\d]{2,4})/i,
    /(?:Mfg\.?|Manufactured)\s*:?\s*([\d]{1,2}[/-][\d]{2,4})/i,
    /(?:Best\s*Before|Use\s*By|Expiry)\s*:?\s*([\d]{1,2}[/-][\d]{1,2}[/-][\d]{2,4})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim();
  }
  return undefined;
}

function extractNetWeight(text: string): string | undefined {
  const m = text.match(/(?:Net\s*(?:Weight|Wt\.?|Content)|Contents?)\s*:?\s*([\d.,]+\s*(?:g|kg|ml|l|oz|lb)s?)/i);
  return m ? m[1].trim() : undefined;
}

function extractMRP(text: string): string | undefined {
  const m = text.match(/(?:M\.?R\.?P\.?|MRP|Price)\s*(?:\(Incl(?:usive)?\.?\s*of\s*all\s*taxes?\)?)?\s*:?\s*(?:Rs\.?|₹|INR)?\s*([\d,]+(?:\.\d{1,2})?)/i);
  return m ? `₹${m[1].replace(/,/g, '')}` : undefined;
}

function extractProductName(text: string): string | undefined {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 2);
  const skipPatterns =
    /^(license|fssai|batch|lot|mfg|manufactured|packed|ingredients|weight|mrp|net\s*w|best\s*before|use\s*by|date|reg|nutritional|storage|contains|allergen|m\.r\.p|\d{10,}|serving|energy|protein|carb|fat|sodium|sugar)/i;

  // Explicit label patterns first
  const labelPatterns = [
    /(?:Product|Brand)\s*(?:Name)?\s*:?\s*(.+?)$/im,
    /(?:Name\s*of\s*(?:the\s*)?(?:Food|Product))\s*:?\s*(.+?)$/im,
  ];
  for (const p of labelPatterns) {
    const m = text.match(p);
    if (m) {
      const name = m[1].trim().replace(/[,.]$/, '');
      if (name.length > 2 && name.length < 80) return name;
    }
  }

  // All-caps lines (often the product headline on Indian labels)
  const capsLines = lines.filter(
    (l) =>
      l.replace(/[^a-zA-Z]/g, '').length > 2 &&
      l.replace(/[^a-zA-Z]/g, '') === l.replace(/[^a-zA-Z]/g, '').toUpperCase() &&
      !skipPatterns.test(l) &&
      !/^\d+[\s.,-]*$/.test(l) &&
      l.length < 60
  );
  for (const line of capsLines.slice(0, 5)) {
    const cleaned = line.replace(/[|_~`®™©]/g, '').trim();
    if (cleaned.length > 2) return cleaned;
  }

  // First meaningful non-skipped line
  for (const line of lines.slice(0, 10)) {
    if (line.length > 2 && line.length < 60 && !skipPatterns.test(line) && !/^\d+[\s.,-]*$/.test(line)) {
      const cleaned = line.replace(/[|_~`®™©]/g, '').trim();
      if (cleaned.length > 2) return cleaned;
    }
  }

  return undefined;
}

function extractManufacturer(text: string): string | undefined {
  const patterns = [
    /(?:Mfg\.?\s*(?:by)?|Manufactured\s*by|Packed\s*by|Marketed\s*by)\s*:?\s*(.+?)(?:\n|,\s*(?:Plot|Survey|Address|Ph\.|Tel\.))/i,
    /(?:Mfg\.?\s*(?:by)?|Manufactured\s*by|Packed\s*by|Marketed\s*by)\s*:?\s*(.+?)$/im,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      let name = m[1].trim().replace(/[,.]$/, '').trim();
      name = name.replace(/\s*(Plot|Survey|Village|Dist|At|Address|Ph\.|Tel\.|www\.).*$/i, '').trim();
      if (name.length > 2 && name.length < 100) return name;
    }
  }
  return undefined;
}

export async function performOCR(
  file: File,
  onProgress?: (msg: string) => void
): Promise<{ details: ExtractedDetails; rawText: string }> {
  onProgress?.('Preprocessing image...');
  const processedImage = await preprocessImage(file);

  onProgress?.('Running OCR...');
  const worker = await getWorker();
  const { data } = await worker.recognize(processedImage);

  const rawText = data.text;

  onProgress?.('Extracting product details...');
  const details: ExtractedDetails = {
    licenseNumber: extractFSSAINumber(rawText),
    manufacturer: extractManufacturer(rawText),
    productName: extractProductName(rawText),
    batchNumber: extractBatchNumber(rawText),
    licenseDate: extractLicenseDate(rawText),
    netWeight: extractNetWeight(rawText),
    mrp: extractMRP(rawText),
  };

  return { details, rawText };
}
