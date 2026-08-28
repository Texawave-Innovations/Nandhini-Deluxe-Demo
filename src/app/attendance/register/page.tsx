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
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-blue-600" />
              Attendance Register & Punch Exceptions
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily attendance logs calculated from hardware biometric punches matched against rostered shifts.
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <select
              value={selectedLoc}
              onChange={(e) => setSelectedLoc(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs rounded px-3 py-1.5 text-slate-700"
            >
              <option value="ALL">All Locations</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs rounded px-3 py-1.5 text-slate-700"
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs rounded px-3 py-1.5 text-slate-700 font-semibold"
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">PRESENT</option>
              <option value="LATE">LATE</option>
              <option value="MISSING_PUNCH">MISSING PUNCH</option>
              <option value="ABSENT">ABSENT</option>
              <option value="ON_LEAVE">ON LEAVE</option>
            </select>
          </div>
        </div>

        {/* Register Table Requirement #9 */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-semibold">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Shift</th>
                  <th className="px-4 py-3">First IN</th>
                  <th className="px-4 py-3">Last OUT</th>
                  <th className="px-4 py-3">Worked Hrs</th>
                  <th className="px-4 py-3">Late Mins</th>
                  <th className="px-4 py-3">OT Hrs</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Regularize</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRecords.map((rec) => {
                  const emp = employees.find(e => e.id === rec.employeeId);
                  if (!emp) return null;

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{emp.firstName} {emp.lastName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{emp.employeeCode}</div>
                      </td>
                      <td className="px-4 py-3 font-mono">{rec.date}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">Morning (M1)</td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-700">{rec.firstIn || '--:--'}</td>
                      <td className="px-4 py-3 font-mono font-bold text-amber-700">{rec.lastOut || '--:--'}</td>
                      <td className="px-4 py-3 font-bold">{rec.totalWorkedHours} Hrs</td>
                      <td className="px-4 py-3 text-purple-700 font-bold">{rec.lateMins > 0 ? `${rec.lateMins}m` : '-'}</td>
                      <td className="px-4 py-3 text-indigo-700 font-bold">{rec.otHours > 0 ? `${rec.otHours}h` : '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          rec.hasMissingPunch ? 'bg-amber-100 text-amber-800' :
                          rec.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800' :
                          rec.status === 'LATE' ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {rec.hasMissingPunch ? 'MISSING PUNCH' : rec.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => { setSelectedRecord(rec); setReqIn(rec.firstIn || '07:00'); setReqOut(rec.lastOut || '15:30'); }}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[10px] rounded"
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
          <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center">
                <h3 className="text-sm font-bold">Attendance Regularization Exception Fix</h3>
                <button onClick={() => setSelectedRecord(null)} className="text-xs font-bold">✕</button>
              </div>

              <form onSubmit={handleRegularizeSubmit} className="p-5 space-y-4">
                <div className="bg-amber-50 p-3 rounded border border-amber-200 text-xs text-amber-800 space-y-1">
                  <div className="font-bold">Target Date: {selectedRecord.date}</div>
                  <div>Current Status: {selectedRecord.hasMissingPunch ? 'Missing Punch Exception' : selectedRecord.status}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1">Requested IN Time</label>
                    <input type="time" value={reqIn} onChange={e => setReqIn(e.target.value)} required className="w-full border text-xs p-2 rounded" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1">Requested OUT Time</label>
                    <input type="time" value={reqOut} onChange={e => setReqOut(e.target.value)} required className="w-full border text-xs p-2 rounded" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Reason for Regularization</label>
                  <textarea value={reason} onChange={e => setReason(e.target.value)} required className="w-full border text-xs p-2 rounded h-20" />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setSelectedRecord(null)} className="px-3 py-1.5 bg-slate-200 text-xs font-semibold rounded">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded shadow">Submit Request</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}

