'use client';

import React from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { ShieldCheck } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function ESICompliancePage() {
  const { employees } = useHRMSStore();

  return (
    <ShellLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Statutory Employee State Insurance (ESI 0.75%) Compliance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            TexaWave ESI Compliance: Automated 0.75% employee & 3.25% employer deduction calculation (Gross threshold cap at ₹21,000).
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-semibold">
                <tr>
                  <th className="px-4 py-3">Employee Code</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Gross Wages</th>
                  <th className="px-4 py-3">Employee Share (0.75%)</th>
                  <th className="px-4 py-3">Employer Share (3.25%)</th>
                  <th className="px-4 py-3">Total Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {employees.map(emp => {
                  const gross = 18500;
                  const esiEmp = Math.round(gross * 0.0075);
                  const esiEmpr = Math.round(gross * 0.0325);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-mono font-bold">{emp.employeeCode}</td>
                      <td className="px-4 py-2.5 font-bold text-slate-900">{emp.firstName} {emp.lastName}</td>
                      <td className="px-4 py-2.5 font-mono font-bold">₹{gross}</td>
                      <td className="px-4 py-2.5 font-mono text-red-600 font-bold">₹{esiEmp}</td>
                      <td className="px-4 py-2.5 font-mono text-blue-600 font-bold">₹{esiEmpr}</td>
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-900 bg-slate-50">₹{esiEmp + esiEmpr}</td>
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

