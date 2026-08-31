// Banquet Management domain store: Hall master, Booking pipeline (Enquiry -> Confirmed [+advance]
// -> Completed [+final bill + balance settlement]). generateFinalBill is a read-only join against
// usePOSStore's already-hydrated orders/bills (catering add-ons via POSOrder.banquetBookingId) —
// Banquet never writes to POS or the stock ledger itself.

import { create } from 'zustand';
import { BanquetBooking, BanquetFinalBill, BanquetHall, BanquetPayment } from '@/types/banquet-mgmt';
import { PaymentMode } from '@/types/pos';
import { generateBanquetMgmtSeed } from '@/mock-data/banquet-mgmt.seed';
import { banquetMgmtService } from '@/services/banquetMgmtService';
import { firebaseDataService } from '@/services/firebaseDataService';
import { useHRMSStore } from '@/store/hrms-store';
import { usePOSStore } from '@/store/pos-store';

interface BanquetState {
  isHydrated: boolean;
  halls: BanquetHall[];
  bookings: BanquetBooking[];
  finalBills: BanquetFinalBill[];
  payments: BanquetPayment[];

  initializeFromFirebase: () => Promise<void>;

  createBooking: (data: { locationId: string; hallId: string; customerName: string; customerPhone: string; eventDate: string; startTime: string; endTime: string; expectedGuests: number; packageName: string; ratePerPlate: number }) => BanquetBooking;
  confirmBooking: (bookingId: string, advanceAmount: number, mode: PaymentMode, referenceNo?: string) => void;
  generateFinalBill: (bookingId: string) => BanquetFinalBill | undefined;
  settleBalance: (bookingId: string, mode: PaymentMode, referenceNo?: string) => void;
  cancelBooking: (id: string) => void;
}

