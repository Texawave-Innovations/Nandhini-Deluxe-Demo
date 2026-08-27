'use client';

import React from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { Timer, CheckCircle2 } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function OvertimePage() {
  const { overtimeRecords, employees, approveOvertime } = useHRMSStore();

  return (
    <ShellLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Timer className="w-5 h-5 text-blue-600" />
            Overtime Engine & Approval Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Calculated OT hours from attendance compared against standard shift thresholds.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-900 text-white uppercase text-[10px] font-semibold">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Worked Hrs</th>
                <th className="px-4 py-3">Standard Shift</th>
                <th className="px-4 py-3">Calculated OT</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {overtimeRecords.map(ot => {
                const emp = employees.find(e => e.id === ot.employeeId);
                return (
                  <tr key={ot.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{emp?.firstName} {emp?.lastName}</td>
                    <td className="px-4 py-3 font-mono">{ot.date}</td>
                    <td className="px-4 py-3 font-bold">{ot.workedHours} Hrs</td>
                    <td className="px-4 py-3">{ot.standardHours} Hrs</td>
                    <td className="px-4 py-3 text-indigo-700 font-bold">{ot.calculatedOtHours} Hrs</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ot.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {ot.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {ot.status === 'PENDING' && (
                        <button
                          onClick={() => approveOvertime(ot.id, ot.calculatedOtHours)}
                          className="px-3 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded shadow hover:bg-emerald-700"
                        >
                          Approve OT
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </ShellLayout>
  );
}

