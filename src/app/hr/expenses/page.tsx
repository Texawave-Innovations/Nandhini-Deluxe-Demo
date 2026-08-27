'use client';

import React from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { DollarSign, CheckCircle2 } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function AdminExpensesPage() {
  const { expenseClaims, employees, approveExpenseClaim } = useHRMSStore();

  return (
    <ShellLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            Expense Reimbursement Claims Approvals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            TexaWave Reimbursements Engine: Review employee claims before pushing to Finance module.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-900 text-white uppercase text-[10px] font-semibold">
              <tr>
                <th className="px-4 py-3">Claim Code</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Claimed Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {expenseClaims.map(c => {
                const emp = employees.find(e => e.id === c.employeeId);
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold">{c.claimCode}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{emp?.firstName} {emp?.lastName}</td>
                    <td className="px-4 py-3 font-semibold text-blue-700">{c.category}</td>
                    <td className="px-4 py-3 text-slate-600">{c.description}</td>
                    <td className="px-4 py-3 font-bold font-mono text-slate-900">₹{c.amount}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.status === 'PENDING' && (
                        <button
                          onClick={() => approveExpenseClaim(c.id, c.amount)}
                          className="px-3 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded hover:bg-emerald-700 shadow"
                        >
                          Approve Claim
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
    </ShellLayout>
  );
}

