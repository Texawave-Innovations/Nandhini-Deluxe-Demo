// Bank statement seed: built FROM the already-seeded POS payments/channel settlements and Vendor
// Payments (not invented reference numbers), so autoMatchBankTransactions has real exact-reference
// matches to find on day one, plus a few deliberate proximity-mismatch and fully-unmatched lines
// for the manual-match / exceptions demo.

import { ChannelOrderSettlement, Payment } from '../types/pos';
import { VendorPayment } from '../types/finance';
import { BankTransaction } from '../types/reconciliation';

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().substring(0, 10);
}

function toDateOnly(iso: string): string {
  return iso.substring(0, 10);
}

const NARRATION_BY_MODE: Record<string, BankTransaction['narrationSource']> = {
  UPI: 'UPI', CARD: 'CARD_SETTLEMENT', RAZORPAY: 'GATEWAY_SETTLEMENT', SWIGGY: 'GATEWAY_SETTLEMENT', ZOMATO: 'GATEWAY_SETTLEMENT',
  NEFT: 'NEFT', RTGS: 'RTGS', CHEQUE: 'CHEQUE',
};

export function generateReconciliationSeed(payments: Payment[], channelSettlements: ChannelOrderSettlement[], vendorPayments: VendorPayment[]): BankTransaction[] {
  const lines: BankTransaction[] = [];
  let seq = 1;

  // Exact-match POS payment credits.
  payments
    .filter((p) => p.status === 'SUCCESS' && p.mode !== 'CASH' && p.referenceNo)
    .slice(0, 10)
    .forEach((p) => {
      lines.push({
        id: `bktxn-${seq++}`, transactionDate: addDays(toDateOnly(p.createdAt), 1),
        description: `${p.mode} Settlement Credit`, referenceNo: p.referenceNo!, type: 'CREDIT', amount: p.amount,
        narrationSource: NARRATION_BY_MODE[p.mode] ?? 'OTHER',
      });
    });

  // Exact-match aggregator (Swiggy/Zomato) settlement credits — includes the brief's pinned
  // "SWG-928321 / BANKSETL-77410" worked example from pos.seed.ts.
  channelSettlements
    .filter((s) => s.status === 'SETTLED' && s.bankReference)
    .slice(0, 8)
    .forEach((s) => {
      lines.push({
        id: `bktxn-${seq++}`, transactionDate: s.settlementDate ? addDays(s.settlementDate, 1) : '2026-08-25',
        description: `${s.platform} Settlement (${s.externalOrderRef})`, referenceNo: s.bankReference!, type: 'CREDIT',
        amount: s.netSettlement, narrationSource: 'GATEWAY_SETTLEMENT',
      });
    });

  // Exact-match Vendor Payment debits.
  vendorPayments
    .filter((p) => p.status === 'SUCCESS' && p.referenceNo)
    .slice(0, 6)
    .forEach((p) => {
      lines.push({
        id: `bktxn-${seq++}`, transactionDate: addDays(toDateOnly(p.paidAt), 1),
        description: `Vendor Payment Debit (${p.paymentNumber})`, referenceNo: p.referenceNo!, type: 'DEBIT',
        amount: p.amount, narrationSource: NARRATION_BY_MODE[p.mode] ?? 'OTHER',
      });
    });

  // Deliberate proximity-mismatch lines: same-flavored real Vendor Payments, but posted short by
  // the bank, so pass-2 of the auto-match algorithm flags a variance rather than an exact match.
  // Vendor Payments (not POS payments) are used as the source here because they're sparse enough
  // (a handful per week, vs. dozens of same-day POS bills) that the proximity fallback resolves
  // to a single unambiguous candidate rather than colliding with same-day siblings.
  const mismatchSources = vendorPayments.filter((p) => p.status === 'SUCCESS' && p.referenceNo).slice(6, 10);
  mismatchSources.forEach((p, i) => {
    const shortfall = Math.max(50, Math.round(p.amount * 0.025));
    lines.push({
      id: `bktxn-${seq++}`, transactionDate: addDays(toDateOnly(p.paidAt), 2),
      description: `Vendor Payment Debit (short) (${p.paymentNumber})`, referenceNo: `BANKDIFF-${90000 + i}`, type: 'DEBIT',
      amount: p.amount - shortfall, narrationSource: NARRATION_BY_MODE[p.mode] ?? 'OTHER',
    });
  });

  // Fully unmatched lines — no corresponding source record, left for manual review.
  const unmatchedSeed: { desc: string; amount: number; type: BankTransaction['type']; date: string; source: BankTransaction['narrationSource'] }[] = [
    { desc: 'Bank Charges - Monthly A/C Maintenance', amount: 590, type: 'DEBIT', date: '2026-08-20', source: 'OTHER' },
    { desc: 'Unidentified UPI Credit', amount: 1250, type: 'CREDIT', date: '2026-08-22', source: 'UPI' },
    { desc: 'Cheque Deposit - Unreferenced', amount: 18500, type: 'CREDIT', date: '2026-08-24', source: 'CHEQUE' },
    { desc: 'RTGS Charges', amount: 295, type: 'DEBIT', date: '2026-08-27', source: 'RTGS' },
  ];
  unmatchedSeed.forEach((u, i) => {
    lines.push({ id: `bktxn-${seq++}`, transactionDate: u.date, description: u.desc, referenceNo: `MISC-${70000 + i}`, type: u.type, amount: u.amount, narrationSource: u.source });
  });

  return lines;
}
