'use client';

import React, { useState } from 'react';
import EmployeePortalLayout from '@/components/layout/EmployeePortalLayout';
import { DollarSign, Plus, CheckCircle2 } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function ESSMyExpensesPage() {
  const { expenseClaims, submitExpenseClaim } = useHRMSStore();
  const [showModal, setShowModal] = useState(false);

  const [category, setCategory] = useState<'TRAVEL' | 'FOOD_CLIENT' | 'OFFICE_SUPPLIES' | 'MISC'>('FOOD_CLIENT');
  const [amount, setAmount] = useState(1500);
  const [description, setDescription] = useState('Client catering testing lunch');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitExpenseClaim({
      employeeId: 'emp-1',
      category,
      amount,
      expenseDate: new Date().toISOString().substring(0, 10),
      description
    });
    setShowModal(false);
  };

  return (
    <EmployeePortalLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Reimbursement & Expense Claims
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Submit out-of-pocket work expenses with receipt attachment placeholders.</p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Expense Claim</span>
          </button>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-900 text-white uppercase text-[10px] font-semibold">
              <tr>
                <th className="px-4 py-3">Claim Code</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {expenseClaims.map(c => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold">{c.claimCode}</td>
                  <td className="px-4 py-3 font-semibold text-blue-700">{c.category}</td>
                  <td className="px-4 py-3 font-mono">{c.expenseDate}</td>
                  <td className="px-4 py-3 text-slate-600">{c.description}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">₹{c.amount}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {c.status}
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
                <h3 className="text-sm font-bold">Submit Expense Reimbursement Claim</h3>
                <button onClick={() => setShowModal(false)} className="text-xs font-bold">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full border text-xs p-2 rounded">
                    <option value="FOOD_CLIENT">Food & Client Entertainment</option>
                    <option value="TRAVEL">Local Travel & Transport</option>
                    <option value="OFFICE_SUPPLIES">Office / Kitchen Supplies</option>
                    <option value="MISC">Miscellaneous Expense</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Amount (₹)</label>
                  <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} required className="w-full border text-xs p-2 rounded" />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Description / Business Rationale</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} required className="w-full border text-xs p-2 rounded h-20" />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 bg-slate-200 text-xs font-semibold rounded">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded shadow">Submit Claim</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </EmployeePortalLayout>
  );
}

