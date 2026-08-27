'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { CalendarDays, Filter, Lock, Send, Download } from 'lucide-react';
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
    e.currentAssignment.locationId === selectedLoc && e.currentAssignment.departmentId === selectedDept
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
      return { code: 'LV', color: 'bg-[#C68A28]/10 text-[#C68A28] border-[#C68A28]/30 font-bold' };
    }

    return {
      code: shift?.code || 'M1',
      color: 'bg-[#0F5B55]/10 text-[#0F5B55] border-[#0F5B55]/30 font-bold'
    };
  };

  return (
    <ShellLayout>
      <div className="space-y-5 font-sans">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#202522] tracking-tight flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-[#0F5B55]" />
              Monthly Roster Grid Engine
            </h1>
            <p className="text-xs text-[#66706B] font-medium mt-0.5">
              Workforce shift planning grid with shift cell reassignment, template bulk application & publishing locks.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => publishRoster(selectedLoc, selectedDept, selectedMonth)}
              className="px-4 py-2 bg-[#C59A45] hover:bg-[#b08739] text-[#08463F] font-bold text-xs rounded-[8px] shadow-brand-xs flex items-center space-x-1.5"
            >
              <Send className="w-4 h-4" />
              <span>Publish Roster</span>
            </button>

            <button className="px-3 py-2 bg-white border border-[#E5E2DB] hover:bg-[#F3F0E9] text-[#202522] font-semibold text-xs rounded-[8px] shadow-brand-xs flex items-center space-x-1">
              <Download className="w-4 h-4 text-[#66706B]" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-3.5 rounded-[10px] border border-[#E5E2DB] shadow-brand-xs flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-[#66706B]">Location:</label>
              <select
                value={selectedLoc}
                onChange={(e) => setSelectedLoc(e.target.value)}
                className="bg-[#F3F0E9] border border-[#E5E2DB] text-xs rounded-[8px] px-3 py-1.5 text-[#202522] font-medium"
              >
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-[#66706B]">Department:</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-[#F3F0E9] border border-[#E5E2DB] text-xs rounded-[8px] px-3 py-1.5 text-[#202522] font-medium"
              >
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-[#66706B]">Month:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-[#F3F0E9] border border-[#E5E2DB] text-xs rounded-[8px] px-3 py-1.5 text-[#202522] font-medium"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-[#66706B]">Shift Badges:</span>
            {shifts.map(s => (
              <span key={s.id} className="text-[10px] font-bold px-2 py-0.5 rounded border bg-[#0F5B55]/10 text-[#0F5B55] border-[#0F5B55]/30">
                {s.code}: {s.startTime}-{s.endTime}
              </span>
            ))}
            <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-[#F3F0E9] text-[#66706B] border-[#E5E2DB]">OFF</span>
          </div>
        </div>

        {/* Enterprise Roster Grid Table */}
        <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#F3F0E9] text-[#66706B] font-semibold text-[11px] border-b border-[#E5E2DB]">
                <tr>
                  <th className="px-4 py-3 sticky left-0 bg-[#F3F0E9] z-10 w-48 border-r border-[#E5E2DB]">
                    Employee ({filteredEmployees.length})
                  </th>
                  {daysArray.map(d => (
                    <th key={d.dateStr} className="px-1 py-2 text-center w-10 border-r border-[#E5E2DB]/60">
                      <div className="text-[10px] font-bold text-[#66706B]">{d.dayOfWeek}</div>
                      <div className="text-xs font-bold text-[#202522]">{d.dayNum}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2DB]">
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-[#F3F0E9]/30 transition-colors">
                    <td className="px-4 py-2.5 sticky left-0 bg-white z-10 font-medium text-[#202522] border-r border-[#E5E2DB]">
                      <div className="font-bold truncate">{emp.firstName} {emp.lastName}</div>
                      <div className="text-[10px] text-[#66706B] font-mono">{emp.employeeCode}</div>
                    </td>

                    {daysArray.map(d => {
                      const badge = getShiftBadge(emp.id, d.dateStr);
                      return (
                        <td 
                          key={d.dateStr}
                          onClick={() => handleCellClick(emp.id, d.dateStr, badge.code)}
                          className="px-1 py-2 text-center border-r border-[#E5E2DB]/60 cursor-pointer hover:bg-[#0F5B55]/10 transition-colors"
                        >
                          <span className={`inline-block w-8 py-1 rounded text-[10px] border ${badge.color}`}>
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
          <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[10px] shadow-xl w-full max-w-sm overflow-hidden border border-[#E5E2DB]">
              <div className="bg-[#0F5B55] text-white px-5 py-3 flex justify-between items-center">
                <h3 className="text-sm font-semibold">Reassign Shift ({editingCell.date})</h3>
                <button onClick={() => setEditingCell(null)} className="text-xs font-bold">✕</button>
              </div>

              <div className="p-5 space-y-2">
                <label className="text-xs font-semibold text-[#66706B] block mb-2">Select Shift Assignment:</label>
                <div className="grid grid-cols-2 gap-2">
                  {shifts.map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleShiftSelect(s.id)}
                      className="p-2.5 border border-[#E5E2DB] hover:border-[#0F5B55] rounded-[8px] text-xs font-bold text-left hover:bg-[#0F5B55]/5 transition-all"
                    >
                      <div className="text-[#0F5B55]">{s.code} - {s.name}</div>
                      <div className="text-[10px] text-[#66706B] font-mono font-normal">{s.startTime} - {s.endTime}</div>
                    </button>
                  ))}
                  <button
                    onClick={() => handleShiftSelect('OFF')}
                    className="p-2.5 border border-[#E5E2DB] hover:border-[#66706B] rounded-[8px] text-xs font-bold text-left hover:bg-[#F3F0E9] transition-all"
                  >
                    <div className="text-[#66706B]">OFF - Weekly Off</div>
                    <div className="text-[10px] text-[#66706B] font-normal">Rest Day</div>
                  </button>
                  <button
                    onClick={() => handleShiftSelect('LV')}
                    className="p-2.5 border border-[#C68A28]/40 hover:border-[#C68A28] rounded-[8px] text-xs font-bold text-left bg-[#C68A28]/5 transition-all"
                  >
                    <div className="text-[#C68A28]">LV - Approved Leave</div>
                    <div className="text-[10px] text-[#C68A28] font-normal">Time Off</div>
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
