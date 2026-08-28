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
          <h1 className="text-[30px] leading-[38px] font-semibold tracking-[-0.02em] text-[#202522] flex items-center gap-2">
            <Timer className="w-7 h-7 text-[#0F5B55]" />
            Overtime Engine & Approval Queue
          </h1>
          <p className="mt-1 text-[14px] leading-5 font-normal text-[#66706B]">
            Calculated OT hours from attendance compared against standard shift thresholds.
          </p>
        </div>

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs overflow-hidden">
          <table className="w-full text-left text-[#202522]">
            <thead className="bg-[#F3F0E9]/60 border-b border-[#E5E2DB]">
              <tr>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Employee</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Date</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Worked Hours</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Standard Shift</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Calculated OT</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Status</th>
                <th className="px-4 py-3 text-right text-[13px] leading-5 font-semibold text-[#66706B]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E2DB]">
              {overtimeRecords.map(ot => {
                const emp = employees.find(e => e.id === ot.employeeId);
                return (
                  <tr key={ot.id} className="hover:bg-[#F3F0E9]/50">
                    <td className="px-4 py-3.5 text-[15px] leading-5 font-medium text-[#202522]">{emp?.firstName} {emp?.lastName}</td>
                    <td className="px-4 py-3.5 font-mono text-[14px] text-[#202522]">{ot.date}</td>
                    <td className="px-4 py-3.5 text-[15px] leading-5 font-medium text-[#202522]">{ot.workedHours} Hrs</td>
                    <td className="px-4 py-3.5 text-[15px] leading-5 font-medium text-[#66706B]">{ot.standardHours} Hrs</td>
                    <td className="px-4 py-3.5 text-[15px] leading-5 font-semibold text-[#3377A8]">{ot.calculatedOtHours} Hrs</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[12px] leading-4 font-semibold ${ot.status === 'APPROVED' ? 'bg-[#23865B]/10 text-[#23865B] border border-[#23865B]/20' : 'bg-[#C68A28]/10 text-[#C68A28] border border-[#C68A28]/20'}`}>
                        {ot.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {ot.status === 'PENDING' && (
                        <button
                          onClick={() => approveOvertime(ot.id, ot.calculatedOtHours)}
                          className="px-4 h-11 bg-[#23865B] text-white text-[14px] leading-5 font-semibold rounded-[8px] shadow-brand-xs hover:bg-[#1b6b48] cursor-pointer"
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

