// Shift Master, Rules, Applicability, Templates and Roster Domain Types

import { Status } from './erp-core';

export interface ShiftBreak {
  id: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  durationMins: number;
  isPaid: boolean;
}

export interface ShiftRules {
  lateArrivalGraceMins: number;
  earlyExitGraceMins: number;
  maxLateOccurrencesPerMonth: number;
  minHoursForHalfDay: number;
  minHoursForFullDay: number;
  otEligibility: boolean;
  minOtDurationMins: number;
  maxOtHoursPerDay: number;
  roundingMins: number;
  missingPunchHandling: 'MARK_ABSENT' | 'AUTO_REGULARIZATION_REQUIRED' | 'HALF_DAY';
}

export interface ShiftMaster {
  id: string;
  code: string; // e.g. M1, E1, N1, G1
  name: string; // Morning Shift 1
  startTime: string; // 07:00
  endTime: string;   // 15:30
  isCrossMidnight: boolean;
  totalShiftHours: number;
  colorCode: string; // Tailwind color e.g., 'bg-blue-100 text-blue-800 border-blue-300'
  breaks: ShiftBreak[];
  rules: ShiftRules;
  status: Status;
}

export interface ShiftApplicability {
  id: string;
  shiftId: string;
  businessUnitId?: string;
  locationId?: string;
  departmentId?: string;
  employmentTypeId?: string;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface ShiftTemplateDay {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday ... 6 = Saturday
  shiftId: string | 'OFF'; // Shift ID or OFF
}

export interface ShiftTemplate {
  id: string;
  code: string;
  name: string;
  description?: string;
  days: ShiftTemplateDay[];
  status: Status;
}

export type RosterStatus = 'DRAFT' | 'PUBLISHED' | 'LOCKED';

export interface RosterShiftAssignment {
  id: string;
  rosterId: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  shiftId: string | 'OFF' | 'LEAVE' | 'HOLIDAY' | 'EVENT';
  eventId?: string;
  notes?: string;
  isModifiedAfterPublish?: boolean;
}

export interface Roster {
  id: string;
  locationId: string;
  departmentId: string;
  monthYear: string; // YYYY-MM
  status: RosterStatus;
  publishedAt?: string;
  publishedBy?: string;
}

export interface ManpowerRequirement {
  date: string;
  shiftId: string;
  departmentId: string;
  locationId: string;
  requiredCount: number;
  scheduledCount: number;
  shortage: number;
}

