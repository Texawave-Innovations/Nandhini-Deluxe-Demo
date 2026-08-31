// Vendor domain service: pure read helpers over the Vendor Master + AP data. The seam a future
// NestJS `GET /vendors` etc. would replace without the UI/store changing shape.

import { Vendor } from '@/types/vendor';
import { VendorBill } from '@/types/finance';

export interface VendorAgingBuckets {
  current: number;
  d30: number;
  d60: number;
  d90plus: number;
  total: number;
}

export const vendorService = {
  generateVendorCode(existing: Vendor[]): string {
    return `VND-${String(1000 + existing.length + 1).slice(-4)}`;
  },

  listActiveVendors(vendors: Vendor[]): Vendor[] {
    return vendors.filter((v) => v.status === 'ACTIVE');
  },

  computeOutstandingForVendor(bills: VendorBill[], vendorId: string): number {
    return bills
      .filter((b) => b.vendorId === vendorId && b.status !== 'CANCELLED')
      .reduce((s, b) => s + (b.totalAmount - b.amountPaid), 0);
  },

  getVendorAgingBuckets(bills: VendorBill[], vendorId: string, asOfDate: string): VendorAgingBuckets {
    const asOf = new Date(asOfDate).getTime();
    const buckets: VendorAgingBuckets = { current: 0, d30: 0, d60: 0, d90plus: 0, total: 0 };
    bills
      .filter((b) => b.vendorId === vendorId && b.status !== 'CANCELLED' && b.totalAmount - b.amountPaid > 0)
      .forEach((b) => {
        const outstanding = b.totalAmount - b.amountPaid;
        const daysOverdue = Math.floor((asOf - new Date(b.dueDate).getTime()) / 86400000);
        buckets.total += outstanding;
        if (daysOverdue <= 0) buckets.current += outstanding;
        else if (daysOverdue <= 30) buckets.d30 += outstanding;
        else if (daysOverdue <= 60) buckets.d60 += outstanding;
        else buckets.d90plus += outstanding;
      });
    return buckets;
  },

  rankVendorsByOutstanding(vendors: Vendor[], bills: VendorBill[]): (Vendor & { outstanding: number })[] {
    return vendors
      .map((v) => ({ ...v, outstanding: vendorService.computeOutstandingForVendor(bills, v.id) }))
      .sort((a, b) => b.outstanding - a.outstanding);
  },
};
