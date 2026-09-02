// Purchase domain service: PO/GRN numbering, PO status pipeline, and the GRN-receipt builder —
// the direct structural analog of recipeService.consumeForSale. This is a pure function; the
// store (purchase-store.postGRN) does the actual inventory-ledger/side-effect wiring.

import { GRN, GRNLineItem, POLineItem, POStatus, PurchaseOrder } from '@/types/purchase';

// Deterministic string hash -> [0, 1), used only by simulateInvoiceScan below so the same PO
// "scans" the same way every time (a reliable, repeatable demo instead of Math.random noise).
function hashToUnit(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

export interface ScannedInvoiceLine {
  itemId: string;
  extractedQty: number;
  extractedRate: number;
  confidencePercent: number;
  flagged: boolean; // qty or rate diverges from the PO — worth a human glance before posting
}

export interface ScannedInvoiceResult {
  vendorMatchConfidence: number;
  extractedInvoiceNumber: string;
  extractedDate: string;
  lines: ScannedInvoiceLine[];
}

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

  // Simulates what a vision-OCR model would extract from a photographed vendor invoice —
  // deterministic (hashToUnit, not Math.random) so the same PO scans the same way every time,
  // making this reliable and repeatable for a live demo. Same honesty convention as
  // aiInsightsService: no hosted model, clearly a rule-based stand-in for one.
  //
  // Roughly 70% of open PO lines come back an exact match, ~20% a small short-delivery, and ~10%
  // with a rate a few percent above the PO rate — enough, on that last bucket, to genuinely cross
  // financeService.performThreeWayMatch's existing 2%/₹5 tolerance once a Bill is created from the
  // resulting GRN, so a live MISMATCH is reachable in the demo, not scripted after the fact.
  simulateInvoiceScan(po: PurchaseOrder): ScannedInvoiceResult {
    const openLines = po.lines.filter((l) => l.receivedQty < l.orderedQty);

    const lines: ScannedInvoiceLine[] = openLines.map((l) => {
      const remaining = l.orderedQty - l.receivedQty;
      const bucket = hashToUnit(`${po.id}::${l.itemId}`);

      if (bucket < 0.70 || remaining <= 1) {
        return { itemId: l.itemId, extractedQty: remaining, extractedRate: l.rate, confidencePercent: 97, flagged: false };
      }
      if (bucket < 0.90) {
        const shortBy = 1 + (Math.floor((bucket - 0.70) * 100) % 3); // 1-3 units, deterministic per line
        return { itemId: l.itemId, extractedQty: Math.max(1, remaining - shortBy), extractedRate: l.rate, confidencePercent: 91, flagged: true };
      }
      const bumpPercent = 3 + (Math.floor((bucket - 0.90) * 100) % 7); // roughly 3%-9% above the PO rate
      const extractedRate = Math.round(l.rate * (1 + bumpPercent / 100) * 100) / 100;
      return { itemId: l.itemId, extractedQty: remaining, extractedRate, confidencePercent: 81, flagged: true };
    });

    return {
      vendorMatchConfidence: 98,
      extractedInvoiceNumber: `INV-${po.poNumber.replace('PO-', '')}-${String(100 + Math.floor(hashToUnit(po.id) * 900)).slice(-3)}`,
      extractedDate: new Date().toISOString().substring(0, 10),
      lines,
    };
  },
};
