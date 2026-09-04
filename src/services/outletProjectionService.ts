// New Outlet Cost Projection domain service — pure functions only, same convention as every
// other *Service.ts. deriveRevenueBenchmarks is the one function that reads real operational
// data (POS bills, hotel folios); everything downstream (capex/opex/monthly cash flow) is a
// deterministic calculation over its own inputs, safe to unit-reason about in isolation.

import { Location } from '@/types/erp-core';
import { DiningTable, Bill } from '@/types/pos';
import { Room, Folio } from '@/types/hotel';
import { CityTier, CostLineItem, MonthlyOutletProjection, NewOutletType, OutletProjectionInput, OutletProjectionResult, RevenueBenchmark } from '@/types/outletProjection';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function average(nums: number[]): number {
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

const AVG_DAYS_PER_MONTH = 30.44;

function addMonths(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 7); // YYYY-MM
}

// Planning-benchmark ratios — deliberately fixed constants (same convention as
// RecurringExpenseTemplate), not derived from real data. Both Capex and the fixed Opex lines
// are expressed as a multiple/fraction of the outlet's own derived steady-state revenue rather
// than an absolute per-seat rupee rate: since revenuePerSeatPerMonth/revenuePerRoomPerMonth are
// themselves derived from this demo's necessarily-thin seeded transaction volume (see
// deriveRevenueBenchmarks), anchoring cost to a real-world absolute rate (e.g. a market rent per
// sq.ft.) independent of that revenue scale would price the outlet as permanently loss-making
// regardless of input — a demo-data artifact, not a real conclusion about the scenario. Ratio-
// anchoring keeps Capex/Opex proportionate to whatever revenue this outlet's own inputs
// produce, on both a real deployment and this demo. City tier still scales the ratios the way a
// metro high street genuinely commands higher rent/labor cost, and lower margin, than a tier-3
// town — but as a multiplier on the ratio, not a flat rupee amount.
const CITY_TIER_MULTIPLIER: Record<CityTier, number> = { METRO_TIER1: 1.15, TIER2: 1.0, TIER3: 0.85 };
const COGS_PCT_OF_REVENUE = 0.32; // food/beverage + room consumables cost, blended benchmark (not tier-adjusted — a product cost, not a real-estate/labor cost)
const MARKETING_PCT_OF_REVENUE = 0.06; // marketing spend + aggregator commission, blended benchmark
const RENT_PCT_OF_REVENUE = 0.14;
const SALARY_PCT_OF_REVENUE = 0.22;
const UTILITIES_PCT_OF_REVENUE = 0.05;
const MAINTENANCE_PCT_OF_REVENUE = 0.035;
const CAPEX_MONTHS_OF_REVENUE = 3; // total one-time setup cost, as a multiple of steady-state monthly revenue
const SOFT_LAUNCH_REVENUE_FRACTION = 0.35; // month 1 revenue as a fraction of steady-state

