// Banquet Management domain (business-side booking/billing) — distinct from the pre-existing HR
// banquet *staffing* module (BanquetEvent/EventRequirement/EventAssignment in attendance-leave.ts,
// pages under /banquet/events, /banquet/allocation), which stays untouched. This domain covers
// Hall master -> Booking (Enquiry -> Confirmed -> Completed, with an advance payment) -> event-day
// catering (a POS 'BANQUET' order linked back here via POSOrder.banquetBookingId) -> Final Bill ->
// balance settlement. Named banquet-mgmt.ts / BanquetHall / BanquetBooking to avoid any collision
// with the existing BanquetEvent type.

import { PaymentMode } from './pos';

export interface BanquetHall {
  id: string;
  locationId: string;
  name: string;
  capacity: number;
  ratePerEvent: number;
}

export type BanquetBookingStatus = 'ENQUIRY' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface BanquetBooking {
  id: string;
  bookingNumber: string; // BQ-xxxx
  locationId: string;
  hallId: string;
  customerName: string;
  customerPhone: string;
  eventDate: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  expectedGuests: number;
  packageName: string;
  ratePerPlate: number;
  packageAmount: number; // expectedGuests * ratePerPlate
  advanceAmount: number;
  status: BanquetBookingStatus;
  createdAt: string;
}

export type BanquetBillLineType = 'PACKAGE' | 'CATERING_ADDON' | 'OTHER';

export interface BanquetBillLine {
  type: BanquetBillLineType;
  description: string;
  amount: number;
  sourceBillId?: string; // for CATERING_ADDON lines, the POS Bill it was pulled from
}

export type BanquetFinalBillStatus = 'OPEN' | 'SETTLED';

// Generated snapshot, mirroring hotel.ts's Folio and Sales' SalesInvoice-from-SalesOrder pattern.
export interface BanquetFinalBill {
  id: string;
  bookingId: string;
  lines: BanquetBillLine[];
  totalAmount: number;
  advanceAdjusted: number;
  balanceDue: number;
  amountPaid: number;
  status: BanquetFinalBillStatus;
  generatedAt: string;
  settledAt?: string;
}

export type BanquetPaymentPurpose = 'ADVANCE' | 'BALANCE';

export interface BanquetPayment {
  id: string;
  bookingId: string;
  amount: number;
  mode: PaymentMode;
  referenceNo?: string;
  purpose: BanquetPaymentPurpose;
  paidAt: string;
}
