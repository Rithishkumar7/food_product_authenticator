import Tesseract from 'tesseract.js';
import { ExtractedDetails } from '@/types/product';

const TARGET_SIZE = 1400;
let cachedWorker: Tesseract.Worker | null = null;
let prewarmPromise: Promise<Tesseract.Worker> | null = null;

async function getWorker(): Promise<Tesseract.Worker> {
  if (cachedWorker) return cachedWorker;
  if (prewarmPromise) return prewarmPromise;
  prewarmPromise = (async () => {
    const worker = await Tesseract.createWorker('eng');
    await worker.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.AUTO,
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
      if (!ctx) {
        resolve(url);
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const threshold = 128;

      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const contrast = 1.5;
        const adjusted = Math.max(0, Math.min(255, ((gray / 255 - 0.5) * contrast + 0.5) * 255));
        const val = adjusted > threshold ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = val;
      }

      ctx.putImageData(imageData, 0, 0);
      const result = canvas.toDataURL('image/png');
      URL.revokeObjectURL(url);
      resolve(result);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

function normalizeForFSSAI(text: string): string {
  return text
    .replace(/[oOQ]/g, '0')
    .replace(/[lI|]/g, '1')
    .replace(/[sS]/g, '5')
    .replace(/[bB]/g, '8');
}

function toDigits(s: string): string {
  return s
    .replace(/[oOQ]/g, '0')
    .replace(/[lI|]/g, '1')
    .replace(/[sS]/g, '5')
    .replace(/[bB]/g, '8')
    .replace(/[zZ]/g, '2')
    .replace(/[gG]/g, '6')
    .replace(/[tT]/g, '7')
    .replace(/\D/g, '');
}

function extractFSSAINumber(text: string): string | undefined {
  const raw = text.replace(/\s+/g, ' ');
  const normalized = normalizeForFSSAI(raw);

  const contextPatterns = [
    /FSSAI\s*(?:Lic(?:ense)?\.?\s*(?:No\.?|Number)?\s*:?\s*)?([\d\sOoQlI|sSbBzZgGtT]{12,20})/i,
    /FSSAI\s*(?:Reg\.?\s*No\.?|No\.?)?\s*:?\s*([\d\sOoQlI|sSbBzZgGtT]{12,20})/i,
    /Lic(?:ense)?\.?\s*(?:No\.?|Number)?\s*:?\s*([\d\sOoQlI|sSbBzZgGtT]{12,20})/i,
    /(?:License|Licence)\s*(?:No\.?|Number)?\s*:?\s*([\d\sOoQlI|sSbBzZgGtT]{12,20})/i,
    /(?:Reg(?:istration)?\.?\s*(?:No\.?)?\s*:?\s*)([\d\sOoQlI|sSbBzZgGtT]{12,20})/i,
    /(?:Food\s*)?(?:Safety\s*)?(?:Lic\.?\s*No\.?)?\s*:?\s*([\d\sOoQlI|sSbBzZgGtT]{12,20})/i,
  ];

  for (const pattern of contextPatterns) {
    for (const src of [raw, normalized]) {
      const m = src.match(pattern);
      if (m) {
        const digits = toDigits(m[1]);
        if (digits.length >= 12 && digits.length <= 14) {
          return digits.slice(0, 14).padStart(14, '0').slice(-14);
        }
      }
    }
  }

  const digitBlock = /[\dOoQlI|sSbBzZgGtT]{12,20}/g;
  const blocks = raw.match(digitBlock) || [];
  for (const block of blocks) {
    const digits = toDigits(block);
    if (digits.length >= 12 && digits.length <= 14) {
      return digits.slice(0, 14).padStart(14, '0').slice(-14);
    }
  }

  const fallback = text.match(/\d{10,}/g);
  if (fallback) {
    for (const seq of fallback) {
      const digits = seq.replace(/\D/g, '');
      if (digits.length >= 12 && digits.length <= 14) {
        return digits.padStart(14, '0').slice(-14);
      }
    }
  }

  return undefined;
}

function extractProductName(text: string): string | undefined {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 2);
  const skipPatterns =
    /^(license|fssai|batch|mfg|manufactured|packed|ingredients|weight|mrp|net\s*w|best\s*before|use\s*by|date|reg|nutritional|storage|contains|allergen|m\.r\.p|\d{10,})/i;

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

  for (const line of lines.slice(0, 10)) {
    if (
      line.length > 2 &&
      line.length < 60 &&
      !skipPatterns.test(line) &&
      !/^\d+[\s.,-]*$/.test(line)
    ) {
      const cleaned = line.replace(/[|_~`®™©]/g, '').trim();
      if (cleaned.length > 2) return cleaned;
    }
  }

  return undefined;
}

function extractManufacturer(text: string): string | undefined {
  const patterns = [
    /(?:Mfg\.?\s*(?:by)?|Manufactured\s*by|Packed\s*by|Marketed\s*by)\s*:?\s*(.+?)(?:\n|,\s*(?:Plot|Survey|Address))/i,
    /(?:Mfg\.?\s*(?:by)?|Manufactured\s*by|Packed\s*by|Marketed\s*by)\s*:?\s*(.+?)$/im,
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      let name = m[1].trim().replace(/[,.]$/, '').trim();
      name = name.replace(/\s*(Plot|Survey|Village|Dist|At|Address).*$/i, '').trim();
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
  const details: ExtractedDetails = {
    licenseNumber: extractFSSAINumber(rawText),
    manufacturer: extractManufacturer(rawText),
    productName: extractProductName(rawText),
  };

  return { details, rawText };
}
