// Bank reconciliation domain service: the two-pass auto-match algorithm behind "Run Auto-Match" —
// exact reference match first, then an amount+date-proximity fallback for anything left
// unresolved. Also: the classic BRS summary formula, and a small CSV parser for statement import.

import { Payment, ChannelOrderSettlement } from '@/types/pos';
import { VendorPayment } from '@/types/finance';
import { CustomerPayment } from '@/types/sales';
import { BankTransaction, MatchSourceType, ReconciliationMatch } from '@/types/reconciliation';
import { LedgerAccount, Voucher } from '@/types/ledger';
import { ledgerService } from '@/services/ledgerService';

const AMOUNT_TOLERANCE_FLAT = 50;
const AMOUNT_TOLERANCE_PERCENT = 0.01;
const DATE_PROXIMITY_DAYS = 2;

interface Candidate {
  sourceType: MatchSourceType;
  sourceId: string;
  label: string;
  amount: number;
  date: string;
  referenceNo?: string;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function daysBetween(a: string, b: string): number {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 86400000;
}

function buildCandidates(params: {
  posPayments: Payment[]; channelSettlements: ChannelOrderSettlement[]; vendorPayments: VendorPayment[]; customerPayments: CustomerPayment[];
}): Candidate[] {
  const candidates: Candidate[] = [];
  params.posPayments.filter((p) => p.status === 'SUCCESS' && p.referenceNo).forEach((p) => {
    candidates.push({ sourceType: 'POS_PAYMENT', sourceId: p.id, label: `${p.mode} Payment (${p.referenceNo})`, amount: p.amount, date: p.createdAt, referenceNo: p.referenceNo });
  });
  params.channelSettlements.filter((s) => s.status === 'SETTLED' && s.bankReference).forEach((s) => {
    candidates.push({ sourceType: 'CHANNEL_SETTLEMENT', sourceId: s.id, label: `${s.platform} Settlement (${s.externalOrderRef})`, amount: s.netSettlement, date: s.settlementDate ?? '', referenceNo: s.bankReference });
  });
  params.vendorPayments.filter((p) => p.status === 'SUCCESS' && p.referenceNo).forEach((p) => {
    candidates.push({ sourceType: 'VENDOR_PAYMENT', sourceId: p.id, label: `Vendor Payment ${p.paymentNumber}`, amount: p.amount, date: p.paidAt, referenceNo: p.referenceNo });
  });
  params.customerPayments.filter((p) => p.status === 'SUCCESS' && p.referenceNo).forEach((p) => {
    candidates.push({ sourceType: 'CUSTOMER_PAYMENT', sourceId: p.id, label: `Customer Receipt ${p.paymentNumber}`, amount: p.amount, date: p.receivedAt, referenceNo: p.referenceNo });
  });
  return candidates;
}

export const reconciliationService = {
  buildCandidates,

  // Two-pass strategy: (1) exact referenceNo/bankReference match -> auto-accepted MATCHED;
  // (2) for what's left, a single amount+date-proximate candidate is a SUGGESTED match (whether
  // or not its amount is within tolerance — the variance is just shown alongside it) that an
  // accountant must confirm before it counts as MATCHED; ambiguous (0 or 2+ candidates) is
  // UNMATCHED for manual resolution.
  autoMatchBankTransactions(params: {
    bankTxns: BankTransaction[]; posPayments: Payment[]; channelSettlements: ChannelOrderSettlement[]; vendorPayments: VendorPayment[]; customerPayments: CustomerPayment[];
  }): ReconciliationMatch[] {
    const candidates = buildCandidates(params);
    const usedCandidateIds = new Set<string>();
    const results: ReconciliationMatch[] = [];

    const unresolved: BankTransaction[] = [];
    params.bankTxns.forEach((txn) => {
      const exact = candidates.find((c) => !usedCandidateIds.has(c.sourceId) && c.referenceNo === txn.referenceNo);
      if (exact) {
        usedCandidateIds.add(exact.sourceId);
        results.push({
          id: `rec-${txn.id}`, bankTransactionId: txn.id, sourceType: exact.sourceType, sourceId: exact.sourceId, sourceLabel: exact.label,
          bankAmount: txn.amount, sourceAmount: exact.amount, varianceAmount: round2(txn.amount - exact.amount),
          status: 'MATCHED', matchMethod: 'EXACT_REFERENCE', createdAt: new Date().toISOString(),
        });
      } else {
        unresolved.push(txn);
      }
    });

    unresolved.forEach((txn) => {
      const proximate = candidates.filter((c) => !usedCandidateIds.has(c.sourceId) && c.date && daysBetween(c.date, txn.transactionDate) <= DATE_PROXIMITY_DAYS);
      const withinAmount = proximate.filter((c) => Math.abs(c.amount - txn.amount) <= Math.max(AMOUNT_TOLERANCE_FLAT, txn.amount * AMOUNT_TOLERANCE_PERCENT));
      const best = withinAmount.length === 1 ? withinAmount[0] : (proximate.length === 1 ? proximate[0] : undefined);

      if (best) {
        usedCandidateIds.add(best.sourceId);
        results.push({
          id: `rec-${txn.id}`, bankTransactionId: txn.id, sourceType: best.sourceType, sourceId: best.sourceId, sourceLabel: best.label,
          bankAmount: txn.amount, sourceAmount: best.amount, varianceAmount: round2(txn.amount - best.amount),
          status: 'SUGGESTED', matchMethod: 'AMOUNT_DATE_PROXIMITY', createdAt: new Date().toISOString(),
        });
      } else {
        results.push({
          id: `rec-${txn.id}`, bankTransactionId: txn.id, sourceLabel: 'No candidate found', bankAmount: txn.amount,
          varianceAmount: 0, status: 'UNMATCHED', matchMethod: 'UNRESOLVED', createdAt: new Date().toISOString(),
        });
      }
    });

    return results;
  },

  computeReconciliationSummary(matches: ReconciliationMatch[]): { matchedCount: number; suggestedCount: number; unmatchedCount: number; totalVarianceAmount: number } {
    return {
      matchedCount: matches.filter((m) => m.status === 'MATCHED').length,
      suggestedCount: matches.filter((m) => m.status === 'SUGGESTED').length,
      unmatchedCount: matches.filter((m) => m.status === 'UNMATCHED').length,
      totalVarianceAmount: round2(matches.reduce((s, m) => s + Math.abs(m.varianceAmount), 0)),
    };
  },

  // Sum of bank-line amounts sitting in limbo — SUGGESTED (not yet confirmed) or UNMATCHED. The
  // Unified Dashboard's single "Total Unreconciled Amount" card — distinct from
  // computeReconciliationSummary's totalVarianceAmount (which sums |variance| across every match,
  // MATCHED included).
  computeUnreconciledAmount(matches: ReconciliationMatch[]): number {
    return round2(matches.filter((m) => m.status !== 'MATCHED').reduce((s, m) => s + m.bankAmount, 0));
  },

  flagVarianceExceptions(matches: ReconciliationMatch[], thresholdAmount = 500): ReconciliationMatch[] {
    return matches
      .filter((m) => m.status !== 'MATCHED' || Math.abs(m.varianceAmount) > thresholdAmount)
      .sort((a, b) => Math.abs(b.varianceAmount) - Math.abs(a.varianceAmount));
  },

  // The classic BRS statement: Book Balance (the Bank ledger account's own running balance) +
  // Uncredited Deposits (RECEIPT vouchers hitting Bank not yet MATCHED/confirmed against a bank
  // CREDIT line) - Uncleared Payments (PAYMENT vouchers hitting Bank not yet MATCHED/confirmed
  // against a bank DEBIT line) = Bank Balance. Compared against the bank statement's own implied
  // balance (Bank account's opening balance + net statement movement) to surface any unexplained
  // gap. Reads Voucher/LedgerAccount/ReconciliationMatch only — never stores its own totals.
  computeClassicSummary(params: { bankAccount: LedgerAccount; vouchers: Voucher[]; bankTxns: BankTransaction[]; matches: ReconciliationMatch[]; asOfDate?: string }) {
    const { bankAccount, vouchers, bankTxns, matches, asOfDate } = params;
    const bookBalance = ledgerService.computeRunningBalance(bankAccount, vouchers, asOfDate);

    const reconciledVoucherIds = new Set(
      matches.filter((m) => m.status === 'MATCHED' && m.sourceType).map((m) => `${m.sourceType}:${m.sourceId}`),
    );
    // A voucher counts as "seen by the bank" if it (or the payment/receipt it derives from) has a
    // confirmed match — approximated here via the voucher's own refType/refId provenance.
    const isReconciled = (v: Voucher) => v.refType && v.refId && reconciledVoucherIds.has(`${refTypeToSourceType(v.refType)}:${v.refId}`);

    const bankVouchers = vouchers.filter((v) => v.status === 'POSTED' && v.lines.some((l) => l.ledgerAccountId === bankAccount.id));
    const uncreditedDeposits = round2(
      bankVouchers.filter((v) => v.voucherType === 'RECEIPT' && !isReconciled(v))
        .reduce((sum, v) => sum + ledgerService.voucherTotal(v), 0),
    );
    const unclearedPayments = round2(
      bankVouchers.filter((v) => v.voucherType === 'PAYMENT' && !isReconciled(v))
        .reduce((sum, v) => sum + ledgerService.voucherTotal(v), 0),
    );

    const computedBankBalance = round2((bookBalance.drCr === 'DEBIT' ? bookBalance.balance : -bookBalance.balance) + uncreditedDeposits - unclearedPayments);

    const statementMovement = bankTxns.reduce((sum, t) => sum + (t.type === 'CREDIT' ? t.amount : -t.amount), 0);
    const statementOpening = bankAccount.openingBalanceDrCr === 'DEBIT' ? bankAccount.openingBalance : -bankAccount.openingBalance;
    const statementBalance = round2(statementOpening + statementMovement);

    return {
      bookBalance: bookBalance.balance, bookBalanceDrCr: bookBalance.drCr,
      uncreditedDeposits, unclearedPayments,
      computedBankBalance: Math.abs(computedBankBalance), computedBankBalanceDrCr: (computedBankBalance >= 0 ? 'DEBIT' : 'CREDIT') as 'DEBIT' | 'CREDIT',
      statementBalance: Math.abs(statementBalance), statementBalanceDrCr: (statementBalance >= 0 ? 'DEBIT' : 'CREDIT') as 'DEBIT' | 'CREDIT',
      gap: round2(computedBankBalance - statementBalance),
    };
  },

  // Best-effort normalization of a bank statement's date column into YYYY-MM-DD. Bank exports
  // commonly use DD/MM/YYYY or DD-MM-YYYY; anything else is passed through unchanged rather than
  // guessed wrong.
  normalizeDateGuess(raw: string): string {
    const trimmed = raw.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const dmy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (dmy) {
      const [, d, m, y] = dmy;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return trimmed;
  },

  // Tiny CSV parser (no external dependency) — handles quoted fields containing commas/quotes.
  // XLS/XLSX binary import would need a real parsing library and isn't supported by this pass.
  parseCSV(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;
    const pushField = () => { row.push(field); field = ''; };
    const pushRow = () => { pushField(); rows.push(row); row = []; };

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (ch === '"') { inQuotes = false; }
        else { field += ch; }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        pushField();
      } else if (ch === '\n') {
        pushRow();
      } else if (ch === '\r') {
        // skip, \n handles the row break
      } else {
        field += ch;
      }
    }
    if (field.length > 0 || row.length > 0) pushRow();
    return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0].trim() !== ''));
  },
};

function refTypeToSourceType(refType: Voucher['refType']): MatchSourceType | undefined {
  switch (refType) {
    case 'VENDOR_PAYMENT': return 'VENDOR_PAYMENT';
    case 'CUSTOMER_PAYMENT': return 'CUSTOMER_PAYMENT';
    default: return undefined;
  }
}
