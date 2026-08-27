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

export interface Location {
  id: string;
  businessUnitId: string;
  code: string;
  name: string;
  city: string;
  address: string;
  geofenceRadiusMeters?: number;
  latitude?: number;
  longitude?: number;
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

export type UserRole = 'SUPER_ADMIN' | 'HR_ADMIN' | 'LOCATION_HR' | 'DEPT_MANAGER' | 'EMPLOYEE';

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

