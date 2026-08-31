// Role-based UI access: which top-level modules a role can see, and whether that role is
// scoped to specific outlets or can see 'ALL OUTLETS' in the Outlet Switcher.
// Consumed by TwoTierSidebar (module filtering) and OutletSwitcherBar (outlet list filtering).

import { UserRole } from '@/types/erp-core';

export type OutletScope = 'ALL' | 'ASSIGNED';

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  CORPORATE_MANAGEMENT: 'Corporate Management',
  OUTLET_MANAGER: 'Outlet Manager',
  RESTAURANT_MANAGER: 'Restaurant Manager',
  CASHIER: 'Cashier',
  KITCHEN_STAFF: 'Kitchen Staff',
  INVENTORY_MANAGER: 'Inventory Manager',
  PURCHASE_MANAGER: 'Purchase Manager',
  FINANCE_EXECUTIVE: 'Finance Executive',
  FINANCE_MANAGER: 'Finance Manager',
  HOTEL_RECEPTIONIST: 'Hotel Receptionist',
  HOUSEKEEPING: 'Housekeeping',
  BANQUET_MANAGER: 'Banquet Manager',
  HR_EXECUTIVE: 'HR Executive',
  HR_ADMIN: 'HR Manager',
  LOCATION_HR: 'Location HR',
  DEPT_MANAGER: 'Department Manager',
  AUDITOR: 'Auditor',
  EMPLOYEE: 'Employee',
};

// Module ids as declared in constants/navigation.ts
export const ROLE_MODULE_ACCESS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ['dashboard', 'pos', 'sales', 'inventory', 'recipe', 'purchase', 'vendors', 'finance', 'reconciliation', 'tally', 'hotel', 'banquet', 'hrms', 'reports', 'ai', 'masters', 'administration'],
  CORPORATE_MANAGEMENT: ['dashboard', 'sales', 'purchase', 'finance', 'reconciliation', 'tally', 'hotel', 'banquet', 'hrms', 'reports', 'ai', 'masters', 'administration'],
  OUTLET_MANAGER: ['dashboard', 'pos', 'sales', 'inventory', 'recipe', 'purchase', 'hotel', 'banquet', 'hrms', 'reports', 'masters'],
  RESTAURANT_MANAGER: ['dashboard', 'pos', 'inventory', 'recipe', 'reports'],
  CASHIER: ['dashboard', 'pos'],
  KITCHEN_STAFF: ['pos', 'inventory'],
  INVENTORY_MANAGER: ['dashboard', 'inventory', 'recipe', 'purchase', 'vendors'],
  PURCHASE_MANAGER: ['dashboard', 'purchase', 'vendors', 'inventory', 'reports'],
  FINANCE_EXECUTIVE: ['dashboard', 'finance', 'sales', 'reconciliation', 'tally', 'reports'],
  FINANCE_MANAGER: ['dashboard', 'finance', 'sales', 'reconciliation', 'tally', 'vendors', 'reports', 'administration'],
  HOTEL_RECEPTIONIST: ['dashboard', 'hotel', 'pos'],
  HOUSEKEEPING: ['hotel'],
  BANQUET_MANAGER: ['dashboard', 'banquet', 'pos'],
  HR_EXECUTIVE: ['hrms'],
  HR_ADMIN: ['dashboard', 'hrms', 'administration'],
  LOCATION_HR: ['hrms'],
  DEPT_MANAGER: ['dashboard', 'hrms'],
  AUDITOR: ['dashboard', 'reconciliation', 'tally', 'reports', 'administration', 'hrms'],
  EMPLOYEE: ['hrms'],
};

export const ROLE_OUTLET_SCOPE: Record<UserRole, OutletScope> = {
  SUPER_ADMIN: 'ALL',
  CORPORATE_MANAGEMENT: 'ALL',
  OUTLET_MANAGER: 'ASSIGNED',
  RESTAURANT_MANAGER: 'ASSIGNED',
  CASHIER: 'ASSIGNED',
  KITCHEN_STAFF: 'ASSIGNED',
  INVENTORY_MANAGER: 'ASSIGNED',
  PURCHASE_MANAGER: 'ASSIGNED',
  FINANCE_EXECUTIVE: 'ALL',
  FINANCE_MANAGER: 'ALL',
  HOTEL_RECEPTIONIST: 'ASSIGNED',
  HOUSEKEEPING: 'ASSIGNED',
  BANQUET_MANAGER: 'ASSIGNED',
  HR_EXECUTIVE: 'ASSIGNED',
  HR_ADMIN: 'ALL',
  LOCATION_HR: 'ASSIGNED',
  DEPT_MANAGER: 'ASSIGNED',
  AUDITOR: 'ALL',
  EMPLOYEE: 'ASSIGNED',
};

// Demo default outlet assignment for roles scoped to ASSIGNED (Indiranagar + Koramangala).
export const DEFAULT_ASSIGNED_OUTLET_IDS = ['loc-1', 'loc-2'];

export function isModuleAllowed(role: UserRole, moduleId: string): boolean {
  return ROLE_MODULE_ACCESS[role]?.includes(moduleId) ?? false;
}
