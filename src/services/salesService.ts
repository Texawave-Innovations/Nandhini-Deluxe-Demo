// Sales / Accounts Receivable domain service: Customer numbering, Sales Order -> Invoice builder,
// AR aging, and FIFO payment allocation. The AR mirror of vendorService + financeService's AP
// helpers — same shapes, same tolerance-free logic, kept in its own file since Sales is a
// self-contained domain (never touches finance.ts's vendor-only types).

import { Customer } from '@/types/sales';
import {
  CustomerPaymentAllocation, SalesInvoice, SalesInvoiceLineItem, SalesInvoiceStatus, SalesOrder,
} from '@/types/sales';

export interface CustomerAgingBuckets {
  current: number;
  d30: number;
  d60: number;
  d90plus: number;
  total: number;
}

export const salesService = {
  generateCustomerCode(existing: Customer[]): string {
    return `CUST-${String(1000 + existing.length + 1).slice(-4)}`;
  },
  generateSONumber(existing: SalesOrder[]): string {
    return `SO-${String(1000 + existing.length + 1).slice(-4)}`;
  },
  generateInvoiceNumber(existing: SalesInvoice[]): string {
    return `SINV-${String(1000 + existing.length + 1).slice(-4)}`;
  },
  generatePaymentNumber(existing: { paymentNumber: string }[]): string {
    return `RCPT-${String(1000 + existing.length + 1).slice(-4)}`;
  },

  buildInvoiceFromSalesOrder(params: {
    so: SalesOrder; invoiceDate: string; taxPercent: number; dueInDays: number; createdBy: string;
  }): Omit<SalesInvoice, 'id' | 'invoiceNumber' | 'status' | 'amountReceived'> {
    const lines: SalesInvoiceLineItem[] = params.so.lines.map((l) => ({
      menuItemId: l.menuItemId, name: l.name, qty: l.qty, rate: l.rate,
      lineTotal: Math.round(l.qty * l.rate * 100) / 100,
    }));
    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    const taxAmount = Math.round(subtotal * (params.taxPercent / 100) * 100) / 100;
    const due = new Date(params.invoiceDate);
    due.setDate(due.getDate() + params.dueInDays);

    return {
      soId: params.so.id,
      customerId: params.so.customerId,
      outletId: params.so.outletId,
      invoiceDate: params.invoiceDate,
      dueDate: due.toISOString().substring(0, 10),
      lines,
      taxAmount,
      totalAmount: Math.round((subtotal + taxAmount) * 100) / 100,
      createdBy: params.createdBy,
      createdAt: new Date().toISOString(),
    };
  },

  computeOutstandingForCustomer(invoices: SalesInvoice[], customerId: string): number {
    return invoices
      .filter((i) => i.customerId === customerId && i.status !== 'CANCELLED')
      .reduce((s, i) => s + (i.totalAmount - i.amountReceived), 0);
  },

  computeARAging(invoices: SalesInvoice[], asOfDate: string): CustomerAgingBuckets {
    const asOf = new Date(asOfDate).getTime();
    const buckets: CustomerAgingBuckets = { current: 0, d30: 0, d60: 0, d90plus: 0, total: 0 };
    invoices
      .filter((i) => i.status !== 'CANCELLED' && i.totalAmount - i.amountReceived > 0)
      .forEach((i) => {
        const outstanding = i.totalAmount - i.amountReceived;
        const daysOverdue = Math.floor((asOf - new Date(i.dueDate).getTime()) / 86400000);
        buckets.total += outstanding;
        if (daysOverdue <= 0) buckets.current += outstanding;
        else if (daysOverdue <= 30) buckets.d30 += outstanding;
        else if (daysOverdue <= 60) buckets.d60 += outstanding;
        else buckets.d90plus += outstanding;
      });
    return buckets;
  },

  getCustomerAgingBuckets(invoices: SalesInvoice[], customerId: string, asOfDate: string): CustomerAgingBuckets {
    return salesService.computeARAging(invoices.filter((i) => i.customerId === customerId), asOfDate);
  },

  rankCustomersByOutstanding(customers: Customer[], invoices: SalesInvoice[]): (Customer & { outstanding: number })[] {
    return customers
      .map((c) => ({ ...c, outstanding: salesService.computeOutstandingForCustomer(invoices, c.id) }))
      .sort((a, b) => b.outstanding - a.outstanding);
  },

  // FIFO by due date across the customer's outstanding invoices, until the payment amount is exhausted.
  allocatePaymentToInvoices(invoices: SalesInvoice[], customerId: string, amount: number): CustomerPaymentAllocation[] {
    const outstanding = invoices
      .filter((i) => i.customerId === customerId && i.status !== 'CANCELLED' && i.totalAmount - i.amountReceived > 0)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    const allocations: CustomerPaymentAllocation[] = [];
    let remaining = amount;
    for (const invoice of outstanding) {
      if (remaining <= 0) break;
      const due = invoice.totalAmount - invoice.amountReceived;
      const alloc = Math.min(due, remaining);
      allocations.push({ invoiceId: invoice.id, amount: Math.round(alloc * 100) / 100 });
      remaining -= alloc;
    }
    return allocations;
  },

  computeInvoiceStatusAfterPayment(invoice: SalesInvoice, newAmountReceived: number): SalesInvoiceStatus {
    if (newAmountReceived >= invoice.totalAmount) return 'PAID';
    if (newAmountReceived > 0) return 'PARTIALLY_PAID';
    return invoice.status;
  },
};
