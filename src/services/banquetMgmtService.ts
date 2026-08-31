// Banquet Management domain service: booking numbering, package-amount math, final-bill-line
// building (package + linked POS Banquet catering bills), revenue/upcoming helpers. Pure functions
// only — banquet-store.ts is the only caller.

import { Bill, POSOrder } from '@/types/pos';
import { BanquetBillLine, BanquetBooking, BanquetFinalBill, BanquetHall } from '@/types/banquet-mgmt';

export const banquetMgmtService = {
  generateBookingNumber(existing: BanquetBooking[]): string {
    return `BQ-${String(1000 + existing.length + 1).slice(-4)}`;
  },

  computePackageAmount(expectedGuests: number, ratePerPlate: number): number {
    return Math.round(expectedGuests * ratePerPlate * 100) / 100;
  },

  // Package line + one line per POS Banquet order's bill linked to this booking.
  buildFinalBillLines(params: { booking: BanquetBooking; hall: BanquetHall; orders: POSOrder[]; bills: Bill[] }): BanquetBillLine[] {
    const { booking, hall, orders, bills } = params;
    const lines: BanquetBillLine[] = [
      { type: 'PACKAGE', description: `${booking.packageName} — ${hall.name} (${booking.expectedGuests} guests)`, amount: booking.packageAmount },
    ];

    const linkedOrderIds = new Set(orders.filter((o) => o.orderType === 'BANQUET' && o.banquetBookingId === booking.id).map((o) => o.id));
    bills
      .filter((b) => linkedOrderIds.has(b.orderId) && b.status !== 'VOID')
      .forEach((b) => {
        lines.push({ type: 'CATERING_ADDON', description: `Catering — Bill ${b.billNumber}`, amount: b.netAmount, sourceBillId: b.id });
      });

    return lines;
  },

  computeUpcomingBookings(bookings: BanquetBooking[], fromDate: string): BanquetBooking[] {
    return bookings
      .filter((b) => b.status === 'CONFIRMED' && b.eventDate >= fromDate)
      .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  },

  computeBanquetRevenue(finalBills: BanquetFinalBill[]): number {
    return finalBills.filter((f) => f.status === 'SETTLED').reduce((s, f) => s + f.totalAmount, 0);
  },
};
