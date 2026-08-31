// Comprehensive realistic seed data for Nandhini Deluxe HRMS Demo

import { Organization, BusinessUnit, Location, Region, Department, Role, CostCenter, AuditLog, OutletFeatures } from '../types/erp-core';
import { EmploymentType, Employee } from '../types/employee';
import { ShiftMaster, ShiftTemplate } from '../types/shift-roster';
import { LeaveType, Holiday, BanquetEvent } from '../types/attendance-leave';

export const INITIAL_ORG: Organization = {
  id: 'org-1',
  code: 'ND-GROUP',
  name: 'Nandhini Deluxe Group of Restaurants & Hotels',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  createdDate: '2024-01-01',
};

export const INITIAL_BUSINESS_UNITS: BusinessUnit[] = [
  { id: 'bu-1', orgId: 'org-1', code: 'ND-REST', name: 'Nandhini Deluxe Restaurants', type: 'RESTAURANT', status: 'ACTIVE' },
  { id: 'bu-2', orgId: 'org-1', code: 'ND-HOTEL', name: 'Nandhini Deluxe Hotels & Banquets', type: 'HOTEL', status: 'ACTIVE' },
  { id: 'bu-3', orgId: 'org-1', code: 'ND-CK', name: 'Nandhini Central Kitchen & Logistics', type: 'CENTRAL_KITCHEN', status: 'ACTIVE' },
  { id: 'bu-4', orgId: 'org-1', code: 'ND-CORP', name: 'Nandhini Corporate Office', type: 'CORPORATE', status: 'ACTIVE' },
];

export const INITIAL_REGIONS: Region[] = [
  { id: 'reg-1', orgId: 'org-1', code: 'BLR', name: 'Bangalore', status: 'ACTIVE' },
];

const REST_FEATURES = (liquor: boolean): OutletFeatures => ({
  hasRestaurant: true, hasHotel: false, hasBanquet: false, hasLiquorSection: liquor, hasKitchen: true, hasInventoryStore: true,
});
const HOTEL_FEATURES: OutletFeatures = {
  hasRestaurant: true, hasHotel: true, hasBanquet: false, hasLiquorSection: true, hasKitchen: true, hasInventoryStore: true,
};
const HYBRID_HOTEL_BANQUET_FEATURES: OutletFeatures = {
  hasRestaurant: true, hasHotel: true, hasBanquet: true, hasLiquorSection: true, hasKitchen: true, hasInventoryStore: true,
};
const HYBRID_REST_BANQUET_FEATURES: OutletFeatures = {
  hasRestaurant: true, hasHotel: false, hasBanquet: true, hasLiquorSection: true, hasKitchen: true, hasInventoryStore: true,
};
const NON_OUTLET_FEATURES: OutletFeatures = {
  hasRestaurant: false, hasHotel: false, hasBanquet: false, hasLiquorSection: false, hasKitchen: false, hasInventoryStore: false,
};

