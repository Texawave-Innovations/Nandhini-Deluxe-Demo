// Bank reconciliation domain service: the two-pass auto-match algorithm behind "Run Auto-Match" —
// exact reference match first, then an amount+date-proximity fallback for anything left unresolved.

import { Payment, ChannelOrderSettlement } from '@/types/pos';
import { VendorPayment } from '@/types/finance';
import { BankTransaction, MatchSourceType, ReconciliationMatch } from '@/types/reconciliation';

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

function daysBetween(a: string, b: string): number {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 86400000;
}

function buildCandidates(params: { posPayments: Payment[]; channelSettlements: ChannelOrderSettlement[]; vendorPayments: VendorPayment[] }): Candidate[] {
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
  return candidates;
}

export const reconciliationService = {
  // Two-pass strategy: (1) exact referenceNo/bankReference match; (2) for what's left, a single
  // amount+date-proximate candidate is a match — proximate but outside the amount tolerance is a
  // MISMATCH (the algorithmic seat for "POS ₹X vs Bank ₹Y" variance rows); ambiguous or absent
  // candidates are left UNMATCHED for manual resolution.
  autoMatchBankTransactions(params: {
    bankTxns: BankTransaction[]; posPayments: Payment[]; channelSettlements: ChannelOrderSettlement[]; vendorPayments: VendorPayment[];
  }): ReconciliationMatch[] {
    const candidates = buildCandidates(params);
    const usedCandidateIds = new Set<string>();
    const results: ReconciliationMatch[] = [];

    // Pass 1: exact reference match.
    const unresolved: BankTransaction[] = [];
    params.bankTxns.forEach((txn) => {
      const exact = candidates.find((c) => !usedCandidateIds.has(c.sourceId) && c.referenceNo === txn.referenceNo);
      if (exact) {
        usedCandidateIds.add(exact.sourceId);
        results.push({
          id: `rec-${txn.id}`, bankTransactionId: txn.id, sourceType: exact.sourceType, sourceId: exact.sourceId, sourceLabel: exact.label,
          bankAmount: txn.amount, sourceAmount: exact.amount, varianceAmount: Math.round((txn.amount - exact.amount) * 100) / 100,
          status: 'MATCHED', matchMethod: 'EXACT_REFERENCE', createdAt: new Date().toISOString(),
        });
      } else {
        unresolved.push(txn);
      }
    });

    // Pass 2: amount + date proximity fallback.
    unresolved.forEach((txn) => {
      const proximate = candidates.filter((c) => !usedCandidateIds.has(c.sourceId) && c.date && daysBetween(c.date, txn.transactionDate) <= DATE_PROXIMITY_DAYS);
      const withinAmount = proximate.filter((c) => Math.abs(c.amount - txn.amount) <= Math.max(AMOUNT_TOLERANCE_FLAT, txn.amount * AMOUNT_TOLERANCE_PERCENT));

      if (withinAmount.length === 1) {
        const c = withinAmount[0];
        usedCandidateIds.add(c.sourceId);
        results.push({
          id: `rec-${txn.id}`, bankTransactionId: txn.id, sourceType: c.sourceType, sourceId: c.sourceId, sourceLabel: c.label,
          bankAmount: txn.amount, sourceAmount: c.amount, varianceAmount: Math.round((txn.amount - c.amount) * 100) / 100,
          status: 'MATCHED', matchMethod: 'AMOUNT_DATE_PROXIMITY', createdAt: new Date().toISOString(),
        });
      } else if (proximate.length === 1) {
        const c = proximate[0];
        usedCandidateIds.add(c.sourceId);
        results.push({
          id: `rec-${txn.id}`, bankTransactionId: txn.id, sourceType: c.sourceType, sourceId: c.sourceId, sourceLabel: c.label,
          bankAmount: txn.amount, sourceAmount: c.amount, varianceAmount: Math.round((txn.amount - c.amount) * 100) / 100,
          status: 'MISMATCH', matchMethod: 'AMOUNT_DATE_PROXIMITY', createdAt: new Date().toISOString(),
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

  computeReconciliationSummary(matches: ReconciliationMatch[]): { matchedCount: number; mismatchCount: number; unmatchedCount: number; totalVarianceAmount: number } {
    return {
      matchedCount: matches.filter((m) => m.status === 'MATCHED').length,
      mismatchCount: matches.filter((m) => m.status === 'MISMATCH').length,
      unmatchedCount: matches.filter((m) => m.status === 'UNMATCHED').length,
      totalVarianceAmount: Math.round(matches.reduce((s, m) => s + Math.abs(m.varianceAmount), 0) * 100) / 100,
    };
  },

  flagVarianceExceptions(matches: ReconciliationMatch[], thresholdAmount = 500): ReconciliationMatch[] {
    return matches
      .filter((m) => m.status !== 'MATCHED' || Math.abs(m.varianceAmount) > thresholdAmount)
      .sort((a, b) => Math.abs(b.varianceAmount) - Math.abs(a.varianceAmount));
  },
};
