'use client';

import React, { useState } from 'react';
import EmployeePortalLayout from '@/components/layout/EmployeePortalLayout';
import { Ticket, Plus, CheckCircle2 } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function ESSRaiseTicketPage() {
  const { hrTickets, submitHrTicket } = useHRMSStore();
  const [showModal, setShowModal] = useState(false);

  const [category, setCategory] = useState<'PAYROLL_DISPUTE' | 'LEAVE_QUERY' | 'ATTENDANCE_CORRECTION' | 'WORKPLACE_FACILITY' | 'OTHER'>('PAYROLL_DISPUTE');
  const [subject, setSubject] = useState('Overtime Calculation Inquiry');
  const [description, setDescription] = useState('Please review OT hours calculated for my night shift last week.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitHrTicket({
      employeeId: 'emp-1',
      category,
      subject,
      description,
      priority: 'MEDIUM'
    });
    setShowModal(false);
  };

  return (
    <EmployeePortalLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[30px] leading-[38px] font-semibold tracking-[-0.02em] text-[#202522] flex items-center gap-2">
              <Ticket className="w-7 h-7 text-[#0F5B55]" />
              HR Helpdesk & Grievance Tickets
            </h1>
            <p className="mt-1 text-[14px] leading-5 font-normal text-[#66706B]">Submit inquiries regarding payroll, attendance, or workplace facilities.</p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 h-11 bg-[#0F5B55] hover:bg-[#08463F] text-white text-[14px] leading-5 font-semibold rounded-[8px] shadow-brand-xs transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Raise New HR Ticket</span>
          </button>
        </div>

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs overflow-hidden">
          <table className="w-full text-left text-[#202522]">
            <thead className="bg-[#F3F0E9]/60 border-b border-[#E5E2DB]">
              <tr>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Ticket Code</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Category</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Subject</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Submitted At</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E2DB]">
              {hrTickets.map(t => (
                <tr key={t.id} className="hover:bg-[#F3F0E9]/50">
                  <td className="px-4 py-3.5 font-mono text-[12px] font-semibold text-[#202522]">{t.ticketCode}</td>
                  <td className="px-4 py-3.5 text-[15px] leading-5 font-medium text-[#0F5B55]">{t.category}</td>
                  <td className="px-4 py-3.5 text-[15px] leading-5 font-medium text-[#202522]">{t.subject}</td>
                  <td className="px-4 py-3.5 font-mono text-[14px] text-[#202522]">{t.submittedAt}</td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[12px] leading-4 font-semibold ${
                      t.status === 'RESOLVED' ? 'bg-[#23865B]/10 text-[#23865B] border border-[#23865B]/20' : 'bg-[#C68A28]/10 text-[#C68A28] border border-[#C68A28]/20'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-[#202522]/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[10px] shadow-xl w-full max-w-md overflow-hidden border border-[#E5E2DB]">
              <div className="bg-[#0F5B55] text-white px-5 py-3.5 flex justify-between items-center">
                <h3 className="text-[18px] leading-6 font-semibold">Raise HR Helpdesk Inquiry Ticket</h3>
                <button onClick={() => setShowModal(false)} className="text-sm font-bold text-white/80 hover:text-white cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full h-11 border border-[#E5E2DB] text-[15px] px-3.5 rounded-[8px] text-[#202522] font-medium">
                    <option value="PAYROLL_DISPUTE">Payroll & Salary Dispute</option>
                    <option value="LEAVE_QUERY">Leave Balance Query</option>
                    <option value="ATTENDANCE_CORRECTION">Attendance Correction</option>
                    <option value="WORKPLACE_FACILITY">Workplace & Uniform Facility</option>
                    <option value="OTHER">Other Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">Subject</label>
                  <input type="text" value={subject} onChange={e => setSubject(e.target.value)} required className="w-full h-11 border border-[#E5E2DB] text-[15px] px-3.5 rounded-[8px] text-[#202522]" />
                </div>

                <div>
                  <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">Detailed Inquiry Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} required className="w-full border border-[#E5E2DB] text-[15px] p-3 rounded-[8px] text-[#202522] h-28" />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 h-11 bg-[#F3F0E9] text-[14px] font-medium text-[#202522] rounded-[8px]">Cancel</button>
                  <button type="submit" className="px-4 h-11 bg-[#0F5B55] hover:bg-[#08463F] text-white text-[14px] font-semibold rounded-[8px] shadow-brand-xs">Submit Ticket</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </EmployeePortalLayout>
  );
}

