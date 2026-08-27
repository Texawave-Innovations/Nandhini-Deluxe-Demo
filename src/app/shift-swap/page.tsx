'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { RefreshCw, Plus, CheckCircle2 } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function ShiftSwapPage() {
  const { shiftSwapRequests, employees, shifts, submitShiftSwap, approveShiftSwap } = useHRMSStore();
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
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              Peer-to-Peer Shift Swap Engine
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Request shift exchanges between eligible employees with automated roster sync upon manager approval.
            </p>
          </div>

          <button
            onClick={() => setShowSwapModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Request Shift Swap</span>
          </button>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Shift Swap Requests Queue</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-100 uppercase text-[10px] text-slate-600 font-semibold">
                <tr>
                  <th className="px-3 py-2">Requestor</th>
                  <th className="px-3 py-2">Swap With</th>
                  <th className="px-3 py-2">Target Date</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {shiftSwapRequests.map(swap => {
                  const reqEmp = employees.find(e => e.id === swap.requestorEmployeeId);
                  const tarEmp = employees.find(e => e.id === swap.targetEmployeeId);

                  return (
                    <tr key={swap.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-bold text-slate-900">{reqEmp?.firstName} {reqEmp?.lastName}</td>
                      <td className="px-3 py-2 font-bold text-slate-900">{tarEmp?.firstName} {tarEmp?.lastName}</td>
                      <td className="px-3 py-2 font-mono">{swap.requestorDate}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          swap.managerStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {swap.managerStatus}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {swap.managerStatus === 'PENDING' && (
                          <button
                            onClick={() => approveShiftSwap(swap.id)}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[10px] font-semibold hover:bg-emerald-700"
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
          <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center">
                <h3 className="text-sm font-bold">Request Peer Shift Swap</h3>
                <button onClick={() => setShowSwapModal(false)} className="text-xs font-bold">✕</button>
              </div>

              <form onSubmit={handleSwapSubmit} className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">Requesting Employee</label>
                  <select value={reqEmpId} onChange={e => setReqEmpId(e.target.value)} className="w-full border text-xs p-2 rounded">
                    {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Target Swap Employee</label>
                  <select value={targetEmpId} onChange={e => setTargetEmpId(e.target.value)} className="w-full border text-xs p-2 rounded">
                    {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Date of Swap</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full border text-xs p-2 rounded" />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowSwapModal(false)} className="px-3 py-1.5 bg-slate-200 text-xs font-semibold rounded">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded shadow">Submit Swap Request</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}

