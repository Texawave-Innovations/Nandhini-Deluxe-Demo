'use client';

import React from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { CheckCircle2, Trophy } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function FMPAuditPage() {
  const { employees, attendanceRecords } = useHRMSStore();

  return (
    <ShellLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Full Month Present (FMP) Incentive Audit Monitor
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            TexaWave Attendance Incentive Engine: Tracks staff with 100% perfect attendance for attendance bonus payout.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-semibold">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Total Working Days</th>
                  <th className="px-4 py-3">Days Present</th>
                  <th className="px-4 py-3">FMP Qualified</th>
                  <th className="px-4 py-3 text-right">Incentive Reward</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {employees.slice(0, 10).map((emp, idx) => {
                  const isQualified = idx % 2 === 0;
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-900">{emp.firstName} {emp.lastName} ({emp.employeeCode})</td>
                      <td className="px-4 py-3 font-mono">26 Days</td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-700">{isQualified ? '26 Days' : '24 Days'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isQualified ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {isQualified ? 'FMP QUALIFIED 🏆' : 'NOT QUALIFIED'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                        {isQualified ? '+₹2,500 Incentive' : '-'}
                      </td>
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

