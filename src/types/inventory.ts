// Inventory Domain: items are maintained per-outlet store. Stock only moves through the Stock
// Ledger — never edited directly by the UI. Consumption entries are posted by recipeService.

import { Status } from './erp-core';

export interface UOM {
  id: string;
  code: string; // KG, L, PC, G, ML
  name: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
}

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  uomId: string;
  isPerishable: boolean;
  reorderLevel: number;
  reorderQty: number;
  standardCost: number;
  status: Status;
}

export type StockLedgerEntryType =
  | 'OPENING' | 'PURCHASE' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'CONSUMPTION' | 'WASTAGE' | 'ADJUSTMENT' | 'RETURN';

export interface StockLedgerEntry {
  id: string;
  outletId: string;
  storeName: string;
  itemId: string;
  entryType: StockLedgerEntryType;
  qty: number; // signed: +in, -out
  balanceAfter: number;
  refType?: 'BILL' | 'TRANSFER' | 'GRN' | 'SALES_ORDER' | 'MANUAL';
  refId?: string;
  batchNo?: string;
  remarks?: string;
  createdBy: string;
  createdAt: string;
}

export interface StockBatch {
  id: string;
  outletId: string;
  itemId: string;
  batchNo: string;
  mfgDate?: string;
  expiryDate?: string;
  qty: number;
  vendorId?: string; // FK to Vendor Master, populated by GRN posting
  vendorName?: string;
  grnRef?: string;
}

export type StockTransferStatus = 'REQUESTED' | 'APPROVED' | 'DISPATCHED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';

export interface StockTransferLine {
  itemId: string;
  qty: number;
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  sourceOutletId: string;
  destinationOutletId: string;
  items: StockTransferLine[];
  status: StockTransferStatus;
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  dispatchedAt?: string;
  receivedAt?: string;
}

export interface CurrentStockLine {
  outletId: string;
  storeName: string;
  itemId: string;
  qty: number;
}
