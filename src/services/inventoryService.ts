// Inventory domain service: stock is always derived from the Stock Ledger (never edited
// directly), and inter-outlet transfers move through an explicit approval pipeline.

import { InventoryItem, StockBatch, StockLedgerEntry, StockLedgerEntryType, StockTransfer, StockTransferStatus } from '@/types/inventory';

export interface StockBalance {
  itemId: string;
  qty: number;
}

const TRANSFER_PIPELINE: StockTransferStatus[] = ['REQUESTED', 'APPROVED', 'DISPATCHED', 'IN_TRANSIT', 'RECEIVED'];

export const inventoryService = {
  computeCurrentStock(ledgerEntries: StockLedgerEntry[], outletId?: string): StockBalance[] {
    const totals = new Map<string, number>();
    ledgerEntries
      .filter((e) => !outletId || e.outletId === outletId)
      .forEach((e) => {
        totals.set(e.itemId, (totals.get(e.itemId) ?? 0) + e.qty);
      });
    return Array.from(totals.entries()).map(([itemId, qty]) => ({ itemId, qty: Math.round(qty * 1000) / 1000 }));
  },

  getBalanceForItem(ledgerEntries: StockLedgerEntry[], outletId: string, itemId: string): number {
    return ledgerEntries
      .filter((e) => e.outletId === outletId && e.itemId === itemId)
      .reduce((s, e) => s + e.qty, 0);
  },

  buildLedgerEntry(params: {
    outletId: string; storeName: string; itemId: string; entryType: StockLedgerEntryType; qty: number;
    priorBalance: number; refType?: StockLedgerEntry['refType']; refId?: string; batchNo?: string; remarks?: string; createdBy: string;
  }): Omit<StockLedgerEntry, 'id'> {
    return {
      outletId: params.outletId, storeName: params.storeName, itemId: params.itemId, entryType: params.entryType,
      qty: params.qty, balanceAfter: Math.round((params.priorBalance + params.qty) * 1000) / 1000,
      // Omit (never assign undefined to) optional fields the caller didn't provide — Firebase's
      // set() rejects any object containing a literal `undefined` value, which would otherwise
      // silently fail every save of the entries array that includes one of these.
      ...(params.refType ? { refType: params.refType } : {}),
      ...(params.refId ? { refId: params.refId } : {}),
      ...(params.batchNo ? { batchNo: params.batchNo } : {}),
      ...(params.remarks ? { remarks: params.remarks } : {}),
      createdBy: params.createdBy, createdAt: new Date().toISOString(),
    };
  },

  getLowStockItems(items: InventoryItem[], balances: StockBalance[]): (InventoryItem & { currentQty: number })[] {
    const byItem = new Map(balances.map((b) => [b.itemId, b.qty]));
    return items
      .map((item) => ({ ...item, currentQty: byItem.get(item.id) ?? 0 }))
      .filter((item) => item.currentQty <= item.reorderLevel);
  },

  getExpiringBatches(batches: StockBatch[], asOfDate: string, withinDays = 3): (StockBatch & { daysToExpiry: number; isExpired: boolean })[] {
    const asOf = new Date(asOfDate).getTime();
    return batches
      .filter((b) => b.expiryDate)
      .map((b) => {
        const days = Math.ceil((new Date(b.expiryDate!).getTime() - asOf) / 86400000);
        return { ...b, daysToExpiry: days, isExpired: days < 0 };
      })
      .filter((b) => b.isExpired || b.daysToExpiry <= withinDays);
  },

  generateTransferNumber(): string {
    return `TRF-${Date.now().toString().slice(-6)}`;
  },

  nextTransferStatus(current: StockTransferStatus): StockTransferStatus | null {
    const idx = TRANSFER_PIPELINE.indexOf(current);
    if (idx === -1 || idx === TRANSFER_PIPELINE.length - 1) return null;
    return TRANSFER_PIPELINE[idx + 1];
  },

  transferPipeline: TRANSFER_PIPELINE,
};
