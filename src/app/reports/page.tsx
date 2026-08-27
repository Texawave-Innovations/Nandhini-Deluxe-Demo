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
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              Management Reports & Payroll-Ready Export
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive attendance summaries, overtime hours, and roster manpower reports.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV / Excel</span>
            </button>
            <button 
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 text-white text-xs font-semibold rounded shadow hover:bg-slate-900"
            >
              <Printer className="w-4 h-4" />
              <span>Print Summary</span>
            </button>
          </div>
        </div>

        {/* Attendance Summary Data Grid */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Payroll-Ready Monthly Attendance Summary Output</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700 border-collapse">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-semibold">
                <tr>
                  <th className="px-4 py-3">Employee Code</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Total Worked Days</th>
                  <th className="px-4 py-3">Late Occurrences</th>
                  <th className="px-4 py-3">Total OT Hours</th>
                  <th className="px-4 py-3">Leave Days</th>
                  <th className="px-4 py-3">Payable Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {employees.map(emp => {
                  const empAtt = attendanceRecords.filter(a => a.employeeId === emp.id);
                  const presentDays = empAtt.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
                  const lateCount = empAtt.filter(a => a.status === 'LATE').length;
                  const otHours = empAtt.reduce((sum, a) => sum + a.otHours, 0);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-900">{emp.employeeCode}</td>
                      <td className="px-4 py-2.5 font-bold text-slate-800">{emp.firstName} {emp.lastName}</td>
                      <td className="px-4 py-2.5 text-slate-600">{emp.currentAssignment.locationId}</td>
                      <td className="px-4 py-2.5 font-semibold text-emerald-700">{presentDays} Days</td>
                      <td className="px-4 py-2.5 text-purple-700 font-bold">{lateCount}</td>
                      <td className="px-4 py-2.5 font-bold text-indigo-700">{otHours} Hrs</td>
                      <td className="px-4 py-2.5 text-amber-700 font-semibold">1 Day</td>
                      <td className="px-4 py-2.5 font-bold text-slate-900 bg-slate-50">26 Days</td>
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

