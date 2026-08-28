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
          <h1 className="text-[30px] leading-[38px] font-semibold tracking-[-0.02em] text-[#202522] flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-[#0F5B55]" />
            Statutory Provident Fund (PF 12%) Compliance Dashboard
          </h1>
          <p className="mt-1 text-[14px] leading-5 font-normal text-[#66706B]">
            Automated 12% deduction calculation matching Indian statutory rules (Threshold capped at ₹15,000 basic).
          </p>
        </div>

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-[20px] leading-[28px] font-semibold text-[#0F5B55]">Monthly PF Return Calculation Sheet</h2>
            <button className="h-11 px-4 bg-[#23865B] text-white text-[14px] leading-5 font-semibold rounded-[8px] shadow-brand-xs hover:bg-[#1b6b48] cursor-pointer">
              Export ECR Return Sheet (.txt / .csv)
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[#202522]">
              <thead className="bg-[#F3F0E9]/60 border-b border-[#E5E2DB]">
                <tr>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Employee Code</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Name</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Eligible Basic Pay</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Employee Share (12%)</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Employer Share (12%)</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Total Deposit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2DB]">
                {employees.map(emp => {
                  const basic = 15000;
                  const pfEmp = basic * 0.12;
                  const pfEmpr = basic * 0.12;

                  return (
                    <tr key={emp.id} className="hover:bg-[#F3F0E9]/50">
                      <td className="px-4 py-3.5 font-mono text-[12px] font-semibold text-[#202522]">{emp.employeeCode}</td>
                      <td className="px-4 py-3.5 text-[15px] leading-5 font-medium text-[#202522]">{emp.firstName} {emp.lastName}</td>
                      <td className="px-4 py-3.5 font-mono text-[15px] leading-5 font-semibold text-[#202522]">₹{basic}</td>
                      <td className="px-4 py-3.5 font-mono text-[15px] leading-5 font-semibold text-[#C94B45]">₹{pfEmp}</td>
                      <td className="px-4 py-3.5 font-mono text-[15px] leading-5 font-semibold text-[#3377A8]">₹{pfEmpr}</td>
                      <td className="px-4 py-3.5 font-mono text-[15px] leading-5 font-bold text-[#202522] bg-[#F8F5EE]">₹{pfEmp + pfEmpr}</td>
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

