// POS masters (floors/tables/counters, discounts) + deterministic historical bill generation for
// the last few closed business days, so Dashboard/Reports/Day Close have realistic data to show
// before the user runs the live demo flow for "today" (2026-08-30).

import { Location } from '../types/erp-core';
import { MenuItem } from '../types/menu';
import { DiningFloor, DiningTable, POSCounter, POSOrder, Bill, Payment, Discount, ChannelOrderSettlement, OrderChannel, PaymentMode } from '../types/pos';

function seeded(n: number): number {
  const x = Math.sin(n * 78.233) * 96351.328;
  return x - Math.floor(x);
}

export function generateFloorsAndTables(outlets: Location[]): { floors: DiningFloor[]; tables: DiningTable[] } {
  const floors: DiningFloor[] = [];
  const tables: DiningTable[] = [];
  let floorSeq = 1;
  let tableSeq = 1;

  outlets.filter((o) => o.features.hasRestaurant).forEach((outlet, oi) => {
    const ground: DiningFloor = { id: `flr-${floorSeq++}`, outletId: outlet.id, name: 'Ground Floor', sortOrder: 1 };
    floors.push(ground);
    const groundTableCount = 6;
    for (let t = 1; t <= groundTableCount; t++) {
      const r = seeded(oi * 13 + t);
      const status: DiningTable['status'] = t === 2 || r < 0.3 ? 'OCCUPIED' : t === 3 ? 'RESERVED' : t === 4 ? 'BILLING' : 'AVAILABLE';
      tables.push({
        id: `tbl-${tableSeq++}`, outletId: outlet.id, floorId: ground.id,
        code: `T0${t}`, capacity: t % 3 === 0 ? 6 : 4, status,
      });
    }
    if (outlet.features.hasBanquet || outlet.features.hasHotel) {
      const terrace: DiningFloor = { id: `flr-${floorSeq++}`, outletId: outlet.id, name: 'First Floor / Terrace', sortOrder: 2 };
      floors.push(terrace);
      for (let t = 1; t <= 4; t++) {
        tables.push({
          id: `tbl-${tableSeq++}`, outletId: outlet.id, floorId: terrace.id,
          code: `TF0${t}`, capacity: 4, status: 'AVAILABLE',
        });
      }
    }
  });

  return { floors, tables };
}

export function generatePOSCounters(outlets: Location[]): POSCounter[] {
  const counters: POSCounter[] = [];
  let seq = 1;
  outlets.forEach((outlet) => {
    if (outlet.features.hasRestaurant) {
      counters.push({ id: `ctr-${seq++}`, outletId: outlet.id, code: `${outlet.code}-C1`, name: 'Restaurant Counter', type: 'RESTAURANT', status: 'ACTIVE' });
    }
    if (outlet.features.hasBanquet) {
      counters.push({ id: `ctr-${seq++}`, outletId: outlet.id, code: `${outlet.code}-BQ`, name: 'Banquet Counter', type: 'BANQUET', status: 'ACTIVE' });
    }
    if (outlet.features.hasHotel) {
      counters.push({ id: `ctr-${seq++}`, outletId: outlet.id, code: `${outlet.code}-RS`, name: 'Room Service Counter', type: 'ROOM_SERVICE', status: 'ACTIVE' });
    }
  });
  return counters;
}

export const INITIAL_DISCOUNTS: Discount[] = [
  { id: 'disc-1', name: 'Corporate Discount', type: 'PERCENTAGE', value: 10, maxAmount: 1000, applicableOutletIds: 'ALL', validFrom: '2026-01-01', validTo: '2026-12-31', approvalRequired: true, status: 'ACTIVE' },
  { id: 'disc-2', name: 'Weekday Lunch Offer', type: 'PERCENTAGE', value: 15, maxAmount: 300, applicableOutletIds: 'ALL', validFrom: '2026-01-01', validTo: '2026-12-31', approvalRequired: false, status: 'ACTIVE' },
  { id: 'disc-3', name: 'Loyalty Flat ₹100', type: 'FIXED', value: 100, applicableOutletIds: 'ALL', validFrom: '2026-01-01', validTo: '2026-12-31', approvalRequired: false, status: 'ACTIVE' },
  { id: 'disc-4', name: 'Festival Special 20%', type: 'PERCENTAGE', value: 20, maxAmount: 500, applicableOutletIds: ['loc-1', 'loc-2', 'loc-7'], validFrom: '2026-08-01', validTo: '2026-09-15', approvalRequired: true, status: 'ACTIVE' },
];

