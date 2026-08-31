// Hotel Operations domain service: reservation numbering, nights/room-charge math, folio-line
// building (room charge + linked POS Room Service bills), occupancy and arrivals/departures.
// Pure functions only — hotel-store.ts is the only caller, same convention as every other domain.

import { Bill, POSOrder } from '@/types/pos';
import { Folio, FolioLine, Reservation, Room } from '@/types/hotel';

export const hotelService = {
  generateReservationNumber(existing: Reservation[]): string {
    return `RES-${String(1000 + existing.length + 1).slice(-4)}`;
  },

  computeNights(checkInDate: string, checkOutDate: string): number {
    const nights = Math.round((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / 86400000);
    return Math.max(1, nights);
  },

  computeRoomChargeTotal(ratePerNight: number, nights: number): number {
    return Math.round(ratePerNight * nights * 100) / 100;
  },

  // Room charge line + one line per POS Room Service bill for this room, placed during the stay.
  buildFolioLines(params: { reservation: Reservation; room: Room; orders: POSOrder[]; bills: Bill[] }): FolioLine[] {
    const { reservation, room, orders, bills } = params;
    const nights = hotelService.computeNights(reservation.checkInDate, reservation.checkOutDate);
    const lines: FolioLine[] = [
      { type: 'ROOM', description: `Room ${room.roomNumber} (${room.roomType}) x ${nights} night${nights > 1 ? 's' : ''}`, amount: hotelService.computeRoomChargeTotal(reservation.ratePerNight, nights) },
    ];

    const roomServiceOrderIds = new Set(
      orders.filter((o) => o.orderType === 'ROOM_SERVICE' && o.roomNumber === room.roomNumber && o.outletId === room.locationId).map((o) => o.id)
    );
    bills
      .filter((b) => roomServiceOrderIds.has(b.orderId) && b.status !== 'VOID' && b.businessDate >= reservation.checkInDate && b.businessDate <= reservation.checkOutDate)
      .forEach((b) => {
        lines.push({ type: 'ROOM_SERVICE', description: `Room Service — Bill ${b.billNumber}`, amount: b.netAmount, sourceBillId: b.id });
      });

    return lines;
  },

  computeOccupancy(rooms: Room[]): { totalRooms: number; occupied: number; vacant: number; occupancyPct: number } {
    const totalRooms = rooms.length;
    const occupied = rooms.filter((r) => r.status === 'OCCUPIED').length;
    return { totalRooms, occupied, vacant: rooms.filter((r) => r.status === 'VACANT').length, occupancyPct: totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0 };
  },

  computeArrivalsDepartures(reservations: Reservation[], businessDate: string): { arrivals: Reservation[]; departures: Reservation[] } {
    return {
      arrivals: reservations.filter((r) => r.checkInDate === businessDate && r.status === 'BOOKED'),
      departures: reservations.filter((r) => r.checkOutDate === businessDate && r.status === 'CHECKED_IN'),
    };
  },

  computeHotelRevenue(folios: Folio[]): number {
    return folios.filter((f) => f.status === 'SETTLED').reduce((s, f) => s + f.totalAmount, 0);
  },
};
