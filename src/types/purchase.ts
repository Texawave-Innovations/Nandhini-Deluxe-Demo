// Purchase domain: Purchase Order + Goods Receipt Note. GRN posting (purchase-store.postGRN ->
// inventory-store.receiveGRNStock) is the sole path that raises PURCHASE stock-ledger entries —
// this store never writes inventory directly.

export type POStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CLOSED' | 'CANCELLED' | 'REJECTED';

export interface POLineItem {
  itemId: string;
  orderedQty: number;
  rate: number;
  receivedQty: number; // running total across all GRNs posted against this line
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  outletId: string; // delivery / receiving outlet
  lines: POLineItem[];
  totalAmount: number;
  status: POStatus;
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  expectedDeliveryDate?: string;
  remarks?: string;
}

export type GRNStatus = 'POSTED' | 'CANCELLED';

export interface GRNLineItem {
  itemId: string;
  orderedQty: number;
  receivedQty: number;
  rate: number;
  batchNo?: string;
  expiryDate?: string;
  lineTotal: number;
}

export interface GRN {
  id: string;
  grnNumber: string;
  poId: string;
  vendorId: string;
  outletId: string;
  lines: GRNLineItem[];
  totalAmount: number;
  status: GRNStatus;
  receivedBy: string;
  receivedAt: string;
  invoiceRefNo?: string; // vendor's physical invoice/challan number, if captured at receipt
}