// 16 outlets across Bangalore (RESTAURANT / HOTEL / BANQUET / HYBRID) + 1 Central Kitchen + 1 Corporate HQ (non-outlet).
export const INITIAL_LOCATIONS: Location[] = [
  { id: 'loc-1', businessUnitId: 'bu-1', regionId: 'reg-1', code: 'IND-REST', name: 'Indiranagar', city: 'Bengaluru', address: '100ft Road, Indiranagar', outletType: 'RESTAURANT', isOutlet: true, features: REST_FEATURES(true), openedDate: '2015-06-01', status: 'ACTIVE' },
  { id: 'loc-2', businessUnitId: 'bu-1', regionId: 'reg-1', code: 'KOR-REST', name: 'Koramangala', city: 'Bengaluru', address: '80ft Road, Koramangala 4th Block', outletType: 'RESTAURANT', isOutlet: true, features: REST_FEATURES(true), openedDate: '2016-02-14', status: 'ACTIVE' },
  { id: 'loc-3', businessUnitId: 'bu-2', regionId: 'reg-1', code: 'MTH-HOTEL', name: 'Marathahalli Hotel & Convention', city: 'Bengaluru', address: 'Outer Ring Road, Marathahalli', outletType: 'HYBRID', isOutlet: true, features: HYBRID_HOTEL_BANQUET_FEATURES, openedDate: '2014-11-20', status: 'ACTIVE' },
  { id: 'loc-4', businessUnitId: 'bu-2', regionId: 'reg-1', code: 'BG-HOTEL', name: 'Bannerghatta Hotel', city: 'Bengaluru', address: 'Bannerghatta Main Road', outletType: 'HOTEL', isOutlet: true, features: HOTEL_FEATURES, openedDate: '2018-08-09', status: 'ACTIVE' },
  { id: 'loc-5', businessUnitId: 'bu-3', regionId: 'reg-1', code: 'PEEN-CK', name: 'Peenya Central Kitchen Hub', city: 'Bengaluru', address: 'Peenya Industrial Area Stage 2', outletType: 'CENTRAL_KITCHEN', isOutlet: false, features: { ...NON_OUTLET_FEATURES, hasKitchen: true, hasInventoryStore: true }, status: 'ACTIVE' },
  { id: 'loc-6', businessUnitId: 'bu-4', regionId: 'reg-1', code: 'JAY-CORP', name: 'Jayanagar Corporate HQ', city: 'Bengaluru', address: '4th T Block, Jayanagar', outletType: 'CORPORATE', isOutlet: false, features: NON_OUTLET_FEATURES, status: 'ACTIVE' },
  { id: 'loc-7', businessUnitId: 'bu-1', regionId: 'reg-1', code: 'JAY-REST', name: 'Jayanagar', city: 'Bengaluru', address: '4th Block, Jayanagar', outletType: 'RESTAURANT', isOutlet: true, features: REST_FEATURES(true), openedDate: '2013-01-10', status: 'ACTIVE' },
  { id: 'loc-8', businessUnitId: 'bu-1', regionId: 'reg-1', code: 'RAJ-REST', name: 'Rajajinagar', city: 'Bengaluru', address: 'Dr Rajkumar Road, Rajajinagar', outletType: 'RESTAURANT', isOutlet: true, features: REST_FEATURES(false), openedDate: '2017-04-22', status: 'ACTIVE' },
  { id: 'loc-9', businessUnitId: 'bu-1', regionId: 'reg-1', code: 'JPN-REST', name: 'JP Nagar', city: 'Bengaluru', address: '24th Main, JP Nagar 6th Phase', outletType: 'RESTAURANT', isOutlet: true, features: REST_FEATURES(true), openedDate: '2019-03-18', status: 'ACTIVE' },
  { id: 'loc-10', businessUnitId: 'bu-1', regionId: 'reg-1', code: 'WF-HYB', name: 'Whitefield', city: 'Bengaluru', address: 'ITPL Main Road, Whitefield', outletType: 'HYBRID', isOutlet: true, features: HYBRID_REST_BANQUET_FEATURES, openedDate: '2020-09-05', status: 'ACTIVE' },
  { id: 'loc-11', businessUnitId: 'bu-1', regionId: 'reg-1', code: 'MAL-REST', name: 'Malleshwaram', city: 'Bengaluru', address: 'Sampige Road, Malleshwaram', outletType: 'RESTAURANT', isOutlet: true, features: REST_FEATURES(false), openedDate: '2012-07-15', status: 'ACTIVE' },
  { id: 'loc-12', businessUnitId: 'bu-1', regionId: 'reg-1', code: 'HSR-REST', name: 'HSR Layout', city: 'Bengaluru', address: '27th Main, HSR Layout Sector 2', outletType: 'RESTAURANT', isOutlet: true, features: REST_FEATURES(true), openedDate: '2021-01-11', status: 'ACTIVE' },
  { id: 'loc-13', businessUnitId: 'bu-1', regionId: 'reg-1', code: 'BAN-REST', name: 'Banashankari', city: 'Bengaluru', address: 'Kumaraswamy Layout Main Road, Banashankari', outletType: 'RESTAURANT', isOutlet: true, features: REST_FEATURES(false), openedDate: '2016-10-02', status: 'ACTIVE' },
  { id: 'loc-14', businessUnitId: 'bu-1', regionId: 'reg-1', code: 'YEL-REST', name: 'Yelahanka', city: 'Bengaluru', address: 'Bengaluru International Airport Road, Yelahanka', outletType: 'RESTAURANT', isOutlet: true, features: REST_FEATURES(false), openedDate: '2022-05-30', status: 'ACTIVE' },
  { id: 'loc-15', businessUnitId: 'bu-1', regionId: 'reg-1', code: 'ECY-REST', name: 'Electronic City', city: 'Bengaluru', address: 'Hosur Road, Electronic City Phase 1', outletType: 'RESTAURANT', isOutlet: true, features: REST_FEATURES(true), openedDate: '2018-12-01', status: 'ACTIVE' },
  { id: 'loc-16', businessUnitId: 'bu-2', regionId: 'reg-1', code: 'HEB-HYB', name: 'Hebbal', city: 'Bengaluru', address: 'Bellary Road, Hebbal', outletType: 'HYBRID', isOutlet: true, features: HYBRID_HOTEL_BANQUET_FEATURES, openedDate: '2023-02-14', status: 'ACTIVE' },
  { id: 'loc-17', businessUnitId: 'bu-1', regionId: 'reg-1', code: 'BTM-REST', name: 'BTM Layout', city: 'Bengaluru', address: '29th Main, BTM Layout 2nd Stage', outletType: 'RESTAURANT', isOutlet: true, features: REST_FEATURES(false), status: 'ACTIVE' },
  { id: 'loc-18', businessUnitId: 'bu-1', regionId: 'reg-1', code: 'SJP-REST', name: 'Sarjapur Road', city: 'Bengaluru', address: 'Sarjapur Main Road, near Wipro Circle', outletType: 'RESTAURANT', isOutlet: true, features: REST_FEATURES(true), status: 'ACTIVE' },
];

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-1', code: 'FNB-SERV', name: 'Food & Beverage Service', status: 'ACTIVE' },
  { id: 'dept-2', code: 'KITCHEN', name: 'Culinary & Kitchen Production', status: 'ACTIVE' },
  { id: 'dept-3', code: 'FRONT-OFF', name: 'Front Desk & Guest Relations', status: 'ACTIVE' },
  { id: 'dept-4', code: 'HOUSEKEEP', name: 'Housekeeping & Facility Care', status: 'ACTIVE' },
  { id: 'dept-5', code: 'BANQUET', name: 'Banquet & Event Operations', status: 'ACTIVE' },
  { id: 'dept-6', code: 'HR-ADMIN', name: 'Human Resources & Administration', status: 'ACTIVE' },
  { id: 'dept-7', code: 'FINANCE', name: 'Accounts & Finance', status: 'ACTIVE' },
  { id: 'dept-8', code: 'SECURITY', name: 'Loss Prevention & Security', status: 'ACTIVE' },
];

