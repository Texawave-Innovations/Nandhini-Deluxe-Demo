// Expanded Zustand Central Store with Initial Firebase Hydration & Real-time Auto Sync

import { create } from 'zustand';
import {
  Organization, BusinessUnit, Location, Region, Department, Role, CostCenter, UserRole, AuditLog
} from '../types/erp-core';
import { Employee, EmployeeAssignment } from '../types/employee';
import { ShiftMaster, ShiftTemplate, RosterShiftAssignment, Roster } from '../types/shift-roster';
import { 
  AttendanceRecord, AttendancePunch, RegularizationRequest, LeaveType, LeaveBalance, LeaveRequest, Holiday, 
  OvertimeRecord, ShiftSwapRequest, BanquetEvent, EventStaffRequirement, EventStaffAssignment,
  LoanRecord, BonusRecord, CandidateApplicant, HrTicket, ExpenseClaim, ExitRequest, EmployeeTask
} from '../types/attendance-leave';
import {
  INITIAL_ORG, INITIAL_BUSINESS_UNITS, INITIAL_LOCATIONS, INITIAL_REGIONS, INITIAL_DEPARTMENTS, INITIAL_ROLES,
  INITIAL_COST_CENTERS, INITIAL_SHIFTS, INITIAL_SHIFT_TEMPLATES,
  INITIAL_LEAVE_TYPES, INITIAL_HOLIDAYS, INITIAL_BANQUET_EVENTS, generateSeedEmployees
} from '../mock-data/seed';
import {
  generateRosterAssignments, generateAttendanceRecords, generateRegularizationRequests, generateLeaveRequests,
  generateOvertimeRecords, generateShiftSwapRequests, generateLoans, generateBonusRecords, generateCandidates,
  generateHrTickets, generateExpenseClaims, generateExitRequests, generateEmployeeTasks, generateEventAssignments,
  generateSeedAuditLogs,
} from '../mock-data/hr-transactions.seed';
import { firebaseDataService } from '../services/firebaseDataService';

interface HRMSState {
  // Initialization state
  isHydrated: boolean;
  initializeFromFirebase: () => Promise<void>;

  // ERP Core Masters
  organization: Organization;
  businessUnits: BusinessUnit[];
  regions: Region[];
  locations: Location[];
  departments: Department[];
  roles: Role[];
  costCenters: CostCenter[];
  currentRole: UserRole;
  auditLogs: AuditLog[];

  // Employee Domain
  employees: Employee[];

  // Shift & Roster Domain
  shifts: ShiftMaster[];
  shiftTemplates: ShiftTemplate[];
  rosters: Roster[];
  rosterAssignments: RosterShiftAssignment[];

  // Attendance Domain & Biometric Punches
  attendanceRecords: AttendanceRecord[];
  attendancePunches: AttendancePunch[];
  regularizationRequests: RegularizationRequest[];

  // Leave & Overtime & Swap
  leaveTypes: LeaveType[];
  leaveBalances: LeaveBalance[];
  leaveRequests: LeaveRequest[];
  holidays: Holiday[];
  overtimeRecords: OvertimeRecord[];
  shiftSwapRequests: ShiftSwapRequest[];

  // Banquet / Events
  banquetEvents: BanquetEvent[];
  eventRequirements: EventStaffRequirement[];
  eventAssignments: EventStaffAssignment[];

  // TexaWave Extensions
  loans: LoanRecord[];
  bonusRecords: BonusRecord[];
  candidates: CandidateApplicant[];
  hrTickets: HrTicket[];
  expenseClaims: ExpenseClaim[];
  exitRequests: ExitRequest[];
  employeeTasks: EmployeeTask[];

  // User Role Switcher Action
  setCurrentRole: (role: UserRole) => void;

  // CRUD Actions
  addBusinessUnit: (bu: Omit<BusinessUnit, 'id'>) => void;
  updateBusinessUnit: (id: string, bu: Partial<BusinessUnit>) => void;
  deleteBusinessUnit: (id: string) => void;

  addLocation: (loc: Omit<Location, 'id'>) => void;
  updateLocation: (id: string, loc: Partial<Location>) => void;
  deleteLocation: (id: string) => void;

