'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { CalendarDays, Send, Download } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function MonthlyRosterPage() {
  const { employees, locations, departments, shifts, rosterAssignments, updateRosterAssignment, publishRoster } = useHRMSStore();

  const [selectedLoc, setSelectedLoc] = useState(locations[0]?.id || 'loc-1');
  const [selectedDept, setSelectedDept] = useState(departments[0]?.id || 'dept-1');
  const [selectedMonth, setSelectedMonth] = useState('2026-08');

  // Edit Shift Cell Modal State
  const [editingCell, setEditingCell] = useState<{ employeeId: string; date: string; currentShiftId: string } | null>(null);

  const daysInMonth = 31;
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
    const dateStr = `${selectedMonth}-${dayStr}`;
    const dayOfWeek = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'narrow' });
    return { dayNum, dateStr, dayOfWeek };
  });

  const filteredEmployees = employees.filter(e => 
    e.status !== 'INACTIVE' && e.currentAssignment.locationId === selectedLoc && e.currentAssignment.departmentId === selectedDept
  );

  const handleCellClick = (employeeId: string, date: string, currentShiftId: string) => {
    setEditingCell({ employeeId, date, currentShiftId });
  };

  const handleShiftSelect = (newShiftId: string) => {
    if (editingCell) {
      updateRosterAssignment(editingCell.employeeId, editingCell.date, newShiftId);
      setEditingCell(null);
    }
  };

  const getShiftBadge = (employeeId: string, date: string) => {
    const asgn = rosterAssignments.find(r => r.employeeId === employeeId && r.date === date);
    const shiftId = asgn ? asgn.shiftId : (new Date(date).getDay() === 0 ? 'OFF' : 'shift-m1');
    const shift = shifts.find(s => s.id === shiftId);

    if (shiftId === 'OFF') {
      return { code: 'OFF', color: 'bg-[#F3F0E9] text-[#66706B] border-[#E5E2DB]' };
    }
    if (shiftId === 'LV') {
      return { code: 'LV', color: 'bg-[#C68A28]/10 text-[#C68A28] border-[#C68A28]/30 font-semibold' };
    }

    return {
      code: shift?.code || 'M1',
      color: 'bg-[#0F5B55]/10 text-[#0F5B55] border-[#0F5B55]/30 font-semibold'
    };
  };

  return (
    <ShellLayout>
      <div className="space-y-5 font-sans">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[30px] leading-[38px] font-semibold tracking-[-0.02em] text-[#202522] flex items-center gap-2">
              <CalendarDays className="w-7 h-7 text-[#0F5B55]" />
              Monthly Roster Grid Engine
            </h1>
            <p className="mt-1 text-[14px] leading-5 font-normal text-[#66706B]">
              Workforce shift planning grid with shift cell reassignment, template bulk application & publishing locks.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => publishRoster(selectedLoc, selectedDept, selectedMonth)}
              className="h-11 px-4 bg-[#C59A45] hover:bg-[#b08739] text-[#08463F] font-semibold text-[14px] leading-5 rounded-[8px] shadow-brand-xs flex items-center space-x-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Publish Roster</span>
            </button>

            <button className="h-11 px-4 bg-white border border-[#E5E2DB] hover:bg-[#F3F0E9] text-[#202522] font-semibold text-[14px] leading-5 rounded-[8px] shadow-brand-xs flex items-center space-x-2 cursor-pointer">
              <Download className="w-4 h-4 text-[#66706B]" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-4 rounded-[10px] border border-[#E5E2DB] shadow-brand-xs flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <label className="text-[14px] leading-5 font-medium text-[#202522]">Location:</label>
              <select
                value={selectedLoc}
                onChange={(e) => setSelectedLoc(e.target.value)}
                className="h-11 bg-[#F3F0E9] border border-[#E5E2DB] text-[15px] rounded-[8px] px-3.5 text-[#202522] font-medium"
              >
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-[14px] leading-5 font-medium text-[#202522]">Department:</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="h-11 bg-[#F3F0E9] border border-[#E5E2DB] text-[15px] rounded-[8px] px-3.5 text-[#202522] font-medium"
              >
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-[14px] leading-5 font-medium text-[#202522]">Month:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-11 bg-[#F3F0E9] border border-[#E5E2DB] text-[15px] rounded-[8px] px-3.5 text-[#202522] font-medium"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[13px] font-semibold text-[#66706B]">Shift Badges:</span>
            {shifts.map(s => (
              <span key={s.id} className="text-[12px] font-semibold px-2.5 py-1 rounded-full border bg-[#0F5B55]/10 text-[#0F5B55] border-[#0F5B55]/30">
                {s.code}: {s.startTime}-{s.endTime}
              </span>
            ))}
            <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full border bg-[#F3F0E9] text-[#66706B] border-[#E5E2DB]">OFF</span>
          </div>
        </div>

        {/* Enterprise Roster Grid Table */}
        <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#F3F0E9] text-[#66706B] font-semibold text-[13px] border-b border-[#E5E2DB]">
                <tr>
                  <th className="px-4 py-3 sticky left-0 bg-[#F3F0E9] z-10 w-52 border-r border-[#E5E2DB]">
                    Employee ({filteredEmployees.length})
                  </th>
                  {daysArray.map(d => (
                    <th key={d.dateStr} className="px-1 py-2 text-center w-11 border-r border-[#E5E2DB]/60">
                      <div className="text-[11px] font-semibold text-[#66706B]">{d.dayOfWeek}</div>
                      <div className="text-[13px] font-semibold text-[#202522]">{d.dayNum}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2DB]">
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-[#F3F0E9]/30 transition-colors">
                    <td className="px-4 py-3 sticky left-0 bg-white z-10 text-[14px] font-medium text-[#202522] border-r border-[#E5E2DB]">
                      <div className="font-semibold text-[#202522] truncate">{emp.firstName} {emp.lastName}</div>
                      <div className="text-[12px] text-[#66706B] font-mono">{emp.employeeCode}</div>
                    </td>

                    {daysArray.map(d => {
                      const badge = getShiftBadge(emp.id, d.dateStr);
                      return (
                        <td 
                          key={d.dateStr}
                          onClick={() => handleCellClick(emp.id, d.dateStr, badge.code)}
                          className="px-1 py-2 text-center border-r border-[#E5E2DB]/60 cursor-pointer hover:bg-[#0F5B55]/10 transition-colors"
                        >
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[12px] font-semibold border ${badge.color}`}>
                            {badge.code}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Shift Cell Reassignment Modal */}
        {editingCell && (
          <div className="fixed inset-0 bg-[#202522]/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[10px] shadow-xl w-full max-w-sm overflow-hidden border border-[#E5E2DB]">
              <div className="bg-[#0F5B55] text-white px-5 py-3.5 flex justify-between items-center">
                <h3 className="text-[18px] leading-6 font-semibold">Reassign Shift ({editingCell.date})</h3>
                <button onClick={() => setEditingCell(null)} className="text-sm font-bold text-white/80 hover:text-white cursor-pointer">✕</button>
              </div>

              <div className="p-5 space-y-3">
                <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">Select Shift Assignment:</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {shifts.map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleShiftSelect(s.id)}
                      className="p-3 border border-[#E5E2DB] hover:border-[#0F5B55] rounded-[8px] text-[14px] font-medium text-left hover:bg-[#0F5B55]/5 transition-all cursor-pointer"
                    >
                      <div className="text-[#0F5B55] font-semibold">{s.code} - {s.name}</div>
                      <div className="text-[12px] text-[#66706B] font-mono">{s.startTime} - {s.endTime}</div>
                    </button>
                  ))}
                  <button
                    onClick={() => handleShiftSelect('OFF')}
                    className="p-3 border border-[#E5E2DB] hover:border-[#66706B] rounded-[8px] text-[14px] font-medium text-left hover:bg-[#F3F0E9] transition-all cursor-pointer"
                  >
                    <div className="text-[#66706B] font-semibold">OFF - Weekly Off</div>
                    <div className="text-[12px] text-[#66706B]">Rest Day</div>
                  </button>
                  <button
                    onClick={() => handleShiftSelect('LV')}
                    className="p-3 border border-[#C68A28]/40 hover:border-[#C68A28] rounded-[8px] text-[14px] font-medium text-left bg-[#C68A28]/5 transition-all cursor-pointer"
                  >
                    <div className="text-[#C68A28] font-semibold">LV - Approved Leave</div>
                    <div className="text-[12px] text-[#C68A28]">Time Off</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