export const outletProjectionService = {
  // Revenue benchmark, derived from THIS chain's own comparable outlets: average monthly
  // revenue per seat (restaurant/dine-in) and per room (hotel). Rate = (observed revenue /
  // number of distinct days that revenue was actually recorded on) * ~30.44, extrapolating the
  // outlet's genuine recent daily run-rate to a month — deliberately NOT total-revenue-since-
  // Location.openedDate/months-open, because the seeded transaction history only covers a
  // recent rolling window (see pos.seed.ts's PAST_BUSINESS_DATES / hotel.seed.ts's BASE_DATE),
  // while openedDate can be over a decade in the past; dividing by full calendar months open
  // would silently deflate the rate by two orders of magnitude. Guarded by seats/rooms > 0 so a
  // hotel-only HYBRID outlet naturally never pollutes the per-seat rate (it has no tables) and a
  // restaurant-only HYBRID never pollutes the per-room rate (it has no rooms) — no need to
  // branch on outletType/features at all.
  deriveRevenueBenchmarks(locations: Location[], tables: DiningTable[], rooms: Room[], bills: Bill[], folios: Folio[]): RevenueBenchmark {
    const perSeatRates: number[] = [];
    locations.filter((l) => l.isOutlet).forEach((loc) => {
      const seats = tables.filter((t) => t.outletId === loc.id).reduce((s, t) => s + t.capacity, 0);
      if (seats === 0) return;
      const outletBills = bills.filter((b) => b.outletId === loc.id && b.status !== 'VOID');
      const activeDays = new Set(outletBills.map((b) => b.businessDate)).size;
      if (activeDays === 0) return;
      const revenue = outletBills.reduce((s, b) => s + b.netAmount, 0);
      perSeatRates.push((revenue / activeDays) * AVG_DAYS_PER_MONTH / seats);
    });

    const perRoomRates: number[] = [];
    locations.filter((l) => l.isOutlet).forEach((loc) => {
      const roomCount = rooms.filter((r) => r.locationId === loc.id).length;
      if (roomCount === 0) return;
      const outletFolios = folios.filter((f) => f.locationId === loc.id && f.status === 'SETTLED');
      const activeDays = new Set(outletFolios.map((f) => f.settledAt?.slice(0, 10)).filter(Boolean)).size;
      if (activeDays === 0) return;
      const revenue = outletFolios.reduce((s, f) => s + f.totalAmount, 0);
      perRoomRates.push((revenue / activeDays) * AVG_DAYS_PER_MONTH / roomCount);
    });

    return {
      revenuePerSeatPerMonth: perSeatRates.length ? round2(average(perSeatRates)) : 0,
      revenuePerRoomPerMonth: perRoomRates.length ? round2(average(perRoomRates)) : 0,
      sampleRestaurantOutlets: perSeatRates.length,
      sampleHotelOutlets: perRoomRates.length,
    };
  },

  // Total Capex = CAPEX_MONTHS_OF_REVENUE worth of this outlet's own steady-state monthly
  // revenue (tier-scaled), then split across line items by fixed weights so the itemized
  // breakdown still reads like a real setup-cost estimate. Weights are defined per applicable
  // category (dine-in vs rooms vs always-on) and renormalized to 100% over whichever categories
  // actually apply — a pure-RESTAURANT scenario never carries room weight, a pure-HOTEL scenario
  // never carries dine-in weight, and a HYBRID scenario blends both.
  buildCapexEstimate(input: OutletProjectionInput, steadyStateRevenue: number): CostLineItem[] {
    const tierMult = CITY_TIER_MULTIPLIER[input.cityTier];
    const { seatingCapacity: seats, roomCount: rooms } = input;
    const totalCapex = steadyStateRevenue * CAPEX_MONTHS_OF_REVENUE * tierMult;

    const weighted: CostLineItem[] = [];
    if (seats > 0) {
      weighted.push({ label: 'Kitchen Equipment & Exhaust', amount: 26 });
      weighted.push({ label: 'Dining Interiors, Furniture & Fixtures', amount: 20 });
      weighted.push({ label: 'Initial F&B Inventory & Smallwares', amount: 6 });
    }
    if (rooms > 0) {
      weighted.push({ label: 'Room FF&E (Furniture, Fixtures & Equipment)', amount: 30 });
      weighted.push({ label: 'Room Interiors & Civil Fit-out', amount: 20 });
      weighted.push({ label: 'Front Office & Housekeeping Setup', amount: 6 });
    }
    weighted.push({ label: 'POS, Billing & IT Infrastructure', amount: 6 });
    weighted.push({ label: 'Licenses, Deposits & Utility Connections', amount: 8 });
    weighted.push({ label: 'Branding, Signage & Pre-Opening Marketing', amount: 4 });

    const totalWeight = weighted.reduce((s, l) => s + l.amount, 0);
    return weighted.map((l) => ({ label: l.label, amount: round2((l.amount / totalWeight) * totalCapex) }));
  },

  // Fixed lines (Rent/Salaries/Utilities/Maintenance) are pinned to their steady-state rupee
  // value and charged in full every month regardless of ramp — realistic, since rent and payroll
  // are due whether or not the outlet is full yet, and is what makes early ramp months lossy in
  // buildMonthlyProjection. COGS/Marketing are shown here at their steady-state value for the
  // summary table, but buildMonthlyProjection re-evaluates them against each month's actual
  // (ramped) revenue, since cost of goods sold only occurs when something is actually sold.
  buildOpexEstimate(input: OutletProjectionInput, steadyStateRevenue: number): CostLineItem[] {
    const tierMult = CITY_TIER_MULTIPLIER[input.cityTier];
    return [
      { label: 'Rent & CAM', amount: round2(steadyStateRevenue * RENT_PCT_OF_REVENUE * tierMult) },
      { label: 'Staff Salaries & Benefits', amount: round2(steadyStateRevenue * SALARY_PCT_OF_REVENUE * tierMult) },
      { label: 'Utilities (Power, Water, Gas)', amount: round2(steadyStateRevenue * UTILITIES_PCT_OF_REVENUE * tierMult) },
      { label: 'Consumables & Cost of Goods (variable, at steady state)', amount: round2(steadyStateRevenue * COGS_PCT_OF_REVENUE) },
      { label: 'Marketing & Aggregator Commission (variable, at steady state)', amount: round2(steadyStateRevenue * MARKETING_PCT_OF_REVENUE) },
      { label: 'Maintenance, Insurance & Admin', amount: round2(steadyStateRevenue * MAINTENANCE_PCT_OF_REVENUE * tierMult) },
    ];
  },

  buildMonthlyProjection(input: OutletProjectionInput, totalCapex: number, fixedMonthlyOpex: number, steadyStateRevenue: number): MonthlyOutletProjection[] {
    const months: MonthlyOutletProjection[] = [];
    let cumulative = -totalCapex;
    for (let m = 1; m <= input.projectionMonths; m++) {
      const rampPct = m >= input.rampMonths ? 1 : round2(SOFT_LAUNCH_REVENUE_FRACTION + (1 - SOFT_LAUNCH_REVENUE_FRACTION) * ((m - 1) / Math.max(1, input.rampMonths - 1)));
      const revenue = round2(steadyStateRevenue * rampPct);
      const variableOpex = round2(revenue * (COGS_PCT_OF_REVENUE + MARKETING_PCT_OF_REVENUE));
      const opex = round2(fixedMonthlyOpex + variableOpex);
      const netCashFlow = round2(revenue - opex);
      cumulative = round2(cumulative + netCashFlow);
      months.push({ monthIndex: m, monthLabel: addMonths(input.targetOpeningDate, m - 1), rampPct, revenue, opex, netCashFlow, cumulativeCashFlow: cumulative });
    }
    return months;
  },

  buildProjection(
    input: OutletProjectionInput,
    locations: Location[],
    tables: DiningTable[],
    rooms: Room[],
    bills: Bill[],
    folios: Folio[],
  ): OutletProjectionResult {
    const benchmark = outletProjectionService.deriveRevenueBenchmarks(locations, tables, rooms, bills, folios);
    const steadyStateMonthlyRevenue = round2(input.seatingCapacity * benchmark.revenuePerSeatPerMonth + input.roomCount * benchmark.revenuePerRoomPerMonth);

    const capexLines = outletProjectionService.buildCapexEstimate(input, steadyStateMonthlyRevenue);
    const totalCapex = round2(capexLines.reduce((s, l) => s + l.amount, 0));

    const opexLines = outletProjectionService.buildOpexEstimate(input, steadyStateMonthlyRevenue);
    const fixedMonthlyOpex = round2(
      opexLines.filter((l) => !l.label.includes('variable')).reduce((s, l) => s + l.amount, 0),
    );
    const monthlyOpexAtSteadyState = round2(opexLines.reduce((s, l) => s + l.amount, 0));

    const months = outletProjectionService.buildMonthlyProjection(input, totalCapex, fixedMonthlyOpex, steadyStateMonthlyRevenue);
    const breakEvenMonth = months.find((m) => m.cumulativeCashFlow >= 0);
    const year1 = months.filter((m) => m.monthIndex <= 12);
    const year2 = months.filter((m) => m.monthIndex > 12 && m.monthIndex <= 24);

    return {
      input,
      benchmark,
      steadyStateMonthlyRevenue,
      capexLines,
      totalCapex,
      opexLines,
      monthlyOpexAtSteadyState,
      months,
      breakEvenMonthIndex: breakEvenMonth ? breakEvenMonth.monthIndex : null,
      year1NetCashFlow: round2(year1.reduce((s, m) => s + m.netCashFlow, 0)),
      year2NetCashFlow: year2.length > 0 ? round2(year2.reduce((s, m) => s + m.netCashFlow, 0)) : null,
    };
  },
};

export type { NewOutletType };