const POPULAR_ITEM_WEIGHTS: { id: string; weight: number }[] = [
  { id: 'mi-13', weight: 5 }, { id: 'mi-1', weight: 4 }, { id: 'mi-43', weight: 3 }, { id: 'mi-23', weight: 3 },
  { id: 'mi-67', weight: 4 }, { id: 'mi-35', weight: 3 }, { id: 'mi-25', weight: 2 }, { id: 'mi-59', weight: 2 },
  { id: 'mi-32', weight: 3 }, { id: 'mi-79', weight: 2 }, { id: 'mi-45', weight: 2 }, { id: 'mi-87', weight: 2 },
];
const WEIGHT_POOL = POPULAR_ITEM_WEIGHTS.flatMap((w) => Array(w.weight).fill(w.id));

// Includes today (2026-08-30) so the Dashboard/POS Reports look populated on first load; the
// live demo flow (New Order -> ... -> Day Close) then adds further bills on top of this baseline.
// A sparser prior-week trio (7-11 days back) gives aiInsightsService.forecastNextWeekRevenue a real
// "prior window" to compare the trailing 7 days against — without it, the AI hub's Sales tab has
// nothing to compute a revenue projection from on day one.
const PRIOR_WEEK_DATES = ['2026-08-19', '2026-08-21', '2026-08-23'];
const PAST_BUSINESS_DATES = [...PRIOR_WEEK_DATES, '2026-08-26', '2026-08-27', '2026-08-28', '2026-08-29', '2026-08-30'];

// Named cashiers (rather than a single generic "Cashier") so aiInsightsService.flagCashierAnomalies
// has real per-cashier discount/complimentary rates to compare against an outlet's own average.
// One outlet's second cashier is deliberately biased toward heavy discounting/comps below, so AI
// Insights -> Front of House has a genuine anomaly on day one rather than an empty tab.
const CASHIER_NAMES = ['Ravi Kumar', 'Divya Shetty', 'Manoj Pillai'];
const FLAGGED_OUTLET_INDEX = 0; // first restaurant outlet in iteration order
const FLAGGED_CASHIER = 'Divya Shetty';
const CHANNELS: { channel: OrderChannel; mode: PaymentMode; weight: number }[] = [
  { channel: 'DIRECT', mode: 'CASH', weight: 30 },
  { channel: 'DIRECT', mode: 'UPI', weight: 25 },
  { channel: 'DIRECT', mode: 'CARD', weight: 18 },
  { channel: 'SWIGGY_DELIVERY', mode: 'SWIGGY', weight: 10 },
  { channel: 'ZOMATO_DELIVERY', mode: 'ZOMATO', weight: 8 },
  { channel: 'SWIGGY_DINEOUT', mode: 'UPI', weight: 4 },
  { channel: 'ZOMATO_DINEOUT', mode: 'UPI', weight: 5 },
];
const CHANNEL_POOL = CHANNELS.flatMap((c) => Array(c.weight).fill(c));

export interface HistoricalPOSData {
  orders: POSOrder[];
  bills: Bill[];
  payments: Payment[];
  channelSettlements: ChannelOrderSettlement[];
}

