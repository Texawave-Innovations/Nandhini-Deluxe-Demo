// Employee Domain Types with Effective Date Assignment Support

import { Status } from './erp-core';

export type EmploymentTypeCategory = 'PERMANENT' | 'PROBATION' | 'CONTRACT' | 'TRAINEE' | 'PART_TIME';

export interface EmploymentType {
  id: string;
  code: string;
  name: string;
  category: EmploymentTypeCategory;
  noticePeriodDays: number;
  probationDays: number;
  status: Status;
}

export interface EmployeeAssignment {
  id: string;
  employeeId: string;
  businessUnitId: string;
  locationId: string;
  departmentId: string;
  roleId: string;
  reportingManagerId?: string;
  costCenterId?: string;
  effectiveFrom: string; // YYYY-MM-DD
  effectiveTo?: string; // YYYY-MM-DD or null if active
  isCurrent: boolean;
  reasonForChange?: string;
}

export interface Employee {
  id: string;
  employeeCode: string; // e.g., ND-1001
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: string;
  joiningDate: string;
  employmentTypeId: string;
  profilePhoto?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  address?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  
  // Current active assignment shortcut for fast display
  currentAssignment: EmployeeAssignment;
  assignmentHistory: EmployeeAssignment[];
}

