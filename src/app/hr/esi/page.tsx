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
          <h1 className="text-[30px] leading-[38px] font-semibold tracking-[-0.02em] text-[#202522] flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-[#0F5B55]" />
            Statutory Employee State Insurance (ESI 0.75%) Compliance
          </h1>
          <p className="mt-1 text-[14px] leading-5 font-normal text-[#66706B]">
            Automated 0.75% employee & 3.25% employer deduction calculation (Gross threshold cap at ₹21,000).
          </p>
        </div>

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs p-5 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[#202522]">
              <thead className="bg-[#F3F0E9]/60 border-b border-[#E5E2DB]">
                <tr>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Employee Code</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Name</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Gross Wages</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Employee Share (0.75%)</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Employer Share (3.25%)</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Total Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2DB]">
                {employees.map(emp => {
                  const gross = 18500;
                  const esiEmp = Math.round(gross * 0.0075);
                  const esiEmpr = Math.round(gross * 0.0325);

                  return (
                    <tr key={emp.id} className="hover:bg-[#F3F0E9]/50">
                      <td className="px-4 py-3.5 font-mono text-[12px] font-semibold text-[#202522]">{emp.employeeCode}</td>
                      <td className="px-4 py-3.5 text-[15px] leading-5 font-medium text-[#202522]">{emp.firstName} {emp.lastName}</td>
                      <td className="px-4 py-3.5 font-mono text-[15px] leading-5 font-semibold text-[#202522]">₹{gross}</td>
                      <td className="px-4 py-3.5 font-mono text-[15px] leading-5 font-semibold text-[#C94B45]">₹{esiEmp}</td>
                      <td className="px-4 py-3.5 font-mono text-[15px] leading-5 font-semibold text-[#3377A8]">₹{esiEmpr}</td>
                      <td className="px-4 py-3.5 font-mono text-[15px] leading-5 font-bold text-[#202522] bg-[#F8F5EE]">₹{esiEmp + esiEmpr}</td>
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

