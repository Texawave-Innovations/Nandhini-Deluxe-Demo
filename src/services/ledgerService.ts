// Core double-entry accounting domain — pure functions only (no state, no Firebase). Builds
// LedgerAccounts from the Vendor/Customer masters, derives balanced Vouchers from already-settled
// Finance (AP) / Sales (AR) business events, validates double-entry balance, and computes
// chronological running balances. ledger-store.ts is the only caller.

import { DrCr, LedgerAccount, LedgerAccountType, LedgerEntry, Voucher, VoucherType } from '@/types/ledger';
import { FIXED_LEDGER_ACCOUNTS } from '@/mock-data/ledger.seed';
import { Vendor } from '@/types/vendor';
import { Customer, SalesInvoice, CustomerPayment } from '@/types/sales';
import { VendorBill, VendorPayment } from '@/types/finance';
import { ChannelOrderSettlement } from '@/types/pos';
import { ReconciliationMatch } from '@/types/reconciliation';

export interface LedgerRegisterLine {
  voucherId: string;
  voucherNumber: string;
  voucherDate: string;
  voucherType: VoucherType;
  particulars: string;
  debit: number;
  credit: number;
  balance: number;
  balanceDrCr: DrCr;
}

export interface AgeingBuckets {
  b0to15: number;
  b15to30: number;
  b30to60: number;
  b60plus: number;
  total: number;
}

export type BillLedgerStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';

export type AggregatorRowStatus = 'MATCHED' | 'MISMATCH' | 'UNMATCHED' | 'PENDING_SETTLEMENT';

export interface AggregatorSettlementRow {
  settlementId: string;
  platform: 'SWIGGY' | 'ZOMATO';
  externalOrderRef: string;
  settlementDate?: string;
  grossSales: number;
  commission: number;
  tax: number;
  expectedNetPayout: number;
  actualBankCredit: number | null; // null until the bank reconciliation engine has matched it
  variance: number | null;
  varianceFlag: boolean;
  status: AggregatorRowStatus;
}

export interface AggregatorLedgerSummary {
  platform: 'SWIGGY' | 'ZOMATO';
  grossSales: number;
  commission: number;
  tax: number;
  expectedNetPayout: number;
  actualBankCreditReceived: number;
  variance: number;
  rows: AggregatorSettlementRow[];
}

