'use client';

import React from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { FileSpreadsheet, Download, Printer, Filter, Building, Calendar, Users } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function ReportsPage() {
  const { attendanceRecords, employees, locations, departments } = useHRMSStore();

  const handleExportCSV = () => {
    const headers = ['Employee Code', 'Employee Name', 'Date', 'First IN', 'Last OUT', 'Worked Hours', 'Late Mins', 'OT Hours', 'Status'];
    const rows = attendanceRecords.map(r => {
      const emp = employees.find(e => e.id === r.employeeId);
      return [
        emp?.employeeCode || '',
        `${emp?.firstName || ''} ${emp?.lastName || ''}`,
        r.date,
        r.firstIn || '--',
        r.lastOut || '--',
        r.totalWorkedHours,
        r.lateMins,
        r.otHours,
        r.status
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Nandhini_HRMS_Attendance_Report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ShellLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[30px] leading-[38px] font-semibold tracking-[-0.02em] text-[#202522] flex items-center gap-2">
              <FileSpreadsheet className="w-7 h-7 text-[#0F5B55]" />
              Management Reports & Payroll-Ready Export
            </h1>
            <p className="mt-1 text-[14px] leading-5 font-normal text-[#66706B]">
              Comprehensive attendance summaries, overtime hours, and roster manpower reports.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-2 h-11 px-4 bg-[#23865B] hover:bg-[#1b6b48] text-white text-[14px] leading-5 font-semibold rounded-[8px] shadow-brand-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV / Excel</span>
            </button>
            <button 
              onClick={() => window.print()}
              className="flex items-center space-x-2 h-11 px-4 bg-[#0F5B55] text-white text-[14px] leading-5 font-semibold rounded-[8px] shadow-brand-xs hover:bg-[#08463F] cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Summary</span>
            </button>
          </div>
        </div>

        {/* Attendance Summary Data Grid */}
        <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs p-5 space-y-4">
          <h2 className="text-[20px] leading-[28px] font-semibold text-[#0F5B55]">Payroll-Ready Monthly Attendance Summary Output</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[#202522]">
              <thead className="bg-[#F3F0E9]/60 border-b border-[#E5E2DB]">
                <tr>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Employee Code</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Name</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Location</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Total Worked Days</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Late Occurrences</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Total OT Hours</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Leave Days</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Payable Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2DB]">
                {employees.map(emp => {
                  const empAtt = attendanceRecords.filter(a => a.employeeId === emp.id);
                  const presentDays = empAtt.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
                  const lateCount = empAtt.filter(a => a.status === 'LATE').length;
                  const otHours = empAtt.reduce((sum, a) => sum + a.otHours, 0);

                  return (
                    <tr key={emp.id} className="hover:bg-[#F3F0E9]/50">
                      <td className="px-4 py-3.5 font-mono text-[12px] font-semibold text-[#202522]">{emp.employeeCode}</td>
                      <td className="px-4 py-3.5 text-[15px] leading-5 font-medium text-[#202522]">{emp.firstName} {emp.lastName}</td>
                      <td className="px-4 py-3.5 text-[15px] leading-5 font-medium text-[#66706B]">{emp.currentAssignment.locationId}</td>
                      <td className="px-4 py-3.5 text-[15px] leading-5 font-semibold text-[#23865B]">{presentDays} Days</td>
                      <td className="px-4 py-3.5 text-[15px] leading-5 font-semibold text-[#C68A28]">{lateCount}</td>
                      <td className="px-4 py-3.5 text-[15px] leading-5 font-semibold text-[#3377A8]">{otHours} Hrs</td>
                      <td className="px-4 py-3.5 text-[15px] leading-5 font-semibold text-[#C68A28]">1 Day</td>
                      <td className="px-4 py-3.5 text-[15px] leading-5 font-bold text-[#202522] bg-[#F8F5EE]">26 Days</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}

