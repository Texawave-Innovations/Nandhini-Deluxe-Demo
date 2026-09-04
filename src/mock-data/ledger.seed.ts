// Fixed/singleton ledger accounts that aren't derived from a Vendor or Customer master — one
// Bank + one Cash contra-account for Payment/Receipt vouchers, aggregator placeholders for the
// two channels already modelled elsewhere in this codebase (POS channel-settlement domain), and
// the two P&L-side legs every Purchase Bill / Sales Invoice voucher needs. Deliberately not
// exhaustive (no GST Input/Output, no Freight) — additive later without a breaking migration.

import { LedgerAccount } from '@/types/ledger';

export const FIXED_LEDGER_ACCOUNTS: Omit<LedgerAccount, 'id' | 'createdAt'>[] = [
  { code: 'LAC-BANK-01', name: 'HDFC Bank - Current A/c', accountType: 'BANK', openingBalance: 500000, openingBalanceDrCr: 'DEBIT', status: 'ACTIVE' },
  { code: 'LAC-CASH-01', name: 'Cash in Hand', accountType: 'CASH', openingBalance: 25000, openingBalanceDrCr: 'DEBIT', status: 'ACTIVE' },
  { code: 'LAC-AGG-01', name: 'Aggregator Receivable - Swiggy', accountType: 'AGGREGATOR', openingBalance: 0, openingBalanceDrCr: 'DEBIT', status: 'ACTIVE' },
  { code: 'LAC-AGG-02', name: 'Aggregator Receivable - Zomato', accountType: 'AGGREGATOR', openingBalance: 0, openingBalanceDrCr: 'DEBIT', status: 'ACTIVE' },
  { code: 'LAC-EXP-PURCHASE', name: 'Purchases', accountType: 'EXPENSE', openingBalance: 0, openingBalanceDrCr: 'DEBIT', status: 'ACTIVE' },
  { code: 'LAC-INC-SALES', name: 'Sales Revenue', accountType: 'INCOME', openingBalance: 0, openingBalanceDrCr: 'CREDIT', status: 'ACTIVE' },
];
