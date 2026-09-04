// New Outlet Cost Projection domain: a standalone feasibility calculator for opening a new
// outlet — one-time setup cost (Capex), steady-state monthly operating cost (Opex), and a
// month-by-month cash flow projection against a revenue benchmark. The revenue benchmark is
// DERIVED from this chain's own existing outlets (avg revenue per seat / per room, from real
// POS bills and hotel folios) via outletProjectionService.deriveRevenueBenchmarks — not a
// generic industry number — so the projection is grounded in this business's actual
// performance. Capex/Opex unit rates are planning-benchmark constants (same convention as
// RecurringExpenseTemplate: a fixed, clearly-labeled assumption, not derived). Purely a
// what-if calculator: nothing here creates a Location, Voucher, or any operational record, and
// it never feeds back into the ledger — same "read-only, doesn't feed the ledger" contract as
// the Finance Projection tab it sits alongside.

export type NewOutletType = 'RESTAURANT' | 'HYBRID' | 'HOTEL';
export type CityTier = 'METRO_TIER1' | 'TIER2' | 'TIER3';

export interface OutletProjectionInput {
  outletName: string;
  city: string;
  cityTier: CityTier;
  outletType: NewOutletType;
  seatingCapacity: number; // 0 when outletType === 'HOTEL'
  roomCount: number; // 0 when outletType === 'RESTAURANT'
  targetOpeningDate: string; // YYYY-MM-DD
  rampMonths: number; // months to ramp from soft-launch revenue to full run-rate
  projectionMonths: number; // total months to project forward from opening
}

export interface CostLineItem {
  label: string;
  amount: number;
}

export interface RevenueBenchmark {
  revenuePerSeatPerMonth: number;
  revenuePerRoomPerMonth: number;
  sampleRestaurantOutlets: number;
  sampleHotelOutlets: number;
}

export interface MonthlyOutletProjection {
  monthIndex: number; // 1-based, month 1 = opening month
  monthLabel: string; // YYYY-MM
  rampPct: number; // 0-1, fraction of steady-state revenue realized this month
  revenue: number;
  opex: number;
  netCashFlow: number;
  cumulativeCashFlow: number; // starts at -totalCapex in month 0 (not itself a row)
}

export interface OutletProjectionResult {
  input: OutletProjectionInput;
  benchmark: RevenueBenchmark;
  steadyStateMonthlyRevenue: number;
  capexLines: CostLineItem[];
  totalCapex: number;
  opexLines: CostLineItem[]; // fixed lines at face value + variable lines evaluated at steady state
  monthlyOpexAtSteadyState: number;
  months: MonthlyOutletProjection[];
  breakEvenMonthIndex: number | null; // null if not reached within projectionMonths
  year1NetCashFlow: number;
  year2NetCashFlow: number | null; // null when projectionMonths < 24
}