export const INITIAL_ROLES: Role[] = [
  { id: 'role-1', code: 'GM-OPS', name: 'General Manager Operations', category: 'MANAGEMENT', status: 'ACTIVE' },
  { id: 'role-2', code: 'REST-MGR', name: 'Restaurant Manager', category: 'MANAGEMENT', status: 'ACTIVE' },
  { id: 'role-3', code: 'HEAD-CHEF', name: 'Executive Head Chef', category: 'KITCHEN', status: 'ACTIVE' },
  { id: 'role-4', code: 'SOUS-CHEF', name: 'Sous Chef / Line Cook', category: 'KITCHEN', status: 'ACTIVE' },
  { id: 'role-5', code: 'CAPTAIN', name: 'Table Captain / Steward Lead', category: 'SERVICE', status: 'ACTIVE' },
  { id: 'role-6', code: 'WAITER', name: 'F&B Steward / Waiter', category: 'SERVICE', status: 'ACTIVE' },
  { id: 'role-7', code: 'FRONT-EXE', name: 'Front Desk Executive', category: 'OPERATIONS', status: 'ACTIVE' },
  { id: 'role-8', code: 'HK-ATTEND', name: 'Housekeeping Attendant', category: 'OPERATIONS', status: 'ACTIVE' },
  { id: 'role-9', code: 'BANQ-SUP', name: 'Banquet Supervisor', category: 'OPERATIONS', status: 'ACTIVE' },
  { id: 'role-10', code: 'HR-EXEC', name: 'HR Operations Executive', category: 'ADMIN', status: 'ACTIVE' },
  { id: 'role-11', code: 'SEC-OFF', name: 'Security Officer', category: 'SUPPORT', status: 'ACTIVE' },
];

