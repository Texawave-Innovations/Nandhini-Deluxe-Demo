// Finance / Accounts Payable domain service: builds a Vendor Bill off a GRN, runs the 3-way
// match (PO vs GRN vs Bill), computes AP aging, and allocates a payment across outstanding bills.

import { GRN } from '@/types/purchase';
import { PurchaseOrder } from '@/types/purchase';
import {
  BillStatus, ThreeWayMatchLineResult, ThreeWayMatchResult, VendorBill, VendorBillLineItem, VendorPaymentAllocation,
} from '@/types/finance';

const RATE_VARIANCE_PERCENT_TOLERANCE = 2;
const RATE_VARIANCE_AMOUNT_TOLERANCE = 5;

export const financeService = {
  generateBillNumber(existing: VendorBill[]): string {
    return `APB-${String(1000 + existing.length + 1).slice(-4)}`;
  },
  generatePaymentNumber(existing: { paymentNumber: string }[]): string {
    return `PAY-${String(1000 + existing.length + 1).slice(-4)}`;
  },

  buildVendorBillFromGRN(params: {
    grn: GRN; vendorInvoiceNumber: string; invoiceDate: string; taxPercent: number; dueInDays: number; createdBy: string;
  }): Omit<VendorBill, 'id' | 'billNumber' | 'status' | 'matchResult' | 'amountPaid'> {
    const lines: VendorBillLineItem[] = params.grn.lines.map((l) => ({
      itemId: l.itemId, billedQty: l.receivedQty, rate: l.rate, lineTotal: l.lineTotal,
    }));
    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    const taxAmount = Math.round(subtotal * (params.taxPercent / 100) * 100) / 100;
    const due = new Date(params.invoiceDate);
    due.setDate(due.getDate() + params.dueInDays);

    return {
      vendorInvoiceNumber: params.vendorInvoiceNumber,
      vendorId: params.grn.vendorId,
      grnId: params.grn.id,
      poId: params.grn.poId,
      outletId: params.grn.outletId,
      invoiceDate: params.invoiceDate,
      dueDate: due.toISOString().substring(0, 10),
      lines,
      taxAmount,
      totalAmount: Math.round((subtotal + taxAmount) * 100) / 100,
      createdBy: params.createdBy,
      createdAt: new Date().toISOString(),
    };
  },

  // The 3-way match algorithm: qty must match exactly; rate is flagged MISMATCH if it drifts
  // beyond whichever tolerance is breached first (percent catches large-qty lines, a flat rupee
  // floor catches small-qty/low-value lines where a percent check would be sub-rupee noise).
  performThreeWayMatch(po: PurchaseOrder, grn: GRN, bill: VendorBill): ThreeWayMatchResult {
    const lineResults: ThreeWayMatchLineResult[] = bill.lines.map((billLine) => {
      const poLine = po.lines.find((l) => l.itemId === billLine.itemId);
      const grnLine = grn.lines.find((l) => l.itemId === billLine.itemId);
      const poQty = poLine?.orderedQty ?? 0;
      const grnQty = grnLine?.receivedQty ?? 0;
      const poRate = poLine?.rate ?? 0;
      const qtyMatch = grnQty === billLine.billedQty;
      const rateVarianceAmount = Math.round(Math.abs(billLine.rate - poRate) * billLine.billedQty * 100) / 100;
      const rateVariancePercent = poRate > 0 ? Math.round((Math.abs(billLine.rate - poRate) / poRate) * 10000) / 100 : 0;
      const reasonCodes: ThreeWayMatchLineResult['reasonCodes'] = [];
      if (!qtyMatch) reasonCodes.push('QTY_MISMATCH');
      if (rateVariancePercent > RATE_VARIANCE_PERCENT_TOLERANCE || rateVarianceAmount > RATE_VARIANCE_AMOUNT_TOLERANCE) reasonCodes.push('RATE_VARIANCE');

      return {
        itemId: billLine.itemId, poQty, grnQty, billQty: billLine.billedQty, poRate, billRate: billLine.rate,
        qtyMatch, rateVariancePercent, rateVarianceAmount,
        lineStatus: reasonCodes.length === 0 ? 'MATCHED' : 'MISMATCH', reasonCodes,
      };
    });

    return {
      status: lineResults.some((l) => l.lineStatus === 'MISMATCH') ? 'MISMATCH' : 'MATCHED',
      lineResults,
      totalVarianceAmount: Math.round(lineResults.reduce((s, l) => s + l.rateVarianceAmount, 0) * 100) / 100,
      checkedAt: new Date().toISOString(),
    };
  },

  computeAPAging(bills: VendorBill[], asOfDate: string): { current: number; d30: number; d60: number; d90plus: number; total: number } {
    const asOf = new Date(asOfDate).getTime();
    const totals = { current: 0, d30: 0, d60: 0, d90plus: 0, total: 0 };
    bills
      .filter((b) => b.status !== 'CANCELLED' && b.totalAmount - b.amountPaid > 0)
      .forEach((b) => {
        const outstanding = b.totalAmount - b.amountPaid;
        const daysOverdue = Math.floor((asOf - new Date(b.dueDate).getTime()) / 86400000);
        totals.total += outstanding;
        if (daysOverdue <= 0) totals.current += outstanding;
        else if (daysOverdue <= 30) totals.d30 += outstanding;
        else if (daysOverdue <= 60) totals.d60 += outstanding;
        else totals.d90plus += outstanding;
      });
    return totals;
  },

  // FIFO by due date across the vendor's outstanding bills, until the payment amount is exhausted.
  allocatePaymentToBills(vendorBills: VendorBill[], vendorId: string, amount: number): VendorPaymentAllocation[] {
    const outstanding = vendorBills
      .filter((b) => b.vendorId === vendorId && b.status !== 'CANCELLED' && b.totalAmount - b.amountPaid > 0)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    const allocations: VendorPaymentAllocation[] = [];
    let remaining = amount;
    for (const bill of outstanding) {
      if (remaining <= 0) break;
      const due = bill.totalAmount - bill.amountPaid;
      const alloc = Math.min(due, remaining);
      allocations.push({ billId: bill.id, amount: Math.round(alloc * 100) / 100 });
      remaining -= alloc;
    }
    return allocations;
  },

  computeBillStatusAfterPayment(bill: VendorBill, newAmountPaid: number): BillStatus {
    if (newAmountPaid >= bill.totalAmount) return 'PAID';
    if (newAmountPaid > 0) return 'PARTIALLY_PAID';
    return bill.status;
  },
};