export const useBanquetStore = create<BanquetState>((set, get) => ({
  isHydrated: false,
  halls: [],
  bookings: [],
  finalBills: [],
  payments: [],

  initializeFromFirebase: async () => {
    if (get().isHydrated) return;
    try {
      const locations = useHRMSStore.getState().locations;
      const seeded = generateBanquetMgmtSeed(locations);

      const fbHalls = await firebaseDataService.fetchRecord('erp/banquet/halls');
      const fbBookings = await firebaseDataService.fetchRecord('erp/banquet/bookings');
      const fbFinalBills = await firebaseDataService.fetchRecord('erp/banquet/finalBills');
      const fbPayments = await firebaseDataService.fetchRecord('erp/banquet/payments');

      set({
        halls: fbHalls && fbHalls.length > 0 ? fbHalls : seeded.halls,
        bookings: fbBookings && fbBookings.length > 0 ? fbBookings : seeded.bookings,
        finalBills: fbFinalBills && fbFinalBills.length > 0 ? fbFinalBills : seeded.finalBills,
        payments: fbPayments && fbPayments.length > 0 ? fbPayments : seeded.payments,
        isHydrated: true,
      });

      if (!fbHalls || fbHalls.length === 0) {
        firebaseDataService.saveRecord('erp/banquet/halls', seeded.halls);
        firebaseDataService.saveRecord('erp/banquet/bookings', seeded.bookings);
        firebaseDataService.saveRecord('erp/banquet/finalBills', seeded.finalBills);
        firebaseDataService.saveRecord('erp/banquet/payments', seeded.payments);
      }
    } catch (e) {
      console.warn('Banquet hydration warning, using local seed:', e);
      const seeded = generateBanquetMgmtSeed(useHRMSStore.getState().locations);
      set({ halls: seeded.halls, bookings: seeded.bookings, finalBills: seeded.finalBills, payments: seeded.payments, isHydrated: true });
    }
  },

  createBooking: (data) => {
    const booking: BanquetBooking = {
      id: `bqbook-${Date.now()}`, bookingNumber: banquetMgmtService.generateBookingNumber(get().bookings),
      locationId: data.locationId, hallId: data.hallId, customerName: data.customerName, customerPhone: data.customerPhone,
      eventDate: data.eventDate, startTime: data.startTime, endTime: data.endTime, expectedGuests: data.expectedGuests,
      packageName: data.packageName, ratePerPlate: data.ratePerPlate,
      packageAmount: banquetMgmtService.computePackageAmount(data.expectedGuests, data.ratePerPlate),
      advanceAmount: 0, status: 'ENQUIRY', createdAt: new Date().toISOString(),
    };
    set((state) => {
      const updated = [booking, ...state.bookings];
      firebaseDataService.saveRecord('erp/banquet/bookings', updated);
      return { bookings: updated };
    });
    return booking;
  },

  confirmBooking: (bookingId, advanceAmount, mode, referenceNo) => {
    const booking = get().bookings.find((b) => b.id === bookingId);
    if (!booking || booking.status !== 'ENQUIRY') return;

    const payment: BanquetPayment = {
      id: `bqpay-${Date.now()}`, bookingId, amount: advanceAmount, mode,
      // Omit (never assign undefined to) referenceNo when blank — Firebase's set() rejects any
      // object containing a literal `undefined` value.
      ...(referenceNo ? { referenceNo } : {}), purpose: 'ADVANCE', paidAt: new Date().toISOString(),
    };

    set((state) => {
      const updatedPayments = [payment, ...state.payments];
      const updatedBookings = state.bookings.map((b) => b.id === bookingId ? { ...b, advanceAmount, status: 'CONFIRMED' as const } : b);
      firebaseDataService.saveRecord('erp/banquet/payments', updatedPayments);
      firebaseDataService.saveRecord('erp/banquet/bookings', updatedBookings);
      return { payments: updatedPayments, bookings: updatedBookings };
    });
  },

  // Recomputes and upserts the final bill for a booking — safe to call repeatedly to pick up
  // newly-billed POS Banquet catering orders linked via banquetBookingId.
  generateFinalBill: (bookingId) => {
    const booking = get().bookings.find((b) => b.id === bookingId);
    const hall = get().halls.find((h) => h.id === booking?.hallId);
    if (!booking || !hall) return undefined;

    const { orders, bills } = usePOSStore.getState();
    const lines = banquetMgmtService.buildFinalBillLines({ booking, hall, orders, bills });
    const totalAmount = Math.round(lines.reduce((s, l) => s + l.amount, 0) * 100) / 100;
    const advanceAdjusted = booking.advanceAmount;
    const existing = get().finalBills.find((f) => f.bookingId === bookingId);

    const finalBill: BanquetFinalBill = {
      id: existing?.id ?? `bqbill-${booking.id}`, bookingId, lines, totalAmount, advanceAdjusted,
      balanceDue: Math.round((totalAmount - advanceAdjusted) * 100) / 100, amountPaid: existing?.amountPaid ?? advanceAdjusted,
      status: existing?.status ?? 'OPEN', generatedAt: new Date().toISOString(),
      ...(existing?.settledAt ? { settledAt: existing.settledAt } : {}),
    };

    set((state) => {
      const updated = existing ? state.finalBills.map((f) => f.id === finalBill.id ? finalBill : f) : [finalBill, ...state.finalBills];
      firebaseDataService.saveRecord('erp/banquet/finalBills', updated);
      return { finalBills: updated };
    });
    return finalBill;
  },

  settleBalance: (bookingId, mode, referenceNo) => {
    const booking = get().bookings.find((b) => b.id === bookingId);
    if (!booking || booking.status !== 'CONFIRMED') return;

    // Refresh the final bill one last time so any just-billed catering add-ons are included.
    const finalBill = get().generateFinalBill(bookingId);
    if (!finalBill) return;
    const balanceDue = Math.round((finalBill.totalAmount - finalBill.amountPaid) * 100) / 100;

    const payment: BanquetPayment = {
      id: `bqpay-${Date.now()}`, bookingId, amount: balanceDue, mode,
      ...(referenceNo ? { referenceNo } : {}), purpose: 'BALANCE', paidAt: new Date().toISOString(),
    };

    set((state) => {
      const updatedPayments = [payment, ...state.payments];
      const updatedFinalBills = state.finalBills.map((f) => f.id === finalBill.id
        ? { ...f, amountPaid: f.totalAmount, balanceDue: 0, status: 'SETTLED' as const, settledAt: new Date().toISOString() } : f);
      const updatedBookings = state.bookings.map((b) => b.id === bookingId ? { ...b, status: 'COMPLETED' as const } : b);
      firebaseDataService.saveRecord('erp/banquet/payments', updatedPayments);
      firebaseDataService.saveRecord('erp/banquet/finalBills', updatedFinalBills);
      firebaseDataService.saveRecord('erp/banquet/bookings', updatedBookings);
      return { payments: updatedPayments, finalBills: updatedFinalBills, bookings: updatedBookings };
    });
  },

  cancelBooking: (id) => {
    set((state) => {
      const updated = state.bookings.map((b) => b.id === id && b.status !== 'COMPLETED' ? { ...b, status: 'CANCELLED' as const } : b);
      firebaseDataService.saveRecord('erp/banquet/bookings', updated);
      return { bookings: updated };
    });
  },
}));
