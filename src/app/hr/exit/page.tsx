'use client';

import React from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { UserMinus } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function AdminExitPage() {
  const { exitRequests, employees, approveExitRequest } = useHRMSStore();

  return (
    <ShellLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-[30px] leading-[38px] font-semibold tracking-[-0.02em] text-[#202522] flex items-center gap-2">
            <UserMinus className="w-7 h-7 text-[#C94B45]" />
            Resignation & Offboarding Clearance Management
          </h1>
          <p className="mt-1 text-[14px] leading-5 font-normal text-[#66706B]">
            Department clearance workflow, notice period tracking & final settlement generation.
          </p>
        </div>

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs overflow-hidden">
          <table className="w-full text-left text-[#202522]">
            <thead className="bg-[#F3F0E9]/60 border-b border-[#E5E2DB]">
              <tr>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Employee</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Resignation Date</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Last Working Day</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Department Clearance</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Status</th>
                <th className="px-4 py-3 text-right text-[13px] leading-5 font-semibold text-[#66706B]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E2DB]">
              {exitRequests.map(e => {
                const emp = employees.find(empItem => empItem.id === e.employeeId);
                return (
                  <tr key={e.id} className="hover:bg-[#F3F0E9]/50">
                    <td className="px-4 py-3.5 text-[15px] leading-5 font-medium text-[#202522]">{emp?.firstName} {emp?.lastName} ({emp?.employeeCode})</td>
                    <td className="px-4 py-3.5 font-mono text-[14px] text-[#202522]">{e.resignationDate}</td>
                    <td className="px-4 py-3.5 font-mono text-[15px] leading-5 font-semibold text-[#C94B45]">{e.expectedLastWorkingDay}</td>
                    <td className="px-4 py-3.5 text-[12px] space-x-1">
                      <span className={`px-2 py-0.5 rounded-full font-semibold ${e.clearanceStatus.deptManagerClearance ? 'bg-[#23865B]/10 text-[#23865B] border border-[#23865B]/20' : 'bg-[#F3F0E9] text-[#66706B] border border-[#E5E2DB]'}`}>DEPT</span>
                      <span className={`px-2 py-0.5 rounded-full font-semibold ${e.clearanceStatus.financeClearance ? 'bg-[#23865B]/10 text-[#23865B] border border-[#23865B]/20' : 'bg-[#F3F0E9] text-[#66706B] border border-[#E5E2DB]'}`}>FIN</span>
                      <span className={`px-2 py-0.5 rounded-full font-semibold ${e.clearanceStatus.hrClearance ? 'bg-[#23865B]/10 text-[#23865B] border border-[#23865B]/20' : 'bg-[#F3F0E9] text-[#66706B] border border-[#E5E2DB]'}`}>HR</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[12px] leading-4 font-semibold bg-[#C68A28]/10 text-[#C68A28] border border-[#C68A28]/20 uppercase">
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {e.status !== 'CLEARED_SETTLED' && (
                        <button
                          onClick={() => approveExitRequest(e.id)}
                          className="px-4 h-11 bg-[#23865B] text-white text-[14px] leading-5 font-semibold rounded-[8px] shadow-brand-xs hover:bg-[#1b6b48] cursor-pointer"
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
