// Single source of truth for the application's navigation shell.
// TwoTierSidebar renders the module rail from MODULE_NAV; TopModuleNav renders the active
// module's categories/sub-tabs by matching the current pathname against `matchPrefixes`.
// Adding a Phase 2 module later means adding one entry here — no component changes required.

import {
  LayoutDashboard, UtensilsCrossed, ShoppingCart, Package, ChefHat, ShoppingBag, Truck,
  DollarSign, GitMerge, BookOpenCheck, BedDouble, PartyPopper, Users, FileBarChart2,
  Sparkles, ListTree, ShieldCheck, type LucideIcon,
} from 'lucide-react';

export interface NavSubItem {
  name: string;
  href: string;
}

export interface NavCategory {
  category: string;
  items: NavSubItem[];
}

export interface ModuleNavConfig {
  id: string;
  name: string;
  icon: LucideIcon;
  href: string;
  matchPrefixes: string[];
  status: 'live' | 'phase2';
  categories: NavCategory[];
}

// HR categories, moved verbatim from the legacy TopHRNav so existing HR navigation is unchanged.
const hrmsCategories: NavCategory[] = [
  { category: 'OVERVIEW', items: [{ name: 'Dashboard', href: '/dashboard' }] },
  { category: 'RECRUITMENT', items: [{ name: 'ATS', href: '/hr/recruitment' }] },
  {
    category: 'PEOPLE & ORG',
    items: [
      { name: 'Employees', href: '/employees' },
      { name: 'Units', href: '/organization/business-units' },
      { name: 'Locations', href: '/organization/locations' },
      { name: 'Departments', href: '/organization/departments' },
      { name: 'Roles', href: '/organization/roles' },
      { name: 'Org Hierarchy', href: '/hr/org-chart' },
    ],
  },
  {
    category: 'TIME & ATTENDANCE',
    items: [
      { name: 'Shift Master', href: '/shifts/master' },
      { name: 'Shift Templates', href: '/shifts/templates' },
      { name: 'Roster Grid', href: '/roster/monthly' },
      { name: 'Manpower Planning', href: '/roster/manpower-planning' },
      { name: 'Live Punch', href: '/attendance/today' },
      { name: 'Attendance Register', href: '/attendance/register' },
      { name: 'Regularization', href: '/attendance/regularization' },
      { name: 'FMP', href: '/hr/fmp' },
    ],
  },
  { category: 'LEAVE MANAGEMENT', items: [{ name: 'Leaves & Quotas', href: '/leave' }] },
  {
    category: 'PAYROLL & STATUTORY',
    items: [
      { name: 'PF', href: '/hr/pf' },
      { name: 'ESI', href: '/hr/esi' },
      { name: 'Loans', href: '/hr/loans' },
      { name: 'Bonus', href: '/hr/bonus' },
      { name: 'Overtime', href: '/overtime' },
      { name: 'Reports', href: '/reports' },
    ],
  },
  {
    category: 'OPERATIONS & ESS',
    items: [
      { name: 'Shift Swap', href: '/shift-swap' },
      { name: 'Banquet Staffing', href: '/banquet/events' },
      { name: 'HR Tickets', href: '/hr/tickets' },
      { name: 'Expense Claims', href: '/hr/expenses' },
      { name: 'Offboarding', href: '/hr/exit' },
      { name: 'Workflows', href: '/workflows' },
      { name: 'Audit Trail', href: '/audit' },
    ],
  },
];