export const INITIAL_COST_CENTERS: CostCenter[] = [
  { id: 'cc-1', businessUnitId: 'bu-1', code: 'CC-REST-OPS', name: 'Restaurant Dining Operations', budgetAllocated: 5000000, status: 'ACTIVE' },
  { id: 'cc-2', businessUnitId: 'bu-2', code: 'CC-HOTEL-ROOMS', name: 'Lodging & Housekeeping', budgetAllocated: 8000000, status: 'ACTIVE' },
  { id: 'cc-3', businessUnitId: 'bu-2', code: 'CC-BANQ-EVENTS', name: 'Banquet Event Services', budgetAllocated: 3500000, status: 'ACTIVE' },
  { id: 'cc-4', businessUnitId: 'bu-3', code: 'CC-CENTRAL-KITCHEN', name: 'Central Food Prep & Distribution', budgetAllocated: 6000000, status: 'ACTIVE' },
];

export const INITIAL_EMPLOYMENT_TYPES: EmploymentType[] = [
  { id: 'emp-type-1', code: 'PERM-FULL', name: 'Permanent Full-Time', category: 'PERMANENT', noticePeriodDays: 30, probationDays: 90, status: 'ACTIVE' },
  { id: 'emp-type-2', code: 'PROBATION', name: 'Probationary Employee', category: 'PROBATION', noticePeriodDays: 15, probationDays: 180, status: 'ACTIVE' },
  { id: 'emp-type-3', code: 'CONTRACT', name: 'Contract Staff', category: 'CONTRACT', noticePeriodDays: 7, probationDays: 0, status: 'ACTIVE' },
  { id: 'emp-type-4', code: 'BANQ-PART', name: 'Banquet Casual / On-Demand', category: 'PART_TIME', noticePeriodDays: 0, probationDays: 0, status: 'ACTIVE' },
];

