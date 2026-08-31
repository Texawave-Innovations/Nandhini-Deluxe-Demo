// Tally / accounting export domain. A TallyVoucher is a mock accounting entry generated from a
// posted GRN (Purchase voucher) or a settled VendorPayment (Payment voucher); TallyExportBatch
// groups a set of vouchers into one export run (mock XML string — no live Tally integration).

export type TallyVoucherType = 'PURCHASE' | 'PAYMENT';
export type TallyVoucherStatus = 'PENDING_EXPORT' | 'EXPORTED';

export interface TallyVoucher {
  id: string;
  voucherType: TallyVoucherType;
  voucherNumber: string;
  voucherDate: string;
  refType: 'GRN' | 'VENDOR_PAYMENT';
  refId: string;
  ledgerName: string; // vendor name, used as the Tally ledger account
  narration: string;
  debitLedger: string;
  creditLedger: string;
  amount: number;
  status: TallyVoucherStatus;
  exportBatchId?: string;
  createdAt: string;
}

export interface TallyExportBatch {
  id: string;
  batchNumber: string; // TXP-xxxxxx
  voucherIds: string[];
  voucherCount: number;
  totalValue: number;
  xmlPreview: string; // mock Tally-style XML content
  exportedBy: string;
  exportedAt: string;
}
