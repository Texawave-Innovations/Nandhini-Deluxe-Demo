'use client';

import React from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { 
  Users, UserCheck, UserX, Clock, CalendarX, AlertTriangle, CheckCircle, 
  ArrowUpRight, TrendingUp, AlertCircle, Building, MapPin, Sparkles, ChevronRight, Zap
} from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';
import Link from 'next/link';

export default function DashboardPage() {
  const { 
    employees, attendanceRecords, regularizationRequests, leaveRequests, 
    overtimeRecords, locations, departments, currentRole, approveRegularization, approveLeaveRequest 
  } = useHRMSStore();

  const totalEmp = employees.length;
  const presentToday = attendanceRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
  const absentToday = attendanceRecords.filter(r => r.status === 'ABSENT').length;
  const onLeaveToday = attendanceRecords.filter(r => r.status === 'ON_LEAVE').length;
  const lateToday = attendanceRecords.filter(r => r.status === 'LATE').length;
  const missingPunchToday = attendanceRecords.filter(r => r.hasMissingPunch).length;
  const otTodayCount = attendanceRecords.filter(r => r.otHours > 0).length;

  const pendingRegs = regularizationRequests.filter(r => r.status === 'PENDING');
  const pendingLeaves = leaveRequests.filter(l => l.status === 'PENDING');

  return (
    <ShellLayout>
      <div className="space-y-6">
        {/* Page Banner & Quick Workflow Story Guide */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-lg p-5 shadow border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-amber-500/20 text-amber-400 text-[11px] font-bold px-2 py-0.5 rounded border border-amber-500/30 uppercase tracking-wider">
                Phase 1 HRMS Live Demo
              </span>
              <span className="text-xs text-slate-400">| Nandhini Deluxe Group ERP</span>
            </div>
            <h1 className="text-xl font-bold mt-1 text-white">Executive HRMS & Operations Command Dashboard</h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Real-time attendance processing, shift roster integrity, exception regularizations, and manpower tracking across all units.
            </p>
          </div>

          {/* Workflow Story Quick Navigation */}
          <div className="mt-4 md:mt-0 flex items-center space-x-2 bg-slate-950/80 p-2 rounded border border-slate-800">
            <span className="text-[11px] font-semibold text-amber-400 px-2">Demo Flow:</span>
            <Link href="/organization/locations" className="text-xs text-slate-300 hover:text-white underline">Org</Link>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <Link href="/employees" className="text-xs text-slate-300 hover:text-white underline">Employees</Link>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <Link href="/roster/monthly" className="text-xs text-slate-300 hover:text-white underline">Roster</Link>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <Link href="/attendance/today" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline">Punches</Link>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <Link href="/reports" className="text-xs text-slate-300 hover:text-white underline">Reports</Link>
          </div>
        </div>

        {/* Top Operational KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
            <div className="text-slate-500 text-[11px] font-medium flex justify-between items-center">
              Total Workforce
              <Users className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1">{totalEmp}</div>
            <div className="text-[10px] text-emerald-600 font-medium mt-0.5">3 Business Units</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
            <div className="text-slate-500 text-[11px] font-medium flex justify-between items-center">
              Present Today
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-xl font-bold text-emerald-700 mt-1">{presentToday}</div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">{((presentToday/totalEmp)*100).toFixed(0)}% Turnout</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
            <div className="text-slate-500 text-[11px] font-medium flex justify-between items-center">
              Absent Today
              <UserX className="w-3.5 h-3.5 text-red-600" />
            </div>
            <div className="text-xl font-bold text-red-700 mt-1">{absentToday}</div>
            <div className="text-[10px] text-red-500 font-medium mt-0.5">Unscheduled</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
            <div className="text-slate-500 text-[11px] font-medium flex justify-between items-center">
              On Leave
              <CalendarX className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-xl font-bold text-amber-700 mt-1">{onLeaveToday}</div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">Approved</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
            <div className="text-slate-500 text-[11px] font-medium flex justify-between items-center">
              Late Arrivals
              <Clock className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="text-xl font-bold text-purple-700 mt-1">{lateToday}</div>
            <div className="text-[10px] text-purple-600 font-medium mt-0.5">&gt;15 min grace</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
            <div className="text-slate-500 text-[11px] font-medium flex justify-between items-center">
              Missing Punch
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-bold text-amber-600 mt-1">{missingPunchToday}</div>
            <div className="text-[10px] text-amber-600 font-medium mt-0.5">Needs Action</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
            <div className="text-slate-500 text-[11px] font-medium flex justify-between items-center">
              OT Workers
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-xl font-bold text-indigo-700 mt-1">{otTodayCount}</div>
            <div className="text-[10px] text-indigo-600 font-medium mt-0.5">Extra Hours</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
            <div className="text-slate-500 text-[11px] font-medium flex justify-between items-center">
              Pending Action
              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
            </div>
            <div className="text-xl font-bold text-red-600 mt-1">{pendingRegs.length + pendingLeaves.length}</div>
            <div className="text-[10px] text-red-500 font-medium mt-0.5">Approvals</div>
          </div>
        </div>

        {/* Central Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Live Location Staffing & Attendance Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Location Wise Staffing Card */}
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    Live Location Staffing Status
                  </h2>
                  <p className="text-xs text-slate-500">Real-time attendance vs required staffing per unit</p>
                </div>
                <Link href="/roster/manpower-planning" className="text-xs text-blue-600 font-semibold hover:underline">
                  View Manpower Plan →
                </Link>
              </div>

              <div className="space-y-3">
                {locations.slice(0, 4).map(loc => {
                  const locEmps = employees.filter(e => e.currentAssignment.locationId === loc.id);
                  const locPresent = attendanceRecords.filter(a => 
                    locEmps.some(e => e.id === a.employeeId) && (a.status === 'PRESENT' || a.status === 'LATE')
                  ).length;
                  const reqCount = locEmps.length;
                  const pct = Math.round((locPresent / Math.max(1, reqCount)) * 100);

                  return (
                    <div key={loc.id} className="p-3 bg-slate-50 rounded border border-slate-200">
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-800 mb-1.5">
                        <span className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>{loc.name} ({loc.code})</span>
                        </span>
                        <span className="text-slate-600 font-mono">{locPresent} / {reqCount} On Duty ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${pct >= 85 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Attendance Exception Tracker */}
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Today&apos;s Attendance Exceptions & Missing Punches
                </h2>
                <Link href="/attendance/register" className="text-xs text-blue-600 font-semibold hover:underline">
                  Full Register →
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="px-3 py-2">Employee</th>
                      <th className="px-3 py-2">Location / Dept</th>
                      <th className="px-3 py-2">First IN</th>
                      <th className="px-3 py-2">Last OUT</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {attendanceRecords.filter(r => r.hasMissingPunch || r.status === 'LATE' || r.status === 'ABSENT').slice(0, 5).map(rec => {
                      const emp = employees.find(e => e.id === rec.employeeId);
                      if (!emp) return null;
                      return (
                        <tr key={rec.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2.5 font-semibold text-slate-900">
                            {emp.firstName} {emp.lastName}
                            <span className="block text-[10px] text-slate-500 font-mono">{emp.employeeCode}</span>
                          </td>
                          <td className="px-3 py-2">
                            {emp.currentAssignment.locationId}
                            <span className="block text-[10px] text-slate-500">{emp.currentAssignment.departmentId}</span>
                          </td>
                          <td className="px-3 py-2 font-mono">{rec.firstIn || '--:--'}</td>
                          <td className="px-3 py-2 font-mono">{rec.lastOut || '--:--'}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              rec.hasMissingPunch ? 'bg-amber-100 text-amber-800' : (rec.status === 'LATE' ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800')
                            }`}>
                              {rec.hasMissingPunch ? 'MISSING PUNCH' : rec.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Link href="/attendance/regularization" className="px-2 py-1 bg-slate-900 text-white rounded text-[10px] font-semibold hover:bg-slate-800">
                              Regularize
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right 1 Column: Pending Approval Queue */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Pending Approvals Queue ({pendingRegs.length + pendingLeaves.length})
                </h2>
              </div>

              <div className="space-y-3">
                {pendingRegs.map(reg => {
                  const emp = employees.find(e => e.id === reg.employeeId);
                  return (
                    <div key={reg.id} className="p-3 bg-amber-50/50 border border-amber-200 rounded-md space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-200/60 px-1.5 py-0.5 rounded uppercase">
                            Regularization
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 mt-1">{emp?.firstName} {emp?.lastName}</h4>
                          <p className="text-[11px] text-slate-600">Date: {reg.date} ({reg.requestedInTime} - {reg.requestedOutTime})</p>
                          <p className="text-[10px] text-slate-500 italic mt-0.5">&quot;{reg.reason}&quot;</p>
                        </div>
                      </div>
                      <div className="flex space-x-2 pt-1">
                        <button
                          onClick={() => approveRegularization(reg.id, 'HR Admin')}
                          className="flex-1 py-1 bg-emerald-600 text-white text-[11px] font-semibold rounded hover:bg-emerald-700 shadow-sm"
                        >
                          Approve
                        </button>
                        <button className="flex-1 py-1 bg-slate-200 text-slate-700 text-[11px] font-semibold rounded hover:bg-slate-300">
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}

                {pendingLeaves.map(leave => {
                  const emp = employees.find(e => e.id === leave.employeeId);
                  return (
                    <div key={leave.id} className="p-3 bg-blue-50/50 border border-blue-200 rounded-md space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold text-blue-800 bg-blue-200/60 px-1.5 py-0.5 rounded uppercase">
                            Leave Request ({leave.totalDays} Days)
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 mt-1">{emp?.firstName} {emp?.lastName}</h4>
                          <p className="text-[11px] text-slate-600">{leave.startDate} to {leave.endDate}</p>
                          <p className="text-[10px] text-slate-500 italic mt-0.5">&quot;{leave.reason}&quot;</p>
                        </div>
                      </div>
                      <div className="flex space-x-2 pt-1">
                        <button
                          onClick={() => approveLeaveRequest(leave.id, 'HR Admin')}
                          className="flex-1 py-1 bg-blue-600 text-white text-[11px] font-semibold rounded hover:bg-blue-700 shadow-sm"
                        >
                          Approve
                        </button>
                        <button className="flex-1 py-1 bg-slate-200 text-slate-700 text-[11px] font-semibold rounded hover:bg-slate-300">
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}

                {pendingRegs.length === 0 && pendingLeaves.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-500 font-medium">
                    No pending approval requests!
                  </div>
                )}
              </div>
            </div>

            {/* Quick Demo Workflow Guide Box */}
            <div className="bg-slate-900 text-slate-300 p-4 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center space-x-1.5 text-amber-400 font-bold text-xs">
                <Sparkles className="w-4 h-4" />
                <span>How to Demo HRMS to Client</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                1. Click <b>Simulate Biometric Punch</b> in top header.<br/>
                2. Select employee ND-1011 and trigger IN punch at 07:45 (Late).<br/>
                3. Go to <b>Attendance Register</b> to view automatically flagged Late status.<br/>
                4. Create a <b>Regularization Request</b> to clear late status after HR approval.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}

