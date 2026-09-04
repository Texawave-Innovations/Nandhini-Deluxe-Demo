// Mock OCR bill-scanning service — no real image analysis, no external OCR API. Deterministic
// per filename (seeded PRNG) so demos are repeatable, but varies across files so results don't
// look hardcoded. Same "honest mock" convention as this codebase's Tally XML export / AI
// insights: clearly labeled as simulated, never presented as a real extraction.
//
// The accountant must review every field and explicitly apply it — nothing here writes to a
// voucher or posts anything; scanBillImage only returns a suggestion.

import { Vendor } from '@/types/vendor';

export interface OCRField<T> {
  value: T;
  confidencePercent: number; // 0-100, simulated
}

export interface OCRBillExtraction {
  vendorName: OCRField<string>;
  matchedVendorId?: string; // set when the "recognized" vendor name resolves to an existing Vendor
  amount: OCRField<number>;
  billDate: OCRField<string>; // YYYY-MM-DD
  gstin: OCRField<string>;
  overallConfidencePercent: number;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h >>> 0;
}

// mulberry32 — tiny seeded PRNG, good enough for a deterministic mock, not for anything security-sensitive.
function seededRandom(seed: number): () => number {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export const ocrService = {
  scanBillImage(fileName: string, vendors: Vendor[], asOfDate: string): OCRBillExtraction {
    const rand = seededRandom(hashString(fileName));
    const conf = () => 58 + Math.round(rand() * 40); // 58-98%

    // ~20% of the time, simulate a scan that couldn't confidently read the vendor name (a real
    // OCR pass on a smudged/angled receipt won't always resolve cleanly) — exercises the "no
    // ledger-account match" review path instead of every scan being a clean auto-fill.
    const misread = rand() < 0.2;
    const vendor = !misread && vendors.length > 0 ? vendors[Math.floor(rand() * vendors.length)] : undefined;
    const amount = Math.round((500 + rand() * 49500) / 10) * 10;
    const daysAgo = Math.floor(rand() * 10);
    const d = new Date(asOfDate);
    d.setDate(d.getDate() - daysAgo);
    const billDate = d.toISOString().slice(0, 10);
    const gstinFallback = `29AAAAA${1000 + Math.floor(rand() * 8999)}A1Z${1 + Math.floor(rand() * 9)}`;

    const fields = {
      vendorName: { value: vendor?.name ?? 'Unrecognized Vendor', confidencePercent: vendor ? conf() : 35 },
      matchedVendorId: vendor?.id,
      amount: { value: amount, confidencePercent: conf() },
      billDate: { value: billDate, confidencePercent: conf() },
      gstin: { value: vendor?.gstin ?? gstinFallback, confidencePercent: vendor?.gstin ? conf() : 45 },
    };
    const overallConfidencePercent = Math.round(
      (fields.vendorName.confidencePercent + fields.amount.confidencePercent + fields.billDate.confidencePercent + fields.gstin.confidencePercent) / 4,
    );
    return { ...fields, overallConfidencePercent };
  },
};
