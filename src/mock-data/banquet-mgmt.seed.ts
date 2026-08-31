// Banquet Management seed: Hall master for the 3 hasBanquet:true outlets (Marathahalli, Whitefield,
// Hebbal), a spread of historical COMPLETED bookings with SETTLED final bills (trailing revenue), a
// couple of open ENQUIRY leads, and one pinned CONFIRMED booking at Whitefield with its advance
// already paid — used for the live event-day catering -> final bill -> balance settlement
// walkthrough. Built through the real banquetMgmtService helpers, same convention as sales.seed.ts.

import { Location } from '../types/erp-core';
import { BanquetBooking, BanquetFinalBill, BanquetHall, BanquetPayment } from '../types/banquet-mgmt';
import { PaymentMode } from '../types/pos';
import { banquetMgmtService } from '../services/banquetMgmtService';

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

const PAYMENT_MODES: PaymentMode[] = ['CASH', 'UPI', 'BANK_TRANSFER'];
const CUSTOMER_NAMES = [
  { name: 'Reddy Family', phone: '9845011111' }, { name: 'Krishnan Wedding Committee', phone: '9845022222' },
  { name: 'Infotech Solutions Pvt Ltd', phone: '9845033333' }, { name: 'Prasad & Family', phone: '9845044444' },
  { name: 'Sunrise Rotary Club', phone: '9845055555' }, { name: 'Iyer Family', phone: '9845066666' },
];
const PACKAGES = [
  { name: 'Silver Wedding Package', ratePerPlate: 900 },
  { name: 'Gold Corporate Package', ratePerPlate: 1100 },
  { name: 'Platinum Celebration Package', ratePerPlate: 1400 },
];

export interface BanquetMgmtSeedResult {
  halls: BanquetHall[];
  bookings: BanquetBooking[];
  finalBills: BanquetFinalBill[];
  payments: BanquetPayment[];
}

