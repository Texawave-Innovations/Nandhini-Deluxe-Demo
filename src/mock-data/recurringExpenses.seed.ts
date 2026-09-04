import { RecurringExpenseTemplate } from '@/types/projection';

// A small fixed list of corporate-level recurring OPEX — realistic enough to make the cash-
// outflow projection non-trivial without inventing a full expense-tracking module. Not persisted
// to Firebase or user-editable; the Projection tab is entirely read-only/derived.
export const RECURRING_EXPENSE_TEMPLATES: RecurringExpenseTemplate[] = [
  { id: 'rec-rent', name: 'Outlet & Kitchen Rent', category: 'RENT', amount: 185000, dayOfMonth: 5 },
  { id: 'rec-salaries', name: 'Staff Salaries', category: 'SALARIES', amount: 620000, dayOfMonth: 1 },
  { id: 'rec-utilities', name: 'Electricity & Water', category: 'UTILITIES', amount: 42000, dayOfMonth: 10 },
  { id: 'rec-subscriptions', name: 'POS/ERP & Software Subscriptions', category: 'SUBSCRIPTIONS', amount: 18500, dayOfMonth: 3 },
  { id: 'rec-maintenance', name: 'Equipment Maintenance Contract', category: 'MAINTENANCE', amount: 15000, dayOfMonth: 15 },
  { id: 'rec-insurance', name: 'Insurance Premium', category: 'OTHER', amount: 22000, dayOfMonth: 20 },
];
