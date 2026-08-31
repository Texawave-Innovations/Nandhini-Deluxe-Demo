// Hotel Operations seed: Room master for the 3 hasHotel:true outlets (Marathahalli, Bannerghatta,
// Hebbal), a spread of historical CHECKED_OUT reservations with SETTLED folios (trailing revenue),
// a couple of upcoming BOOKED reservations (arrivals demo), and one pinned CHECKED_IN reservation
// at Bannerghatta Hotel used for the live Room Service -> Folio walkthrough. Built through the real
// hotelService helpers so seeded data is exactly as consistent as data the live UI would produce —
// same convention as sales.seed.ts / purchase.seed.ts.

import { Location } from '../types/erp-core';
import { Folio, HotelPayment, Reservation, Room, RoomType } from '../types/hotel';
import { PaymentMode } from '../types/pos';
import { hotelService } from '../services/hotelService';

function seeded(n: number): number {
  const x = Math.sin(n * 19.331) * 27512.912;
  return x - Math.floor(x);
}

const BASE_DATE = '2026-08-30'; // matches outlet-store's default businessDate ("today" for this demo)

function daysFromBase(n: number): string {
  const d = new Date(`${BASE_DATE}T10:00:00.000Z`);
  d.setDate(d.getDate() + n);
  return d.toISOString().substring(0, 10);
}
function isoAt(dateStr: string, hour: number): string {
  return new Date(`${dateStr}T${String(hour).padStart(2, '0')}:00:00.000Z`).toISOString();
}

const ROOM_TYPE_CYCLE: RoomType[] = ['STANDARD', 'STANDARD', 'DELUXE', 'DELUXE', 'SUITE', 'EXECUTIVE', 'STANDARD', 'DELUXE', 'SUITE', 'EXECUTIVE'];
const RATE_BY_TYPE: Record<RoomType, number> = { STANDARD: 3500, DELUXE: 5500, SUITE: 8500, EXECUTIVE: 6500 };
const PAYMENT_MODES: PaymentMode[] = ['CASH', 'UPI', 'CARD'];
const GUEST_NAMES = ['Arvind Subramaniam', 'Meera Balakrishnan', 'Vikram Nair', 'Anjali Rao', 'Suresh Iyengar', 'Kavya Shastri', 'Rohit Malhotra', 'Deepa Venkatesh', 'Naveen Kumar', 'Priya Ramachandran'];

export interface HotelSeedResult {
  rooms: Room[];
  reservations: Reservation[];
  folios: Folio[];
  payments: HotelPayment[];
}

