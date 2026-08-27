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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-blue-600" />
              HR Helpdesk & Grievance Tickets
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Submit inquiries regarding payroll, attendance, or workplace facilities.</p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Raise New HR Ticket</span>
          </button>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-900 text-white uppercase text-[10px] font-semibold">
              <tr>
                <th className="px-4 py-3">Ticket Code</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Submitted At</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {hrTickets.map(t => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold">{t.ticketCode}</td>
                  <td className="px-4 py-3 font-semibold text-blue-700">{t.category}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{t.subject}</td>
                  <td className="px-4 py-3 font-mono">{t.submittedAt}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
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
          <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center">
                <h3 className="text-sm font-bold">Raise HR Helpdesk Inquiry Ticket</h3>
                <button onClick={() => setShowModal(false)} className="text-xs font-bold">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full border text-xs p-2 rounded">
                    <option value="PAYROLL_DISPUTE">Payroll & Salary Dispute</option>
                    <option value="LEAVE_QUERY">Leave Balance Query</option>
                    <option value="ATTENDANCE_CORRECTION">Attendance Correction</option>
                    <option value="WORKPLACE_FACILITY">Workplace & Uniform Facility</option>
                    <option value="OTHER">Other Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Subject</label>
                  <input type="text" value={subject} onChange={e => setSubject(e.target.value)} required className="w-full border text-xs p-2 rounded" />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Detailed Inquiry Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} required className="w-full border text-xs p-2 rounded h-24" />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 bg-slate-200 text-xs font-semibold rounded">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded shadow">Submit Ticket</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </EmployeePortalLayout>
  );
}

