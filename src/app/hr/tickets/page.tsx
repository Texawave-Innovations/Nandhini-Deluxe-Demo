'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { Ticket } from 'lucide-react';
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
          <h1 className="text-[30px] leading-[38px] font-semibold tracking-[-0.02em] text-[#202522] flex items-center gap-2">
            <Ticket className="w-7 h-7 text-[#0F5B55]" />
            HR Helpdesk & Grievances Manager
          </h1>
          <p className="mt-1 text-[14px] leading-5 font-normal text-[#66706B]">
            Review employee tickets regarding payroll disputes, leave queries, and workplace facilities.
          </p>
        </div>

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs overflow-hidden">
          <table className="w-full text-left text-[#202522]">
            <thead className="bg-[#F3F0E9]/60 border-b border-[#E5E2DB]">
              <tr>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Code</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Employee</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Category</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Subject</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Priority</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Status</th>
                <th className="px-4 py-3 text-right text-[13px] leading-5 font-semibold text-[#66706B]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E2DB]">
              {hrTickets.map(t => {
                const emp = employees.find(e => e.id === t.employeeId);
                return (
                  <tr key={t.id} className="hover:bg-[#F3F0E9]/50">
                    <td className="px-4 py-3.5 font-mono text-[12px] font-semibold text-[#202522]">{t.ticketCode}</td>
                    <td className="px-4 py-3.5 text-[15px] leading-5 font-medium text-[#202522]">{emp?.firstName} {emp?.lastName}</td>
                    <td className="px-4 py-3.5 text-[15px] leading-5 font-medium text-[#0F5B55]">{t.category}</td>
                    <td className="px-4 py-3.5 text-[15px] leading-5 font-medium text-[#202522]">{t.subject}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[12px] leading-4 font-semibold bg-[#C94B45]/10 text-[#C94B45] border border-[#C94B45]/20 uppercase">
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[12px] leading-4 font-semibold ${
                        t.status === 'RESOLVED' ? 'bg-[#23865B]/10 text-[#23865B] border border-[#23865B]/20' : 'bg-[#C68A28]/10 text-[#C68A28] border border-[#C68A28]/20'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {t.status === 'OPEN' && (
                        <button
                          onClick={() => setSelectedTicket(t)}
                          className="px-4 h-11 bg-[#23865B] text-white text-[14px] leading-5 font-semibold rounded-[8px] shadow-brand-xs hover:bg-[#1b6b48] cursor-pointer"
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
          <div className="fixed inset-0 bg-[#202522]/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[10px] shadow-xl w-full max-w-md overflow-hidden border border-[#E5E2DB]">
              <div className="bg-[#0F5B55] text-white px-5 py-3.5 flex justify-between items-center">
                <h3 className="text-[18px] leading-6 font-semibold">Resolve Helpdesk Ticket: {selectedTicket.ticketCode}</h3>
                <button onClick={() => setSelectedTicket(null)} className="text-sm font-bold text-white/80 hover:text-white cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleResolve} className="p-5 space-y-4">
                <div className="bg-[#F8F5EE] p-3.5 rounded-[8px] border border-[#E5E2DB] text-[14px] leading-5 text-[#202522] space-y-1">
                  <div className="font-semibold text-[#0F5B55]">{selectedTicket.subject}</div>
                  <div className="italic text-[#66706B]">&quot;{selectedTicket.description}&quot;</div>
                </div>

                <div>
                  <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">HR Resolution Notes</label>
                  <textarea value={resolution} onChange={e => setResolution(e.target.value)} required className="w-full border border-[#E5E2DB] text-[15px] p-3 rounded-[8px] text-[#202522] h-28" />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setSelectedTicket(null)} className="px-4 h-11 bg-[#F3F0E9] text-[14px] font-medium text-[#202522] rounded-[8px]">Cancel</button>
                  <button type="submit" className="px-4 h-11 bg-[#23865B] text-white text-[14px] font-semibold rounded-[8px] shadow-brand-xs hover:bg-[#1b6b48]">Mark Resolved</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
