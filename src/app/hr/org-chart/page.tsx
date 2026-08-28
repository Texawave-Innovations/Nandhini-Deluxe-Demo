'use client';

import React from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { Users } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function OrgChartPage() {
  const { employees, locations } = useHRMSStore();
  const activeEmployees = employees.filter(e => e.status !== 'INACTIVE');
  const gm = activeEmployees[0] || employees[0];

  return (
    <ShellLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-[30px] leading-[38px] font-semibold tracking-[-0.02em] text-[#202522] flex items-center gap-2">
            <Users className="w-7 h-7 text-[#0F5B55]" />
            Visual Organization Tree Hierarchy
          </h1>
          <p className="mt-1 text-[14px] leading-5 font-normal text-[#66706B]">
            Interactive reporting line organization structure across business units and locations.
          </p>
        </div>

        {/* Tree Render Container */}
        <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-8 shadow-brand-xs text-center space-y-8 overflow-x-auto">
          {/* Level 1 GM */}
          <div className="inline-block bg-[#0F5B55] text-white p-5 rounded-[10px] shadow-md w-72 border border-[#08463F]">
            <span className="text-[12px] font-semibold bg-[#C59A45] text-[#202522] px-2.5 py-0.5 rounded-full uppercase tracking-wide">
              Group Executive GM
            </span>
            <h3 className="font-semibold text-[18px] leading-6 mt-2">{gm.firstName} {gm.lastName}</h3>
            <div className="text-[12px] text-white/80 font-mono mt-0.5">{gm.employeeCode}</div>
          </div>

          <div className="w-px h-8 bg-[#E5E2DB] mx-auto" />

          {/* Level 2 Location Managers */}
          <div className="flex justify-center space-x-6">
            {locations.slice(0, 3).map(loc => (
              <div key={loc.id} className="bg-[#F8F5EE] p-5 rounded-[10px] border border-[#E5E2DB] w-64 space-y-1.5 shadow-brand-xs">
                <span className="text-[12px] font-semibold text-[#0F5B55] bg-[#0F5B55]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wide border border-[#0F5B55]/20">
                  {loc.code}
                </span>
                <h4 className="font-semibold text-[16px] text-[#202522] mt-1.5">{loc.name} Head</h4>
                <p className="text-[14px] text-[#66706B]">12 Direct Reporting Staff</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}