const VOUCHER_PREFIX: Record<VoucherType, string> = {
  PAYMENT: 'PYV',
  RECEIPT: 'RCV',
  JOURNAL: 'JV',
  CONTRA: 'CV',
  DEBIT_NOTE: 'DN',
  CREDIT_NOTE: 'CN',
  PURCHASE_BILL: 'PBV',
  SALES_INVOICE: 'SIV',
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const ledgerService = {
  generateAccountCode(existing: LedgerAccount[], accountRefCode: string): string {
    return `LAC-${accountRefCode}`;
  },

  // Per-type sequential numbering, mirroring financeService.generateBillNumber's pattern.
  generateVoucherNumber(voucherType: VoucherType, existingVouchers: Voucher[]): string {
    const countOfType = existingVouchers.filter((v) => v.voucherType === voucherType).length;
    return `${VOUCHER_PREFIX[voucherType]}-${String(1000 + countOfType + 1).slice(-4)}`;
  },

  // One LedgerAccount per Vendor (VENDOR, vendorId set) and per Customer (CUSTOMER, customerId
  // set), plus the fixed singleton accounts. Opening balance is 0 for every VENDOR/CUSTOMER
  // account — their true balance emerges entirely from derived vouchers, since the mock seed
  // data already IS the full transactional history (there is no "prior era" predating it).
  buildLedgerAccountsSeed(vendors: Vendor[], customers: Customer[]): LedgerAccount[] {
    const now = new Date().toISOString();
    const vendorAccounts: LedgerAccount[] = vendors.map((v, i) => ({
      id: `lac-vnd-${v.id}`,
      code: `LAC-${v.code}`,
      name: v.name,
      accountType: 'VENDOR' as LedgerAccountType,
      vendorId: v.id,
      openingBalance: 0,
      openingBalanceDrCr: 'DEBIT',
      status: v.status,
      createdAt: now,
    }));
    const customerAccounts: LedgerAccount[] = customers.map((c) => ({
      id: `lac-cust-${c.id}`,
      code: `LAC-${c.code}`,
      name: c.name,
      accountType: 'CUSTOMER' as LedgerAccountType,
      customerId: c.id,
      openingBalance: 0,
      openingBalanceDrCr: 'DEBIT',
      status: c.status,
      createdAt: now,
    }));
    const fixedAccounts: LedgerAccount[] = FIXED_LEDGER_ACCOUNTS.map((a) => ({
      ...a,
      id: `lac-fixed-${a.code}`,
      createdAt: now,
    }));
    return [...fixedAccounts, ...vendorAccounts, ...customerAccounts];
  },

  // VendorBill (AP-recognition event, not the GRN stock event) -> Dr Purchases, Cr Vendor.
  buildPurchaseBillVoucher(
    bill: VendorBill,
    vendorAccount: LedgerAccount,
    purchasesAccount: LedgerAccount,
  ): { voucherType: VoucherType; voucherDate: string; narration: string; lines: LedgerEntry[]; refType: 'VENDOR_BILL'; refId: string } {
    const amount = round2(bill.totalAmount);
    return {
      voucherType: 'PURCHASE_BILL',
      voucherDate: bill.invoiceDate,
      narration: `Purchase bill ${bill.billNumber} (vendor invoice ${bill.vendorInvoiceNumber})`,
      lines: [
        { ledgerAccountId: purchasesAccount.id, drCr: 'DEBIT', amount, particulars: `Purchases against ${bill.billNumber}` },
        { ledgerAccountId: vendorAccount.id, drCr: 'CREDIT', amount, particulars: `Bill ${bill.billNumber} raised` },
      ],
      refType: 'VENDOR_BILL',
      refId: bill.id,
    };
  },

  // VendorPayment SUCCESS -> Dr Vendor, Cr Bank/Cash (branch on payment.mode).
  buildPaymentVoucher(
    payment: VendorPayment,
    vendorAccount: LedgerAccount,
    contraAccount: LedgerAccount,
  ): { voucherType: VoucherType; voucherDate: string; narration: string; lines: LedgerEntry[]; refType: 'VENDOR_PAYMENT'; refId: string } {
    const amount = round2(payment.amount);
    return {
      voucherType: 'PAYMENT',
      voucherDate: payment.paidAt.slice(0, 10),
      narration: `Payment ${payment.paymentNumber} to vendor`,
      lines: [
        { ledgerAccountId: vendorAccount.id, drCr: 'DEBIT', amount, particulars: `Payment ${payment.paymentNumber}` },
        { ledgerAccountId: contraAccount.id, drCr: 'CREDIT', amount, particulars: `Payment ${payment.paymentNumber} via ${payment.mode}` },
      ],
      refType: 'VENDOR_PAYMENT',
      refId: payment.id,
    };
  },

  // SalesInvoice -> Dr Customer, Cr Sales Revenue.
  buildSalesInvoiceVoucher(
    invoice: SalesInvoice,
    customerAccount: LedgerAccount,
    salesAccount: LedgerAccount,
  ): { voucherType: VoucherType; voucherDate: string; narration: string; lines: LedgerEntry[]; refType: 'SALES_INVOICE'; refId: string } {
    const amount = round2(invoice.totalAmount);
    return {
      voucherType: 'SALES_INVOICE',
      voucherDate: invoice.invoiceDate,
      narration: `Sales invoice ${invoice.invoiceNumber}`,
      lines: [
        { ledgerAccountId: customerAccount.id, drCr: 'DEBIT', amount, particulars: `Invoice ${invoice.invoiceNumber} raised` },
        { ledgerAccountId: salesAccount.id, drCr: 'CREDIT', amount, particulars: `Sales against ${invoice.invoiceNumber}` },
      ],
      refType: 'SALES_INVOICE',
      refId: invoice.id,
    };
  },

  // CustomerPayment SUCCESS -> Dr Bank/Cash, Cr Customer.
  buildReceiptVoucher(
    payment: CustomerPayment,
    customerAccount: LedgerAccount,
    contraAccount: LedgerAccount,
  ): { voucherType: VoucherType; voucherDate: string; narration: string; lines: LedgerEntry[]; refType: 'CUSTOMER_PAYMENT'; refId: string } {
    const amount = round2(payment.amount);
    return {
      voucherType: 'RECEIPT',
      voucherDate: payment.receivedAt.slice(0, 10),
      narration: `Receipt ${payment.paymentNumber} from customer`,
      lines: [
        { ledgerAccountId: contraAccount.id, drCr: 'DEBIT', amount, particulars: `Receipt ${payment.paymentNumber} via ${payment.mode}` },
        { ledgerAccountId: customerAccount.id, drCr: 'CREDIT', amount, particulars: `Receipt ${payment.paymentNumber}` },
      ],
      refType: 'CUSTOMER_PAYMENT',
      refId: payment.id,
    };
  },

  isBalanced(lines: LedgerEntry[]): boolean {
    if (lines.length < 2) return false;
    if (lines.some((l) => !(l.amount > 0))) return false;
    const debit = round2(lines.filter((l) => l.drCr === 'DEBIT').reduce((sum, l) => sum + l.amount, 0));
    const credit = round2(lines.filter((l) => l.drCr === 'CREDIT').reduce((sum, l) => sum + l.amount, 0));
    return debit === credit;
  },

  validateVoucher(voucher: Pick<Voucher, 'lines'>, knownAccountIds: Set<string>): { valid: boolean; error?: string } {
    if (voucher.lines.length < 2) return { valid: false, error: 'A voucher needs at least 2 lines.' };
    if (voucher.lines.some((l) => !(l.amount > 0))) return { valid: false, error: 'Every line amount must be greater than zero.' };
    if (voucher.lines.some((l) => !knownAccountIds.has(l.ledgerAccountId))) return { valid: false, error: 'One or more lines reference an unknown ledger account.' };
    if (!ledgerService.isBalanced(voucher.lines)) return { valid: false, error: 'Total debit must equal total credit.' };
    return { valid: true };
  },

  // Chronological, line-by-line statement for one account: opening balance, then every POSTED
  // voucher line touching that account (date/voucher no/type/particulars/debit/credit/running
  // balance), up to an optional asOfDate. The single computation every ledger-drilldown screen
  // (Vendor/Customer/Aggregator Ledger) should read — never recompute this fold independently.
  buildLedgerRegister(
    account: LedgerAccount,
    vouchers: Voucher[],
    asOfDate?: string,
  ): { lines: LedgerRegisterLine[]; closingBalance: number; closingDrCr: DrCr } {
    // Normalize to a signed number (Debit positive, Credit negative) for the fold, then convert
    // back to magnitude + side per line — keeps the running-total math trivial and unambiguous.
    let signed = account.openingBalanceDrCr === 'DEBIT' ? account.openingBalance : -account.openingBalance;

    const relevant = vouchers
      .filter((v) => v.status === 'POSTED')
      .filter((v) => !asOfDate || v.voucherDate <= asOfDate)
      .sort((a, b) => a.voucherDate.localeCompare(b.voucherDate) || a.createdAt.localeCompare(b.createdAt));

    const lines: LedgerRegisterLine[] = [];
    for (const v of relevant) {
      for (const line of v.lines) {
        if (line.ledgerAccountId !== account.id) continue;
        signed = round2(signed + (line.drCr === 'DEBIT' ? line.amount : -line.amount));
        lines.push({
          voucherId: v.id,
          voucherNumber: v.voucherNumber,
          voucherDate: v.voucherDate,
          voucherType: v.voucherType,
          particulars: line.particulars,
          debit: line.drCr === 'DEBIT' ? line.amount : 0,
          credit: line.drCr === 'CREDIT' ? line.amount : 0,
          balance: signed >= 0 ? signed : -signed,
          balanceDrCr: signed >= 0 ? 'DEBIT' : 'CREDIT',
        });
      }
    }

    return {
      lines,
      closingBalance: signed >= 0 ? signed : -signed,
      closingDrCr: signed >= 0 ? 'DEBIT' : 'CREDIT',
    };
  },

  // Convenience wrapper over buildLedgerRegister for callers that only need the closing balance
  // (e.g. dashboard KPI cards) — always returns magnitude + side, never a bare signed number.
  computeRunningBalance(
    account: LedgerAccount,
    vouchers: Voucher[],
    asOfDate?: string,
  ): { balance: number; drCr: DrCr } {
    const { closingBalance, closingDrCr } = ledgerService.buildLedgerRegister(account, vouchers, asOfDate);
    return { balance: closingBalance, drCr: closingDrCr };
  },

  // Standard 0-15 / 15-30 / 30-60 / 60+ day ageing (days since dueDate; not-yet-due items fall
  // into 0-15 too, since the spec has no separate "current" bucket). Generic over any open-item
  // shape with an outstanding amount + a due date — reused for Vendor Bills and Sales Invoices.
  computeAgeingBuckets(
    openItems: { outstanding: number; dueDate: string }[],
    asOfDate: string,
  ): AgeingBuckets {
    const buckets: AgeingBuckets = { b0to15: 0, b15to30: 0, b30to60: 0, b60plus: 0, total: 0 };
    const asOfMs = Date.parse(asOfDate);
    for (const item of openItems) {
      const outstanding = round2(item.outstanding);
      if (outstanding <= 0) continue;
      const daysOverdue = Math.floor((asOfMs - Date.parse(item.dueDate)) / 86400000);
      if (daysOverdue <= 15) buckets.b0to15 += outstanding;
      else if (daysOverdue <= 30) buckets.b15to30 += outstanding;
      else if (daysOverdue <= 60) buckets.b30to60 += outstanding;
      else buckets.b60plus += outstanding;
      buckets.total += outstanding;
    }
    return {
      b0to15: round2(buckets.b0to15), b15to30: round2(buckets.b15to30),
      b30to60: round2(buckets.b30to60), b60plus: round2(buckets.b60plus), total: round2(buckets.total),
    };
  },

  // Per-bill/per-invoice payment status in the vendor/customer ledger's own vocabulary — distinct
  // from VendorBill.status/SalesInvoice.status, which track 3-way-match/approval state, not
  // payment progress. Cancelled items should be filtered out by the caller before calling this.
  deriveItemPaymentStatus(
    item: { totalAmount: number; paidAmount: number; dueDate: string },
    asOfDate: string,
  ): BillLedgerStatus {
    if (item.paidAmount >= item.totalAmount) return 'PAID';
    if (item.paidAmount > 0) return 'PARTIALLY_PAID';
    return item.dueDate < asOfDate ? 'OVERDUE' : 'UNPAID';
  },

  // Aggregator Ledger (Swiggy/Zomato): gross sales, commission/tax deductions, expected net
  // payout vs actual bank credit, with a variance flag — built by joining ChannelOrderSettlement
  // (the authoritative source for gross/commission/tax/expected payout) against
  // ReconciliationMatch (the authoritative source for what the bank actually credited, already
  // computed by reconciliationService.autoMatchBankTransactions — never re-derived here). No
  // Voucher/LedgerAccount postings exist for POS aggregator revenue yet (POS revenue as a whole
  // — cash/UPI/card/aggregator — isn't voucher-ized in this pass), so unlike the Vendor/Customer
  // Ledger this is a read-only summary over those two source domains, not a Dr/Cr register.
  buildAggregatorLedgerSummaries(
    settlements: ChannelOrderSettlement[],
    matches: ReconciliationMatch[],
  ): AggregatorLedgerSummary[] {
    const matchBySettlementId = new Map(
      matches.filter((m) => m.sourceType === 'CHANNEL_SETTLEMENT' && m.sourceId).map((m) => [m.sourceId as string, m]),
    );

    const platforms: ('SWIGGY' | 'ZOMATO')[] = ['SWIGGY', 'ZOMATO'];
    return platforms.map((platform) => {
      const platformSettlements = settlements.filter((s) => s.platform === platform);
      const rows: AggregatorSettlementRow[] = platformSettlements.map((s) => {
        const match = matchBySettlementId.get(s.id);
        const actualBankCredit = match ? match.bankAmount : null;
        const variance = match ? round2(s.netSettlement - match.bankAmount) : null;
        // Flagged on the actual amount difference, not on reconciliationService's own
        // MATCHED/MISMATCH label — that label can be MATCHED via an exact reference match even
        // when the settled amount differs from what the bank credited (it only confirms "this is
        // the right bank line", not "the payout amount agrees"). ₹1 tolerance absorbs rounding.
        const varianceFlag = variance !== null && Math.abs(variance) > 1;
        const status: AggregatorRowStatus = match
          ? (match.status as AggregatorRowStatus)
          : (s.status === 'PENDING' ? 'PENDING_SETTLEMENT' : 'UNMATCHED');
        return {
          settlementId: s.id, platform, externalOrderRef: s.externalOrderRef, settlementDate: s.settlementDate,
          grossSales: round2(s.orderAmount), commission: round2(s.commission), tax: round2(s.taxesCharges),
          expectedNetPayout: round2(s.netSettlement), actualBankCredit, variance, varianceFlag, status,
        };
      });

      return {
        platform,
        grossSales: round2(rows.reduce((sum, r) => sum + r.grossSales, 0)),
        commission: round2(rows.reduce((sum, r) => sum + r.commission, 0)),
        tax: round2(rows.reduce((sum, r) => sum + r.tax, 0)),
        expectedNetPayout: round2(rows.reduce((sum, r) => sum + r.expectedNetPayout, 0)),
        actualBankCreditReceived: round2(rows.reduce((sum, r) => sum + (r.actualBankCredit ?? 0), 0)),
        variance: round2(rows.reduce((sum, r) => sum + (r.actualBankCredit !== null ? r.expectedNetPayout - r.actualBankCredit : 0), 0)),
        rows,
      };
    });
  },

  // The only sanctioned path to "undo" a POSTED voucher — never mutate a POSTED voucher's lines.
  // Same lines with drCr flipped on every line.
  buildReversalVoucher(
    original: Voucher,
    createdBy: string,
  ): { voucherType: VoucherType; voucherDate: string; narration: string; lines: LedgerEntry[]; refType: 'REVERSAL'; refId: string; createdBy: string } {
    return {
      voucherType: original.voucherType,
      voucherDate: new Date().toISOString().slice(0, 10),
      narration: `Reversal of ${original.voucherNumber}: ${original.narration}`,
      lines: original.lines.map((l) => ({
        ...l,
        drCr: l.drCr === 'DEBIT' ? 'CREDIT' : 'DEBIT',
      })),
      refType: 'REVERSAL',
      refId: original.id,
      createdBy,
    };
  },
};