export const INITIAL_SHIFTS: ShiftMaster[] = [
  {
    id: 'shift-m1',
    code: 'M1',
    name: 'Morning Service Shift',
    startTime: '07:00',
    endTime: '15:30',
    isCrossMidnight: false,
    totalShiftHours: 8.5,
    colorCode: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    breaks: [{ id: 'b1', name: 'Breakfast & Tea', startTime: '10:00', endTime: '10:30', durationMins: 30, isPaid: true }],
    rules: { lateArrivalGraceMins: 15, earlyExitGraceMins: 10, maxLateOccurrencesPerMonth: 3, minHoursForHalfDay: 4, minHoursForFullDay: 8, otEligibility: true, minOtDurationMins: 60, maxOtHoursPerDay: 4, roundingMins: 15, missingPunchHandling: 'AUTO_REGULARIZATION_REQUIRED' },
    status: 'ACTIVE'
  },
  {
    id: 'shift-e1',
    code: 'E1',
    name: 'Evening Dining Shift',
    startTime: '15:00',
    endTime: '23:30',
    isCrossMidnight: false,
    totalShiftHours: 8.5,
    colorCode: 'bg-amber-50 text-amber-700 border-amber-300',
    breaks: [{ id: 'b2', name: 'Dinner Break', startTime: '19:30', endTime: '20:15', durationMins: 45, isPaid: true }],
    rules: { lateArrivalGraceMins: 15, earlyExitGraceMins: 10, maxLateOccurrencesPerMonth: 3, minHoursForHalfDay: 4, minHoursForFullDay: 8, otEligibility: true, minOtDurationMins: 60, maxOtHoursPerDay: 4, roundingMins: 15, missingPunchHandling: 'AUTO_REGULARIZATION_REQUIRED' },
    status: 'ACTIVE'
  },
  {
    id: 'shift-n1',
    code: 'N1',
    name: 'Night Hotel / Security Shift',
    startTime: '23:00',
    endTime: '07:30',
    isCrossMidnight: true,
    totalShiftHours: 8.5,
    colorCode: 'bg-indigo-50 text-indigo-700 border-indigo-300',
    breaks: [{ id: 'b3', name: 'Night Break', startTime: '03:00', endTime: '03:30', durationMins: 30, isPaid: true }],
    rules: { lateArrivalGraceMins: 15, earlyExitGraceMins: 10, maxLateOccurrencesPerMonth: 3, minHoursForHalfDay: 4, minHoursForFullDay: 8, otEligibility: true, minOtDurationMins: 60, maxOtHoursPerDay: 4, roundingMins: 15, missingPunchHandling: 'MARK_ABSENT' },
    status: 'ACTIVE'
  },
  {
    id: 'shift-g1',
    code: 'G1',
    name: 'General Corporate Shift',
    startTime: '09:30',
    endTime: '18:00',
    isCrossMidnight: false,
    totalShiftHours: 8.5,
    colorCode: 'bg-blue-50 text-blue-700 border-blue-300',
    breaks: [{ id: 'b4', name: 'Lunch Break', startTime: '13:00', endTime: '14:00', durationMins: 60, isPaid: true }],
    rules: { lateArrivalGraceMins: 15, earlyExitGraceMins: 15, maxLateOccurrencesPerMonth: 3, minHoursForHalfDay: 4, minHoursForFullDay: 8, otEligibility: false, minOtDurationMins: 0, maxOtHoursPerDay: 0, roundingMins: 15, missingPunchHandling: 'AUTO_REGULARIZATION_REQUIRED' },
    status: 'ACTIVE'
  },
  {
    id: 'shift-sp1',
    code: 'SP1',
    name: 'Restaurant Split Shift (Lunch & Dinner)',
    startTime: '11:00',
    endTime: '23:00',
    isCrossMidnight: false,
    totalShiftHours: 12.0,
    colorCode: 'bg-purple-50 text-purple-700 border-purple-300',
    breaks: [{ id: 'b5', name: 'Afternoon Break', startTime: '15:30', endTime: '18:30', durationMins: 180, isPaid: false }],
    rules: { lateArrivalGraceMins: 15, earlyExitGraceMins: 10, maxLateOccurrencesPerMonth: 3, minHoursForHalfDay: 5, minHoursForFullDay: 9, otEligibility: true, minOtDurationMins: 60, maxOtHoursPerDay: 4, roundingMins: 15, missingPunchHandling: 'AUTO_REGULARIZATION_REQUIRED' },
    status: 'ACTIVE'
  }
];

export const INITIAL_SHIFT_TEMPLATES: ShiftTemplate[] = [
  {
    id: 'tmpl-1',
    code: 'TMPL-REST-MORN',
    name: 'Restaurant Morning Rotation (Mon-Sat, Sun Off)',
    days: [
      { dayOfWeek: 1, shiftId: 'shift-m1' },
      { dayOfWeek: 2, shiftId: 'shift-m1' },
      { dayOfWeek: 3, shiftId: 'shift-m1' },
      { dayOfWeek: 4, shiftId: 'shift-m1' },
      { dayOfWeek: 5, shiftId: 'shift-m1' },
      { dayOfWeek: 6, shiftId: 'shift-m1' },
      { dayOfWeek: 0, shiftId: 'OFF' },
    ],
    status: 'ACTIVE'
  },
  {
    id: 'tmpl-2',
    code: 'TMPL-REST-EVE',
    name: 'Restaurant Evening Rotation (Tue-Sun, Mon Off)',
    days: [
      { dayOfWeek: 1, shiftId: 'OFF' },
      { dayOfWeek: 2, shiftId: 'shift-e1' },
      { dayOfWeek: 3, shiftId: 'shift-e1' },
      { dayOfWeek: 4, shiftId: 'shift-e1' },
      { dayOfWeek: 5, shiftId: 'shift-e1' },
      { dayOfWeek: 6, shiftId: 'shift-e1' },
      { dayOfWeek: 0, shiftId: 'shift-e1' },
    ],
    status: 'ACTIVE'
  }
];

