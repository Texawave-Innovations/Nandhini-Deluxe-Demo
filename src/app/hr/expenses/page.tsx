'use client';

import React from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { DollarSign } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function AdminExpensesPage() {
  const { expenseClaims, employees, approveExpenseClaim } = useHRMSStore();

  return (
    <ShellLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-[30px] leading-[38px] font-semibold tracking-[-0.02em] text-[#202522] flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-[#0F5B55]" />
            Expense Reimbursement Claims Approvals
          </h1>
          <p className="mt-1 text-[14px] leading-5 font-normal text-[#66706B]">
            Review employee claims before pushing to Finance module.
          </p>
        </div>

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs overflow-hidden">
          <table className="w-full text-left text-[#202522]">
            <thead className="bg-[#F3F0E9]/60 border-b border-[#E5E2DB]">
              <tr>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Claim Code</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Employee</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Category</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Description</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Claimed Amount</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Status</th>
                <th className="px-4 py-3 text-right text-[13px] leading-5 font-semibold text-[#66706B]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E2DB]">
              {expenseClaims.map(c => {
                const emp = employees.find(e => e.id === c.employeeId);
                return (
                  <tr key={c.id} className="hover:bg-[#F3F0E9]/50">
                    <td className="px-4 py-3.5 font-mono text-[12px] font-semibold text-[#202522]">{c.claimCode}</td>
                    <td className="px-4 py-3.5 text-[15px] leading-5 font-medium text-[#202522]">{emp?.firstName} {emp?.lastName}</td>
                    <td className="px-4 py-3.5 text-[15px] leading-5 font-medium text-[#0F5B55]">{c.category}</td>
                    <td className="px-4 py-3.5 text-[14px] text-[#66706B]">{c.description}</td>
                    <td className="px-4 py-3.5 font-mono text-[15px] leading-5 font-semibold text-[#202522]">₹{c.amount}</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[12px] leading-4 font-semibold ${
                        c.status === 'APPROVED' ? 'bg-[#23865B]/10 text-[#23865B] border border-[#23865B]/20' : 'bg-[#C68A28]/10 text-[#C68A28] border border-[#C68A28]/20'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {c.status === 'PENDING' && (
                        <button
                          onClick={() => approveExpenseClaim(c.id, c.amount)}
                          className="px-4 h-11 bg-[#23865B] text-white text-[14px] leading-5 font-semibold rounded-[8px] shadow-brand-xs hover:bg-[#1b6b48] cursor-pointer"
                        >
                          Approve Claim
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
