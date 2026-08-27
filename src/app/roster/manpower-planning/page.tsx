'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { Users, AlertCircle, CheckCircle2, TrendingDown, Layers, MapPin } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function ManpowerPlanningPage() {
  const { locations, departments, shifts, employees, rosterAssignments } = useHRMSStore();
  const [selectedLoc, setSelectedLoc] = useState('loc-1');
  const [date, setDate] = useState('2026-08-27');

  const locEmps = employees.filter(e => e.currentAssignment.locationId === selectedLoc);

  return (
    <ShellLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Manpower Requirement vs Scheduled Planning
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate required headcount against actual rostered staff to instantly highlight operational manpower shortages and over-allocation.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Target Location</label>
            <select
              value={selectedLoc}
              onChange={(e) => setSelectedLoc(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-xs rounded px-3 py-1.5 text-slate-800 font-medium"
            >
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Planning Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-xs rounded px-3 py-1.5 text-slate-800 font-medium"
            />
          </div>
        </div>

        {/* Department Wise Shift Manpower Cards */}
        <div className="space-y-6">
          {departments.map((dept) => {
            const deptEmps = locEmps.filter(e => e.currentAssignment.departmentId === dept.id);
            if (deptEmps.length === 0) return null;

            return (
              <div key={dept.id} className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{dept.name}</h3>
                    <p className="text-xs text-slate-500">{deptEmps.length} Total Assigned Staff in Location</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {shifts.slice(0, 3).map((shift) => {
                    // Calculate scheduled roster count for this shift on selected date
                    const scheduled = rosterAssignments.filter(ra => 
                      ra.date === date && 
                      (ra.shiftId === shift.id || ra.shiftId === shift.code) &&
                      deptEmps.some(e => e.id === ra.employeeId)
                    ).length;

                    // Required benchmark rule based on department
                    const required = dept.id === 'dept-1' ? 8 : (dept.id === 'dept-2' ? 6 : 4);
                    const shortage = required - scheduled;

                    return (
                      <div key={shift.id} className={`p-4 rounded-lg border ${shortage > 0 ? 'bg-red-50/50 border-red-200' : 'bg-emerald-50/50 border-emerald-200'}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-900">{shift.name} ({shift.code})</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${shortage > 0 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {shortage > 0 ? `Shortage: -${shortage}` : 'Optimal Staffing'}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center mt-3 pt-3 border-t border-slate-200/60">
                          <div>
                            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Required</span>
                            <span className="text-sm font-bold text-slate-800">{required}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Scheduled</span>
                            <span className="text-sm font-bold text-blue-600">{scheduled}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Variance</span>
                            <span className={`text-sm font-bold ${shortage > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                              {shortage > 0 ? `-${shortage}` : `+${Math.abs(shortage)}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ShellLayout>
  );
}