export const INITIAL_LEAVE_TYPES: LeaveType[] = [
  { id: 'lt-1', code: 'CL', name: 'Casual Leave', annualAllocation: 12, isCarryForward: false, maxCarryForwardDays: 0, paidType: 'PAID' },
  { id: 'lt-2', code: 'SL', name: 'Sick Leave', annualAllocation: 12, isCarryForward: true, maxCarryForwardDays: 6, paidType: 'PAID' },
  { id: 'lt-3', code: 'EL', name: 'Earned / Privilege Leave', annualAllocation: 15, isCarryForward: true, maxCarryForwardDays: 30, paidType: 'PAID' },
  { id: 'lt-4', code: 'LOP', name: 'Loss of Pay / Unpaid', annualAllocation: 0, isCarryForward: false, maxCarryForwardDays: 0, paidType: 'UNPAID' },
  { id: 'lt-5', code: 'COMP', name: 'Compensatory Off', annualAllocation: 0, isCarryForward: false, maxCarryForwardDays: 0, paidType: 'PAID' },
];

export const INITIAL_HOLIDAYS: Holiday[] = [
  { id: 'hol-1', name: 'Republic Day', date: '2026-01-26', type: 'NATIONAL', applicableLocationIds: [], isRestricted: false, status: 'ACTIVE' },
  { id: 'hol-2', name: 'Ugadi / Kannada New Year', date: '2026-03-19', type: 'FESTIVAL', applicableLocationIds: [], isRestricted: false, status: 'ACTIVE' },
  { id: 'hol-3', name: 'May Day / Labor Day', date: '2026-05-01', type: 'NATIONAL', applicableLocationIds: [], isRestricted: false, status: 'ACTIVE' },
  { id: 'hol-4', name: 'Independence Day', date: '2026-08-15', type: 'NATIONAL', applicableLocationIds: [], isRestricted: false, status: 'ACTIVE' },
  { id: 'hol-5', name: 'Ganesh Chaturthi', date: '2026-09-14', type: 'FESTIVAL', applicableLocationIds: [], isRestricted: false, status: 'ACTIVE' },
  { id: 'hol-6', name: 'Ayudha Pooja / Dasara', date: '2026-10-20', type: 'FESTIVAL', applicableLocationIds: [], isRestricted: false, status: 'ACTIVE' },
  { id: 'hol-7', name: 'Kannada Rajyotsava', date: '2026-11-01', type: 'FESTIVAL', applicableLocationIds: [], isRestricted: false, status: 'ACTIVE' },
  { id: 'hol-8', name: 'Deepavali', date: '2026-11-08', type: 'FESTIVAL', applicableLocationIds: [], isRestricted: false, status: 'ACTIVE' },
];

export const INITIAL_BANQUET_EVENTS: BanquetEvent[] = [
  {
    id: 'evt-1',
    code: 'EVT-2026-0801',
    name: 'Reddy Family Wedding Reception',
    locationId: 'loc-3', // Marathahalli Hotel
    eventDate: '2026-08-28',
    startTime: '18:00',
    endTime: '23:30',
    expectedGuests: 450,
    status: 'UPCOMING',
    notes: 'Grand Buffet with South Indian & North Indian Live Counters.'
  },
  {
    id: 'evt-2',
    code: 'EVT-2026-0802',
    name: 'Tech Mahindra Annual Leadership Dinner',
    locationId: 'loc-4', // Bannerghatta Hotel
    eventDate: '2026-08-29',
    startTime: '19:00',
    endTime: '23:00',
    expectedGuests: 180,
    status: 'UPCOMING',
    notes: 'VIP plated service required for top table.'
  }
];

