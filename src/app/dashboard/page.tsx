'use client';

import React from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { 
  Users, UserCheck, Calendar, AlertCircle, Ticket, Receipt, DollarSign, Plus, Clock, FileSpreadsheet, Sparkles, TrendingUp, UserX
} from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';
import Link from 'next/link';

export default function DashboardPage() {
  const { 
    employees, attendanceRecords, regularizationRequests, leaveRequests, 
    hrTickets, expenseClaims, currentRole 
  } = useHRMSStore();

  const totalEmp = employees.length;
  const activeEmp = employees.filter(e => e.status !== 'INACTIVE').length;
  const inactiveEmp = employees.filter(e => e.status === 'INACTIVE').length;
  const presentToday = attendanceRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
  const absentToday = attendanceRecords.filter(r => r.status === 'ABSENT').length;
  const onLeaveToday = attendanceRecords.filter(r => r.status === 'ON_LEAVE').length;
  const lateToday = attendanceRecords.filter(r => r.lateMins > 0).length;
  const otToday = attendanceRecords.filter(r => r.otHours > 0).length;
  const missingPunchesCount = attendanceRecords.filter(r => r.hasMissingPunch).length;

  const pendingApprovalsCount = regularizationRequests.filter(r => r.status === 'PENDING').length + leaveRequests.filter(l => l.status === 'PENDING').length;
  const openTicketsCount = hrTickets.filter(t => t.status === 'OPEN').length;
  const pendingExpensesCount = expenseClaims.filter(c => c.status === 'PENDING').length;

  return (
    <ShellLayout>
      <div className="space-y-6">
        {/* Top Header Greeting Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#202522] tracking-tight">
              Dashboard
            </h1>
            <p className="text-xs text-[#66706B] font-medium mt-0.5">
              Workforce overview for today • Thursday, 27 August 2026
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/employees"
              className="px-4 py-2 bg-white border border-[#E5E2DB] hover:bg-[#F3F0E9] text-[#202522] font-semibold text-xs rounded-[8px] shadow-brand-xs flex items-center space-x-1.5 transition-all"
            >
              <Users className="w-4 h-4 text-[#66706B]" />
              <span>Employee Directory</span>
            </Link>

            <Link
              href="/reports"
              className="px-4 py-2 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-xs rounded-[8px] shadow-brand-xs flex items-center space-x-1.5 transition-all"
            >
              <DollarSign className="w-4 h-4" />
              <span>Run Payroll</span>
            </Link>
          </div>
        </div>

        {/* TOP KPI CARDS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-3 shadow-brand-xs">
            <span className="text-[10px] font-semibold text-[#66706B] uppercase tracking-wider block">ACTIVE EMPLOYEES</span>
            <div className="text-xl font-bold text-[#202522] mt-1">{activeEmp}</div>
            <div className="text-[10px] text-[#66706B] font-medium mt-0.5">
              {inactiveEmp > 0 ? `${inactiveEmp} inactive` : `of ${totalEmp} total`}
            </div>
          </div>

          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-3 shadow-brand-xs">
            <span className="text-[10px] font-semibold text-[#66706B] uppercase tracking-wider block">PRESENT TODAY</span>
            <div className="text-xl font-bold text-[#23865B] mt-1">{presentToday}</div>
            <div className="text-[10px] text-[#66706B] font-medium mt-0.5">{activeEmp ? Math.round((presentToday/activeEmp)*100) : 0}% Attendance</div>
          </div>

          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-3 shadow-brand-xs">
            <span className="text-[10px] font-semibold text-[#66706B] uppercase tracking-wider block">ABSENT TODAY</span>
            <div className="text-xl font-bold text-[#C94B45] mt-1">{absentToday}</div>
            <div className="text-[10px] text-[#66706B] font-medium mt-0.5">Unaccounted</div>
          </div>

          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-3 shadow-brand-xs">
            <span className="text-[10px] font-semibold text-[#66706B] uppercase tracking-wider block">ON LEAVE</span>
            <div className="text-xl font-bold text-[#C68A28] mt-1">{onLeaveToday}</div>
            <div className="text-[10px] text-[#66706B] font-medium mt-0.5">Approved Time Off</div>
          </div>

          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-3 shadow-brand-xs">
            <span className="text-[10px] font-semibold text-[#66706B] uppercase tracking-wider block">LATE TODAY</span>
            <div className="text-xl font-bold text-[#C68A28] mt-1">{lateToday}</div>
            <div className="text-[10px] text-[#66706B] font-medium mt-0.5">Grace Exceeded</div>
          </div>

          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-3 shadow-brand-xs">
            <span className="text-[10px] font-semibold text-[#66706B] uppercase tracking-wider block">OT TODAY</span>
            <div className="text-xl font-bold text-[#3377A8] mt-1">{otToday}</div>
            <div className="text-[10px] text-[#66706B] font-medium mt-0.5">Extra Hours</div>
          </div>

          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-3 shadow-brand-xs">
            <span className="text-[10px] font-semibold text-[#66706B] uppercase tracking-wider block">MISSING PUNCHES</span>
            <div className="text-xl font-bold text-[#C94B45] mt-1">{missingPunchesCount}</div>
            <div className="text-[10px] text-[#66706B] font-medium mt-0.5">Needs Fix</div>
          </div>

          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-3 shadow-brand-xs">
            <span className="text-[10px] font-semibold text-[#66706B] uppercase tracking-wider block">PENDING APPROVALS</span>
            <div className="text-xl font-bold text-[#0F5B55] mt-1">{pendingApprovalsCount}</div>
            <div className="text-[10px] text-[#66706B] font-medium mt-0.5">In Queue</div>
          </div>
        </div>

        {/* REQUIRES ACTION & REVIEW SECTION */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1 text-xs font-semibold text-[#C94B45] uppercase tracking-wider">
            <AlertCircle className="w-4 h-4" />
            <span>Requires Action & Review</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs flex justify-between items-center border-l-4 border-l-[#C94B45]">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-[#202522] uppercase">Pending Approvals</span>
                  <span className="px-2 py-0.5 bg-[#C94B45]/10 text-[#C94B45] font-semibold text-[10px] rounded-full uppercase">Action</span>
                </div>
                <div className="text-2xl font-bold text-[#C94B45] mt-1">{pendingApprovalsCount}</div>
                <div className="text-xs text-[#66706B] font-medium mt-0.5">Leaves, loans & bonuses</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#C94B45]/10 text-[#C94B45] flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs flex justify-between items-center border-l-4 border-l-[#C68A28]">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-[#202522] uppercase">Open Tickets</span>
                  <span className="px-2 py-0.5 bg-[#C68A28]/10 text-[#C68A28] font-semibold text-[10px] rounded-full uppercase">Pending</span>
                </div>
                <div className="text-2xl font-bold text-[#C68A28] mt-1">{openTicketsCount}</div>
                <div className="text-xs text-[#66706B] font-medium mt-0.5">Unresolved support requests</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#C68A28]/10 text-[#C68A28] flex items-center justify-center">
                <Ticket className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs flex justify-between items-center border-l-4 border-l-[#0F5B55]">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-[#202522] uppercase">Pending Expenses</span>
                  <span className="px-2 py-0.5 bg-[#0F5B55]/10 text-[#0F5B55] font-semibold text-[10px] rounded-full uppercase">Review</span>
                </div>
                <div className="text-2xl font-bold text-[#0F5B55] mt-1">{pendingExpensesCount}</div>
                <div className="text-xs text-[#66706B] font-medium mt-0.5">Claims awaiting reimbursement</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#0F5B55]/10 text-[#0F5B55] flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Attendance Overview & Manpower Shortage */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Attendance Overview Card */}
          <div className="lg:col-span-2 bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#E5E2DB]">
              <h3 className="text-sm font-semibold text-[#202522] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0F5B55]" />
                Attendance Today Overview
              </h3>
              <span className="px-2.5 py-0.5 bg-[#23865B]/10 text-[#23865B] text-xs font-semibold rounded-full border border-[#23865B]/20">
                {presentToday} / {activeEmp} Present
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8 py-2">
              <div className="relative w-32 h-32 rounded-full border-8 border-[#0F5B55] flex items-center justify-center text-center">
                <div>
                  <div className="text-2xl font-bold text-[#202522]">{presentToday}</div>
                  <div className="text-[10px] text-[#66706B]">of {activeEmp} Active</div>
                </div>
              </div>

              <div className="flex-1 space-y-2.5 w-full">
                <div className="flex justify-between items-center p-2.5 bg-[#F3F0E9] rounded-md">
                  <div className="flex items-center space-x-2 text-xs font-medium text-[#202522]">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#23865B]" />
                    <span>Present Today</span>
                  </div>
                  <span className="text-xs font-semibold text-[#202522]">{presentToday}</span>
                </div>

                <div className="flex justify-between items-center p-2.5 bg-[#F3F0E9] rounded-md">
                  <div className="flex items-center space-x-2 text-xs font-medium text-[#202522]">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#C94B45]" />
                    <span>Absent Today</span>
                  </div>
                  <span className="text-xs font-semibold text-[#202522]">{absentToday}</span>
                </div>

                <div className="flex justify-between items-center p-2.5 bg-[#F3F0E9] rounded-md">
                  <div className="flex items-center space-x-2 text-xs font-medium text-[#202522]">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#C68A28]" />
                    <span>On Approved Leave</span>
                  </div>
                  <span className="text-xs font-semibold text-[#202522]">{onLeaveToday}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs space-y-4">
            <h3 className="text-sm font-semibold text-[#202522]">Quick Actions</h3>

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/employees"
                className="p-3 bg-[#F3F0E9] hover:bg-[#0F5B55] text-[#202522] hover:text-white rounded-md flex flex-col items-center justify-center text-center space-y-1 transition-all"
              >
                <Plus className="w-5 h-5 text-[#0F5B55]" />
                <span className="text-xs font-medium">Add Employee</span>
              </Link>

              <Link
                href="/attendance/register"
                className="p-3 bg-[#F3F0E9] hover:bg-[#0F5B55] text-[#202522] hover:text-white rounded-md flex flex-col items-center justify-center text-center space-y-1 transition-all"
              >
                <Clock className="w-5 h-5 text-[#0F5B55]" />
                <span className="text-xs font-medium">Mark Attendance</span>
              </Link>

              <Link
                href="/leave"
                className="p-3 bg-[#F3F0E9] hover:bg-[#0F5B55] text-[#202522] hover:text-white rounded-md flex flex-col items-center justify-center text-center space-y-1 transition-all"
              >
                <UserCheck className="w-5 h-5 text-[#0F5B55]" />
                <span className="text-xs font-medium">Approve Leaves</span>
              </Link>

              <Link
                href="/reports"
                className="p-3 bg-[#F3F0E9] hover:bg-[#0F5B55] text-[#202522] hover:text-white rounded-md flex flex-col items-center justify-center text-center space-y-1 transition-all"
              >
                <DollarSign className="w-5 h-5 text-[#0F5B55]" />
                <span className="text-xs font-medium">Run Payroll</span>
              </Link>

              <Link
                href="/hr/tickets"
                className="p-3 bg-[#F3F0E9] hover:bg-[#0F5B55] text-[#202522] hover:text-white rounded-md flex flex-col items-center justify-center text-center space-y-1 transition-all"
              >
                <Ticket className="w-5 h-5 text-[#0F5B55]" />
                <span className="text-xs font-medium">View Tickets</span>
              </Link>

              <Link
                href="/hr/expenses"
                className="p-3 bg-[#F3F0E9] hover:bg-[#0F5B55] text-[#202522] hover:text-white rounded-md flex flex-col items-center justify-center text-center space-y-1 transition-all"
              >
                <Receipt className="w-5 h-5 text-[#0F5B55]" />
                <span className="text-xs font-medium">Expense Review</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}
