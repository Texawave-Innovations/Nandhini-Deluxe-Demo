'use client';

import React from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { Layers } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function ShiftTemplatesPage() {
  const { shiftTemplates } = useHRMSStore();

  return (
    <ShellLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-[30px] leading-[38px] font-semibold tracking-[-0.02em] text-[#202522] flex items-center gap-2">
            <Layers className="w-7 h-7 text-[#0F5B55]" />
            Reusable Shift Rotation Templates
          </h1>
          <p className="mt-1 text-[14px] leading-5 font-normal text-[#66706B]">
            Standard weekly rotation schedules used for 1-click bulk roster generation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shiftTemplates.map(tmpl => (
            <div key={tmpl.id} className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs space-y-3">
              <span className="text-[12px] font-mono font-semibold bg-[#0F5B55]/10 text-[#0F5B55] px-2.5 py-0.5 rounded-full border border-[#0F5B55]/20">
                {tmpl.code}
              </span>
              <h3 className="text-[17px] leading-6 font-semibold text-[#202522]">{tmpl.name}</h3>

              <div className="grid grid-cols-7 gap-1 text-center font-mono text-[12px] bg-[#F8F5EE] p-3 rounded-[8px] border border-[#E5E2DB]">
                <div className="text-[#202522]">Mon: M1</div>
                <div className="text-[#202522]">Tue: M1</div>
                <div className="text-[#202522]">Wed: M1</div>
                <div className="text-[#202522]">Thu: M1</div>
                <div className="text-[#202522]">Fri: M1</div>
                <div className="text-[#202522]">Sat: M1</div>
                <div className="text-[#C94B45] font-semibold">Sun: OFF</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ShellLayout>
  );
}
