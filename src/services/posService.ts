// POS domain service: pure business-logic functions the pos-store calls. Each function here is
// the seam a future NestJS endpoint would replace (e.g. `computeBillTotals` -> `POST /pos/bills/preview`,
// `generateOrderNumber` -> server-assigned sequence) without the UI or the store changing shape.

import { Bill, BillType, Discount, KOT, KOTItem, OrderLineItem, POSOrder, Payment } from '@/types/pos';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const posService = {
  generateOrderNumber(outletCode: string): string {
    return `ORD-${outletCode}-${Date.now().toString().slice(-6)}`;
  },
  generateKOTNumber(): string {
    return `KOT-${Math.floor(100000 + Math.random() * 900000)}`;
  },
  generateBillNumber(outletCode: string): string {
    return `BILL-${outletCode}-${Date.now().toString().slice(-6)}`;
  },
  generateTransactionId(prefix: string): string {
    return `${prefix}${Math.floor(100000000 + Math.random() * 900000000)}`;
  },

  buildKOTFromOrder(order: POSOrder, tableCode: string | undefined): Omit<KOT, 'id'> {
    const items: KOTItem[] = order.items.map((it) => ({ menuItemId: it.menuItemId, name: it.name, qty: it.qty, instructions: it.instructions }));
    return {
      kotNumber: posService.generateKOTNumber(),
      orderId: order.id,
      outletId: order.outletId,
      tableCode,
      items,
      status: 'NEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  applyDiscount(discount: Discount, gross: number): number {
    const raw = discount.type === 'PERCENTAGE' ? (gross * discount.value) / 100 : discount.value;
    return discount.maxAmount ? Math.min(raw, discount.maxAmount) : raw;
  },

  // Computes the full bill breakdown (gross/discount/complimentary/non-chargeable/tax/service
  // charge/round-off/net) for a set of order line items.
  computeBillTotals(items: OrderLineItem[], discountAmountInput: number, billType: BillType, serviceChargePercent = 0) {
    const gross = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
    const isComplimentary = billType === 'COMPLIMENTARY';
    const isNonChargeable = billType === 'NON_CHARGEABLE';
    const discountAmount = isComplimentary ? 0 : Math.min(discountAmountInput || 0, gross);
    const taxableBase = gross - discountAmount;

    const taxAmount = isComplimentary || isNonChargeable
      ? 0
      : items.reduce((sum, it) => {
          const itemGross = it.qty * it.unitPrice;
          const share = gross > 0 ? itemGross / gross : 0;
          return sum + taxableBase * share * (it.taxPercent / 100);
        }, 0);

    const serviceChargeAmount = isComplimentary || isNonChargeable ? 0 : round2(taxableBase * (serviceChargePercent / 100));
    const netRaw = isComplimentary || isNonChargeable ? 0 : taxableBase + taxAmount + serviceChargeAmount;
    const netAmount = Math.round(netRaw);
    const roundOff = round2(netAmount - netRaw);

    return {
      grossAmount: round2(gross),
      discountAmount: round2(discountAmount),
      complimentaryAmount: isComplimentary ? round2(gross) : 0,
      nonChargeableAmount: isNonChargeable ? round2(gross) : 0,
      taxAmount: round2(taxAmount),
      serviceChargeAmount,
      roundOff,
      netAmount,
    };
  },

  sumPayments(payments: Payment[]): number {
    return round2(payments.filter((p) => p.status === 'SUCCESS').reduce((s, p) => s + p.amount, 0));
  },

  isBillFullyPaid(bill: Bill, payments: Payment[]): boolean {
    return posService.sumPayments(payments) >= bill.netAmount;
  },

  computeExpectedClosingCash(openingCash: number, cashSales: number, cashExpenses: number, cashRefunds: number): number {
    return round2(openingCash + cashSales - cashExpenses - cashRefunds);
  },

  computeVariance(expected: number, actual: number): number {
    return round2(actual - expected);
  },
};
