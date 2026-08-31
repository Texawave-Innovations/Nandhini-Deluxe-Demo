// Hotel Operations domain: Room master -> Reservation (Booked -> Checked-in -> Checked-out) ->
// Folio (room charge + linked POS Room Service bills) -> Payment at checkout. Room-service orders
// are placed through the existing POS module (orderType 'ROOM_SERVICE', matched back here by
// roomNumber) — this domain never writes the stock ledger itself, it only reads POS's already-
// posted bills to build the folio, mirroring how Reports & Analytics reads other domains read-only.

import { PaymentMode } from './pos';

export type RoomType = 'STANDARD' | 'DELUXE' | 'SUITE' | 'EXECUTIVE';
export type RoomStatus = 'VACANT' | 'OCCUPIED' | 'RESERVED' | 'DIRTY' | 'OUT_OF_SERVICE';

export interface Room {
  id: string;
  locationId: string;
  roomNumber: string;
  floor: number;
  roomType: RoomType;
  rateInr: number; // per night
  maxOccupancy: number;
  status: RoomStatus;
}

export type ReservationStatus = 'BOOKED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'NO_SHOW';

export interface Reservation {
  id: string;
  reservationNumber: string; // RES-xxxx
  locationId: string;
  roomId: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  actualCheckInAt?: string;
  actualCheckOutAt?: string;
  numberOfGuests: number;
  ratePerNight: number;
  status: ReservationStatus;
  createdAt: string;
}

export type FolioLineType = 'ROOM' | 'ROOM_SERVICE' | 'OTHER';

export interface FolioLine {
  type: FolioLineType;
  description: string;
  amount: number;
  sourceBillId?: string; // for ROOM_SERVICE lines, the POS Bill it was pulled from
}

export type FolioStatus = 'OPEN' | 'SETTLED';

// A generated snapshot, mirroring how a SalesInvoice snapshots a Sales Order — regenerated on
// demand (generateFolio) until checkout settles it, at which point it's the permanent record.
export interface Folio {
  id: string;
  reservationId: string;
  roomId: string;
  locationId: string;
  lines: FolioLine[];
  totalAmount: number;
  amountPaid: number;
  status: FolioStatus;
  generatedAt: string;
  settledAt?: string;
}

export interface HotelPayment {
  id: string;
  reservationId: string;
  amount: number;
  mode: PaymentMode;
  referenceNo?: string;
  paidAt: string;
}
