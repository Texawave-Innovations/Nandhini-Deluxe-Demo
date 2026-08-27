'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { Ticket, CheckCircle2 } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function AdminTicketsPage() {
  const { hrTickets, employees, resolveHrTicket } = useHRMSStore();
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [resolution, setResolution] = useState('Reviewed OT logs and approved 1.5 hrs manual adjustment.');

  const handleResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    resolveHrTicket(selectedTicket.id, resolution);
    setSelectedTicket(null);
  };

  return (
    <ShellLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-blue-600" />
            HR Helpdesk & Grievances Manager
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            TexaWave Helpdesk Engine: Review employee tickets regarding payroll disputes, leave queries, and workplace facilities.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-900 text-white uppercase text-[10px] font-semibold">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {hrTickets.map(t => {
                const emp = employees.find(e => e.id === t.employeeId);
                return (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold">{t.ticketCode}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{emp?.firstName} {emp?.lastName}</td>
                    <td className="px-4 py-3 font-semibold text-blue-700">{t.category}</td>
                    <td className="px-4 py-3">{t.subject}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 uppercase">
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {t.status === 'OPEN' && (
                        <button
                          onClick={() => setSelectedTicket(t)}
                          className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded hover:bg-emerald-700 shadow"
                        >
                          Resolve Inquiry
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center">
                <h3 className="text-sm font-bold">Resolve Helpdesk Ticket: {selectedTicket.ticketCode}</h3>
                <button onClick={() => setSelectedTicket(null)} className="text-xs font-bold">✕</button>
              </div>

              <form onSubmit={handleResolve} className="p-5 space-y-4">
                <div className="bg-slate-50 p-3 rounded text-xs text-slate-700 space-y-1 border">
                  <div className="font-bold">{selectedTicket.subject}</div>
                  <div className="italic">&quot;{selectedTicket.description}&quot;</div>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">HR Resolution Notes</label>
                  <textarea value={resolution} onChange={e => setResolution(e.target.value)} required className="w-full border text-xs p-2 rounded h-24" />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setSelectedTicket(null)} className="px-3 py-1.5 bg-slate-200 text-xs font-semibold rounded">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded shadow">Mark Resolved</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}

