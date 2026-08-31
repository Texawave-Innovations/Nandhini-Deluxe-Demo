// Purchase domain service: PO/GRN numbering, PO status pipeline, and the GRN-receipt builder —
// the direct structural analog of recipeService.consumeForSale. This is a pure function; the
// store (purchase-store.postGRN) does the actual inventory-ledger/side-effect wiring.

import { GRN, GRNLineItem, POLineItem, POStatus, PurchaseOrder } from '@/types/purchase';

export const purchaseService = {
  generatePONumber(existing: PurchaseOrder[]): string {
    return `PO-${String(1000 + existing.length + 1).slice(-4)}`;
  },
  generateGRNNumber(existing: GRN[]): string {
    return `GRN-${String(1000 + existing.length + 1).slice(-4)}`;
  },

  // Linear pipeline for the pre-receiving stages only; receiving itself is not linear (a PO can
  // sit at PARTIALLY_RECEIVED across multiple GRNs), so it's handled by computePOStatusAfterReceipt.
  nextPOStatus(current: POStatus): POStatus | null {
    const pipeline: POStatus[] = ['DRAFT', 'SUBMITTED', 'APPROVED'];
    const idx = pipeline.indexOf(current);
    if (idx === -1 || idx === pipeline.length - 1) return null;
    return pipeline[idx + 1];
  },

  // Builds the GRN's line items + the plain {itemId, qty} stock postings for a receipt against a
  // PO. Does NOT touch the ledger — inventory-store.receiveGRNStock turns these postings into
  // StockLedgerEntry/StockBatch records, exactly like recipeService.consumeForSale's
  // ConsumptionEvent is turned into ledger entries by inventory-store.consumeForOrderItems.
  buildGRNReceiptLines(params: {
    po: PurchaseOrder;
    lines: { itemId: string; receivedQty: number; rate?: number; batchNo?: string; expiryDate?: string }[];
  }): { grnLines: GRNLineItem[]; totalAmount: number; postings: { itemId: string; qty: number; batchNo?: string; expiryDate?: string }[] } {
    const grnLines: GRNLineItem[] = params.lines
      .filter((l) => l.receivedQty > 0)
      .map((l) => {
        const poLine = params.po.lines.find((pl) => pl.itemId === l.itemId);
        const rate = l.rate ?? poLine?.rate ?? 0;
        return {
          itemId: l.itemId,
          orderedQty: poLine?.orderedQty ?? 0,
          receivedQty: l.receivedQty,
          rate,
          // Omit (never assign undefined to) optional fields — Firebase's set() rejects any
          // object containing a literal `undefined` value.
          ...(l.batchNo ? { batchNo: l.batchNo } : {}),
          ...(l.expiryDate ? { expiryDate: l.expiryDate } : {}),
          lineTotal: Math.round(l.receivedQty * rate * 100) / 100,
        };
      });

    return {
      grnLines,
      totalAmount: Math.round(grnLines.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100,
      postings: grnLines.map((l) => ({
        itemId: l.itemId, qty: l.receivedQty,
        ...(l.batchNo ? { batchNo: l.batchNo } : {}),
        ...(l.expiryDate ? { expiryDate: l.expiryDate } : {}),
      })),
    };
  },

  // Compares cumulative received qty (after this receipt) against ordered qty per line to
  // decide whether the PO is now fully, partially, or not-yet received.
  computePOStatusAfterReceipt(updatedLines: POLineItem[]): POStatus {
    const totalOrdered = updatedLines.reduce((s, l) => s + l.orderedQty, 0);
    const totalReceived = updatedLines.reduce((s, l) => s + Math.min(l.receivedQty, l.orderedQty), 0);
    if (totalReceived <= 0) return 'APPROVED';
    if (totalReceived >= totalOrdered) return 'RECEIVED';
    return 'PARTIALLY_RECEIVED';
  },

  // Warns (does not hard-block, consistent with the mockup's permissive style) when a receipt
  // line would push cumulative received qty past what was ordered.
  validateGRNAgainstPO(po: PurchaseOrder, lines: { itemId: string; receivedQty: number }[]): { itemId: string; overReceived: boolean }[] {
    return lines.map((l) => {
      const poLine = po.lines.find((pl) => pl.itemId === l.itemId);
      const cumulative = (poLine?.receivedQty ?? 0) + l.receivedQty;
      return { itemId: l.itemId, overReceived: !!poLine && cumulative > poLine.orderedQty };
    });
  },
};
