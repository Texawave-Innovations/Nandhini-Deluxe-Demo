// Realistic sample data for the HR transactional entities that ship empty by default
// (attendance, leave, overtime, shift swaps, loans, bonus, recruitment, tickets, expenses,
// exit, tasks, event staffing, roster and audit trail). Mirrors the deterministic,
// index-driven generation style of `generateSeedEmployees` in seed.ts — no Math.random,
// so the demo renders identically on every load / SSR pass.

import { Employee } from '../types/employee';
import { RosterShiftAssignment } from '../types/shift-roster';
import { AuditLog } from '../types/erp-core';
import {
  AttendanceRecord, AttendancePunch, RegularizationRequest, LeaveRequest, OvertimeRecord,
  ShiftSwapRequest, LoanRecord, BonusRecord, CandidateApplicant, HrTicket, ExpenseClaim,
  ExitRequest, EmployeeTask, EventStaffRequirement, EventStaffAssignment,
} from '../types/attendance-leave';

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const dateStr = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const dowUTC = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d)).getUTCDay();
const addMinutes = (hhmm: string, mins: number) => {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(((total % 1440) + 1440) % 1440 / 60);
  const nm = ((total % 60) + 60) % 60;
  return `${pad(nh)}:${pad(nm)}`;
};

const activeEmployees = (employees: Employee[]) => employees.filter((e) => e.status !== 'INACTIVE');

// ---- Roster: full-month shift schedule per employee, department-appropriate shift + staggered weekly off ----
export function generateRosterAssignments(employees: Employee[], monthYear: string): RosterShiftAssignment[] {
  const [yStr, mStr] = monthYear.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();

  const deptShift: Record<string, string> = {
    'dept-2': 'shift-m1', // Kitchen
    'dept-3': 'shift-g1', // Front Desk
    'dept-4': 'shift-g1', // Housekeeping
    'dept-5': 'shift-sp1', // Banquet
    'dept-6': 'shift-g1', // HR Admin
    'dept-7': 'shift-g1', // Finance
    'dept-8': 'shift-n1', // Security
  };

  const assignments: RosterShiftAssignment[] = [];
  activeEmployees(employees).forEach((emp, idx) => {
    const deptId = emp.currentAssignment.departmentId;
    const weeklyOffDay = idx % 7;
    const baseShiftId = deptId === 'dept-1' ? (idx % 2 === 0 ? 'shift-m1' : 'shift-e1') : (deptShift[deptId] ?? 'shift-g1');

    for (let d = 1; d <= daysInMonth; d++) {
      const date = dateStr(y, m, d);
      const isOff = dowUTC(y, m, d) === weeklyOffDay;
      assignments.push({
        id: `ra-${emp.id}-${date}`,
        rosterId: `roster-${deptId}-${monthYear}`,
        employeeId: emp.id,
        date,
        shiftId: isOff ? 'OFF' : baseShiftId,
      });
    }
  });
  return assignments;
}