// Helper to generate 35 Realistic Employees
export function generateSeedEmployees(): Employee[] {
  const firstNames = ['Ramesh', 'Suresh', 'Venkatesh', 'Anitha', 'Kavitha', 'Prakash', 'Sunil', 'Manjunath', 'Deepak', 'Vijay', 'Lakshmi', 'Nandini', 'Rajesh', 'Ganesh', 'Karthik', 'Swathi', 'Pooja', 'Mahesh', 'Sanjay', 'Preeti', 'Basavaraj', 'Shruti', 'Raghavendra', 'Dhananjay', 'Chethan', 'Divya', 'Mohan', 'Arun', 'Naveen', 'Roopa', 'Girish', 'Bhavya', 'Harish', 'Kiran', 'Sowmya'];
  const lastNames = ['Gowda', 'Kumar', 'Reddy', 'Rao', 'Shetty', 'Patil', 'Murthy', 'Nair', 'Hegde', 'Joshi', 'Naidu', 'Bhat', 'Prasad', 'Desai', 'Kulkarni'];
  
  const employees: Employee[] = [];
  
  for (let i = 1; i <= 35; i++) {
    const fn = firstNames[(i - 1) % firstNames.length];
    const ln = lastNames[(i - 1) % lastNames.length];
    const empCode = `ND-${1000 + i}`;
    
    // Distribute across locations & departments realistically
    let buId = 'bu-1';
    let locId = 'loc-1';
    let deptId = 'dept-1';
    let roleId = 'role-6'; // Waiter default
    
    if (i <= 8) {
      buId = 'bu-1'; locId = 'loc-1'; // Indiranagar Rest
      deptId = i <= 2 ? 'dept-2' : 'dept-1';
      roleId = i === 1 ? 'role-2' : (i === 2 ? 'role-3' : (i === 3 ? 'role-5' : 'role-6'));
    } else if (i <= 16) {
      buId = 'bu-1'; locId = 'loc-2'; // Koramangala Rest
      deptId = i <= 10 ? 'dept-2' : 'dept-1';
      roleId = i === 9 ? 'role-2' : (i === 10 ? 'role-4' : (i === 11 ? 'role-5' : 'role-6'));
    } else if (i <= 25) {
      buId = 'bu-2'; locId = 'loc-3'; // Marathahalli Hotel & Banquet
      deptId = i <= 20 ? 'dept-5' : (i <= 23 ? 'dept-3' : 'dept-4');
      roleId = i === 17 ? 'role-9' : (i <= 20 ? 'role-6' : (i <= 23 ? 'role-7' : 'role-8'));
    } else if (i <= 30) {
      buId = 'bu-3'; locId = 'loc-5'; // Central Kitchen
      deptId = 'dept-2';
      roleId = i === 26 ? 'role-3' : 'role-4';
    } else {
      buId = 'bu-4'; locId = 'loc-6'; // Corporate HQ
      deptId = i <= 33 ? 'dept-6' : 'dept-7';
      roleId = i === 31 ? 'role-10' : 'role-1';
    }

    const assignment = {
      id: `asgn-${i}`,
      employeeId: `emp-${i}`,
      businessUnitId: buId,
      locationId: locId,
      departmentId: deptId,
      roleId: roleId,
      effectiveFrom: '2024-01-01',
      isCurrent: true
    };

    employees.push({
      id: `emp-${i}`,
      employeeCode: empCode,
      firstName: fn,
      lastName: ln,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@nandhinideluxe.com`,
      phone: `98450${10000 + i}`,
      gender: i % 4 === 0 ? 'FEMALE' : 'MALE',
      dateOfBirth: `199${(i % 9)}-0${((i % 8) + 1)}-15`,
      joiningDate: `2023-0${(i % 8) + 1}-10`,
      employmentTypeId: i % 6 === 0 ? 'emp-type-2' : 'emp-type-1',
      emergencyContactName: `Spouse/Parent of ${fn}`,
      emergencyContactPhone: `99000${20000 + i}`,
      address: `Bengaluru, Karnataka`,
      status: 'ACTIVE',
      currentAssignment: assignment,
      assignmentHistory: [assignment]
    });
  }

  return employees;
}