const posCategories: NavCategory[] = [
  { category: 'OVERVIEW', items: [{ name: 'POS Dashboard', href: '/pos' }] },
  {
    category: 'ORDERS',
    items: [
      { name: 'New Order', href: '/pos/new-order' },
      { name: 'Tables', href: '/pos/tables' },
      { name: 'Open Orders', href: '/pos/orders' },
      { name: 'KOT', href: '/pos/kot' },
    ],
  },
  {
    category: 'BILLING',
    items: [
      { name: 'Bills', href: '/pos/bills' },
      { name: 'Payments', href: '/pos/payments' },
      { name: 'Discounts', href: '/pos/discounts' },
      { name: 'Complimentary Bills', href: '/pos/complimentary' },
      { name: 'Void / Cancelled', href: '/pos/void' },
    ],
  },
  {
    category: 'DAY OPERATIONS',
    items: [
      { name: 'Cash Drawer', href: '/pos/cash-drawer' },
      { name: 'Day Close', href: '/pos/day-close' },
      { name: 'POS Reports', href: '/pos/reports' },
    ],
  },
];

const inventoryCategories: NavCategory[] = [
  { category: 'OVERVIEW', items: [{ name: 'Inventory Dashboard', href: '/inventory' }] },
  {
    category: 'STOCK',
    items: [
      { name: 'Current Stock', href: '/inventory/stock' },
      { name: 'Stock Ledger', href: '/inventory/ledger' },
      { name: 'Batch & Expiry', href: '/inventory/batch-expiry' },
    ],
  },
  { category: 'MOVEMENT', items: [{ name: 'Outlet Transfer', href: '/inventory/transfer' }] },
];

const mastersCategories: NavCategory[] = [
  {
    category: 'ORGANIZATION',
    items: [
      { name: 'Business Units', href: '/organization/business-units' },
      { name: 'Departments', href: '/organization/departments' },
      { name: 'Roles & Designations', href: '/organization/roles' },
    ],
  },
  {
    category: 'OUTLET & POS',
    items: [
      { name: 'Outlet Master', href: '/masters/outlets' },
      { name: 'POS Counters & Tables', href: '/masters/pos-counters' },
    ],
  },
  {
    category: 'MENU & RECIPE',
    items: [
      { name: 'Menu Master', href: '/masters/menu' },
      { name: 'Recipe / BOM', href: '/masters/recipe' },
    ],
  },
  { category: 'INVENTORY', items: [{ name: 'Inventory Items & UOM', href: '/masters/inventory-items' }] },
];

const purchaseCategories: NavCategory[] = [
  { category: 'OVERVIEW', items: [{ name: 'Purchase Dashboard', href: '/purchase' }] },
  { category: 'ORDERS', items: [{ name: 'Purchase Orders', href: '/purchase/orders' }] },
  { category: 'RECEIVING', items: [{ name: 'Goods Receipt (GRN)', href: '/purchase/grn' }] },
];

const vendorsCategories: NavCategory[] = [
  { category: 'OVERVIEW', items: [{ name: 'Vendor Dashboard', href: '/vendors' }] },
];

const financeCategories: NavCategory[] = [
  { category: 'OVERVIEW', items: [{ name: 'Finance Dashboard', href: '/finance' }] },
  {
    category: 'ACCOUNTS PAYABLE',
    items: [
      { name: 'Vendor Bills', href: '/finance/bills' },
      { name: 'Vendor Payments', href: '/finance/payments' },
    ],
  },
];

const reconciliationCategories: NavCategory[] = [
  { category: 'OVERVIEW', items: [{ name: 'Reconciliation Dashboard', href: '/reconciliation' }] },
  { category: 'BANK', items: [{ name: 'Bank Statement', href: '/reconciliation/bank-statement' }] },
];

const tallyCategories: NavCategory[] = [
  { category: 'OVERVIEW', items: [{ name: 'Tally Dashboard', href: '/tally' }] },
  {
    category: 'VOUCHERS',
    items: [
      { name: 'Vouchers', href: '/tally/vouchers' },
      { name: 'Export History', href: '/tally/export-history' },
    ],
  },
];

const administrationCategories: NavCategory[] = [
  { category: 'OVERVIEW', items: [{ name: 'Administration', href: '/administration' }] },
  {
    category: 'ACCESS',
    items: [
      { name: 'Roles & Access', href: '/administration/roles' },
      { name: 'Audit Logs', href: '/audit' },
    ],
  },
];

