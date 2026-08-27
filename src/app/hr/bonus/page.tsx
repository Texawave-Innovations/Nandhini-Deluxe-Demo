'use client';

import React from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { DollarSign } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function BonusPage() {
  const { bonusRecords, employees } = useHRMSStore();

  return (
    <ShellLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            Bonus Schemes & Festival Payout Sheets
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            TexaWave ERP Bonus Engine: Festival bonuses (Diwali/Ugadi), statutory annual payouts & performance incentives.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-900 text-white uppercase text-[10px] font-semibold">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Bonus Category</th>
                <th className="px-4 py-3">Month / Year</th>
                <th className="px-4 py-3">Payout Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {bonusRecords.map(b => {
                const emp = employees.find(e => e.id === b.employeeId);
                return (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{emp?.firstName} {emp?.lastName} ({emp?.employeeCode})</td>
                    <td className="px-4 py-3 font-semibold text-blue-700">{b.bonusType}</td>
                    <td className="px-4 py-3 font-mono">{b.monthYear}</td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-700">₹{b.amount}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {b.status}
                      </span>
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

