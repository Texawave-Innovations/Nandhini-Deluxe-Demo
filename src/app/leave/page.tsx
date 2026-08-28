'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { Palmtree, Plus, CheckCircle2, Calendar, FileText } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function LeaveManagementPage() {
  const { leaveTypes, leaveBalances, leaveRequests, holidays, employees, submitLeaveRequest, approveLeaveRequest } = useHRMSStore();
  const [showApplyModal, setShowApplyModal] = useState(false);

  const [selectedEmpId, setSelectedEmpId] = useState('emp-1');
  const [leaveTypeId, setLeaveTypeId] = useState('lt-1');
  const [startDate, setStartDate] = useState('2026-08-29');
  const [endDate, setEndDate] = useState('2026-08-30');
  const [reason, setReason] = useState('Personal family event');

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    submitLeaveRequest({
      employeeId: selectedEmpId,
      leaveTypeId,
      startDate,
      endDate,
      isHalfDay: false,
      totalDays: 2,
      reason
    });
    setShowApplyModal(false);
  };

  return (
    <ShellLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Palmtree className="w-5 h-5 text-blue-600" />
              Leave Management & Holiday Calendar
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Leave policies, balances, leave application workflows, and location holiday calendars.
            </p>
          </div>

          <button
            onClick={() => setShowApplyModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Apply Leave Request</span>
          </button>
        </div>

        {/* Leave Balances Grid Requirement #13 */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {leaveTypes.map(type => (
            <div key={type.id} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                <span>{type.name}</span>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] uppercase font-mono">{type.code}</span>
              </div>
              <div className="text-xl font-bold text-slate-900">{type.annualAllocation} Days / Year</div>
              <div className="text-[10px] text-slate-500">{type.isCarryForward ? `Carry forward up to ${type.maxCarryForwardDays}d` : 'No Carry Forward'}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leave Requests Table */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Leave Applications & Approval Status</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-slate-100 uppercase text-[10px] text-slate-600 font-semibold">
                  <tr>
                    <th className="px-3 py-2">Employee</th>
                    <th className="px-3 py-2">Leave Type</th>
                    <th className="px-3 py-2">Dates</th>
                    <th className="px-3 py-2">Reason</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {leaveRequests.map(req => {
                    const emp = employees.find(e => e.id === req.employeeId);
                    const lt = leaveTypes.find(t => t.id === req.leaveTypeId);

                    return (
                      <tr key={req.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 font-bold text-slate-900">{emp?.firstName} {emp?.lastName}</td>
                        <td className="px-3 py-2 font-semibold text-blue-600">{lt?.name}</td>
                        <td className="px-3 py-2 font-mono">{req.startDate} to {req.endDate}</td>
                        <td className="px-3 py-2 text-slate-500 italic max-w-xs truncate">&quot;{req.reason}&quot;</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                            req.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {req.status === 'PENDING' && (
                            <button
                              onClick={() => approveLeaveRequest(req.id, 'HR Admin')}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[10px] font-semibold hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Holiday Calendar Column Requirement #14 */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              Annual Holiday Calendar (2026)
            </h2>

            <div className="space-y-2">
              {holidays.map(hol => (
                <div key={hol.id} className="p-3 bg-slate-50 rounded border border-slate-200 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{hol.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">{hol.type} Holiday</div>
                  </div>
                  <div className="font-mono font-bold text-slate-800 bg-amber-100 text-amber-900 px-2 py-1 rounded">
                    {hol.date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Apply Leave Modal */}
        {showApplyModal && (
          <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center">
                <h3 className="text-sm font-bold">Apply Employee Leave Request</h3>
                <button onClick={() => setShowApplyModal(false)} className="text-xs font-bold">✕</button>
              </div>

              <form onSubmit={handleSubmitLeave} className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">Employee</label>
                  <select value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)} className="w-full border text-xs p-2 rounded">
                    {employees.filter(e => e.status !== 'INACTIVE').map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Leave Type</label>
                  <select value={leaveTypeId} onChange={e => setLeaveTypeId(e.target.value)} className="w-full border text-xs p-2 rounded">
                    {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1">Start Date</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full border text-xs p-2 rounded" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1">End Date</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="w-full border text-xs p-2 rounded" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Reason</label>
                  <textarea value={reason} onChange={e => setReason(e.target.value)} required className="w-full border text-xs p-2 rounded h-20" />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowApplyModal(false)} className="px-3 py-1.5 bg-slate-200 text-xs font-semibold rounded">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded shadow">Submit Application</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}

