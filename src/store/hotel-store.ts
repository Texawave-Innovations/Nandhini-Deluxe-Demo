// Hotel Operations domain store: Room master, Reservation pipeline (Booked -> Checked-in ->
// Checked-out), and Folio generation. generateFolio is a read-only join against usePOSStore's
// already-hydrated orders/bills (Room Service charges) — Hotel never writes to POS or the stock
// ledger; it only reads POS's already-posted bills, mirroring how Reports & Analytics reads other
// domains without owning their data.

import { create } from 'zustand';
import { Folio, HotelPayment, Reservation, Room } from '@/types/hotel';
import { PaymentMode } from '@/types/pos';
import { generateHotelSeed } from '@/mock-data/hotel.seed';
import { hotelService } from '@/services/hotelService';
import { firebaseDataService } from '@/services/firebaseDataService';
import { useHRMSStore } from '@/store/hrms-store';
import { usePOSStore } from '@/store/pos-store';

interface HotelState {
  isHydrated: boolean;
  rooms: Room[];
  reservations: Reservation[];
  folios: Folio[];
  payments: HotelPayment[];

  initializeFromFirebase: () => Promise<void>;

  createReservation: (data: { locationId: string; roomId: string; guestName: string; guestPhone: string; guestEmail?: string; checkInDate: string; checkOutDate: string; numberOfGuests: number; ratePerNight: number }) => Reservation;
  checkIn: (reservationId: string) => void;
  generateFolio: (reservationId: string) => Folio | undefined;
  checkOut: (reservationId: string, mode: PaymentMode, referenceNo?: string) => void;
  markRoomClean: (roomId: string) => void;
  cancelReservation: (id: string) => void;
}

