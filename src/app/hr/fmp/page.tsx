'use client';

import React from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { Trophy } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function FMPAuditPage() {
  const { employees } = useHRMSStore();

  return (
    <ShellLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-[30px] leading-[38px] font-semibold tracking-[-0.02em] text-[#202522] flex items-center gap-2">
            <Trophy className="w-7 h-7 text-[#C59A45]" />
            Full Month Present (FMP) Incentive Audit Monitor
          </h1>
          <p className="mt-1 text-[14px] leading-5 font-normal text-[#66706B]">
            Tracks staff with 100% perfect attendance for monthly attendance bonus payout.
          </p>
        </div>

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs p-5 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[#202522]">
              <thead className="bg-[#F3F0E9]/60 border-b border-[#E5E2DB]">
                <tr>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Employee</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Total Working Days</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Days Present</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">FMP Qualified</th>
                  <th className="px-4 py-3 text-right text-[13px] leading-5 font-semibold text-[#66706B]">Incentive Reward</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2DB]">
                {employees.slice(0, 10).map((emp, idx) => {
                  const isQualified = idx % 2 === 0;
                  return (
                    <tr key={emp.id} className="hover:bg-[#F3F0E9]/50">
                      <td className="px-4 py-3.5 text-[15px] leading-5 font-medium text-[#202522]">{emp.firstName} {emp.lastName} ({emp.employeeCode})</td>
                      <td className="px-4 py-3.5 font-mono text-[14px] text-[#202522]">26 Days</td>
                      <td className="px-4 py-3.5 font-mono text-[15px] leading-5 font-semibold text-[#23865B]">{isQualified ? '26 Days' : '24 Days'}</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[12px] leading-4 font-semibold ${isQualified ? 'bg-[#23865B]/10 text-[#23865B] border border-[#23865B]/20' : 'bg-[#C94B45]/10 text-[#C94B45] border border-[#C94B45]/20'}`}>
                          {isQualified ? 'FMP QUALIFIED 🏆' : 'NOT QUALIFIED'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-[15px] leading-5 font-bold text-[#23865B]">
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