export function generateBanquetMgmtSeed(locations: Location[]): BanquetMgmtSeedResult {
  const banquetLocations = locations.filter((l) => l.features.hasBanquet);
  const halls: BanquetHall[] = [];
  let hallSeq = 1;
  const HALL_DEFS: Record<string, { name: string; capacity: number; ratePerEvent: number }[]> = {
    'loc-3': [{ name: 'Grand Ballroom', capacity: 500, ratePerEvent: 150000 }, { name: 'Garden Pavilion', capacity: 150, ratePerEvent: 60000 }],
    'loc-10': [{ name: 'Whitefield Banquet Hall', capacity: 250, ratePerEvent: 90000 }],
    'loc-16': [{ name: 'Hebbal Convention Hall', capacity: 400, ratePerEvent: 130000 }, { name: 'Hebbal Terrace Lawn', capacity: 120, ratePerEvent: 50000 }],
  };
  banquetLocations.forEach((loc) => {
    (HALL_DEFS[loc.id] ?? [{ name: `${loc.name} Banquet Hall`, capacity: 200, ratePerEvent: 80000 }]).forEach((def) => {
      halls.push({ id: `hall-${hallSeq}`, locationId: loc.id, ...def });
      hallSeq++;
    });
  });

  const bookings: BanquetBooking[] = [];
  const finalBills: BanquetFinalBill[] = [];
  const payments: BanquetPayment[] = [];
  let bookSeq = 1;
  let paySeq = 1;

  // ---- Historical COMPLETED bookings, SETTLED final bills (feeds the trailing Banquet Revenue KPI) ----
  halls.forEach((hall, hi) => {
    const r = seeded(hi + 1);
    const customer = CUSTOMER_NAMES[hi % CUSTOMER_NAMES.length];
    const pkg = PACKAGES[hi % PACKAGES.length];
    const expectedGuests = Math.round(hall.capacity * (0.5 + r * 0.3));
    const packageAmount = banquetMgmtService.computePackageAmount(expectedGuests, pkg.ratePerPlate);
    const eventDate = daysFromBase(-(5 + hi * 4));
    const advanceAmount = Math.round(packageAmount * 0.3 * 100) / 100;

    const booking: BanquetBooking = {
      id: `bqbook-${bookSeq}`, bookingNumber: banquetMgmtService.generateBookingNumber(bookings), locationId: hall.locationId, hallId: hall.id,
      customerName: customer.name, customerPhone: customer.phone, eventDate, startTime: '18:00', endTime: '23:00',
      expectedGuests, packageName: pkg.name, ratePerPlate: pkg.ratePerPlate, packageAmount, advanceAmount,
      status: 'COMPLETED', createdAt: isoAt(daysFromBase(-(5 + hi * 4) - 20), 10),
    };
    bookings.push(booking);
    bookSeq++;

    const advPayment: BanquetPayment = {
      id: `bqpay-${paySeq}`, bookingId: booking.id, amount: advanceAmount, mode: PAYMENT_MODES[hi % PAYMENT_MODES.length],
      referenceNo: `ADV-${820000 + paySeq}`, purpose: 'ADVANCE', paidAt: isoAt(daysFromBase(-(5 + hi * 4) - 15), 11),
    };
    payments.push(advPayment);
    paySeq++;

    const balanceDue = Math.round((packageAmount - advanceAmount) * 100) / 100;
    const balPayment: BanquetPayment = {
      id: `bqpay-${paySeq}`, bookingId: booking.id, amount: balanceDue, mode: PAYMENT_MODES[hi % PAYMENT_MODES.length],
      referenceNo: `BAL-${820000 + paySeq}`, purpose: 'BALANCE', paidAt: isoAt(eventDate, 22),
    };
    payments.push(balPayment);
    paySeq++;

    finalBills.push({
      id: `bqbill-${booking.id}`, bookingId: booking.id,
      lines: [{ type: 'PACKAGE', description: `${pkg.name} — ${hall.name} (${expectedGuests} guests)`, amount: packageAmount }],
      totalAmount: packageAmount, advanceAdjusted: advanceAmount, balanceDue: 0, amountPaid: packageAmount,
      status: 'SETTLED', generatedAt: isoAt(eventDate, 21), settledAt: isoAt(eventDate, 22),
    });
  });

  // ---- Open enquiries (no payment yet) ----
  const enquiryHalls = halls.slice(0, 2);
  enquiryHalls.forEach((hall, ei) => {
    const customer = CUSTOMER_NAMES[(halls.length + ei) % CUSTOMER_NAMES.length];
    const pkg = PACKAGES[(halls.length + ei) % PACKAGES.length];
    const expectedGuests = Math.round(hall.capacity * 0.4);
    bookings.push({
      id: `bqbook-enq-${ei + 1}`, bookingNumber: banquetMgmtService.generateBookingNumber(bookings), locationId: hall.locationId, hallId: hall.id,
      customerName: customer.name, customerPhone: customer.phone, eventDate: daysFromBase(10 + ei * 5), startTime: '17:30', endTime: '22:30',
      expectedGuests, packageName: pkg.name, ratePerPlate: pkg.ratePerPlate, packageAmount: banquetMgmtService.computePackageAmount(expectedGuests, pkg.ratePerPlate),
      advanceAmount: 0, status: 'ENQUIRY', createdAt: isoAt(daysFromBase(-2 + ei), 10),
    });
  });

  // ---- Pinned CONFIRMED booking at Whitefield, advance already paid — the live event-day catering
  // -> final bill -> balance settlement walkthrough uses this booking end to end. ----
  const pinnedHall = halls.find((h) => h.locationId === 'loc-10') ?? halls[0];
  const pinnedEventDate = daysFromBase(1);
  const pinnedBooking: BanquetBooking = {
    id: 'bqbook-pin-confirmed', bookingNumber: 'BQ-9001', locationId: pinnedHall.locationId, hallId: pinnedHall.id,
    customerName: 'Nandhini Anniversary Celebrations', customerPhone: '9845099999', eventDate: pinnedEventDate,
    startTime: '18:30', endTime: '23:30', expectedGuests: 180, packageName: 'Gold Corporate Package', ratePerPlate: 1100,
    packageAmount: banquetMgmtService.computePackageAmount(180, 1100), advanceAmount: Math.round(banquetMgmtService.computePackageAmount(180, 1100) * 0.3 * 100) / 100,
    status: 'CONFIRMED', createdAt: isoAt(daysFromBase(-6), 10),
  };
  bookings.push(pinnedBooking);
  payments.push({
    id: 'bqpay-pin-advance', bookingId: pinnedBooking.id, amount: pinnedBooking.advanceAmount, mode: 'BANK_TRANSFER',
    referenceNo: 'ADV-829999', purpose: 'ADVANCE', paidAt: isoAt(daysFromBase(-5), 11),
  });

  return { halls, bookings, finalBills, payments };
}