export const useHotelStore = create<HotelState>((set, get) => ({
  isHydrated: false,
  rooms: [],
  reservations: [],
  folios: [],
  payments: [],

  initializeFromFirebase: async () => {
    if (get().isHydrated) return;
    try {
      const locations = useHRMSStore.getState().locations;
      const seeded = generateHotelSeed(locations);

      const fbRooms = await firebaseDataService.fetchRecord('erp/hotel/rooms');
      const fbReservations = await firebaseDataService.fetchRecord('erp/hotel/reservations');
      const fbFolios = await firebaseDataService.fetchRecord('erp/hotel/folios');
      const fbPayments = await firebaseDataService.fetchRecord('erp/hotel/payments');

      set({
        rooms: fbRooms && fbRooms.length > 0 ? fbRooms : seeded.rooms,
        reservations: fbReservations && fbReservations.length > 0 ? fbReservations : seeded.reservations,
        folios: fbFolios && fbFolios.length > 0 ? fbFolios : seeded.folios,
        payments: fbPayments && fbPayments.length > 0 ? fbPayments : seeded.payments,
        isHydrated: true,
      });

      if (!fbRooms || fbRooms.length === 0) {
        firebaseDataService.saveRecord('erp/hotel/rooms', seeded.rooms);
        firebaseDataService.saveRecord('erp/hotel/reservations', seeded.reservations);
        firebaseDataService.saveRecord('erp/hotel/folios', seeded.folios);
        firebaseDataService.saveRecord('erp/hotel/payments', seeded.payments);
      }
    } catch (e) {
      console.warn('Hotel hydration warning, using local seed:', e);
      const seeded = generateHotelSeed(useHRMSStore.getState().locations);
      set({ rooms: seeded.rooms, reservations: seeded.reservations, folios: seeded.folios, payments: seeded.payments, isHydrated: true });
    }
  },

  createReservation: (data) => {
    const reservation: Reservation = {
      id: `res-${Date.now()}`, reservationNumber: hotelService.generateReservationNumber(get().reservations),
      locationId: data.locationId, roomId: data.roomId, guestName: data.guestName, guestPhone: data.guestPhone,
      // Omit (never assign undefined to) optional fields — Firebase's set() rejects any object
      // containing a literal `undefined` value.
      ...(data.guestEmail ? { guestEmail: data.guestEmail } : {}),
      checkInDate: data.checkInDate, checkOutDate: data.checkOutDate, numberOfGuests: data.numberOfGuests,
      ratePerNight: data.ratePerNight, status: 'BOOKED', createdAt: new Date().toISOString(),
    };
    set((state) => {
      const updated = [reservation, ...state.reservations];
      firebaseDataService.saveRecord('erp/hotel/reservations', updated);
      return { reservations: updated };
    });
    return reservation;
  },

  checkIn: (reservationId) => {
    const reservation = get().reservations.find((r) => r.id === reservationId);
    if (!reservation || reservation.status !== 'BOOKED') return;

    set((state) => {
      const updatedReservations = state.reservations.map((r) => r.id === reservationId
        ? { ...r, status: 'CHECKED_IN' as const, actualCheckInAt: new Date().toISOString() } : r);
      const updatedRooms = state.rooms.map((rm) => rm.id === reservation.roomId ? { ...rm, status: 'OCCUPIED' as const } : rm);
      firebaseDataService.saveRecord('erp/hotel/reservations', updatedReservations);
      firebaseDataService.saveRecord('erp/hotel/rooms', updatedRooms);
      return { reservations: updatedReservations, rooms: updatedRooms };
    });
  },

  // Recomputes and upserts the folio for a reservation — safe to call repeatedly (e.g. on page
  // load, or via a "Refresh Folio" button) to pick up newly-billed Room Service orders.
  generateFolio: (reservationId) => {
    const reservation = get().reservations.find((r) => r.id === reservationId);
    const room = get().rooms.find((rm) => rm.id === reservation?.roomId);
    if (!reservation || !room) return undefined;

    const { orders, bills } = usePOSStore.getState();
    const lines = hotelService.buildFolioLines({ reservation, room, orders, bills });
    const totalAmount = Math.round(lines.reduce((s, l) => s + l.amount, 0) * 100) / 100;
    const existing = get().folios.find((f) => f.reservationId === reservationId);

    const folio: Folio = {
      id: existing?.id ?? `folio-${reservation.id}`, reservationId, roomId: room.id, locationId: reservation.locationId,
      lines, totalAmount, amountPaid: existing?.amountPaid ?? 0, status: existing?.status ?? 'OPEN',
      generatedAt: new Date().toISOString(),
      ...(existing?.settledAt ? { settledAt: existing.settledAt } : {}),
    };

    set((state) => {
      const updated = existing ? state.folios.map((f) => f.id === folio.id ? folio : f) : [folio, ...state.folios];
      firebaseDataService.saveRecord('erp/hotel/folios', updated);
      return { folios: updated };
    });
    return folio;
  },

  checkOut: (reservationId, mode, referenceNo) => {
    const reservation = get().reservations.find((r) => r.id === reservationId);
    if (!reservation || reservation.status !== 'CHECKED_IN') return;

    // Refresh the folio one last time so any just-billed Room Service charges are included.
    const folio = get().generateFolio(reservationId);
    if (!folio) return;
    const balanceDue = Math.round((folio.totalAmount - folio.amountPaid) * 100) / 100;

    const payment: HotelPayment = {
      id: `hpay-${Date.now()}`, reservationId, amount: balanceDue, mode,
      ...(referenceNo ? { referenceNo } : {}), paidAt: new Date().toISOString(),
    };

    set((state) => {
      const updatedPayments = [payment, ...state.payments];
      const updatedFolios = state.folios.map((f) => f.id === folio.id
        ? { ...f, amountPaid: f.totalAmount, status: 'SETTLED' as const, settledAt: new Date().toISOString() } : f);
      const updatedReservations = state.reservations.map((r) => r.id === reservationId
        ? { ...r, status: 'CHECKED_OUT' as const, actualCheckOutAt: new Date().toISOString() } : r);
      const updatedRooms = state.rooms.map((rm) => rm.id === reservation.roomId ? { ...rm, status: 'DIRTY' as const } : rm);
      firebaseDataService.saveRecord('erp/hotel/payments', updatedPayments);
      firebaseDataService.saveRecord('erp/hotel/folios', updatedFolios);
      firebaseDataService.saveRecord('erp/hotel/reservations', updatedReservations);
      firebaseDataService.saveRecord('erp/hotel/rooms', updatedRooms);
      return { payments: updatedPayments, folios: updatedFolios, reservations: updatedReservations, rooms: updatedRooms };
    });
  },

  markRoomClean: (roomId) => {
    set((state) => {
      const updated = state.rooms.map((r) => r.id === roomId && r.status === 'DIRTY' ? { ...r, status: 'VACANT' as const } : r);
      firebaseDataService.saveRecord('erp/hotel/rooms', updated);
      return { rooms: updated };
    });
  },

  cancelReservation: (id) => {
    set((state) => {
      const updated = state.reservations.map((r) => r.id === id && r.status === 'BOOKED' ? { ...r, status: 'CANCELLED' as const } : r);
      firebaseDataService.saveRecord('erp/hotel/reservations', updated);
      return { reservations: updated };
    });
  },
}));