export const MODULE_NAV: ModuleNavConfig[] = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', matchPrefixes: ['/dashboard'], status: 'live', categories: [] },
  { id: 'pos', name: 'POS', icon: UtensilsCrossed, href: '/pos', matchPrefixes: ['/pos'], status: 'live', categories: posCategories },
  { id: 'sales', name: 'Sales', icon: ShoppingCart, href: '/sales', matchPrefixes: ['/sales'], status: 'phase2', categories: [] },
  { id: 'inventory', name: 'Inventory', icon: Package, href: '/inventory', matchPrefixes: ['/inventory'], status: 'live', categories: inventoryCategories },
  { id: 'recipe', name: 'Recipe / BOM', icon: ChefHat, href: '/masters/recipe', matchPrefixes: ['/masters/recipe'], status: 'live', categories: [] },
  { id: 'purchase', name: 'Purchase', icon: ShoppingBag, href: '/purchase', matchPrefixes: ['/purchase'], status: 'live', categories: purchaseCategories },
  { id: 'vendors', name: 'Vendors', icon: Truck, href: '/vendors', matchPrefixes: ['/vendors'], status: 'live', categories: vendorsCategories },
  { id: 'finance', name: 'Finance', icon: DollarSign, href: '/finance', matchPrefixes: ['/finance'], status: 'live', categories: financeCategories },
  { id: 'reconciliation', name: 'Reconciliation', icon: GitMerge, href: '/reconciliation', matchPrefixes: ['/reconciliation'], status: 'live', categories: reconciliationCategories },
  { id: 'tally', name: 'Tally / Accounting', icon: BookOpenCheck, href: '/tally', matchPrefixes: ['/tally'], status: 'live', categories: tallyCategories },
  { id: 'hotel', name: 'Hotel Operations', icon: BedDouble, href: '/hotel', matchPrefixes: ['/hotel'], status: 'phase2', categories: [] },
  { id: 'banquet', name: 'Banquet Management', icon: PartyPopper, href: '/banquet-mgmt', matchPrefixes: ['/banquet-mgmt'], status: 'phase2', categories: [] },
  {
    id: 'hrms', name: 'HRMS', icon: Users, href: '/dashboard',
    matchPrefixes: ['/employees', '/attendance', '/roster', '/shifts', '/leave', '/overtime', '/shift-swap', '/organization', '/hr', '/banquet', '/reports', '/audit', '/workflows'],
    status: 'live', categories: hrmsCategories,
  },
  { id: 'reports', name: 'Reports & Analytics', icon: FileBarChart2, href: '/reports-analytics', matchPrefixes: ['/reports-analytics'], status: 'phase2', categories: [] },
  { id: 'ai', name: 'AI Insights', icon: Sparkles, href: '/ai', matchPrefixes: ['/ai'], status: 'phase2', categories: [] },
  { id: 'masters', name: 'Masters', icon: ListTree, href: '/masters', matchPrefixes: ['/masters'], status: 'live', categories: mastersCategories },
  { id: 'administration', name: 'Administration', icon: ShieldCheck, href: '/administration', matchPrefixes: ['/administration'], status: 'live', categories: administrationCategories },
];

// Resolve which module owns the current pathname (longest matching prefix wins so e.g.
// /masters/recipe resolves to the 'recipe' module rather than the generic 'masters' one).
export function resolveActiveModule(pathname: string): ModuleNavConfig | undefined {
  let best: ModuleNavConfig | undefined;
  let bestLen = -1;
  for (const mod of MODULE_NAV) {
    for (const prefix of mod.matchPrefixes) {
      if (pathname === prefix || pathname.startsWith(prefix + '/')) {
        if (prefix.length > bestLen) {
          best = mod;
          bestLen = prefix.length;
        }
      }
    }
  }
  return best;
}
