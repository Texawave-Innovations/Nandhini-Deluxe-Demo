'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { ClipboardCheck, Search, Filter, AlertTriangle, FileSpreadsheet, Plus, CheckCircle2 } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function AttendanceRegisterPage() {
  const { attendanceRecords, employees, locations, departments, shifts, submitRegularization } = useHRMSStore();

  const [selectedLoc, setSelectedLoc] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Regularization Modal State
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [reqIn, setReqIn] = useState('07:00');
  const [reqOut, setReqOut] = useState('15:30');
  const [reason, setReason] = useState('Biometric reader device fail');

  const filteredRecords = attendanceRecords.filter(rec => {
    const emp = employees.find(e => e.id === rec.employeeId);
    if (!emp || emp.status === 'INACTIVE') return false;

    const matchesSearch = `${emp.firstName} ${emp.lastName} ${emp.employeeCode}`.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = selectedLoc === 'ALL' || emp.currentAssignment.locationId === selectedLoc;
    const matchesDept = selectedDept === 'ALL' || emp.currentAssignment.departmentId === selectedDept;
    const matchesStatus = statusFilter === 'ALL' || rec.status === statusFilter || (statusFilter === 'MISSING_PUNCH' && rec.hasMissingPunch);

    return matchesSearch && matchesLoc && matchesDept && matchesStatus;
  });

  const handleRegularizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    submitRegularization({
      employeeId: selectedRecord.employeeId,
      date: selectedRecord.date,
      attendanceRecordId: selectedRecord.id,
      requestedInTime: reqIn,
      requestedOutTime: reqOut,
      reason
    });

    setSelectedRecord(null);
  };

  return (
    <ShellLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[30px] leading-[38px] font-semibold tracking-[-0.02em] text-[#202522] flex items-center gap-2">
              <ClipboardCheck className="w-7 h-7 text-[#0F5B55]" />
              Attendance Register & Punch Exceptions
            </h1>
            <p className="mt-1 text-[14px] leading-5 font-normal text-[#66706B]">
              Daily attendance logs calculated from hardware biometric punches matched against rostered shifts.
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-4 rounded-[10px] border border-[#E5E2DB] shadow-brand-xs flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#66706B]" />
            <input
              type="text"
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-[#F3F0E9] border border-[#E5E2DB] rounded-[8px] text-[15px] leading-5 text-[#202522] focus:outline-none focus:ring-1 focus:ring-[#0F5B55]"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <select
              value={selectedLoc}
              onChange={(e) => setSelectedLoc(e.target.value)}
              className="bg-[#F3F0E9] border border-[#E5E2DB] h-11 text-[15px] leading-5 rounded-[8px] px-3.5 text-[#202522] font-medium cursor-pointer"
            >
              <option value="ALL">All Locations</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-[#F3F0E9] border border-[#E5E2DB] h-11 text-[15px] leading-5 rounded-[8px] px-3.5 text-[#202522] font-medium cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#F3F0E9] border border-[#E5E2DB] h-11 text-[15px] leading-5 rounded-[8px] px-3.5 text-[#202522] font-semibold cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="MISSING_PUNCH">Missing Punch</option>
              <option value="ABSENT">Absent</option>
              <option value="ON_LEAVE">On Leave</option>
            </select>
          </div>
        </div>

        {/* Register Table Requirement #9 */}
        <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[#202522]">
              <thead className="bg-[#F3F0E9]/60 border-b border-[#E5E2DB]">
                <tr>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Employee</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Date</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Shift</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">First In</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Last Out</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Worked Hours</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Late Mins</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">OT Hours</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Status</th>
                  <th className="px-4 py-3 text-right text-[13px] leading-5 font-semibold text-[#66706B]">Regularize</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2DB]">
                {filteredRecords.map((rec) => {
                  const emp = employees.find(e => e.id === rec.employeeId);
                  if (!emp) return null;

                  return (
                    <tr key={rec.id} className="hover:bg-[#F3F0E9]/50">
                      <td className="px-4 py-3.5">
                        <div className="text-[15px] leading-5 font-medium text-[#202522]">{emp.firstName} {emp.lastName}</div>
                        <div className="text-[12px] text-[#66706B] font-mono mt-0.5">{emp.employeeCode}</div>
                      </td>
                      <td className="px-4 py-3.5 text-[15px] leading-5 font-mono text-[#202522]">{rec.date}</td>
                      <td className="px-4 py-3.5 text-[15px] leading-5 font-medium text-[#202522]">Morning (M1)</td>
                      <td className="px-4 py-3.5 text-[15px] leading-5 font-mono font-medium text-[#23865B]">{rec.firstIn || '--:--'}</td>
                      <td className="px-4 py-3.5 text-[15px] leading-5 font-mono font-medium text-[#C68A28]">{rec.lastOut || '--:--'}</td>
                      <td className="px-4 py-3.5 text-[15px] leading-5 font-medium text-[#202522]">{rec.totalWorkedHours} Hrs</td>
                      <td className="px-4 py-3.5 text-[15px] leading-5 font-medium text-[#C68A28]">{rec.lateMins > 0 ? `${rec.lateMins}m` : '-'}</td>
                      <td className="px-4 py-3.5 text-[15px] leading-5 font-medium text-[#3377A8]">{rec.otHours > 0 ? `${rec.otHours}h` : '-'}</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[12px] leading-4 font-semibold ${
                          rec.hasMissingPunch ? 'bg-[#C68A28]/10 text-[#C68A28] border border-[#C68A28]/20' :
                          rec.status === 'PRESENT' ? 'bg-[#23865B]/10 text-[#23865B] border border-[#23865B]/20' :
                          rec.status === 'LATE' ? 'bg-[#C68A28]/10 text-[#C68A28] border border-[#C68A28]/20' : 'bg-[#C94B45]/10 text-[#C94B45] border border-[#C94B45]/20'
                        }`}>
                          {rec.hasMissingPunch ? 'MISSING PUNCH' : rec.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => { setSelectedRecord(rec); setReqIn(rec.firstIn || '07:00'); setReqOut(rec.lastOut || '15:30'); }}
                          className="px-3 py-1.5 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[13px] leading-5 rounded-[6px] shadow-brand-xs cursor-pointer"
                        >
                          Request Fix
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Regularization Request Modal */}
        {selectedRecord && (
          <div className="fixed inset-0 bg-[#202522]/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[10px] shadow-xl w-full max-w-md overflow-hidden border border-[#E5E2DB]">
              <div className="bg-[#0F5B55] text-white px-5 py-3.5 flex justify-between items-center">
                <h3 className="text-[18px] leading-6 font-semibold">Attendance Exception Fix</h3>
                <button onClick={() => setSelectedRecord(null)} className="text-sm font-bold text-white/80 hover:text-white cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleRegularizeSubmit} className="p-5 space-y-4">
                <div className="bg-[#F8F5EE] p-3.5 rounded-[8px] border border-[#E5E2DB] text-[13px] leading-5 text-[#202522] space-y-1">
                  <div className="font-semibold text-[#0F5B55]">Target Date: {selectedRecord.date}</div>
                  <div>Current Status: {selectedRecord.hasMissingPunch ? 'Missing Punch Exception' : selectedRecord.status}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">Requested IN Time</label>
                    <input type="time" value={reqIn} onChange={e => setReqIn(e.target.value)} required className="w-full h-11 border border-[#E5E2DB] text-[15px] px-3.5 rounded-[8px] text-[#202522]" />
                  </div>
                  <div>
                    <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">Requested OUT Time</label>
                    <input type="time" value={reqOut} onChange={e => setReqOut(e.target.value)} required className="w-full h-11 border border-[#E5E2DB] text-[15px] px-3.5 rounded-[8px] text-[#202522]" />
                  </div>
                </div>

                <div>
                  <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">Reason for Regularization</label>
                  <textarea value={reason} onChange={e => setReason(e.target.value)} required className="w-full border border-[#E5E2DB] text-[15px] p-3 rounded-[8px] text-[#202522] h-24" />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setSelectedRecord(null)} className="px-4 h-11 bg-[#F3F0E9] text-[14px] font-medium text-[#202522] rounded-[8px]">Cancel</button>
                  <button type="submit" className="px-4 h-11 bg-[#0F5B55] hover:bg-[#08463F] text-white text-[14px] font-semibold rounded-[8px] shadow-brand-xs">Submit Request</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}

