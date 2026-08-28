'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { RefreshCw, Plus } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function ShiftSwapPage() {
  const { shiftSwapRequests, employees, submitShiftSwap, approveShiftSwap } = useHRMSStore();
  const [showSwapModal, setShowSwapModal] = useState(false);

  const [reqEmpId, setReqEmpId] = useState('emp-1');
  const [targetEmpId, setTargetEmpId] = useState('emp-2');
  const [date, setDate] = useState('2026-08-28');

  const handleSwapSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitShiftSwap({
      requestorEmployeeId: reqEmpId,
      requestorDate: date,
      requestorShiftId: 'shift-m1',
      targetEmployeeId: targetEmpId,
      targetDate: date,
      targetShiftId: 'shift-e1'
    });
    setShowSwapModal(false);
  };

  return (
    <ShellLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[30px] leading-[38px] font-semibold tracking-[-0.02em] text-[#202522] flex items-center gap-2">
              <RefreshCw className="w-7 h-7 text-[#0F5B55]" />
              Peer-to-Peer Shift Swap Engine
            </h1>
            <p className="mt-1 text-[14px] leading-5 font-normal text-[#66706B]">
              Request shift exchanges between eligible employees with automated roster sync upon manager approval.
            </p>
          </div>

          <button
            onClick={() => setShowSwapModal(true)}
            className="flex items-center space-x-2 px-4 h-11 bg-[#0F5B55] hover:bg-[#08463F] text-white text-[14px] leading-5 font-semibold rounded-[8px] shadow-brand-xs transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Request Shift Swap</span>
          </button>
        </div>

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs p-5 space-y-4">
          <h2 className="text-[20px] leading-[28px] font-semibold text-[#0F5B55]">Shift Swap Requests Queue</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[#202522]">
              <thead className="bg-[#F3F0E9]/60 border-b border-[#E5E2DB]">
                <tr>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Requestor</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Swap With</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Target Date</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Status</th>
                  <th className="px-4 py-3 text-right text-[13px] leading-5 font-semibold text-[#66706B]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2DB]">
                {shiftSwapRequests.map(swap => {
                  const reqEmp = employees.find(e => e.id === swap.requestorEmployeeId);
                  const tarEmp = employees.find(e => e.id === swap.targetEmployeeId);

                  return (
                    <tr key={swap.id} className="hover:bg-[#F3F0E9]/50">
                      <td className="px-4 py-3.5 text-[15px] leading-5 font-medium text-[#202522]">{reqEmp?.firstName} {reqEmp?.lastName}</td>
                      <td className="px-4 py-3.5 text-[15px] leading-5 font-medium text-[#202522]">{tarEmp?.firstName} {tarEmp?.lastName}</td>
                      <td className="px-4 py-3.5 font-mono text-[14px] text-[#202522]">{swap.requestorDate}</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[12px] leading-4 font-semibold ${
                          swap.managerStatus === 'APPROVED' ? 'bg-[#23865B]/10 text-[#23865B] border border-[#23865B]/20' : 'bg-[#C68A28]/10 text-[#C68A28] border border-[#C68A28]/20'
                        }`}>
                          {swap.managerStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {swap.managerStatus === 'PENDING' && (
                          <button
                            onClick={() => approveShiftSwap(swap.id)}
                            className="px-4 h-11 bg-[#23865B] text-white text-[14px] leading-5 font-semibold rounded-[8px] shadow-brand-xs hover:bg-[#1b6b48] cursor-pointer"
                          >
                            Approve Swap & Update Roster
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

        {/* Swap Modal */}
        {showSwapModal && (
          <div className="fixed inset-0 bg-[#202522]/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[10px] shadow-xl w-full max-w-md overflow-hidden border border-[#E5E2DB]">
              <div className="bg-[#0F5B55] text-white px-5 py-3.5 flex justify-between items-center">
                <h3 className="text-[18px] leading-6 font-semibold">Request Peer Shift Swap</h3>
                <button onClick={() => setShowSwapModal(false)} className="text-sm font-bold text-white/80 hover:text-white cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleSwapSubmit} className="p-5 space-y-4">
                <div>
                  <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">Requesting Employee</label>
                  <select value={reqEmpId} onChange={e => setReqEmpId(e.target.value)} className="w-full h-11 border border-[#E5E2DB] text-[15px] px-3.5 rounded-[8px] text-[#202522] font-medium">
                    {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">Target Swap Employee</label>
                  <select value={targetEmpId} onChange={e => setTargetEmpId(e.target.value)} className="w-full h-11 border border-[#E5E2DB] text-[15px] px-3.5 rounded-[8px] text-[#202522] font-medium">
                    {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">Date of Swap</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full h-11 border border-[#E5E2DB] text-[15px] px-3.5 rounded-[8px] text-[#202522]" />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowSwapModal(false)} className="px-4 h-11 bg-[#F3F0E9] text-[14px] font-medium text-[#202522] rounded-[8px]">Cancel</button>
                  <button type="submit" className="px-4 h-11 bg-[#0F5B55] hover:bg-[#08463F] text-white text-[14px] font-semibold rounded-[8px] shadow-brand-xs">Submit Swap Request</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
