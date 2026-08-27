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
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            Reusable Shift Rotation Templates
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Standard weekly rotation schedules used for 1-click bulk roster generation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shiftTemplates.map(tmpl => (
            <div key={tmpl.id} className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-3">
              <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                {tmpl.code}
              </span>
              <h3 className="text-sm font-bold text-slate-900">{tmpl.name}</h3>

              <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] bg-slate-50 p-2 rounded">
                <div>Mon: M1</div>
                <div>Tue: M1</div>
                <div>Wed: M1</div>
                <div>Thu: M1</div>
                <div>Fri: M1</div>
                <div>Sat: M1</div>
                <div className="text-red-600 font-bold">Sun: OFF</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ShellLayout>
  );
}