  addDepartment: (dept: Omit<Department, 'id'>) => void;
  updateDepartment: (id: string, dept: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;

  addRole: (role: Omit<Role, 'id'>) => void;
  updateRole: (id: string, role: Partial<Role>) => void;
  deleteRole: (id: string) => void;

  addEmployee: (empData: Partial<Employee>) => void;
  updateEmployee: (id: string, empData: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  updateEmployeeAssignment: (employeeId: string, newAssignment: Omit<EmployeeAssignment, 'id' | 'employeeId' | 'isCurrent'>) => void;

  addShift: (shift: Omit<ShiftMaster, 'id'>) => void;
  updateShift: (id: string, shift: Partial<ShiftMaster>) => void;
  deleteShift: (id: string) => void;

  addShiftTemplate: (tmpl: Omit<ShiftTemplate, 'id'>) => void;
  updateShiftTemplate: (id: string, tmpl: Partial<ShiftTemplate>) => void;
  deleteShiftTemplate: (id: string) => void;

  updateRosterAssignment: (employeeId: string, date: string, shiftId: string) => void;
  bulkApplyTemplateToRoster: (locationId: string, departmentId: string, monthYear: string, templateId: string) => void;
  publishRoster: (locationId: string, departmentId: string, monthYear: string) => void;

  simulateBiometricPunch: (employeeId: string, timestamp: string, punchType: 'IN' | 'OUT', photoUrl?: string) => void;
  submitRegularization: (req: Omit<RegularizationRequest, 'id' | 'status' | 'submittedAt'>) => void;
  approveRegularization: (requestId: string, approverName: string) => void;
  deleteAttendanceRecord: (id: string) => void;

  submitLeaveRequest: (req: Omit<LeaveRequest, 'id' | 'status' | 'submittedAt'>) => void;
  approveLeaveRequest: (requestId: string, approverName: string) => void;
  deleteLeaveRequest: (id: string) => void;
  addHoliday: (hol: Omit<Holiday, 'id'>) => void;
  updateHoliday: (id: string, hol: Partial<Holiday>) => void;
  deleteHoliday: (id: string) => void;

  approveOvertime: (recordId: string, approvedHours: number) => void;
  deleteOvertimeRecord: (id: string) => void;

  submitShiftSwap: (swap: Omit<ShiftSwapRequest, 'id' | 'targetAccepted' | 'managerStatus' | 'submittedAt'>) => void;
  approveShiftSwap: (swapId: string) => void;
  deleteShiftSwap: (id: string) => void;

  addBanquetEvent: (evt: Omit<BanquetEvent, 'id' | 'code'>) => void;
  updateBanquetEvent: (id: string, evt: Partial<BanquetEvent>) => void;
  deleteBanquetEvent: (id: string) => void;
  assignStaffToEvent: (eventId: string, requirementId: string, employeeId: string) => void;
  removeStaffFromEvent: (assignmentId: string) => void;

  issueLoan: (loan: Omit<LoanRecord, 'id' | 'recoveredAmount' | 'balanceAmount' | 'status' | 'sanctionedDate'>) => void;
  updateLoan: (id: string, loan: Partial<LoanRecord>) => void;
  deleteLoan: (id: string) => void;

  submitHrTicket: (ticket: Omit<HrTicket, 'id' | 'ticketCode' | 'status' | 'submittedAt'>) => void;
  resolveHrTicket: (ticketId: string, resolution: string) => void;
  deleteHrTicket: (id: string) => void;

  submitExpenseClaim: (claim: Omit<ExpenseClaim, 'id' | 'claimCode' | 'status'>) => void;
  approveExpenseClaim: (claimId: string, approvedAmount: number) => void;
  deleteExpenseClaim: (id: string) => void;

  submitExitRequest: (exitReq: Omit<ExitRequest, 'id' | 'status' | 'clearanceStatus'>) => void;
  approveExitRequest: (exitId: string) => void;
  deleteExitRequest: (id: string) => void;

  addCandidate: (candidate: Omit<CandidateApplicant, 'id' | 'stage'>) => void;
  updateCandidateStage: (candidateId: string, stage: CandidateApplicant['stage']) => void;
  deleteCandidate: (id: string) => void;

  logAudit: (module: AuditLog['module'], action: AuditLog['action'], recordId: string, title: string, prev?: string, nextVal?: string) => void;
}

const seedEmployees = generateSeedEmployees();

// Derived transactional sample data — mirrors the roster → attendance → regularization
// dependency chain a real deployment would have (roster is the source of truth for who was
// scheduled, attendance is computed against it, regularizations arise from its exceptions).
const seedRosterAssignments = generateRosterAssignments(seedEmployees, '2026-08');
const seedAttendanceRecords = generateAttendanceRecords(seedEmployees, seedRosterAssignments, '2026-08-21', '2026-08-30');
const seedRegularizationRequests = generateRegularizationRequests(seedAttendanceRecords);
const seedLeaveRequests = generateLeaveRequests(seedEmployees);
const seedOvertimeRecords = generateOvertimeRecords(seedEmployees);
const seedShiftSwapRequests = generateShiftSwapRequests(seedEmployees);
const seedLoans = generateLoans(seedEmployees);
const seedBonusRecords = generateBonusRecords(seedEmployees);
const seedCandidates = generateCandidates();
const seedHrTickets = generateHrTickets(seedEmployees);
const seedExpenseClaims = generateExpenseClaims(seedEmployees);
const seedExitRequests = generateExitRequests(seedEmployees);
const seedEmployeeTasks = generateEmployeeTasks(seedEmployees);
const seedEventRequirements: EventStaffRequirement[] = [
  { id: 'req-1', eventId: 'evt-1', roleId: 'role-6', requiredCount: 15, assignedCount: 2 },
  { id: 'req-2', eventId: 'evt-1', roleId: 'role-9', requiredCount: 2, assignedCount: 1 },
];
const seedEventAssignments = generateEventAssignments(seedEventRequirements, seedEmployees);
const seedAuditLogs = generateSeedAuditLogs();

export const useHRMSStore = create<HRMSState>((set, get) => ({
  isHydrated: false,

  // Initial State Hydration Function from Firebase
  initializeFromFirebase: async () => {
    if (get().isHydrated) return;

    try {
      const fbEmps = await firebaseDataService.fetchRecord('hr/employees');
      const fbBUs = await firebaseDataService.fetchRecord('hr/businessUnits');
      const fbLocs = await firebaseDataService.fetchRecord('hr/locations');
      const fbDepts = await firebaseDataService.fetchRecord('hr/departments');
      const fbRoles = await firebaseDataService.fetchRecord('hr/roles');
      const fbShifts = await firebaseDataService.fetchRecord('hr/shifts');
      const fbRosterAsgn = await firebaseDataService.fetchRecord('hr/rosterAssignments');
      const fbAttRecs = await firebaseDataService.fetchRecord('hr/attendanceRecords');
      const fbLoans = await firebaseDataService.fetchRecord('hr/loans');
      const fbTickets = await firebaseDataService.fetchRecord('hr/tickets');

      set({
        employees: fbEmps && fbEmps.length > 0 ? fbEmps : seedEmployees,
        businessUnits: fbBUs && fbBUs.length > 0 ? fbBUs : INITIAL_BUSINESS_UNITS,
        locations: fbLocs && fbLocs.length > 0 ? fbLocs : INITIAL_LOCATIONS,
        departments: fbDepts && fbDepts.length > 0 ? fbDepts : INITIAL_DEPARTMENTS,
        roles: fbRoles && fbRoles.length > 0 ? fbRoles : INITIAL_ROLES,
        shifts: fbShifts && fbShifts.length > 0 ? fbShifts : INITIAL_SHIFTS,
        rosterAssignments: fbRosterAsgn && fbRosterAsgn.length > 0 ? fbRosterAsgn : seedRosterAssignments,
        attendanceRecords: fbAttRecs && fbAttRecs.length > 0 ? fbAttRecs : seedAttendanceRecords,
        loans: fbLoans && fbLoans.length > 0 ? fbLoans : seedLoans,
        hrTickets: fbTickets && fbTickets.length > 0 ? fbTickets : seedHrTickets,
        isHydrated: true
      });
    } catch (e) {
      console.warn('Firebase hydration warning, using local state:', e);
      set({ isHydrated: true });
    }
  },

  organization: INITIAL_ORG,
  businessUnits: INITIAL_BUSINESS_UNITS,
  regions: INITIAL_REGIONS,
  locations: INITIAL_LOCATIONS,
  departments: INITIAL_DEPARTMENTS,
  roles: INITIAL_ROLES,
  costCenters: INITIAL_COST_CENTERS,
  currentRole: 'SUPER_ADMIN',
  auditLogs: seedAuditLogs,

  employees: seedEmployees,

  shifts: INITIAL_SHIFTS,
  shiftTemplates: INITIAL_SHIFT_TEMPLATES,
  rosters: [],
  rosterAssignments: seedRosterAssignments,

  attendanceRecords: seedAttendanceRecords,
  attendancePunches: [],
  regularizationRequests: seedRegularizationRequests,

  leaveTypes: INITIAL_LEAVE_TYPES,
  leaveBalances: seedEmployees.map(e => ({
    employeeId: e.id,
    leaveTypeId: 'lt-1',
    openingBalance: 12,
    allocated: 12,
    used: 2,
    pending: 1,
    available: 9
  })),
  leaveRequests: seedLeaveRequests,
  holidays: INITIAL_HOLIDAYS,
  overtimeRecords: seedOvertimeRecords,
  shiftSwapRequests: seedShiftSwapRequests,

  banquetEvents: INITIAL_BANQUET_EVENTS,
  eventRequirements: seedEventRequirements,
  eventAssignments: seedEventAssignments,

  loans: seedLoans,
  bonusRecords: seedBonusRecords,
  candidates: seedCandidates,
  hrTickets: seedHrTickets,
  expenseClaims: seedExpenseClaims,
  exitRequests: seedExitRequests,
  employeeTasks: seedEmployeeTasks,

  setCurrentRole: (role) => set({ currentRole: role }),

  logAudit: (module, action, recordId, title, prev, nextVal) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: 'usr-admin',
      userName: get().currentRole,
      userRole: get().currentRole,
      module,
      action,
      recordId,
      recordTitle: title,
      previousValue: prev,
      newValue: nextVal,
      ipAddress: '127.0.0.1'
    };
    set((state) => {
      const updatedLogs = [newLog, ...state.auditLogs];
      firebaseDataService.saveRecord('hr/auditLogs', updatedLogs);
      return { auditLogs: updatedLogs };
    });
  },

  // BUSINESS UNITS CRUD
  addBusinessUnit: (bu) => {
    const newBu: BusinessUnit = { ...bu, id: `bu-${Date.now()}` };
    set((state) => {
      const updated = [...state.businessUnits, newBu];
      firebaseDataService.saveRecord('hr/businessUnits', updated);
      return { businessUnits: updated };
    });
    get().logAudit('ORGANIZATION', 'CREATE', newBu.id, `Created BU: ${newBu.name}`);
  },
  updateBusinessUnit: (id, buData) => {
    set((state) => {
      const updated = state.businessUnits.map(b => b.id === id ? { ...b, ...buData } : b);
      firebaseDataService.saveRecord('hr/businessUnits', updated);
      return { businessUnits: updated };
    });
  },
  deleteBusinessUnit: (id) => {
    set((state) => {
      const updated = state.businessUnits.filter(b => b.id !== id);
      firebaseDataService.saveRecord('hr/businessUnits', updated);
      return { businessUnits: updated };
    });
  },

  // LOCATIONS CRUD
  addLocation: (loc) => {
    const newLoc: Location = { ...loc, id: `loc-${Date.now()}` };
    set((state) => {
      const updated = [...state.locations, newLoc];
      firebaseDataService.saveRecord('hr/locations', updated);
      return { locations: updated };
    });
    get().logAudit('ORGANIZATION', 'CREATE', newLoc.id, `Created Location: ${newLoc.name}`);
  },
  updateLocation: (id, locData) => {
    set((state) => {
      const updated = state.locations.map(l => l.id === id ? { ...l, ...locData } : l);
      firebaseDataService.saveRecord('hr/locations', updated);
      return { locations: updated };
    });
  },
  deleteLocation: (id) => {
    set((state) => {
      const updated = state.locations.filter(l => l.id !== id);
      firebaseDataService.saveRecord('hr/locations', updated);
      return { locations: updated };
    });
  },

  // DEPARTMENTS CRUD
  addDepartment: (dept) => {
    const newDept: Department = { ...dept, id: `dept-${Date.now()}` };
    set((state) => {
      const updated = [...state.departments, newDept];
      firebaseDataService.saveRecord('hr/departments', updated);
      return { departments: updated };
    });
    get().logAudit('ORGANIZATION', 'CREATE', newDept.id, `Created Dept: ${newDept.name}`);
  },
  updateDepartment: (id, deptData) => {
    set((state) => {
      const updated = state.departments.map(d => d.id === id ? { ...d, ...deptData } : d);
      firebaseDataService.saveRecord('hr/departments', updated);
      return { departments: updated };
    });
  },
  deleteDepartment: (id) => {
    set((state) => {
      const updated = state.departments.filter(d => d.id !== id);
      firebaseDataService.saveRecord('hr/departments', updated);
      return { departments: updated };
    });
  },

  // ROLES & DESIGNATIONS CRUD
  addRole: (role) => {
    const newRole: Role = { ...role, id: `role-${Date.now()}` };
    set((state) => {
      const updated = [...state.roles, newRole];
      firebaseDataService.saveRecord('hr/roles', updated);
      return { roles: updated };
    });
    get().logAudit('ORGANIZATION', 'CREATE', newRole.id, `Created Role: ${newRole.name}`);
  },
  updateRole: (id, roleData) => {
    set((state) => {
      const updated = state.roles.map(r => r.id === id ? { ...r, ...roleData } : r);
      firebaseDataService.saveRecord('hr/roles', updated);
      return { roles: updated };
    });
  },
  deleteRole: (id) => {
    set((state) => {
      const updated = state.roles.filter(r => r.id !== id);
      firebaseDataService.saveRecord('hr/roles', updated);
      return { roles: updated };
    });
  },

  // EMPLOYEES CRUD
  addEmployee: (empData) => {
    const id = `emp-${Date.now()}`;
    const empCode = `ND-${1000 + get().employees.length + 1}`;
    const assignment: EmployeeAssignment = {
      id: `asgn-${Date.now()}`,
      employeeId: id,
      businessUnitId: empData.currentAssignment?.businessUnitId || 'bu-1',
      locationId: empData.currentAssignment?.locationId || 'loc-1',
      departmentId: empData.currentAssignment?.departmentId || 'dept-1',
      roleId: empData.currentAssignment?.roleId || 'role-6',
      effectiveFrom: new Date().toISOString().substring(0, 10),
      isCurrent: true
    };

    const newEmp: Employee = {
      id,
      employeeCode: empCode,
      firstName: empData.firstName || 'New',
      lastName: empData.lastName || 'Employee',
      email: empData.email || `${empCode.toLowerCase()}@nandhinideluxe.com`,
      phone: empData.phone || '9845000000',
      gender: empData.gender || 'MALE',
      dateOfBirth: empData.dateOfBirth || '1995-01-01',
      joiningDate: empData.joiningDate || new Date().toISOString().substring(0, 10),
      employmentTypeId: empData.employmentTypeId || 'emp-type-1',
      status: empData.status || 'ACTIVE',
      currentAssignment: assignment,
      assignmentHistory: [assignment]
    };

    set((state) => {
      const updated = [...state.employees, newEmp];
      firebaseDataService.saveRecord('hr/employees', updated);
      return { employees: updated };
    });
    get().logAudit('EMPLOYEE', 'CREATE', id, `Added Employee: ${newEmp.firstName} ${newEmp.lastName}`);
  },
  updateEmployee: (id, empData) => {
    set((state) => {
      const updated = state.employees.map(e => e.id === id ? { ...e, ...empData } : e);
      firebaseDataService.saveRecord('hr/employees', updated);
      return { employees: updated };
    });
    get().logAudit('EMPLOYEE', 'UPDATE', id, `Updated Employee ID: ${id}`);
  },
  deleteEmployee: (id) => {
    set((state) => {
      const updated = state.employees.filter(e => e.id !== id);
      firebaseDataService.saveRecord('hr/employees', updated);
      return { employees: updated };
    });
    get().logAudit('EMPLOYEE', 'DELETE', id, `Deleted Employee ID: ${id}`);
  },
  updateEmployeeAssignment: (employeeId, newAsgnData) => {
    set((state) => {
      const updatedEmployees = state.employees.map((emp) => {
        if (emp.id !== employeeId) return emp;
        const updatedHistory = emp.assignmentHistory.map(a => 
          a.isCurrent ? { ...a, isCurrent: false, effectiveTo: newAsgnData.effectiveFrom } : a
        );
        const newAssignment: EmployeeAssignment = {
          ...newAsgnData,
          id: `asgn-${Date.now()}`,
          employeeId,
          isCurrent: true
        };
        return {
          ...emp,
          currentAssignment: newAssignment,
          assignmentHistory: [newAssignment, ...updatedHistory]
        };
      });
      firebaseDataService.saveRecord('hr/employees', updatedEmployees);
      return { employees: updatedEmployees };
    });
  },

  // SHIFTS CRUD
  addShift: (shiftData) => {
    const newShift: ShiftMaster = { ...shiftData, id: `shift-${Date.now()}` };
    set((state) => {
      const updated = [...state.shifts, newShift];
      firebaseDataService.saveRecord('hr/shifts', updated);
      return { shifts: updated };
    });
  },
  updateShift: (id, shiftData) => {
    set((state) => {
      const updated = state.shifts.map(s => s.id === id ? { ...s, ...shiftData } : s);
      firebaseDataService.saveRecord('hr/shifts', updated);
      return { shifts: updated };
    });
  },
  deleteShift: (id) => {
    set((state) => {
      const updated = state.shifts.filter(s => s.id !== id);
      firebaseDataService.saveRecord('hr/shifts', updated);
      return { shifts: updated };
    });
  },

  // SHIFT TEMPLATES CRUD
  addShiftTemplate: (tmpl) => {
    const newTmpl: ShiftTemplate = { ...tmpl, id: `tmpl-${Date.now()}` };
    set((state) => {
      const updated = [...state.shiftTemplates, newTmpl];
      firebaseDataService.saveRecord('hr/shiftTemplates', updated);
      return { shiftTemplates: updated };
    });
  },
  updateShiftTemplate: (id, tmplData) => {
    set((state) => {
      const updated = state.shiftTemplates.map(t => t.id === id ? { ...t, ...tmplData } : t);
      firebaseDataService.saveRecord('hr/shiftTemplates', updated);
      return { shiftTemplates: updated };
    });
  },
  deleteShiftTemplate: (id) => {
    set((state) => {
      const updated = state.shiftTemplates.filter(t => t.id !== id);
      firebaseDataService.saveRecord('hr/shiftTemplates', updated);
      return { shiftTemplates: updated };
    });
  },

  // ROSTER & PUNCHES
  updateRosterAssignment: (employeeId, date, shiftId) => {
    set((state) => {
      const existing = state.rosterAssignments.find(r => r.employeeId === employeeId && r.date === date);
      let updatedList: RosterShiftAssignment[];
      if (existing) {
        updatedList = state.rosterAssignments.map(r => 
          r.employeeId === employeeId && r.date === date ? { ...r, shiftId, isModifiedAfterPublish: true } : r
        );
      } else {
        updatedList = [...state.rosterAssignments, {
          id: `rasgn-${employeeId}-${date}`,
          rosterId: 'rst-1',
          employeeId,
          date,
          shiftId
        }];
      }
      firebaseDataService.saveRecord('hr/rosterAssignments', updatedList);
      return { rosterAssignments: updatedList };
    });
  },
  bulkApplyTemplateToRoster: (locationId, departmentId, monthYear, templateId) => {
    const template = get().shiftTemplates.find(t => t.id === templateId);
    if (!template) return;

    const targetEmployees = get().employees.filter(e => 
      e.status !== 'INACTIVE' && e.currentAssignment.locationId === locationId && e.currentAssignment.departmentId === departmentId
    );

    const [year, month] = monthYear.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    const newAssignments: RosterShiftAssignment[] = [];
    targetEmployees.forEach(emp => {
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${monthYear}-${day < 10 ? '0' + day : day}`;
        const dayOfWeek = new Date(dateStr).getDay();
        const templateDay = template.days.find(d => d.dayOfWeek === dayOfWeek);
        const shiftId = templateDay ? templateDay.shiftId : 'OFF';

        newAssignments.push({
          id: `rasgn-${emp.id}-${dateStr}`,
          rosterId: `rst-${locationId}-${departmentId}`,
          employeeId: emp.id,
          date: dateStr,
          shiftId: shiftId
        });
      }
    });

    set((state) => {
      const filtered = state.rosterAssignments.filter(ra => 
        !targetEmployees.some(te => te.id === ra.employeeId) || !ra.date.startsWith(monthYear)
      );
      const updated = [...filtered, ...newAssignments];
      firebaseDataService.saveRecord('hr/rosterAssignments', updated);
      return { rosterAssignments: updated };
    });
  },
  publishRoster: (locationId, departmentId, monthYear) => {
    set((state) => {
      const updatedRosters = state.rosters.map(r => 
        r.locationId === locationId && r.departmentId === departmentId && r.monthYear === monthYear
          ? { ...r, status: 'PUBLISHED' as const, publishedAt: new Date().toISOString() }
          : r
      );
      firebaseDataService.saveRecord('hr/rosters', updatedRosters);
      return { rosters: updatedRosters };
    });
  },

  simulateBiometricPunch: (employeeId, timestamp, punchType, photoUrl) => {
    const date = timestamp.substring(0, 10);
    const time = timestamp.substring(11, 16);

    const punch: AttendancePunch = {
      id: `p-${Date.now()}`,
      employeeId,
      timestamp,
      punchType,
      source: photoUrl ? 'WEB_CAMERA_VERIFIED' : 'SIMULATOR',
      photoUrl,
      isProcessed: true
    };

    set((state) => {
      const existingRec = state.attendanceRecords.find(r => r.employeeId === employeeId && r.date === date);
      let updatedRecs: AttendanceRecord[];

      if (existingRec) {
        const firstIn = punchType === 'IN' ? (existingRec.firstIn ? (time < existingRec.firstIn ? time : existingRec.firstIn) : time) : existingRec.firstIn;
        const lastOut = punchType === 'OUT' ? (existingRec.lastOut ? (time > existingRec.lastOut ? time : existingRec.lastOut) : time) : existingRec.lastOut;
        
        let workedHrs = existingRec.totalWorkedHours;
        let status: AttendanceRecord['status'] = existingRec.status;
        if (firstIn && lastOut) {
          const [inH, inM] = firstIn.split(':').map(Number);
          const [outH, outM] = lastOut.split(':').map(Number);
          workedHrs = Math.max(0, parseFloat(((outH + outM/60) - (inH + inM/60) - 0.5).toFixed(1)));
          status = 'PRESENT';
        }

        updatedRecs = state.attendanceRecords.map(r => 
          r.id === existingRec.id 
            ? { ...r, firstIn, lastOut, totalWorkedHours: workedHrs, status, hasMissingPunch: !(firstIn && lastOut), punches: [...r.punches, punch] }
            : r
        );
      } else {
        const newRec: AttendanceRecord = {
          id: `att-${date}-${employeeId}`,
          employeeId,
          date,
          scheduledShiftId: 'shift-m1',
          firstIn: punchType === 'IN' ? time : undefined,
          lastOut: punchType === 'OUT' ? time : undefined,
          totalWorkedHours: 0,
          breakDurationMins: 30,
          lateMins: 0,
          earlyExitMins: 0,
          otHours: 0,
          status: punchType === 'IN' ? 'PRESENT' : 'MISSING_PUNCH',
          hasMissingPunch: true,
          isRegularized: false,
          punches: [punch]
        };
        updatedRecs = [...state.attendanceRecords, newRec];
      }

      const updatedPunches = [punch, ...state.attendancePunches];
      firebaseDataService.saveRecord('hr/attendancePunches', updatedPunches);
      firebaseDataService.saveRecord('hr/attendanceRecords', updatedRecs);
      return { attendancePunches: updatedPunches, attendanceRecords: updatedRecs };
    });
  },

  submitRegularization: (req) => {
    const newReq: RegularizationRequest = {
      ...req,
      id: `reg-${Date.now()}`,
      status: 'PENDING',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    set((state) => {
      const updated = [newReq, ...state.regularizationRequests];
      firebaseDataService.saveRecord('hr/regularizations', updated);
      return { regularizationRequests: updated };
    });
  },
  approveRegularization: (requestId, approverName) => {
    const req = get().regularizationRequests.find(r => r.id === requestId);
    if (!req) return;

    set((state) => {
      const updatedRegs = state.regularizationRequests.map(r => 
        r.id === requestId ? { ...r, status: 'APPROVED' as const, approvedBy: approverName, approvedAt: new Date().toISOString() } : r
      );
      const updatedAtt = state.attendanceRecords.map(a => {
        if (a.id === req.attendanceRecordId || (a.employeeId === req.employeeId && a.date === req.date)) {
          const [inH, inM] = req.requestedInTime.split(':').map(Number);
          const [outH, outM] = req.requestedOutTime.split(':').map(Number);
          const workedHrs = Math.max(0, parseFloat(((outH + outM/60) - (inH + inM/60) - 0.5).toFixed(1)));
          return {
            ...a,
            firstIn: req.requestedInTime,
            lastOut: req.requestedOutTime,
            totalWorkedHours: workedHrs,
            status: 'PRESENT' as const,
            hasMissingPunch: false,
            isRegularized: true,
            regularizationId: requestId
          };
        }
        return a;
      });

      firebaseDataService.saveRecord('hr/regularizations', updatedRegs);
      firebaseDataService.saveRecord('hr/attendanceRecords', updatedAtt);
      return { regularizationRequests: updatedRegs, attendanceRecords: updatedAtt };
    });
  },
  deleteAttendanceRecord: (id) => {
    set((state) => {
      const updated = state.attendanceRecords.filter(a => a.id !== id);
      firebaseDataService.saveRecord('hr/attendanceRecords', updated);
      return { attendanceRecords: updated };
    });
  },

  submitLeaveRequest: (req) => {
    const newReq: LeaveRequest = {
      ...req,
      id: `lr-${Date.now()}`,
      status: 'PENDING',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    set((state) => {
      const updated = [newReq, ...state.leaveRequests];
      firebaseDataService.saveRecord('hr/leaves', updated);
      return { leaveRequests: updated };
    });
  },
  approveLeaveRequest: (requestId, approverName) => {
    set((state) => {
      const updatedLeaves = state.leaveRequests.map(r => 
        r.id === requestId ? { ...r, status: 'APPROVED' as const, approvedBy: approverName, approvedAt: new Date().toISOString() } : r
      );
      firebaseDataService.saveRecord('hr/leaves', updatedLeaves);
      return { leaveRequests: updatedLeaves };
    });
  },
  deleteLeaveRequest: (id) => {
    set((state) => {
      const updated = state.leaveRequests.filter(l => l.id !== id);
      firebaseDataService.saveRecord('hr/leaves', updated);
      return { leaveRequests: updated };
    });
  },

  addHoliday: (hol) => {
    const newHol: Holiday = { ...hol, id: `hol-${Date.now()}` };
    set((state) => {
      const updated = [...state.holidays, newHol];
      firebaseDataService.saveRecord('hr/holidays', updated);
      return { holidays: updated };
    });
  },
  updateHoliday: (id, holData) => {
    set((state) => {
      const updated = state.holidays.map(h => h.id === id ? { ...h, ...holData } : h);
      firebaseDataService.saveRecord('hr/holidays', updated);
      return { holidays: updated };
    });
  },
  deleteHoliday: (id) => {
    set((state) => {
      const updated = state.holidays.filter(h => h.id !== id);
      firebaseDataService.saveRecord('hr/holidays', updated);
      return { holidays: updated };
    });
  },

  approveOvertime: (recordId, approvedHours) => {
    set((state) => {
      const updatedOt = state.overtimeRecords.map(o => 
        o.id === recordId ? { ...o, approvedOtHours: approvedHours, status: 'APPROVED' as const, approvedBy: get().currentRole } : o
      );
      firebaseDataService.saveRecord('hr/overtime', updatedOt);
      return { overtimeRecords: updatedOt };
    });
  },
  deleteOvertimeRecord: (id) => {
    set((state) => {
      const updated = state.overtimeRecords.filter(o => o.id !== id);
      firebaseDataService.saveRecord('hr/overtime', updated);
      return { overtimeRecords: updated };
    });
  },

  submitShiftSwap: (swap) => {
    const newSwap: ShiftSwapRequest = {
      ...swap,
      id: `swap-${Date.now()}`,
      targetAccepted: true,
      managerStatus: 'PENDING',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    set((state) => {
      const updated = [newSwap, ...state.shiftSwapRequests];
      firebaseDataService.saveRecord('hr/shiftSwaps', updated);
      return { shiftSwapRequests: updated };
    });
  },
  approveShiftSwap: (swapId) => {
    set((state) => {
      const updatedSwaps = state.shiftSwapRequests.map(s => 
        s.id === swapId ? { ...s, managerStatus: 'APPROVED' as const, approvedBy: get().currentRole } : s
      );
      firebaseDataService.saveRecord('hr/shiftSwaps', updatedSwaps);
      return { shiftSwapRequests: updatedSwaps };
    });
  },
  deleteShiftSwap: (id) => {
    set((state) => {
      const updated = state.shiftSwapRequests.filter(s => s.id !== id);
      firebaseDataService.saveRecord('hr/shiftSwaps', updated);
      return { shiftSwapRequests: updated };
    });
  },

  addBanquetEvent: (evt) => {
    const newEvt: BanquetEvent = {
      ...evt,
      id: `evt-${Date.now()}`,
      code: `EVT-${Math.floor(1000 + Math.random() * 9000)}`
    };
    set((state) => {
      const updated = [...state.banquetEvents, newEvt];
      firebaseDataService.saveRecord('hr/banquetEvents', updated);
      return { banquetEvents: updated };
    });
  },
  updateBanquetEvent: (id, evtData) => {
    set((state) => {
      const updated = state.banquetEvents.map(e => e.id === id ? { ...e, ...evtData } : e);
      firebaseDataService.saveRecord('hr/banquetEvents', updated);
      return { banquetEvents: updated };
    });
  },
  deleteBanquetEvent: (id) => {
    set((state) => {
      const updated = state.banquetEvents.filter(e => e.id !== id);
      firebaseDataService.saveRecord('hr/banquetEvents', updated);
      return { banquetEvents: updated };
    });
  },
  assignStaffToEvent: (eventId, requirementId, employeeId) => {
    const newAsgn: EventStaffAssignment = {
      id: `easgn-${Date.now()}`,
      eventId,
      requirementId,
      employeeId,
      assignedAt: new Date().toISOString()
    };
    set((state) => {
      const updatedAsgn = [...state.eventAssignments, newAsgn];
      const updatedReqs = state.eventRequirements.map(r => 
        r.id === requirementId ? { ...r, assignedCount: r.assignedCount + 1 } : r
      );
      firebaseDataService.saveRecord('hr/eventAssignments', updatedAsgn);
      firebaseDataService.saveRecord('hr/eventRequirements', updatedReqs);
      return { eventAssignments: updatedAsgn, eventRequirements: updatedReqs };
    });
  },
  removeStaffFromEvent: (assignmentId) => {
    set((state) => {
      const updated = state.eventAssignments.filter(a => a.id !== assignmentId);
      firebaseDataService.saveRecord('hr/eventAssignments', updated);
      return { eventAssignments: updated };
    });
  },

  issueLoan: (loanData) => {
    const newLoan: LoanRecord = {
      ...loanData,
      id: `ln-${Date.now()}`,
      recoveredAmount: 0,
      balanceAmount: loanData.principalAmount,
      status: 'ACTIVE',
      sanctionedDate: new Date().toISOString().substring(0, 10)
    };
    set((state) => {
      const updated = [...state.loans, newLoan];
      firebaseDataService.saveRecord('hr/loans', updated);
      return { loans: updated };
    });
  },
  updateLoan: (id, loanData) => {
    set((state) => {
      const updated = state.loans.map(l => l.id === id ? { ...l, ...loanData } : l);
      firebaseDataService.saveRecord('hr/loans', updated);
      return { loans: updated };
    });
  },
  deleteLoan: (id) => {
    set((state) => {
      const updated = state.loans.filter(l => l.id !== id);
      firebaseDataService.saveRecord('hr/loans', updated);
      return { loans: updated };
    });
  },

  submitHrTicket: (tkt) => {
    const newTkt: HrTicket = {
      ...tkt,
      id: `tkt-${Date.now()}`,
      ticketCode: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'OPEN',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    set((state) => {
      const updated = [newTkt, ...state.hrTickets];
      firebaseDataService.saveRecord('hr/tickets', updated);
      return { hrTickets: updated };
    });
  },
  resolveHrTicket: (ticketId, resolution) => {
    set((state) => {
      const updated = state.hrTickets.map(t => 
        t.id === ticketId ? { ...t, status: 'RESOLVED' as const, resolutionNotes: resolution } : t
      );
      firebaseDataService.saveRecord('hr/tickets', updated);
      return { hrTickets: updated };
    });
  },
  deleteHrTicket: (id) => {
    set((state) => {
      const updated = state.hrTickets.filter(t => t.id !== id);
      firebaseDataService.saveRecord('hr/tickets', updated);
      return { hrTickets: updated };
    });
  },

  submitExpenseClaim: (claim) => {
    const newClaim: ExpenseClaim = {
      ...claim,
      id: `exp-${Date.now()}`,
      claimCode: `EXP-${Math.floor(100 + Math.random() * 900)}`,
      status: 'PENDING'
    };
    set((state) => {
      const updated = [...state.expenseClaims, newClaim];
      firebaseDataService.saveRecord('hr/expenses', updated);
      return { expenseClaims: updated };
    });
  },
  approveExpenseClaim: (claimId, approvedAmount) => {
    set((state) => {
      const updated = state.expenseClaims.map(c => 
        c.id === claimId ? { ...c, status: 'APPROVED' as const, approvedAmount } : c
      );
      firebaseDataService.saveRecord('hr/expenses', updated);
      return { expenseClaims: updated };
    });
  },
  deleteExpenseClaim: (id) => {
    set((state) => {
      const updated = state.expenseClaims.filter(c => c.id !== id);
      firebaseDataService.saveRecord('hr/expenses', updated);
      return { expenseClaims: updated };
    });
  },

  submitExitRequest: (req) => {
    const newExit: ExitRequest = {
      ...req,
      id: `exit-${Date.now()}`,
      status: 'NOTICE_PERIOD_ACTIVE',
      clearanceStatus: { deptManagerClearance: false, financeClearance: false, itAssetsClearance: false, hrClearance: false }
    };
    set((state) => {
      const updated = [...state.exitRequests, newExit];
      firebaseDataService.saveRecord('hr/exits', updated);
      return { exitRequests: updated };
    });
  },
  approveExitRequest: (exitId) => {
    set((state) => {
      const updated = state.exitRequests.map(e => 
        e.id === exitId ? { ...e, status: 'CLEARED_SETTLED' as const, clearanceStatus: { deptManagerClearance: true, financeClearance: true, itAssetsClearance: true, hrClearance: true } } : e
      );
      firebaseDataService.saveRecord('hr/exits', updated);
      return { exitRequests: updated };
    });
  },
  deleteExitRequest: (id) => {
    set((state) => {
      const updated = state.exitRequests.filter(e => e.id !== id);
      firebaseDataService.saveRecord('hr/exits', updated);
      return { exitRequests: updated };
    });
  },

  addCandidate: (cand) => {
    const newCand: CandidateApplicant = {
      ...cand,
      id: `cand-${Date.now()}`,
      stage: 'APPLIED'
    };
    set((state) => {
      const updated = [...state.candidates, newCand];
      firebaseDataService.saveRecord('hr/recruitment', updated);
      return { candidates: updated };
    });
  },
  updateCandidateStage: (candidateId, stage) => {
    set((state) => {
      const updated = state.candidates.map(c => c.id === candidateId ? { ...c, stage } : c);
      firebaseDataService.saveRecord('hr/recruitment', updated);
      return { candidates: updated };
    });
  },
  deleteCandidate: (id) => {
    set((state) => {
      const updated = state.candidates.filter(c => c.id !== id);
      firebaseDataService.saveRecord('hr/recruitment', updated);
      return { candidates: updated };
    });
  }
}));
