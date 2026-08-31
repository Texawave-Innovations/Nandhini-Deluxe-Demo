'use client';

import React, { useMemo } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import Link from 'next/link';
import {
  Users2, UserCheck, UserX, Palmtree, ClipboardCheck, Timer, RefreshCw, Ticket, Receipt,
  Briefcase, DollarSign, UserMinus, PartyPopper, Plus, CalendarDays,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { useHRMSStore } from '@/store/hrms-store';
import { useOutletStore } from '@/store/outlet-store';
import KpiCard from '@/components/ui/KpiCard';
import StatusChip from '@/components/ui/StatusChip';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const PIE_COLORS = ['#23865B', '#C68A28', '#C94B45', '#3377A8', '#66706B'];

export default function HROverviewPage() {
  const {
    employees, departments, attendanceRecords, regularizationRequests, leaveRequests, overtimeRecords,
    shiftSwapRequests, hrTickets, expenseClaims, loans, bonusRecords, candidates, exitRequests, banquetEvents,
  } = useHRMSStore();
  const { businessDate } = useOutletStore();

  const activeEmployees = employees.filter((e) => e.status !== 'INACTIVE');
  const onProbation = activeEmployees.filter((e) => e.employmentTypeId === 'emp-type-2').length;

  // Attendance is generated for a trailing window of already-elapsed business dates, so use
  // the most recent date on record rather than `businessDate` itself (which is "today").
  const latestAttendanceDate = useMemo(
    () => attendanceRecords.reduce((max, r) => (r.date > max ? r.date : max), ''),
    [attendanceRecords]
  );
  const latestAttendance = attendanceRecords.filter((r) => r.date === latestAttendanceDate);
  const presentCount = latestAttendance.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
  const absentCount = latestAttendance.filter((r) => r.status === 'ABSENT').length;
  const onLeaveCount = leaveRequests.filter((l) => l.status === 'APPROVED' && l.startDate <= businessDate && l.endDate >= businessDate).length;

  const attendanceDist = useMemo(() => {
    const counts = new Map<string, number>();
    latestAttendance.forEach((r) => counts.set(r.status, (counts.get(r.status) ?? 0) + 1));
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }, [latestAttendance]);

  const deptHeadcount = useMemo(() => {
    return departments
      .map((d) => ({ name: d.name, value: activeEmployees.filter((e) => e.currentAssignment.departmentId === d.id).length }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [departments, activeEmployees]);

  const pendingLeaves = leaveRequests.filter((l) => l.status === 'PENDING');
  const pendingRegularizations = regularizationRequests.filter((r) => r.status === 'PENDING');
  const pendingOT = overtimeRecords.filter((o) => o.status === 'PENDING');
  const pendingSwaps = shiftSwapRequests.filter((s) => s.managerStatus === 'PENDING');
  const openTickets = hrTickets.filter((t) => t.status === 'OPEN');
  const pendingExpenses = expenseClaims.filter((c) => c.status === 'PENDING');
  const pendingBonuses = bonusRecords.filter((b) => b.status === 'PENDING');
  const activeLoans = loans.filter((l) => l.status === 'ACTIVE');
  const outstandingLoanBalance = activeLoans.reduce((s, l) => s + l.balanceAmount, 0);
  const onNotice = exitRequests.filter((e) => e.status === 'NOTICE_PERIOD_ACTIVE' || e.status === 'PENDING_HR');
  const openPositions = new Set(candidates.filter((c) => c.stage !== 'OFFERED' && c.stage !== 'REJECTED').map((c) => c.jobTitle)).size;
  const upcomingEvents = banquetEvents.filter((e) => e.eventDate >= businessDate).slice(0, 4);

  const empById = new Map(employees.map((e) => [e.id, e]));
  const empName = (id: string) => { const e = empById.get(id); return e ? `${e.firstName} ${e.lastName}` : id; };

  return (
    <ShellLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-[28px] leading-[36px] font-semibold tracking-[-0.02em] text-[#202522]">HR Overview</h1>
            <p className="mt-1 text-[14px] leading-5 font-normal text-[#66706B]">
              People, attendance, leave &amp; payroll snapshot across the organization • Attendance as of {latestAttendanceDate || '—'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/leave" className="h-11 px-4 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[14px] leading-5 rounded-[8px] shadow-brand-xs flex items-center space-x-2 transition-all">
              <Plus className="w-4 h-4" /><span>Apply Leave</span>
            </Link>
            <Link href="/hr/recruitment" className="h-11 px-4 bg-white border border-[#E5E2DB] hover:bg-[#F3F0E9] text-[#202522] font-semibold text-[14px] leading-5 rounded-[8px] shadow-brand-xs flex items-center space-x-2 transition-all">
              <Briefcase className="w-4 h-4 text-[#66706B]" /><span>Add Candidate</span>
            </Link>
          </div>
        </div>

        {/* WORKFORCE SNAPSHOT */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#66706B] mb-1.5">Workforce Snapshot</div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <KpiCard label="Total Employees" value={employees.length} icon={Users2} sublabel={`${activeEmployees.length} active`} />
            <KpiCard label="Present" value={presentCount} icon={UserCheck} valueColorClass="text-[#23865B]" sublabel={latestAttendanceDate || undefined} />
            <KpiCard label="Absent" value={absentCount} icon={UserX} valueColorClass={absentCount > 0 ? 'text-[#C94B45]' : undefined} sublabel={latestAttendanceDate || undefined} />
            <KpiCard label="On Leave Today" value={onLeaveCount} icon={Palmtree} valueColorClass="text-[#C68A28]" />
            <KpiCard label="On Probation" value={onProbation} icon={ClipboardCheck} />
            <KpiCard label="Open Positions" value={openPositions} icon={Briefcase} valueColorClass="text-[#3377A8]" sublabel={`${candidates.length} candidates in pipeline`} />
          </div>
        </div>

        {/* APPROVALS & PENDING ACTIONS */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#66706B] mb-1.5">Pending Approvals</div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard label="Leave Requests" value={pendingLeaves.length} icon={Palmtree} valueColorClass={pendingLeaves.length ? 'text-[#C68A28]' : 'text-[#23865B]'} />
            <KpiCard label="Regularizations" value={pendingRegularizations.length} icon={ClipboardCheck} valueColorClass={pendingRegularizations.length ? 'text-[#C68A28]' : 'text-[#23865B]'} />
            <KpiCard label="Overtime" value={pendingOT.length} icon={Timer} valueColorClass={pendingOT.length ? 'text-[#C68A28]' : 'text-[#23865B]'} />
            <KpiCard label="Shift Swaps" value={pendingSwaps.length} icon={RefreshCw} valueColorClass={pendingSwaps.length ? 'text-[#C68A28]' : 'text-[#23865B]'} />
            <KpiCard label="Open HR Tickets" value={openTickets.length} icon={Ticket} valueColorClass={openTickets.length ? 'text-[#C94B45]' : 'text-[#23865B]'} />
            <KpiCard label="Expense Claims" value={pendingExpenses.length} icon={Receipt} valueColorClass={pendingExpenses.length ? 'text-[#C68A28]' : 'text-[#23865B]'} />
          </div>
        </div>

        {/* PAYROLL & COMPLIANCE */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#66706B] mb-1.5">Payroll &amp; Compliance</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Active Loans / Advances" value={activeLoans.length} icon={DollarSign} sublabel={inr(outstandingLoanBalance) + ' outstanding'} />
            <KpiCard label="Bonus Payouts Pending" value={pendingBonuses.length} icon={DollarSign} valueColorClass={pendingBonuses.length ? 'text-[#C68A28]' : 'text-[#23865B]'} />
            <KpiCard label="Employees Serving Notice" value={onNotice.length} icon={UserMinus} valueColorClass={onNotice.length ? 'text-[#C94B45]' : undefined} />
            <KpiCard label="Upcoming Banquet Events" value={upcomingEvents.length} icon={PartyPopper} />
          </div>
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
            <h3 className="text-sm font-semibold text-[#202522] mb-3">Headcount by Department</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={deptHeadcount} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E2DB" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#66706B' }} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: '#202522' }} />
                <Tooltip />
                <Bar dataKey="value" fill="#0F5B55" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
            <h3 className="text-sm font-semibold text-[#202522] mb-3">Attendance Status — {latestAttendanceDate || 'No data'}</h3>
            {attendanceDist.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-[13px] text-[#66706B]">No attendance recorded yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={attendanceDist} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {attendanceDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {attendanceDist.map((d, i) => (
                <span key={d.name} className="text-[11px] flex items-center gap-1 text-[#66706B]">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />{d.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ACTION LISTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#202522] flex items-center gap-2"><Palmtree className="w-4 h-4 text-[#C68A28]" />Pending Leave Requests</h3>
              <Link href="/leave" className="text-[12px] text-[#0F5B55] font-semibold">View all →</Link>
            </div>
            <div className="space-y-2">
              {pendingLeaves.length === 0 && <div className="text-[13px] text-[#66706B]">No pending leave requests.</div>}
              {pendingLeaves.slice(0, 5).map((l) => (
                <div key={l.id} className="flex items-center justify-between p-2.5 bg-[#F3F0E9] rounded-md text-[13px]">
                  <span className="text-[#202522] font-medium truncate">{empName(l.employeeId)}</span>
                  <span className="text-[#66706B] font-mono text-[12px]">{l.startDate} → {l.endDate}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#202522] flex items-center gap-2"><Ticket className="w-4 h-4 text-[#C94B45]" />Open HR Tickets</h3>
              <Link href="/hr/tickets" className="text-[12px] text-[#0F5B55] font-semibold">View all →</Link>
            </div>
            <div className="space-y-2">
              {openTickets.length === 0 && <div className="text-[13px] text-[#66706B]">No open tickets.</div>}
              {openTickets.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center justify-between p-2.5 bg-[#F3F0E9] rounded-md text-[13px] gap-2">
                  <span className="text-[#202522] font-medium truncate">{t.subject}</span>
                  <StatusChip label={t.priority} tone={t.priority === 'URGENT' || t.priority === 'HIGH' ? 'danger' : 'warning'} />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#202522] flex items-center gap-2"><CalendarDays className="w-4 h-4 text-[#3377A8]" />Upcoming Banquet Events</h3>
              <Link href="/banquet/events" className="text-[12px] text-[#0F5B55] font-semibold">View all →</Link>
            </div>
            <div className="space-y-2">
              {upcomingEvents.length === 0 && <div className="text-[13px] text-[#66706B]">No upcoming events.</div>}
              {upcomingEvents.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-2.5 bg-[#F3F0E9] rounded-md text-[13px]">
                  <span className="text-[#202522] font-medium truncate">{e.name}</span>
                  <span className="text-[#66706B] font-mono text-[12px]">{e.eventDate}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}
