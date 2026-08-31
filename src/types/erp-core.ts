// Enterprise Shared ERP Core Types

export type Status = 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Organization {
  id: string;
  code: string;
  name: string;
  logo?: string;
  taxId?: string;
  currency: string;
  timezone: string;
  createdDate: string;
}

export interface BusinessUnit {
  id: string;
  orgId: string;
  code: string;
  name: string;
  type: 'RESTAURANT' | 'HOTEL' | 'CENTRAL_KITCHEN' | 'CORPORATE';
  description?: string;
  status: Status;
}

// A Region groups Outlets geographically (Organization -> Region -> Outlet).
export interface Region {
  id: string;
  orgId: string;
  code: string;
  name: string;
  status: Status;
}

export type OutletType = 'RESTAURANT' | 'HOTEL' | 'BANQUET' | 'HYBRID' | 'CENTRAL_KITCHEN' | 'CORPORATE';

// Feature flags describe which operational surfaces an Outlet exposes.
export interface OutletFeatures {
  hasRestaurant: boolean;
  hasHotel: boolean;
  hasBanquet: boolean;
  hasLiquorSection: boolean;
  hasKitchen: boolean;
  hasInventoryStore: boolean;
}

// `Location` is the Outlet Master. Every operational outlet (Restaurant/Hotel/Banquet/Hybrid)
// is a Location with isOutlet=true; Central Kitchen / Corporate HQ remain Locations but are
// not outlets (isOutlet=false) and are excluded from the Outlet Switcher.
export interface Location {
  id: string;
  businessUnitId: string;
  regionId?: string;
  code: string;
  name: string;
  city: string;
  address: string;
  geofenceRadiusMeters?: number;
  latitude?: number;
  longitude?: number;
  outletType: OutletType;
  isOutlet: boolean;
  features: OutletFeatures;
  openedDate?: string;
  status: Status;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  parentDepartmentId?: string;
  status: Status;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  category: 'MANAGEMENT' | 'OPERATIONS' | 'SERVICE' | 'KITCHEN' | 'ADMIN' | 'SUPPORT';
  status: Status;
}

export interface CostCenter {
  id: string;
  businessUnitId: string;
  code: string;
  name: string;
  budgetAllocated: number;
  status: Status;
}

export type UserRole =
  | 'SUPER_ADMIN'
  | 'CORPORATE_MANAGEMENT'
  | 'OUTLET_MANAGER'
  | 'RESTAURANT_MANAGER'
  | 'CASHIER'
  | 'KITCHEN_STAFF'
  | 'INVENTORY_MANAGER'
  | 'PURCHASE_MANAGER'
  | 'FINANCE_EXECUTIVE'
  | 'FINANCE_MANAGER'
  | 'HOTEL_RECEPTIONIST'
  | 'HOUSEKEEPING'
  | 'BANQUET_MANAGER'
  | 'HR_EXECUTIVE'
  | 'HR_ADMIN'
  | 'LOCATION_HR'
  | 'DEPT_MANAGER'
  | 'AUDITOR'
  | 'EMPLOYEE';

export interface User {
  id: string;
  employeeId: string;
  username: string;
  email: string;
  role: UserRole;
  allowedLocationIds?: string[];
  allowedDepartmentIds?: string[];
  status: Status;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  module: 'ORGANIZATION' | 'EMPLOYEE' | 'SHIFT' | 'ROSTER' | 'ATTENDANCE' | 'LEAVE' | 'OVERTIME' | 'SHIFT_SWAP' | 'BANQUET' | 'WORKFLOW';
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'PUBLISH' | 'ASSIGN' | 'SUBMIT';
  recordId: string;
  recordTitle: string;
  previousValue?: string;
  newValue?: string;
  ipAddress: string;
}

export interface ApprovalWorkflowStep {
  stepNumber: number;
  role: 'REPORTING_MANAGER' | 'DEPT_MANAGER' | 'LOCATION_HR' | 'HR_ADMIN' | 'SPECIFIC_USER';
  specificUserId?: string;
  autoApproveHours?: number;
}

export interface ApprovalWorkflow {
  id: string;
  name: string;
  module: 'LEAVE' | 'OVERTIME' | 'REGULARIZATION' | 'SHIFT_SWAP' | 'ROSTER_CHANGE';
  steps: ApprovalWorkflowStep[];
  isActive: boolean;
}

