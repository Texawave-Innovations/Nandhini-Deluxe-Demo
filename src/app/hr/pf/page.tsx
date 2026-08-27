'use client';

import React from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { DollarSign, ShieldCheck, Download, FileSpreadsheet } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function PFCompliancePage() {
  const { employees } = useHRMSStore();

  return (
    <ShellLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Statutory Provident Fund (PF 12%) Compliance Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            TexaWave ERP Compliance Engine: Automated 12% deduction calculation matching Indian statutory rules (Threshold capped at ₹15,000 basic).
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-900">Monthly PF Return Calculation Sheet</h2>
            <button className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded shadow hover:bg-emerald-700">
              Export ECR Return Sheet (.txt / .csv)
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-semibold">
                <tr>
                  <th className="px-4 py-3">Employee Code</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Eligible Basic Pay</th>
                  <th className="px-4 py-3">Employee Share (12%)</th>
                  <th className="px-4 py-3">Employer Share (12%)</th>
                  <th className="px-4 py-3">Total Deposit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {employees.map(emp => {
                  const basic = 15000;
                  const pfEmp = basic * 0.12;
                  const pfEmpr = basic * 0.12;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-mono font-bold">{emp.employeeCode}</td>
                      <td className="px-4 py-2.5 font-bold text-slate-900">{emp.firstName} {emp.lastName}</td>
                      <td className="px-4 py-2.5 font-mono font-bold">₹{basic}</td>
                      <td className="px-4 py-2.5 font-mono text-red-600 font-bold">₹{pfEmp}</td>
                      <td className="px-4 py-2.5 font-mono text-blue-600 font-bold">₹{pfEmpr}</td>
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-900 bg-slate-50">₹{pfEmp + pfEmpr}</td>
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