export function generateHistoricalPOSData(outlets: Location[], menuItems: MenuItem[], counters: POSCounter[]): HistoricalPOSData {
  const orders: POSOrder[] = [];
  const bills: Bill[] = [];
  const payments: Payment[] = [];
  const channelSettlements: ChannelOrderSettlement[] = [];
  const itemById = new Map(menuItems.map((m) => [m.id, m]));

  let orderSeq = 1;
  let billSeq = 1;
  let paySeq = 1;
  let settlementSeq = 1;

  const restaurantOutlets = outlets.filter((o) => o.features.hasRestaurant);

  // aiInsightsService.benchmarkOutletPerformance flags an outlet trailing its peers' 7-day revenue
  // median — the last restaurant outlet in iteration order deliberately runs a fraction of the
  // normal bill volume so AI Insights -> Executive has a real underperformer on day one.
  const underperformerOutletId = restaurantOutlets[restaurantOutlets.length - 1]?.id;

  restaurantOutlets.forEach((outlet, oi) => {
    const counter = counters.find((c) => c.outletId === outlet.id && c.type === 'RESTAURANT');
    if (!counter) return;
    const isUnderperformer = outlet.id === underperformerOutletId;

    PAST_BUSINESS_DATES.forEach((businessDate, di) => {
      const billsToday = isUnderperformer ? 1 : 3 + Math.floor(seeded(oi * 31 + di * 7 + 1) * 3); // 3-5 bills/outlet/day, 1 for the deliberate underperformer
      for (let b = 0; b < billsToday; b++) {
        const seedBase = oi * 500 + di * 50 + b;
        const cashierName = CASHIER_NAMES[(di * 7 + b) % CASHIER_NAMES.length];
        const isFlaggedCashierBill = oi === FLAGGED_OUTLET_INDEX && cashierName === FLAGGED_CASHIER;
        const itemCount = 1 + Math.floor(seeded(seedBase + 2) * 3);
        const items = Array.from({ length: itemCount }).map((_, ii) => {
          const poolIdx = Math.floor(seeded(seedBase * 3 + ii) * WEIGHT_POOL.length);
          const menuItem = itemById.get(WEIGHT_POOL[poolIdx])!;
          const qty = 1 + Math.floor(seeded(seedBase * 5 + ii) * 2);
          return {
            id: `oli-${orderSeq}-${ii}`, menuItemId: menuItem.id, name: menuItem.name, qty,
            unitPrice: menuItem.basePrice, taxPercent: menuItem.taxPercent, kotStatus: 'SERVED' as const,
          };
        });

        const gross = items.reduce((s, it) => s + it.unitPrice * it.qty, 0);
        const pick = CHANNEL_POOL[Math.floor(seeded(seedBase * 7) * CHANNEL_POOL.length)];
        const isComplimentary = seedBase % 47 === 0;
        const isVoid = seedBase % 61 === 0;
        const discountAmount = isFlaggedCashierBill && !isComplimentary
          ? Math.round(gross * 0.35)
          : !isComplimentary && seedBase % 9 === 0 ? Math.round(gross * 0.1) : 0;
        const taxAmount = Math.round((gross - discountAmount) * 0.05);
        const netRaw = gross - discountAmount + taxAmount;
        const roundOff = Math.round(netRaw) - netRaw;
        const netAmount = isComplimentary ? 0 : Math.round(netRaw);

        const orderNumber = `ORD-${outlet.code}-${1000 + orderSeq}`;
        const order: POSOrder = {
          id: `pord-${orderSeq}`, orderNumber, outletId: outlet.id, counterId: counter.id,
          orderType: 'DINE_IN', channel: pick.channel, items, status: isVoid ? 'CANCELLED' : 'CLOSED',
          businessDate, createdAt: `${businessDate}T13:${(10 + b * 7) % 60}:00.000Z`,
          updatedAt: `${businessDate}T14:${(10 + b * 7) % 60}:00.000Z`,
          externalOrderRef: pick.channel !== 'DIRECT' ? `${pick.channel.startsWith('SWIGGY') ? 'SWG' : 'ZMT'}-${900000 + orderSeq}` : undefined,
        };
        orders.push(order);
        orderSeq++;

        const bill: Bill = {
          id: `bill-${billSeq}`, billNumber: `BILL-${outlet.code}-${2000 + billSeq}`, orderId: order.id,
          outletId: outlet.id, businessDate, grossAmount: gross, discountAmount,
          complimentaryAmount: isComplimentary ? gross : 0, nonChargeableAmount: 0, taxAmount: isComplimentary ? 0 : taxAmount,
          serviceChargeAmount: 0, roundOff: Number(roundOff.toFixed(2)), netAmount,
          billType: isVoid ? 'VOID' : isComplimentary ? 'COMPLIMENTARY' : 'NORMAL',
          complimentaryReason: isComplimentary ? 'Guest relations gesture' : undefined,
          complimentaryRequestedBy: isComplimentary ? 'Restaurant Manager' : undefined,
          complimentaryApprovedBy: isComplimentary ? 'Outlet Manager' : undefined,
          status: isVoid ? 'VOID' : 'PAID', createdBy: cashierName, createdAt: order.createdAt,
          paidAt: isVoid ? undefined : order.updatedAt,
        };
        bills.push(bill);
        order.billId = bill.id;
        billSeq++;

        if (!isVoid && !isComplimentary) {
          payments.push({
            id: `pay-${paySeq}`, billId: bill.id, mode: pick.mode, amount: netAmount,
            referenceNo: pick.mode === 'CASH' ? undefined : `${pick.mode}-${100000 + paySeq}`,
            status: 'SUCCESS', createdAt: order.updatedAt,
          });
          paySeq++;

          if (pick.channel === 'SWIGGY_DELIVERY' || pick.channel === 'ZOMATO_DELIVERY') {
            const platform = pick.channel === 'SWIGGY_DELIVERY' ? 'SWIGGY' : 'ZOMATO';
            const commission = Math.round(netAmount * 0.18);
            const taxesCharges = Math.round(netAmount * 0.04);
            channelSettlements.push({
              id: `settle-${settlementSeq}`, orderId: order.id, externalOrderRef: order.externalOrderRef!,
              platform, orderAmount: netAmount, commission, taxesCharges, netSettlement: netAmount - commission - taxesCharges,
              settlementDate: businessDate, bankReference: `BANKSETL-${80000 + settlementSeq}`, status: 'SETTLED',
            });
            settlementSeq++;
          }
        }
      }
    });
  });

  // Pin the brief's worked Swiggy settlement example to Indiranagar on the most recent past date.
  channelSettlements.unshift({
    id: 'settle-fixed-1', orderId: 'pord-fixed-1', externalOrderRef: 'SWG-928321', platform: 'SWIGGY',
    orderAmount: 1450, commission: 270, taxesCharges: 55, netSettlement: 1125,
    settlementDate: '2026-08-29', bankReference: 'BANKSETL-77410', status: 'SETTLED',
  });

  return { orders, bills, payments, channelSettlements };
}