// ---- Attendance: derived from the roster for a trailing window of already-elapsed business dates ----
export function generateAttendanceRecords(
  employees: Employee[],
  rosterAssignments: RosterShiftAssignment[],
  fromDate: string,
  toDate: string
): AttendanceRecord[] {
  const shiftTimes: Record<string, { start: string; end: string; hours: number }> = {
    'shift-m1': { start: '07:00', end: '15:30', hours: 8.5 },
    'shift-e1': { start: '15:00', end: '23:30', hours: 8.5 },
    'shift-n1': { start: '23:00', end: '07:30', hours: 8.5 },
    'shift-g1': { start: '09:30', end: '18:00', hours: 8.5 },
    'shift-sp1': { start: '11:00', end: '23:00', hours: 12.0 },
  };
  const rosterByEmpDate = new Map(rosterAssignments.map((ra) => [`${ra.employeeId}|${ra.date}`, ra]));
  const dates: string[] = [];
  const cursor = new Date(`${fromDate}T00:00:00.000Z`);
  const end = new Date(`${toDate}T00:00:00.000Z`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().substring(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const records: AttendanceRecord[] = [];
  const active = activeEmployees(employees);
  active.forEach((emp, idx) => {
    dates.forEach((date, dIdx) => {
      const ra = rosterByEmpDate.get(`${emp.id}|${date}`);
      if (!ra || ra.shiftId === 'OFF') return;
      const shift = shiftTimes[ra.shiftId as string] ?? shiftTimes['shift-g1'];
      const cycle = (idx + dIdx) % 20; // deterministic distribution across the roster

      const recId = `att-${emp.id}-${date}`;
      const punches: AttendancePunch[] = [];
      let status: AttendanceRecord['status'] = 'PRESENT';
      let firstIn: string | undefined = shift.start;
      let lastOut: string | undefined = shift.end;
      let lateMins = 0;
      let earlyExitMins = 0;
      let otHours = 0;
      let hasMissingPunch = false;
      let workedHours = shift.hours;

      if (cycle === 0) {
        status = 'ABSENT';
        firstIn = undefined; lastOut = undefined; workedHours = 0;
      } else if (cycle === 1 || cycle === 2) {
        status = 'LATE';
        lateMins = 12 + (cycle * 5);
        firstIn = addMinutes(shift.start, lateMins);
        workedHours = Math.max(0, shift.hours - lateMins / 60);
      } else if (cycle === 3) {
        status = 'MISSING_PUNCH';
        hasMissingPunch = true;
        lastOut = undefined;
        workedHours = 0;
      } else if (cycle === 4) {
        status = 'EARLY_EXIT';
        earlyExitMins = 20;
        lastOut = addMinutes(shift.end, -earlyExitMins);
        workedHours = Math.max(0, shift.hours - earlyExitMins / 60);
      } else if (cycle === 5) {
        status = 'PRESENT';
        otHours = 1.5;
        lastOut = addMinutes(shift.end, 90);
        workedHours = shift.hours + otHours;
      }

      if (firstIn) punches.push({ id: `${recId}-in`, employeeId: emp.id, timestamp: `${date}T${firstIn}:00.000Z`, punchType: 'IN', source: 'BIOMETRIC_DEVICE', locationId: emp.currentAssignment.locationId, isProcessed: true });
      if (lastOut) punches.push({ id: `${recId}-out`, employeeId: emp.id, timestamp: `${date}T${lastOut}:00.000Z`, punchType: 'OUT', source: 'BIOMETRIC_DEVICE', locationId: emp.currentAssignment.locationId, isProcessed: true });

      records.push({
        id: recId,
        employeeId: emp.id,
        date,
        scheduledShiftId: ra.shiftId as string,
        firstIn,
        lastOut,
        totalWorkedHours: Math.round(workedHours * 100) / 100,
        breakDurationMins: 30,
        lateMins,
        earlyExitMins,
        otHours,
        status,
        hasMissingPunch,
        isRegularized: false,
        punches,
      });
    });
  });
  return records;
}

export function generateRegularizationRequests(attendanceRecords: AttendanceRecord[]): RegularizationRequest[] {
  const missing = attendanceRecords.filter((r) => r.hasMissingPunch).slice(0, 6);
  return missing.map((rec, i) => ({
    id: `regz-${i + 1}`,
    employeeId: rec.employeeId,
    date: rec.date,
    attendanceRecordId: rec.id,
    requestedInTime: rec.firstIn ?? '09:30',
    requestedOutTime: '18:00',
    reason: 'Biometric reader device fail — worked full shift, punch not captured.',
    status: i % 3 === 0 ? 'APPROVED' : 'PENDING',
    submittedAt: `${rec.date}T19:30:00.000Z`,
    approvedBy: i % 3 === 0 ? 'HR Admin' : undefined,
    approvedAt: i % 3 === 0 ? `${rec.date}T20:00:00.000Z` : undefined,
  }));
}

export function generateLeaveRequests(employees: Employee[]): LeaveRequest[] {
  const active = activeEmployees(employees);
  const reasons = ['Personal family event', 'Feeling unwell', 'Native place visit', 'Child school function', 'Wedding in family', 'Medical follow-up'];
  const leaveTypeCycle = ['lt-1', 'lt-2', 'lt-3'];
  const requests: LeaveRequest[] = [];

  // Historical, already-approved leave (spread across mid-August)
  active.filter((_, i) => i % 3 === 0).forEach((emp, i) => {
    const startDay = 5 + (i % 15);
    const days = 1 + (i % 2);
    requests.push({
      id: `lv-${i + 1}`,
      employeeId: emp.id,
      leaveTypeId: leaveTypeCycle[i % leaveTypeCycle.length],
      startDate: `2026-08-${pad(startDay)}`,
      endDate: `2026-08-${pad(startDay + days - 1)}`,
      isHalfDay: days === 1 && i % 4 === 0,
      totalDays: days,
      reason: reasons[i % reasons.length],
      status: i % 9 === 8 ? 'REJECTED' : 'APPROVED',
      submittedAt: `2026-08-${pad(Math.max(1, startDay - 3))}T10:00:00.000Z`,
      approvedBy: i % 9 === 8 ? undefined : 'HR Admin',
      approvedAt: i % 9 === 8 ? undefined : `2026-08-${pad(Math.max(1, startDay - 2))}T11:00:00.000Z`,
    });
  });

  // A handful of upcoming requests still awaiting approval, for the demo's Approve action
  active.filter((_, i) => i % 5 === 1).slice(0, 5).forEach((emp, i) => {
    const startDay = 2 + (i * 2);
    requests.push({
      id: `lv-pending-${i + 1}`,
      employeeId: emp.id,
      leaveTypeId: leaveTypeCycle[(i + 1) % leaveTypeCycle.length],
      startDate: `2026-09-${pad(startDay)}`,
      endDate: `2026-09-${pad(startDay + 1)}`,
      isHalfDay: false,
      totalDays: 2,
      reason: reasons[(i + 2) % reasons.length],
      status: 'PENDING',
      submittedAt: '2026-08-30T09:00:00.000Z',
    });
  });

  return requests;
}

export function generateOvertimeRecords(employees: Employee[]): OvertimeRecord[] {
  const otEligible = activeEmployees(employees).filter((e) => ['dept-1', 'dept-2', 'dept-5'].includes(e.currentAssignment.departmentId));
  return otEligible.slice(0, 10).map((emp, i) => {
    const worked = 10 + (i % 3);
    const standard = 8.5;
    const otHours = Math.round((worked - standard) * 10) / 10;
    const status = i % 5 === 4 ? 'PENDING' : 'APPROVED';
    return {
      id: `ot-${i + 1}`,
      employeeId: emp.id,
      date: `2026-08-${pad(18 + (i % 10))}`,
      shiftId: i % 2 === 0 ? 'shift-m1' : 'shift-e1',
      workedHours: worked,
      standardHours: standard,
      calculatedOtHours: otHours,
      requestedOtHours: otHours,
      approvedOtHours: status === 'APPROVED' ? otHours : 0,
      status,
      approvedBy: status === 'APPROVED' ? 'Restaurant Manager' : undefined,
    };
  });
}

export function generateShiftSwapRequests(employees: Employee[]): ShiftSwapRequest[] {
  const active = activeEmployees(employees);
  const pairs: ShiftSwapRequest[] = [];
  for (let i = 0; i < 6; i++) {
    const requestor = active[i * 2 % active.length];
    const target = active[(i * 2 + 1) % active.length];
    if (!requestor || !target || requestor.id === target.id) continue;
    const approved = i % 2 === 0;
    pairs.push({
      id: `swap-${i + 1}`,
      requestorEmployeeId: requestor.id,
      requestorDate: `2026-08-${pad(20 + i)}`,
      requestorShiftId: 'shift-m1',
      targetEmployeeId: target.id,
      targetDate: `2026-08-${pad(20 + i)}`,
      targetShiftId: 'shift-e1',
      targetAccepted: approved,
      managerStatus: approved ? 'APPROVED' : 'PENDING',
      submittedAt: `2026-08-${pad(18 + i)}T08:00:00.000Z`,
      approvedBy: approved ? 'Restaurant Manager' : undefined,
    });
  }
  return pairs;
}

export function generateLoans(employees: Employee[]): LoanRecord[] {
  const active = activeEmployees(employees);
  const configs: Array<{ type: LoanRecord['loanType']; principal: number; emi: number; monthsRecovered: number; status: LoanRecord['status'] }> = [
    { type: 'SALARY_ADVANCE', principal: 15000, emi: 5000, monthsRecovered: 3, status: 'CLOSED' },
    { type: 'PERSONAL_LOAN', principal: 60000, emi: 5000, monthsRecovered: 4, status: 'ACTIVE' },
    { type: 'EMERGENCY', principal: 20000, emi: 4000, monthsRecovered: 2, status: 'ACTIVE' },
    { type: 'SALARY_ADVANCE', principal: 10000, emi: 5000, monthsRecovered: 1, status: 'ACTIVE' },
    { type: 'PERSONAL_LOAN', principal: 45000, emi: 7500, monthsRecovered: 2, status: 'ACTIVE' },
    { type: 'EMERGENCY', principal: 25000, emi: 5000, monthsRecovered: 0, status: 'PENDING_APPROVAL' },
    { type: 'SALARY_ADVANCE', principal: 12000, emi: 6000, monthsRecovered: 2, status: 'CLOSED' },
  ];
  return configs.map((c, i) => {
    const emp = active[(i * 4 + 2) % active.length];
    const recovered = Math.min(c.principal, c.emi * c.monthsRecovered);
    return {
      id: `loan-${i + 1}`,
      employeeId: emp.id,
      loanType: c.type,
      principalAmount: c.principal,
      monthlyEmiAmount: c.emi,
      startMonthYear: `2026-0${(i % 6) + 3}`,
      recoveredAmount: recovered,
      balanceAmount: c.principal - recovered,
      status: c.status,
      sanctionedDate: `2026-0${(i % 6) + 3}-05`,
    };
  });
}

export function generateBonusRecords(employees: Employee[]): BonusRecord[] {
  const active = activeEmployees(employees);
  const records: BonusRecord[] = [];
  // Statutory annual bonus — full workforce, already paid
  active.forEach((emp, i) => {
    records.push({
      id: `bonus-stat-${i + 1}`,
      employeeId: emp.id,
      bonusType: 'STATUTORY_ANNUAL',
      amount: 3500 + (i % 5) * 250,
      monthYear: '2025-04',
      status: 'APPROVED',
    });
  });
  // Diwali festival bonus — most recently completed Diwali, already paid
  active.slice(0, 22).forEach((emp, i) => {
    records.push({
      id: `bonus-diwali-${i + 1}`,
      employeeId: emp.id,
      bonusType: 'FESTIVAL_DIWALI',
      amount: 5000,
      monthYear: '2025-10',
      status: 'APPROVED',
    });
  });
  // Performance bonus — a handful of standout staff this year, some still pending sign-off
  active.slice(0, 6).forEach((emp, i) => {
    records.push({
      id: `bonus-perf-${i + 1}`,
      employeeId: emp.id,
      bonusType: 'PERFORMANCE',
      amount: 4000 + i * 500,
      monthYear: '2026-07',
      status: i % 3 === 0 ? 'PENDING' : 'APPROVED',
    });
  });
  return records;
}

export function generateCandidates(): CandidateApplicant[] {
  const rows: Array<[string, string, string, string, CandidateApplicant['stage'], string?]> = [
    ['Senior Sous Chef', 'Kishore Kumar', 'kishore.k@gmail.com', '9845012345', 'INTERVIEW_SCHEDULED', '2026-09-03'],
    ['Front Desk Executive', 'Anjali Menon', 'anjali.menon@gmail.com', '9845098765', 'SCREENING'],
    ['Housekeeping Supervisor', 'Ravi Teja', 'ravi.teja@gmail.com', '9845011122', 'APPLIED'],
    ['Banquet Coordinator', 'Meera Iyer', 'meera.iyer@gmail.com', '9845033445', 'TECHNICAL_PASSED'],
    ['Restaurant Manager', 'Aditya Rao', 'aditya.rao@gmail.com', '9845055667', 'OFFER_EXTENDED', '2026-08-25'],
    ['Waiter / F&B Steward', 'Faisal Khan', 'faisal.khan@gmail.com', '9845077889', 'OFFERED'],
    ['Line Cook', 'Sneha Pillai', 'sneha.pillai@gmail.com', '9845099001', 'REJECTED'],
    ['Security Officer', 'Manjunath B', 'manjunath.b@gmail.com', '9845022334', 'APPLIED'],
    ['HR Operations Executive', 'Divya Prakash', 'divya.prakash@gmail.com', '9845044556', 'SCREENING'],
  ];
  return rows.map(([jobTitle, candidateName, email, phone, stage, interviewDate], i) => ({
    id: `cand-${i + 1}`,
    jobTitle, candidateName, email, phone, stage,
    interviewDate,
    notes: stage === 'REJECTED' ? 'Did not meet minimum experience requirement.' : undefined,
  }));
}

export function generateHrTickets(employees: Employee[]): HrTicket[] {
  const active = activeEmployees(employees);
  const rows: Array<[HrTicket['category'], string, string, HrTicket['priority'], HrTicket['status']]> = [
    ['PAYROLL_DISPUTE', 'August salary short by one day', 'My August payslip shows one day less than the days I actually worked, please review my attendance record.', 'HIGH', 'OPEN'],
    ['LEAVE_QUERY', 'Carry-forward balance not reflecting', 'My Earned Leave carry-forward from last year is not showing in my current balance.', 'MEDIUM', 'IN_PROGRESS'],
    ['ATTENDANCE_CORRECTION', 'Missing punch on 24th August', 'Biometric device was down at Koramangala outlet, need manual correction.', 'MEDIUM', 'RESOLVED'],
    ['WORKPLACE_FACILITY', 'Staff locker room AC not working', 'The staff changing room AC has not been working for the past week.', 'LOW', 'OPEN'],
    ['PAYROLL_DISPUTE', 'PF not deducted for July', 'PF deduction is missing from my July payslip, need it corrected before annual return.', 'URGENT', 'OPEN'],
    ['LEAVE_QUERY', 'Sandwich leave policy clarification', 'Need clarification on whether the holiday in between two approved leave days counts as leave.', 'LOW', 'RESOLVED'],
    ['OTHER', 'ID card reissue request', 'Lost my employee ID card, need a reissue for biometric access.', 'MEDIUM', 'IN_PROGRESS'],
    ['ATTENDANCE_CORRECTION', 'Regularization request stuck pending', 'My regularization request from last week is still showing pending, please expedite.', 'MEDIUM', 'OPEN'],
    ['WORKPLACE_FACILITY', 'Drinking water cooler needs refill', 'The drinking water cooler at the kitchen has been empty since morning.', 'LOW', 'RESOLVED'],
  ];
  return rows.map(([category, subject, description, priority, status], i) => ({
    id: `tkt-${i + 1}`,
    ticketCode: `TKT-2026-${pad(800 + i)}`,
    employeeId: active[(i * 3 + 1) % active.length].id,
    category, subject, description, priority, status,
    submittedAt: `2026-08-${pad(15 + i)}T09:${pad(10 + i)}:00.000Z`,
    resolutionNotes: status === 'RESOLVED' ? 'Reviewed and corrected; confirmed with employee.' : undefined,
  }));
}

export function generateExpenseClaims(employees: Employee[]): ExpenseClaim[] {
  const active = activeEmployees(employees);
  const rows: Array<[ExpenseClaim['category'], number, string, ExpenseClaim['status']]> = [
    ['TRAVEL', 1250, 'Auto fare for vendor site visit', 'APPROVED'],
    ['FOOD_CLIENT', 3200, 'Client lunch meeting — corporate catering lead', 'APPROVED'],
    ['OFFICE_SUPPLIES', 850, 'Stationery for front desk', 'PENDING'],
    ['MISC', 2000, 'Uniform dry cleaning reimbursement', 'PENDING'],
    ['TRAVEL', 4500, 'Inter-outlet travel for training session', 'APPROVED'],
    ['FOOD_CLIENT', 1800, 'Refreshments for supplier negotiation meeting', 'REJECTED'],
    ['OFFICE_SUPPLIES', 620, 'Printer cartridge for HR office', 'APPROVED'],
    ['MISC', 1500, 'Emergency taxi fare — night shift closing', 'PENDING'],
  ];
  return rows.map(([category, amount, description, status], i) => ({
    id: `exp-${i + 1}`,
    claimCode: `EXP-2026-${pad(700 + i)}`,
    employeeId: active[(i * 5 + 3) % active.length].id,
    category, amount,
    expenseDate: `2026-08-${pad(10 + i)}`,
    description,
    status,
    approvedAmount: status === 'APPROVED' ? amount : undefined,
  }));
}

export function generateExitRequests(employees: Employee[]): ExitRequest[] {
  const active = activeEmployees(employees);
  const rows: Array<[string, ExitRequest['status'], boolean, boolean, boolean]> = [
    ['Relocating to hometown for family reasons', 'CLEARED_SETTLED', true, true, true],
    ['Better career opportunity outside the group', 'NOTICE_PERIOD_ACTIVE', true, false, false],
    ['Higher studies', 'PENDING_HR', false, false, false],
  ];
  return rows.map(([reason, status, dept, fin, it], i) => {
    const emp = active[(i * 7 + 5) % active.length];
    return {
      id: `exit-${i + 1}`,
      employeeId: emp.id,
      resignationDate: `2026-07-${pad(15 + i * 3)}`,
      expectedLastWorkingDay: `2026-08-${pad(14 + i * 3)}`,
      reason,
      noticePeriodDays: 30,
      status,
      clearanceStatus: {
        deptManagerClearance: dept,
        financeClearance: fin,
        itAssetsClearance: it,
        hrClearance: status === 'CLEARED_SETTLED',
      },
    };
  });
}

export function generateEmployeeTasks(employees: Employee[]): EmployeeTask[] {
  const active = activeEmployees(employees);
  const rows: Array<[string, string, EmployeeTask['priority'], EmployeeTask['status']]> = [
    ['Complete FSSAI hygiene refresher training', '2026-09-05', 'HIGH', 'PENDING'],
    ['Submit updated bank details for payroll', '2026-09-02', 'MEDIUM', 'PENDING'],
    ['Acknowledge revised uniform policy', '2026-09-01', 'LOW', 'COMPLETED'],
    ['Update banquet event inventory checklist', '2026-09-04', 'MEDIUM', 'IN_PROGRESS'],
    ['Complete fire safety evacuation drill', '2026-09-10', 'HIGH', 'PENDING'],
    ['Renew food handler medical certificate', '2026-09-15', 'HIGH', 'PENDING'],
    ['Submit Q3 self-appraisal form', '2026-09-08', 'MEDIUM', 'PENDING'],
    ['Attend POS billing refresher session', '2026-09-03', 'LOW', 'COMPLETED'],
    ['Verify emergency contact details', '2026-09-06', 'LOW', 'IN_PROGRESS'],
    ['Complete guest service etiquette module', '2026-09-12', 'MEDIUM', 'PENDING'],
  ];
  return rows.map(([taskTitle, dueDate, priority, status], i) => ({
    id: `task-${i + 1}`,
    employeeId: active[(i * 2 + 4) % active.length].id,
    taskTitle, dueDate, priority, status,
  }));
}

export function generateEventAssignments(
  eventRequirements: EventStaffRequirement[],
  employees: Employee[]
): EventStaffAssignment[] {
  const banquetStaff = activeEmployees(employees).filter((e) => e.currentAssignment.departmentId === 'dept-5' && e.currentAssignment.locationId === 'loc-3');
  const assignments: EventStaffAssignment[] = [];
  eventRequirements.forEach((req) => {
    const roleStaff = banquetStaff.filter((e) => e.currentAssignment.roleId === req.roleId);
    roleStaff.slice(0, req.assignedCount).forEach((emp, i) => {
      assignments.push({
        id: `evtasgn-${req.id}-${i + 1}`,
        eventId: req.eventId,
        requirementId: req.id,
        employeeId: emp.id,
        assignedAt: '2026-08-20T10:00:00.000Z',
      });
    });
  });
  return assignments;
}

export function generateSeedAuditLogs(): AuditLog[] {
  const rows: Array<[AuditLog['module'], AuditLog['action'], string, string]> = [
    ['EMPLOYEE', 'CREATE', 'emp-35', 'Employee Sowmya Kulkarni onboarded'],
    ['ROSTER', 'PUBLISH', 'roster-dept-1-2026-08', 'August 2026 roster published — Indiranagar F&B Service'],
    ['LEAVE', 'APPROVE', 'lv-1', 'Leave request approved for employee'],
    ['ATTENDANCE', 'UPDATE', 'att-emp-3-2026-08-24', 'Attendance regularized after biometric device failure'],
    ['SHIFT_SWAP', 'APPROVE', 'swap-1', 'Shift swap approved and roster synced'],
    ['OVERTIME', 'APPROVE', 'ot-1', 'Overtime hours approved by Restaurant Manager'],
    ['BANQUET', 'ASSIGN', 'evt-1', 'Staff assigned to Reddy Family Wedding Reception'],
    ['WORKFLOW', 'SUBMIT', 'tkt-1', 'HR ticket submitted: August salary short by one day'],
  ];
  return rows.map(([module, action, recordId, recordTitle], i) => ({
    id: `aud-seed-${i + 1}`,
    timestamp: `2026-08-${pad(18 + i)} ${pad(9 + i)}:${pad((i * 7) % 60)}:00`,
    userId: 'usr-admin',
    userName: 'SUPER_ADMIN',
    userRole: 'SUPER_ADMIN',
    module, action, recordId, recordTitle,
    ipAddress: `10.0.0.${10 + i}`,
  }));
}
