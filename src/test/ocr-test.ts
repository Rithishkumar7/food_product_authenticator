import { describe, it, expect } from 'vitest';

// ── paste the raw extraction functions here for unit testing ──────────────

function toDigits(s: string): string {
  return s
    .replace(/[oOQ]/g, '0')
    .replace(/[lI|!]/g, '1')
    .replace(/[zZ]/g, '2')
    .replace(/[sS$]/g, '5')
    .replace(/[bB]/g, '8')
    .replace(/\D/g, '');
}

function normaliseFSSAICandidate(raw: string): string | undefined {
  const joined = raw.replace(/\s+/g, '');
  const digits = toDigits(joined);
  if (digits.length >= 12 && digits.length <= 16) {
    return digits.slice(0, 14).padStart(14, '0').slice(-14);
  }
  return undefined;
}

function extractFSSAINumber(text: string): string | undefined {
  const contextPatterns = [
    /FSSAI\s*(?:Lic(?:ense|ence)?\.?\s*)?(?:No\.?|Number|Reg\.?\s*No\.?)?\s*:?\s*([\d\s oOQlI|!sSbB]{11,22})/i,
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
  // fallback: blocks
  const blocks = text.match(/[\d oOQlI|!sSbB]{12,20}/g) ?? [];
  for (const block of blocks) {
    if (/[a-df-ruw-z]/i.test(block)) continue;
    const result = normaliseFSSAICandidate(block);
    if (result) return result;
  }
  // last resort
  const sequences = text.match(/\d[\d\s]{10,13}\d/g) ?? [];
  for (const seq of sequences) {
    const digits = seq.replace(/\s/g, '');
    if (digits.length >= 12 && digits.length <= 14)
      return digits.padStart(14, '0').slice(-14);
  }
  return undefined;
}

function extractMRP(text: string): string | undefined {
  const m = text.match(/(?:M\.?R\.?P\.?|MRP|Price)\s*(?:\(Incl(?:usive)?\.?\s*of\s*all\s*taxes?\)?)?\s*:?\s*(?:Rs\.?|₹|INR|£)?\s*([\d,]+(?:\.\d{1,2})?)/i);
  return m ? `₹${m[1].replace(/,/g, '')}` : undefined;
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

function extractNetWeight(text: string): string | undefined {
  const m = text.match(/(?:Net\s*(?:Weight|Wt\.?|Content)|NET\s*WT\.?)\s*:?\s*([\d.,]+\s*(?:g|kg|ml|l|oz|lb)s?)/i);
  return m ? m[1].trim() : undefined;
}

// ─────────────────────────────────────────────────────────────────────────────

const BINGO_OCR = `——
-r
[3
in grie o
a
Freon
243493. Lic. No,
0012012000155,
Le, HOT XO 001, Mi,
friday
COSTRXT PUNE, (M00)
ud
an. lic. No. 1001202200042. (1) VOKOX MANGIACTRING
ram uate, man by NATHA KATY PIRIVU, PUTHUTIGTIAN,
OSSTRXT (TN) - €A1654
GO
Uc No. 1001404201415. (CIC LMITIO 0005 ©
Le
IN
o
VILUR & VASOGAPATTI VILLAGL, VILALIMALAL TI,
wm)
sane. Lic. No. 10018042004042. t) nico
POTATO
COSON, MF - MYSURD, SURVIY NO. 77/3, THAN
aN) aut, Ooms
CHIPS
TALUK |, MYSORE, (WA)
sms Ue
ieobionien. 05s, nC uTto, 10004
wi
lic. No. 1001703100218. W) BQO 10005 PRA
SURVEY NO: 201A & 2018, NATAMPALU VILAGE, PEOAVIC/
gate
great
mr
lengths
WIST Cooaram, (7) - 334450. Lic. No. 10021044
(OW) CRANTLOA FOO (INDLL) PRIVATE LIMITED, PLOTNO. 112 118, 134
ta choose the best
|
200, 208 4 218, NORTH LAST MICA FOO0S PARK LTD, TONY, XJ. 11, 4S)
potatoes
- mn. Lic. No. 10020071001288. @ rc uw:
K
po
=
OOVISION, SY. NOL 355 T0412, 416, 417, 442, 44910 45), MAND
TOOPRAN, MIOAX, (75) - 592334 Lic. Ko. 136219990001
OR THEMES. ORIT ADDALSS AND Lc No, WAICH THE HIRST O.
\\ y <R
a
SATO! NOMBER
to perfection
ADORESS IN TRE MFO. AOORESS PANEL.
)
fat
ji—
SE
No. 1001
1000312
Aunique process gives
PROPRIETARY £000 - POTATO (RIPS (15.3)
{tthe distinctive cruzed
SN
——
MRP £50.00 incl. of all tax
Fall, we spindle
FOR FEEDBACK/COMPLAINT CONTACT:
TL with secret flavoers
A
TCCARES AT PO. BOXNO. 592
tage
3
3.
athemont
Ritccores @itcin Breas 44444
favoarfol chips, of"
_ QUALITY GUARANTEED.
——
J
oonore HM PACK IF FOUND tlh
IN A COOL, DRY & HYGIEN
¢
—Mmoal LM
i.
rispg and hot chillies are
(qu
Uhpeee. Vi
ee Wg serve (245) pec
used in Biag
! Chilli $priniled
$31
106
53
~
Potato Chips to make it
Protein (5)
71
14
Grbokpdaate()
10.1
mosth-watering 3nd ege-watering!
Total Sugars
0.3
Bite into ose, it's traly irresistible
Added
®
108
0.2
04
Total Fat (9)
4
6.7
10.0
Trans fat other than naturally' 01
0.02
1.0
DOSLO SAAT, 51
0 (400M) RUAINID PALMOLLIN, SEASONING
POWDER (LIN), MALTODLXTRIN, SHICLS AND
curring trans fat) (9)
CONDUMINTS, COX FOWDLR, REFINIO WRAY FLOUR (MAIDA), RATORE
23
12.7
IDONTICAL TLAVOL ENG SUBSTANCIS, BUMK SALT, MILK 50083,
NATURAL FLAVOGRS AND NATURAL FLAYOGRING SUBSTANCES, SUGAR,
10 POWCLR, NTOROLYZEO VICHTASLE PROTLIN, GARLIC POWD(
824.
1649 82
FLAVOYR [XHANCER (185 5040) AND JOD(0 SALT.
15 HLAVOURING AGENTS.
APPROX.
NS SO, MAX, WRLKT
NO.
SERVES
PER PACK
MED,
Il
|
liz 5
0172510075
NETWT. check what it scans from image
fssai Lic. No.10012031000312`;

describe('OCR extraction on Bingo Chips label', () => {
  it('extracts FSSAI license number', () => {
    const result = extractFSSAINumber(BINGO_OCR);
    console.log('FSSAI:', result);
    expect(result).toBeDefined();
  });

  it('extracts MRP', () => {
    const result = extractMRP(BINGO_OCR);
    console.log('MRP:', result);
    expect(result).toBeDefined();
  });

  it('extracts batch number', () => {
    const result = extractBatchNumber(BINGO_OCR);
    console.log('Batch:', result);
  });

  it('extracts net weight', () => {
    const result = extractNetWeight(BINGO_OCR);
    console.log('Net weight:', result);
  });
});
