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
            <h1 className="text-[30px] leading-[38px] font-semibold tracking-[-0.02em] text-[#202522] flex items-center gap-2">
              <Palmtree className="w-7 h-7 text-[#0F5B55]" />
              Leave Management & Holiday Calendar
            </h1>
            <p className="mt-1 text-[14px] leading-5 font-normal text-[#66706B]">
              Leave policies, balances, leave application workflows, and location holiday calendars.
            </p>
          </div>

          <button
            onClick={() => setShowApplyModal(true)}
            className="flex items-center space-x-2 px-4 h-11 bg-[#0F5B55] hover:bg-[#08463F] text-white text-[14px] leading-5 font-semibold rounded-[8px] shadow-brand-xs transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Apply Leave Request</span>
          </button>
        </div>

        {/* Leave Balances Grid Requirement #13 */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {leaveTypes.map(type => (
            <div key={type.id} className="bg-white rounded-[10px] border border-[#E5E2DB] p-4 shadow-brand-xs space-y-2">
              <div className="flex justify-between items-center text-[14px] font-semibold text-[#202522]">
                <span>{type.name}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#0F5B55]/10 text-[#0F5B55] text-[12px] font-semibold font-mono">{type.code}</span>
              </div>
              <div className="text-[24px] leading-[30px] font-bold text-[#0F5B55]">{type.annualAllocation} Days / Year</div>
              <div className="text-[12px] font-semibold text-[#66706B]">{type.isCarryForward ? `Carry forward up to ${type.maxCarryForwardDays}d` : 'No Carry Forward'}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leave Requests Table */}
          <div className="lg:col-span-2 bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs p-5 space-y-4">
            <h2 className="text-[20px] leading-[28px] font-semibold text-[#0F5B55]">Leave Applications & Approval Status</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[#202522]">
                <thead className="bg-[#F3F0E9]/60 border-b border-[#E5E2DB]">
                  <tr>
                    <th className="px-3.5 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Employee</th>
                    <th className="px-3.5 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Leave Type</th>
                    <th className="px-3.5 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Dates</th>
                    <th className="px-3.5 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Reason</th>
                    <th className="px-3.5 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Status</th>
                    <th className="px-3.5 py-3 text-right text-[13px] leading-5 font-semibold text-[#66706B]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2DB]">
                  {leaveRequests.map(req => {
                    const emp = employees.find(e => e.id === req.employeeId);
                    const lt = leaveTypes.find(t => t.id === req.leaveTypeId);

                    return (
                      <tr key={req.id} className="hover:bg-[#F3F0E9]/50">
                        <td className="px-3.5 py-3.5 text-[15px] leading-5 font-medium text-[#202522]">{emp?.firstName} {emp?.lastName}</td>
                        <td className="px-3.5 py-3.5 text-[15px] leading-5 font-medium text-[#0F5B55]">{lt?.name}</td>
                        <td className="px-3.5 py-3.5 font-mono text-[14px] text-[#202522]">{req.startDate} to {req.endDate}</td>
                        <td className="px-3.5 py-3.5 text-[14px] text-[#66706B] italic max-w-xs truncate">&quot;{req.reason}&quot;</td>
                        <td className="px-3.5 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[12px] leading-4 font-semibold ${
                            req.status === 'APPROVED' ? 'bg-[#23865B]/10 text-[#23865B] border border-[#23865B]/20' :
                            req.status === 'PENDING' ? 'bg-[#C68A28]/10 text-[#C68A28] border border-[#C68A28]/20' : 'bg-[#C94B45]/10 text-[#C94B45] border border-[#C94B45]/20'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-3.5 py-3.5 text-right">
                          {req.status === 'PENDING' && (
                            <button
                              onClick={() => approveLeaveRequest(req.id, 'HR Admin')}
                              className="px-3 py-1.5 bg-[#23865B] text-white rounded-[6px] text-[13px] leading-5 font-semibold hover:bg-[#1b6b48] cursor-pointer shadow-brand-xs"
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
          <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs p-5 space-y-4">
            <h2 className="text-[20px] leading-[28px] font-semibold text-[#0F5B55] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#C59A45]" />
              Annual Holiday Calendar (2026)
            </h2>

            <div className="space-y-2">
              {holidays.map(hol => (
                <div key={hol.id} className="p-3.5 bg-[#F8F5EE] rounded-[8px] border border-[#E5E2DB] flex justify-between items-center text-[14px]">
                  <div>
                    <div className="font-semibold text-[#202522]">{hol.name}</div>
                    <div className="text-[12px] text-[#66706B] font-semibold">{hol.type} Holiday</div>
                  </div>
                  <div className="font-mono font-semibold text-[#08463F] bg-[#C59A45]/20 text-[13px] px-2.5 py-1 rounded-[6px]">
                    {hol.date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Apply Leave Modal */}
        {showApplyModal && (
          <div className="fixed inset-0 bg-[#202522]/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[10px] shadow-xl w-full max-w-md overflow-hidden border border-[#E5E2DB]">
              <div className="bg-[#0F5B55] text-white px-5 py-3.5 flex justify-between items-center">
                <h3 className="text-[18px] leading-6 font-semibold">Apply Employee Leave Request</h3>
                <button onClick={() => setShowApplyModal(false)} className="text-sm font-bold text-white/80 hover:text-white cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleSubmitLeave} className="p-5 space-y-4">
                <div>
                  <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">Employee</label>
                  <select value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)} className="w-full h-11 border border-[#E5E2DB] text-[15px] px-3.5 rounded-[8px] text-[#202522] font-medium">
                    {employees.filter(e => e.status !== 'INACTIVE').map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">Leave Type</label>
                  <select value={leaveTypeId} onChange={e => setLeaveTypeId(e.target.value)} className="w-full h-11 border border-[#E5E2DB] text-[15px] px-3.5 rounded-[8px] text-[#202522] font-medium">
                    {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">Start Date</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full h-11 border border-[#E5E2DB] text-[15px] px-3.5 rounded-[8px] text-[#202522]" />
                  </div>
                  <div>
                    <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">End Date</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="w-full h-11 border border-[#E5E2DB] text-[15px] px-3.5 rounded-[8px] text-[#202522]" />
                  </div>
                </div>

                <div>
                  <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">Reason</label>
                  <textarea value={reason} onChange={e => setReason(e.target.value)} required className="w-full border border-[#E5E2DB] text-[15px] p-3 rounded-[8px] text-[#202522] h-24" />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowApplyModal(false)} className="px-4 h-11 bg-[#F3F0E9] text-[14px] font-medium text-[#202522] rounded-[8px]">Cancel</button>
                  <button type="submit" className="px-4 h-11 bg-[#0F5B55] hover:bg-[#08463F] text-white text-[14px] font-semibold rounded-[8px] shadow-brand-xs">Submit Application</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}

