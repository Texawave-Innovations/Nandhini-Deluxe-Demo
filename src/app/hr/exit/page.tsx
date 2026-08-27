'use client';

import React from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { UserMinus, CheckCircle2 } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function AdminExitPage() {
  const { exitRequests, employees, approveExitRequest } = useHRMSStore();

  return (
    <ShellLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserMinus className="w-5 h-5 text-red-600" />
            Resignation & Offboarding Clearance Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            TexaWave Offboarding Engine: Department clearance workflow, notice period tracking & final settlement generation.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-900 text-white uppercase text-[10px] font-semibold">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Resignation Date</th>
                <th className="px-4 py-3">Last Working Day</th>
                <th className="px-4 py-3">Department Clearance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {exitRequests.map(e => {
                const emp = employees.find(empItem => empItem.id === e.employeeId);
                return (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{emp?.firstName} {emp?.lastName} ({emp?.employeeCode})</td>
                    <td className="px-4 py-3 font-mono">{e.resignationDate}</td>
                    <td className="px-4 py-3 font-mono font-bold text-red-600">{e.expectedLastWorkingDay}</td>
                    <td className="px-4 py-3 text-[10px]">
                      <span className={`px-1.5 py-0.5 rounded font-bold mr-1 ${e.clearanceStatus.deptManagerClearance ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>DEPT</span>
                      <span className={`px-1.5 py-0.5 rounded font-bold mr-1 ${e.clearanceStatus.financeClearance ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>FIN</span>
                      <span className={`px-1.5 py-0.5 rounded font-bold ${e.clearanceStatus.hrClearance ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>HR</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {e.status !== 'CLEARED_SETTLED' && (
                        <button
                          onClick={() => approveExitRequest(e.id)}
                          className="px-3 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded hover:bg-emerald-700 shadow"
                        >
                          Clear & Settle Offboarding
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

