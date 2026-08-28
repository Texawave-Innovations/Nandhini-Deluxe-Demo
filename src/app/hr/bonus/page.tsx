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
          <h1 className="text-[30px] leading-[38px] font-semibold tracking-[-0.02em] text-[#202522] flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-[#0F5B55]" />
            Bonus Schemes & Festival Payout Sheets
          </h1>
          <p className="mt-1 text-[14px] leading-5 font-normal text-[#66706B]">
            Festival bonuses (Diwali/Ugadi), statutory annual payouts & performance incentives.
          </p>
        </div>

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs overflow-hidden">
          <table className="w-full text-left text-[#202522]">
            <thead className="bg-[#F3F0E9]/60 border-b border-[#E5E2DB]">
              <tr>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Employee</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Bonus Category</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Month / Year</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Payout Amount</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E2DB]">
              {bonusRecords.map(b => {
                const emp = employees.find(e => e.id === b.employeeId);
                return (
                  <tr key={b.id} className="hover:bg-[#F3F0E9]/50">
                    <td className="px-4 py-3.5 text-[15px] leading-5 font-medium text-[#202522]">{emp?.firstName} {emp?.lastName} ({emp?.employeeCode})</td>
                    <td className="px-4 py-3.5 text-[15px] leading-5 font-medium text-[#0F5B55]">{b.bonusType}</td>
                    <td className="px-4 py-3.5 font-mono text-[14px] text-[#202522]">{b.monthYear}</td>
                    <td className="px-4 py-3.5 font-mono text-[15px] leading-5 font-semibold text-[#23865B]">₹{b.amount}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[12px] leading-4 font-semibold bg-[#23865B]/10 text-[#23865B] border border-[#23865B]/20">
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
