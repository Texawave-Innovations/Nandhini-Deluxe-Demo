// Finance Projection domain service — pure functions only. Every forecast here is *derived* from
// already-existing Receivables (SalesInvoice), Payables (VendorBill), and Aggregator settlement
// data (via ledgerService.buildAggregatorLedgerSummaries) — nothing is entered directly on this
// screen, and nothing here is a source of truth for anything else (it never feeds back into the
// ledger). A fixed seeded list of recurring expense templates is the only non-derived input.

import { SalesInvoice } from '@/types/sales';
import { VendorBill } from '@/types/finance';
import { RecurringExpenseTemplate } from '@/types/projection';
import { AggregatorSettlementRow } from '@/services/ledgerService';

export type CashEventCategory = 'RECEIVABLE' | 'AGGREGATOR_PAYOUT' | 'PAYABLE' | 'RECURRING_EXPENSE';

export interface CashEvent {
  date: string; // YYYY-MM-DD, expected/due date
  amount: number;
  label: string;
  category: CashEventCategory;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// Typical bank settlement lag between a platform marking a payout "settled" and the money
// actually landing — used only when the aggregator ledger doesn't already show a bank credit.
const AGGREGATOR_PAYOUT_LAG_DAYS = 2;

export const projectionService = {
  // Cash IN: open (non-cancelled, outstanding > 0) Sales Invoices, due-date driven.
  buildReceivablesForecast(invoices: SalesInvoice[]): CashEvent[] {
    return invoices
      .filter((i) => i.status !== 'CANCELLED' && i.totalAmount - i.amountReceived > 0)
      .map((i) => ({ date: i.dueDate, amount: round2(i.totalAmount - i.amountReceived), label: `Invoice ${i.invoiceNumber}`, category: 'RECEIVABLE' as const }));
  },

  // Cash IN: aggregator settlements not yet confirmed as bank-credited (per the Aggregator
  // Ledger's own reconciliation join) — expected on settlementDate + a short bank lag.
  buildAggregatorPayoutForecast(rows: AggregatorSettlementRow[]): CashEvent[] {
    return rows
      .filter((r) => r.actualBankCredit === null && r.settlementDate)
      .map((r) => ({
        date: addDays(r.settlementDate!, AGGREGATOR_PAYOUT_LAG_DAYS),
        amount: round2(r.expectedNetPayout),
        label: `${r.platform === 'SWIGGY' ? 'Swiggy' : 'Zomato'} payout (${r.externalOrderRef})`,
        category: 'AGGREGATOR_PAYOUT' as const,
      }));
  },

  // Cash OUT: open (non-cancelled, non-mismatch, outstanding > 0) Vendor Bills, due-date driven.
  buildPayablesForecast(bills: VendorBill[]): CashEvent[] {
    return bills
      .filter((b) => b.status !== 'CANCELLED' && b.status !== 'MISMATCH' && b.totalAmount - b.amountPaid > 0)
      .map((b) => ({ date: b.dueDate, amount: round2(b.totalAmount - b.amountPaid), label: `Bill ${b.billNumber}`, category: 'PAYABLE' as const }));
  },

  // Cash OUT: each recurring-expense template expanded into one dated instance per calendar
  // month inside [horizonStart, horizonEndExclusive).
  buildRecurringExpenseForecast(templates: RecurringExpenseTemplate[], horizonStart: string, horizonEndExclusive: string): CashEvent[] {
    const events: CashEvent[] = [];
    const start = new Date(horizonStart);
    const end = new Date(horizonEndExclusive);
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cursor < end) {
      templates.forEach((t) => {
        const day = Math.min(t.dayOfMonth, new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate());
        const eventDate = new Date(cursor.getFullYear(), cursor.getMonth(), day).toISOString().slice(0, 10);
        if (eventDate >= horizonStart && eventDate < horizonEndExclusive) {
          events.push({ date: eventDate, amount: t.amount, label: t.name, category: 'RECURRING_EXPENSE' });
        }
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return events;
  },

  // Buckets inflow/outflow events into WEEK (7-day, starting horizonStart) or MONTH (calendar
  // month) windows for the chart — each bucket carries its own inflow/outflow/net totals, all
  // derived on the fly from the event lists, never separately stored.
  bucketCashEvents(
    inflow: CashEvent[],
    outflow: CashEvent[],
    granularity: 'WEEK' | 'MONTH',
    horizonStart: string,
    horizonEndExclusive: string,
  ): { bucketLabel: string; bucketStart: string; inflow: number; outflow: number; net: number }[] {
    const buckets: { bucketLabel: string; bucketStart: string; bucketEndExclusive: string }[] = [];
    if (granularity === 'WEEK') {
      let cursor = horizonStart;
      while (cursor < horizonEndExclusive) {
        const next = addDays(cursor, 7);
        buckets.push({ bucketStart: cursor, bucketEndExclusive: next, bucketLabel: `Wk of ${cursor.slice(5)}` });
        cursor = next;
      }
    } else {
      const start = new Date(horizonStart);
      const end = new Date(horizonEndExclusive);
      const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
      while (cursor < end) {
        const bucketStart = cursor.toISOString().slice(0, 10);
        const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
        buckets.push({ bucketStart, bucketEndExclusive: next.toISOString().slice(0, 10), bucketLabel: cursor.toLocaleString('en-IN', { month: 'short', year: '2-digit' }) });
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    return buckets.map((b) => {
      const inSum = round2(inflow.filter((e) => e.date >= b.bucketStart && e.date < b.bucketEndExclusive).reduce((s, e) => s + e.amount, 0));
      const outSum = round2(outflow.filter((e) => e.date >= b.bucketStart && e.date < b.bucketEndExclusive).reduce((s, e) => s + e.amount, 0));
      return { bucketLabel: b.bucketLabel, bucketStart: b.bucketStart, inflow: inSum, outflow: outSum, net: round2(inSum - outSum) };
    });
  },
};
