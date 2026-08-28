// Expanded Attendance, Exceptions, Statutory PF/ESI, Loans, Recruitment, Expenses, Tickets & Exit Types

export type PunchSource = 'BIOMETRIC_DEVICE' | 'MOBILE_APP' | 'MANUAL_ENTRY' | 'SIMULATOR' | 'WEB_CAMERA_VERIFIED';

export interface AttendancePunch {
  id: string;
  employeeId: string;
  timestamp: string; // ISO String
  punchType: 'IN' | 'OUT';
  source: PunchSource;
  deviceId?: string;
  locationId?: string;
  photoUrl?: string; // Web check-in photo verification
  isProcessed: boolean;
}

export type AttendanceStatus = 
  | 'PRESENT' 
  | 'LATE' 
  | 'EARLY_EXIT' 
  | 'HALF_DAY' 
  | 'ABSENT' 
  | 'MISSING_PUNCH' 
  | 'ON_LEAVE' 
  | 'WEEKLY_OFF' 
  | 'HOLIDAY';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  scheduledShiftId?: string;
  firstIn?: string; // HH:mm
  lastOut?: string; // HH:mm
  totalWorkedHours: number;
  breakDurationMins: number;
  lateMins: number;
  earlyExitMins: number;
  otHours: number;
  status: AttendanceStatus;
  hasMissingPunch: boolean;
  isRegularized: boolean;
  regularizationId?: string;
  punches: AttendancePunch[];
}

export type ApprovalStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface RegularizationRequest {
  id: string;
  employeeId: string;
  date: string;
  attendanceRecordId: string;
  requestedInTime: string;
  requestedOutTime: string;
  reason: string;
  supportingNote?: string;
  status: ApprovalStatus;
  submittedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface LeaveType {
  id: string;
  code: string;
  name: string;
  annualAllocation: number;
  isCarryForward: boolean;
  maxCarryForwardDays: number;
  paidType: 'PAID' | 'UNPAID';
}

export interface LeaveBalance {
  employeeId: string;
  leaveTypeId: string;
  openingBalance: number;
  allocated: number;
  used: number;
  pending: number;
  available: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  isHalfDay: boolean;
  totalDays: number;
  reason: string;
  status: ApprovalStatus;
  submittedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'NATIONAL' | 'FESTIVAL' | 'OPTIONAL';
  applicableLocationIds: string[]; // empty means all
  isRestricted: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface OvertimeRecord {
  id: string;
  employeeId: string;
  date: string;
  shiftId: string;
  workedHours: number;
  standardHours: number;
  calculatedOtHours: number;
  requestedOtHours: number;
  approvedOtHours: number;
  status: ApprovalStatus;
  approvedBy?: string;
}

export interface ShiftSwapRequest {
  id: string;
  requestorEmployeeId: string;
  requestorDate: string;
  requestorShiftId: string;
  targetEmployeeId: string;
  targetDate: string;
  targetShiftId: string;
  targetAccepted: boolean;
  managerStatus: ApprovalStatus;
  submittedAt: string;
  approvedBy?: string;
}

export interface BanquetEvent {
  id: string;
  code: string;
  name: string; // e.g. "Royal Wedding Reception", "Corporate Executive Dinner"
  locationId: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  expectedGuests: number;
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
}

export interface EventStaffRequirement {
  id: string;
  eventId: string;
  roleId: string; // e.g. Waiter, Supervisor, Chef
  requiredCount: number;
  assignedCount: number;
}

export interface EventStaffAssignment {
  id: string;
  eventId: string;
  requirementId: string;
  employeeId: string;
  assignedAt: string;
}

// --- TexaWave ERP Missing Feature Extensions ---

export interface LoanRecord {
  id: string;
  employeeId: string;
  loanType: 'SALARY_ADVANCE' | 'PERSONAL_LOAN' | 'EMERGENCY';
  principalAmount: number;
  monthlyEmiAmount: number;
  startMonthYear: string; // YYYY-MM
  recoveredAmount: number;
  balanceAmount: number;
  status: 'ACTIVE' | 'CLOSED' | 'PENDING_APPROVAL';
  sanctionedDate: string;
}

export interface PfEsiRecord {
  employeeId: string;
  monthYear: string;
  basicPay: number;
  grossPay: number;
  pfEmployeeShare: number; // 12% capped
  pfEmployerShare: number; // 12%
  esiEmployeeShare: number; // 0.75% capped
  esiEmployerShare: number; // 3.25%
}

export interface BonusRecord {
  id: string;
  employeeId: string;
  bonusType: 'FESTIVAL_DIWALI' | 'PERFORMANCE' | 'STATUTORY_ANNUAL';
  amount: number;
  monthYear: string;
  status: ApprovalStatus;
}

export interface CandidateApplicant {
  id: string;
  jobTitle: string;
  candidateName: string;
  email: string;
  phone: string;
  stage: 'APPLIED' | 'SCREENING' | 'INTERVIEW_SCHEDULED' | 'TECHNICAL_PASSED' | 'OFFER_EXTENDED' | 'OFFERED' | 'REJECTED';
  interviewDate?: string;
  notes?: string;
}

export interface HrTicket {
  id: string;
  ticketCode: string;
  employeeId: string;
  category: 'PAYROLL_DISPUTE' | 'LEAVE_QUERY' | 'ATTENDANCE_CORRECTION' | 'WORKPLACE_FACILITY' | 'OTHER';
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  submittedAt: string;
  resolutionNotes?: string;
}

export interface ExpenseClaim {
  id: string;
  claimCode: string;
  employeeId: string;
  category: 'TRAVEL' | 'FOOD_CLIENT' | 'OFFICE_SUPPLIES' | 'MISC';
  amount: number;
  expenseDate: string;
  description: string;
  receiptPlaceholderUrl?: string;
  status: ApprovalStatus;
  approvedAmount?: number;
}

export interface ExitRequest {
  id: string;
  employeeId: string;
  resignationDate: string;
  expectedLastWorkingDay: string;
  reason: string;
  noticePeriodDays: number;
  status: 'PENDING_HR' | 'NOTICE_PERIOD_ACTIVE' | 'CLEARED_SETTLED' | 'REJECTED';
  clearanceStatus: {
    deptManagerClearance: boolean;
    financeClearance: boolean;
    itAssetsClearance: boolean;
    hrClearance: boolean;
  };
}

export interface EmployeeTask {
  id: string;
  employeeId: string;
  taskTitle: string;
  dueDate: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}
