'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { Users } from 'lucide-react';
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
          <h1 className="text-[30px] leading-[38px] font-semibold tracking-[-0.02em] text-[#202522] flex items-center gap-2">
            <Users className="w-7 h-7 text-[#0F5B55]" />
            Manpower Requirement vs Scheduled Planning
          </h1>
          <p className="mt-1 text-[14px] leading-5 font-normal text-[#66706B]">
            Evaluate required headcount against actual rostered staff to instantly highlight operational manpower shortages and over-allocation.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-[10px] border border-[#E5E2DB] shadow-brand-xs flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">Target Location</label>
            <select
              value={selectedLoc}
              onChange={(e) => setSelectedLoc(e.target.value)}
              className="h-11 bg-[#F3F0E9] border border-[#E5E2DB] text-[15px] rounded-[8px] px-3.5 text-[#202522] font-medium"
            >
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">Planning Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 bg-[#F3F0E9] border border-[#E5E2DB] text-[15px] rounded-[8px] px-3.5 text-[#202522] font-medium"
            />
          </div>
        </div>

        {/* Department Wise Shift Manpower Cards */}
        <div className="space-y-6">
          {departments.map((dept) => {
            const deptEmps = locEmps.filter(e => e.currentAssignment.departmentId === dept.id);
            if (deptEmps.length === 0) return null;

            return (
              <div key={dept.id} className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-[#E5E2DB]">
                  <div>
                    <h3 className="text-[20px] leading-[28px] font-semibold text-[#0F5B55]">{dept.name}</h3>
                    <p className="text-[14px] text-[#66706B] mt-0.5">{deptEmps.length} Total Assigned Staff in Location</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {shifts.slice(0, 3).map((shift) => {
                    const scheduled = rosterAssignments.filter(ra => 
                      ra.date === date && 
                      (ra.shiftId === shift.id || ra.shiftId === shift.code) &&
                      deptEmps.some(e => e.id === ra.employeeId)
                    ).length;

                    const required = dept.id === 'dept-1' ? 8 : (dept.id === 'dept-2' ? 6 : 4);
                    const shortage = required - scheduled;

                    return (
                      <div key={shift.id} className={`p-4 rounded-[10px] border ${shortage > 0 ? 'bg-[#C94B45]/5 border-[#C94B45]/30' : 'bg-[#23865B]/5 border-[#23865B]/30'}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-[16px] font-semibold text-[#202522]">{shift.name} ({shift.code})</span>
                          <span className={`px-2.5 py-1 rounded-full text-[12px] font-semibold ${shortage > 0 ? 'bg-[#C94B45]/10 text-[#C94B45] border border-[#C94B45]/20' : 'bg-[#23865B]/10 text-[#23865B] border border-[#23865B]/20'}`}>
                            {shortage > 0 ? `Shortage: -${shortage}` : 'Optimal Staffing'}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center mt-3 pt-3 border-t border-[#E5E2DB]">
                          <div>
                            <span className="text-[12px] text-[#66706B] font-medium uppercase block">Required</span>
                            <span className="text-[18px] font-bold text-[#202522]">{required}</span>
                          </div>
                          <div>
                            <span className="text-[12px] text-[#66706B] font-medium uppercase block">Scheduled</span>
                            <span className="text-[18px] font-bold text-[#0F5B55]">{scheduled}</span>
                          </div>
                          <div>
                            <span className="text-[12px] text-[#66706B] font-medium uppercase block">Variance</span>
                            <span className={`text-[18px] font-bold ${shortage > 0 ? 'text-[#C94B45]' : 'text-[#23865B]'}`}>
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