export function generateHotelSeed(locations: Location[]): HotelSeedResult {
  const hotelLocations = locations.filter((l) => l.features.hasHotel);
  const rooms: Room[] = [];
  let roomSeq = 1;

  hotelLocations.forEach((loc) => {
    for (let r = 0; r < 10; r++) {
      const floor = Math.floor(r / 4) + 1;
      const roomType = ROOM_TYPE_CYCLE[r];
      rooms.push({
        id: `room-${roomSeq}`,
        locationId: loc.id,
        roomNumber: `${floor}0${(r % 4) + 1}`,
        floor,
        roomType,
        rateInr: RATE_BY_TYPE[roomType],
        maxOccupancy: roomType === 'SUITE' ? 4 : roomType === 'EXECUTIVE' ? 3 : 2,
        status: 'VACANT',
      });
      roomSeq++;
    }
  });

  const roomsByLocation = new Map<string, Room[]>();
  hotelLocations.forEach((loc) => roomsByLocation.set(loc.id, rooms.filter((r) => r.locationId === loc.id)));

  const reservations: Reservation[] = [];
  const folios: Folio[] = [];
  const payments: HotelPayment[] = [];
  let resSeq = 1;
  let paySeq = 1;
  const occupiedRoomIds = new Set<string>();
  const dirtyRoomIds = new Set<string>();

  // ---- Historical CHECKED_OUT reservations, SETTLED folios (feeds the trailing Hotel Revenue KPI) ----
  let histIdx = 0;
  hotelLocations.forEach((loc, li) => {
    const locRooms = roomsByLocation.get(loc.id) ?? [];
    for (let i = 0; i < 3; i++) {
      const r = seeded(histIdx + 1);
      const room = locRooms[(i * 3 + li) % locRooms.length];
      const nights = 1 + Math.floor(r * 3);
      const checkOutOffset = -(2 + histIdx * 2); // spread across the last ~2-3 weeks
      const checkOutDate = daysFromBase(checkOutOffset);
      const checkInDate = daysFromBase(checkOutOffset - nights);
      const guest = GUEST_NAMES[histIdx % GUEST_NAMES.length];

      const reservation: Reservation = {
        id: `res-${resSeq}`, reservationNumber: hotelService.generateReservationNumber(reservations),
        locationId: loc.id, roomId: room.id, guestName: guest, guestPhone: `98404${20000 + histIdx}`,
        checkInDate, checkOutDate, actualCheckInAt: isoAt(checkInDate, 13), actualCheckOutAt: isoAt(checkOutDate, 11),
        numberOfGuests: 1 + (histIdx % room.maxOccupancy), ratePerNight: room.rateInr, status: 'CHECKED_OUT',
        createdAt: isoAt(checkInDate, 9),
      };
      reservations.push(reservation);
      resSeq++;

      const roomChargeTotal = hotelService.computeRoomChargeTotal(room.rateInr, nights);
      const folio: Folio = {
        id: `folio-${reservation.id}`, reservationId: reservation.id, roomId: room.id, locationId: loc.id,
        lines: [{ type: 'ROOM', description: `Room ${room.roomNumber} (${room.roomType}) x ${nights} night${nights > 1 ? 's' : ''}`, amount: roomChargeTotal }],
        totalAmount: roomChargeTotal, amountPaid: roomChargeTotal, status: 'SETTLED',
        generatedAt: isoAt(checkOutDate, 10), settledAt: isoAt(checkOutDate, 11),
      };
      folios.push(folio);

      const mode = PAYMENT_MODES[histIdx % PAYMENT_MODES.length];
      const payment: HotelPayment = {
        id: `hpay-${paySeq}`, reservationId: reservation.id, amount: roomChargeTotal, mode,
        ...(mode !== 'CASH' ? { referenceNo: `${mode}-${810000 + paySeq}` } : {}),
        paidAt: isoAt(checkOutDate, 11),
      };
      payments.push(payment);
      paySeq++;

      // The very first (most recent) checkout across the demo is left un-housekept, so the
      // Housekeeping page has something to act on out of the box.
      if (histIdx === 0) dirtyRoomIds.add(room.id);
      histIdx++;
    }
  });

  // ---- Upcoming BOOKED reservations (arrivals demo) ----
  hotelLocations.forEach((loc, li) => {
    const locRooms = roomsByLocation.get(loc.id) ?? [];
    const room = locRooms[(locRooms.length - 1 - li) % locRooms.length];
    if (occupiedRoomIds.has(room.id)) return;
    const nights = 2;
    const reservation: Reservation = {
      id: `res-${resSeq}`, reservationNumber: hotelService.generateReservationNumber(reservations),
      locationId: loc.id, roomId: room.id, guestName: GUEST_NAMES[(histIdx + li) % GUEST_NAMES.length],
      guestPhone: `98404${30000 + li}`, checkInDate: daysFromBase(li), checkOutDate: daysFromBase(li + nights),
      numberOfGuests: 2, ratePerNight: room.rateInr, status: 'BOOKED', createdAt: isoAt(daysFromBase(li - 3), 9),
    };
    reservations.push(reservation);
    resSeq++;
  });

  // ---- Pinned CHECKED_IN in-house guest at Bannerghatta Hotel (loc-4) — the live Room Service /
  // Folio / Check-out walkthrough uses this reservation & room number end to end. ----
  const pinnedLocation = hotelLocations.find((l) => l.id === 'loc-4') ?? hotelLocations[0];
  const pinnedRoom = (roomsByLocation.get(pinnedLocation.id) ?? [])[0];
  if (pinnedRoom) {
    const checkInDate = daysFromBase(-1);
    const checkOutDate = daysFromBase(1);
    const pinnedReservation: Reservation = {
      id: 'res-pin-checkedin', reservationNumber: 'RES-9001', locationId: pinnedLocation.id, roomId: pinnedRoom.id,
      guestName: 'Arvind Subramaniam', guestPhone: '9840412345', checkInDate, checkOutDate,
      actualCheckInAt: isoAt(checkInDate, 14), numberOfGuests: 2, ratePerNight: pinnedRoom.rateInr,
      status: 'CHECKED_IN', createdAt: isoAt(daysFromBase(-4), 9),
    };
    reservations.push(pinnedReservation);
    occupiedRoomIds.add(pinnedRoom.id);
  }

  // A second, currently-in-house guest at Marathahalli for a non-trivial occupancy KPI.
  const secondLocation = hotelLocations.find((l) => l.id === 'loc-3') ?? hotelLocations[hotelLocations.length - 1];
  const secondRoom = (roomsByLocation.get(secondLocation.id) ?? [])[3];
  if (secondRoom && !occupiedRoomIds.has(secondRoom.id)) {
    const checkInDate = daysFromBase(0);
    const checkOutDate = daysFromBase(2);
    reservations.push({
      id: 'res-pin-checkedin-2', reservationNumber: 'RES-9002', locationId: secondLocation.id, roomId: secondRoom.id,
      guestName: 'Meera Balakrishnan', guestPhone: '9840498765', checkInDate, checkOutDate,
      actualCheckInAt: isoAt(checkInDate, 12), numberOfGuests: 1, ratePerNight: secondRoom.rateInr,
      status: 'CHECKED_IN', createdAt: isoAt(daysFromBase(-2), 9),
    });
    occupiedRoomIds.add(secondRoom.id);
  }

  const finalRooms = rooms.map((r) => {
    if (occupiedRoomIds.has(r.id)) return { ...r, status: 'OCCUPIED' as const };
    if (dirtyRoomIds.has(r.id)) return { ...r, status: 'DIRTY' as const };
    return r;
  });

  return { rooms: finalRooms, reservations, folios, payments };
}
