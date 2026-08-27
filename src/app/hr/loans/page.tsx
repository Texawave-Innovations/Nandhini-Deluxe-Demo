'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { DollarSign, Plus, CheckCircle2 } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function LoansPage() {
  const { loans, employees, issueLoan } = useHRMSStore();
  const [showModal, setShowModal] = useState(false);

  const [selectedEmpId, setSelectedEmpId] = useState('emp-1');
  const [loanType, setLoanType] = useState<'SALARY_ADVANCE' | 'PERSONAL_LOAN' | 'EMERGENCY'>('SALARY_ADVANCE');
  const [amount, setAmount] = useState(30000);
  const [emi, setEmi] = useState(5000);
  const [startMonth, setStartMonth] = useState('2026-09');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    issueLoan({
      employeeId: selectedEmpId,
      loanType,
      principalAmount: amount,
      monthlyEmiAmount: emi,
      startMonthYear: startMonth
    });
    setShowModal(false);
  };

  return (
    <ShellLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Salary Advances & Loans Recovery Manager
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              TexaWave ERP Loans Engine: Configure recovery start month & monthly EMI auto-deductions during payroll runs.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Sanction New Loan / Advance</span>
          </button>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-900 text-white uppercase text-[10px] font-semibold">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Loan Category</th>
                <th className="px-4 py-3">Sanctioned Principal</th>
                <th className="px-4 py-3">Monthly EMI</th>
                <th className="px-4 py-3">Recovered Amount</th>
                <th className="px-4 py-3">Outstanding Balance</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loans.map(l => {
                const emp = employees.find(e => e.id === l.employeeId);
                return (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{emp?.firstName} {emp?.lastName} ({emp?.employeeCode})</td>
                    <td className="px-4 py-3 font-semibold text-blue-700">{l.loanType}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">₹{l.principalAmount}</td>
                    <td className="px-4 py-3 font-mono font-bold text-amber-700">₹{l.monthlyEmiAmount} / mo</td>
                    <td className="px-4 py-3 font-mono text-emerald-700 font-bold">₹{l.recoveredAmount}</td>
                    <td className="px-4 py-3 font-mono text-red-600 font-bold">₹{l.balanceAmount}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {l.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center">
                <h3 className="text-sm font-bold">Sanction Employee Loan / Advance</h3>
                <button onClick={() => setShowModal(false)} className="text-xs font-bold">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">Employee</label>
                  <select value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)} className="w-full border text-xs p-2 rounded">
                    {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Loan Category</label>
                  <select value={loanType} onChange={e => setLoanType(e.target.value as any)} className="w-full border text-xs p-2 rounded">
                    <option value="SALARY_ADVANCE">Salary Advance</option>
                    <option value="PERSONAL_LOAN">Long-Term Personal Loan</option>
                    <option value="EMERGENCY">Emergency Medical Advance</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1">Principal Amount (₹)</label>
                    <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} required className="w-full border text-xs p-2 rounded" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1">Monthly EMI Recovery (₹)</label>
                    <input type="number" value={emi} onChange={e => setEmi(Number(e.target.value))} required className="w-full border text-xs p-2 rounded" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Recovery Start Month</label>
                  <input type="month" value={startMonth} onChange={e => setStartMonth(e.target.value)} required className="w-full border text-xs p-2 rounded" />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 bg-slate-200 text-xs font-semibold rounded">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded shadow">Sanction Loan</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}

