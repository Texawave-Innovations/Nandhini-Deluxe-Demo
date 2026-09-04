// Core double-entry accounting domain: LedgerAccount (one per Vendor/Customer/Bank/Cash/
// Aggregator/Expense/Income), Voucher (a balanced set of LedgerEntry debit/credit lines), and
// LedgerEntry (one debit-or-credit line within a Voucher, posted against exactly one
// LedgerAccount). This is the SINGLE source of truth every ledger/BRS/projection/dashboard screen
// reads from — no screen may keep its own duplicate running totals; always derive balances via
// ledgerService.computeRunningBalance.
//
// Deliberately separate from types/tally.ts (TallyVoucher): that single-entry export-mockup
// domain is untouched for now and is superseded by this one only when the /tally/* pages are cut
// over in a later pass (Voucher Entry UI redesign).

import { Status } from './erp-core';

export type LedgerAccountType =
  | 'VENDOR' | 'CUSTOMER' | 'AGGREGATOR' | 'BANK' | 'CASH' | 'EXPENSE' | 'INCOME';

export type DrCr = 'DEBIT' | 'CREDIT';

export interface LedgerAccount {
  id: string;
  code: string; // LAC-xxxx
  name: string;
  accountType: LedgerAccountType;
  // FK back-references — present only for the matching accountType. Never assign undefined:
  // the key is omitted entirely (conditional spread) when not applicable.
  vendorId?: string;   // set iff accountType === 'VENDOR'
  customerId?: string; // set iff accountType === 'CUSTOMER'
  openingBalance: number;   // always a non-negative magnitude
  openingBalanceDrCr: DrCr; // which side the opening balance sits on
  status: Status;
  createdAt: string;
}

export type VoucherType =
  | 'PAYMENT' | 'RECEIPT' | 'JOURNAL' | 'CONTRA'
  | 'DEBIT_NOTE' | 'CREDIT_NOTE' | 'PURCHASE_BILL' | 'SALES_INVOICE';

// DRAFT vouchers are freely editable/deletable. POSTED vouchers are immutable — the only way to
// change a POSTED voucher's economic effect is reverseVoucher(), which creates a new voucher and
// flips this one to REVERSED. No store action ever mutates a POSTED voucher's `lines`.
export type VoucherStatus = 'DRAFT' | 'POSTED' | 'REVERSED';

export type VoucherRefType =
  | 'GRN' | 'VENDOR_BILL' | 'VENDOR_PAYMENT' | 'SALES_INVOICE' | 'CUSTOMER_PAYMENT'
  | 'MANUAL' | 'REVERSAL';

export interface LedgerEntry {
  ledgerAccountId: string;
  drCr: DrCr;
  amount: number; // always > 0; the line's side is drCr, never a signed number
  particulars: string; // free-text line narration, e.g. "Purchases against Bill APB-1024"
}

export interface Voucher {
  id: string;
  voucherNumber: string; // per-type prefix, see ledgerService.generateVoucherNumber
  voucherType: VoucherType;
  voucherDate: string; // YYYY-MM-DD
  narration: string;
  lines: LedgerEntry[]; // must balance: sum(debit lines) === sum(credit lines)
  status: VoucherStatus;
  // Provenance: which business event this voucher was auto-derived from, if any. Manually
  // created vouchers (Journal/Contra/etc, entered directly by an accountant) omit these.
  refType?: VoucherRefType;
  refId?: string;
  // Reversal linkage — set on both sides once a POSTED voucher is reversed.
  reversedByVoucherId?: string; // set on the ORIGINAL voucher once reversed
  reversesVoucherId?: string;   // set on the REVERSAL voucher, pointing back at the original
  // Manual-entry-only fields (Voucher Entry screen). attachmentName is a placeholder for OCR bill
  // capture (later pass) — just a filename today, no actual file storage/upload.
  attachmentName?: string;
  // Set once this voucher is included in an export batch (see VoucherExportBatch) — orthogonal
  // to `status`: only POSTED vouchers are exportable, but export-ness is a bookkeeping-sync
  // concern, not part of the accounting lifecycle itself.
  exportBatchId?: string;
  createdBy: string;
  createdAt: string;
  postedBy?: string;
  postedAt?: string;
}

// Groups a batch of already-POSTED vouchers into one mock Tally XML export run — no live Tally
// connector, this is a mockup of the export like the domain it replaces (the old types/tally.ts).
export interface VoucherExportBatch {
  id: string;
  batchNumber: string; // TXP-xxxxxx
  voucherIds: string[];
  voucherCount: number;
  totalValue: number;
  xmlPreview: string; // mock Tally-style XML content
  exportedBy: string;
  exportedAt: string;
}
