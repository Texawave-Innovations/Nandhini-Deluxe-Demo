// Finance Projection domain: recurring-expense templates are the only bit of new state here
// (a fixed seeded list, no CRUD — the Projection tab itself is entirely read-only/derived from
// Receivables, Payables, and Aggregator data that already exists elsewhere). No LedgerAccount/
// Voucher involvement — this is a forecast, not an accounting record.

export type RecurringExpenseCategory = 'RENT' | 'SALARIES' | 'UTILITIES' | 'SUBSCRIPTIONS' | 'MAINTENANCE' | 'OTHER';

export interface RecurringExpenseTemplate {
  id: string;
  name: string;
  category: RecurringExpenseCategory;
  amount: number;
  dayOfMonth: number; // 1-28 — the day each month this expense is expected to hit
}
