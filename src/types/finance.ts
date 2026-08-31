// Finance / Accounts Payable domain: a Vendor Bill raised off a GRN, 3-way matched against the
// PO + GRN, and Vendor Payments allocated across one or more bills.

export type MatchStatus = 'MATCHED' | 'MISMATCH';
export type BillStatus = MatchStatus | 'APPROVED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';

export interface VendorBillLineItem {
  itemId: string;
  billedQty: number;
  rate: number;
  lineTotal: number;
}

export interface ThreeWayMatchLineResult {
  itemId: string;
  poQty: number;
  grnQty: number;
  billQty: number;
  poRate: number;
  billRate: number;
  qtyMatch: boolean;
  rateVariancePercent: number;
  rateVarianceAmount: number;
  lineStatus: MatchStatus;
  reasonCodes: ('QTY_MISMATCH' | 'RATE_VARIANCE')[];
}

export interface ThreeWayMatchResult {
  status: MatchStatus;
  lineResults: ThreeWayMatchLineResult[];
  totalVarianceAmount: number;
  checkedAt: string;
}

export interface VendorBill {
  id: string;
  billNumber: string; // internal AP number
  vendorInvoiceNumber: string; // vendor's own invoice number
  vendorId: string;
  grnId: string;
  poId: string;
  outletId: string;
  invoiceDate: string;
  dueDate: string;
  lines: VendorBillLineItem[];
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  status: BillStatus;
  matchResult?: ThreeWayMatchResult;
  approvedBy?: string;
  approvedAt?: string;
  createdBy: string;
  createdAt: string;
}

export type VendorPaymentMode = 'NEFT' | 'RTGS' | 'UPI' | 'CHEQUE' | 'CASH';
export type VendorPaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface VendorPaymentAllocation {
  billId: string;
  amount: number;
}

export interface VendorPayment {
  id: string;
  paymentNumber: string;
  vendorId: string;
  mode: VendorPaymentMode;
  amount: number;
  referenceNo?: string; // bank UTR/reference — the reconciliation match key
  allocations: VendorPaymentAllocation[];
  status: VendorPaymentStatus;
  paidBy: string;
  paidAt: string;
}
