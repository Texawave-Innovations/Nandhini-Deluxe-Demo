'use client';

import React from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { Users, ChevronDown, Building, ShieldCheck } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function OrgChartPage() {
  const { employees, locations, departments } = useHRMSStore();
  const gm = employees[0];

  return (
    <ShellLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Visual Organization Tree Hierarchy
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            TexaWave ERP Hierarchy Engine: Interactive reporting line organization structure.
          </p>
        </div>

        {/* Tree Render Container */}
        <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm text-center space-y-8 overflow-x-auto">
          {/* Level 1 GM */}
          <div className="inline-block bg-slate-900 text-white p-4 rounded-lg shadow-md w-64 border border-slate-800">
            <span className="text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded uppercase">
              Group Executive GM
            </span>
            <h3 className="font-bold text-sm mt-1">{gm.firstName} {gm.lastName}</h3>
            <div className="text-[10px] text-slate-400 font-mono">{gm.employeeCode}</div>
          </div>

          <div className="w-px h-6 bg-slate-300 mx-auto" />

          {/* Level 2 Location Managers */}
          <div className="flex justify-center space-x-6">
            {locations.slice(0, 3).map(loc => (
              <div key={loc.id} className="bg-slate-50 p-4 rounded-lg border border-slate-300 w-56 space-y-1 shadow-sm">
                <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded uppercase">
                  {loc.code}
                </span>
                <h4 className="font-bold text-xs text-slate-900 mt-1">{loc.name} Head</h4>
                <p className="text-[10px] text-slate-500">12 Direct Reporting Staff</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}

