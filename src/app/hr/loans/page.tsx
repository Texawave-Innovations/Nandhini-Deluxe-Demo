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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[30px] leading-[38px] font-semibold tracking-[-0.02em] text-[#202522] flex items-center gap-2">
              <DollarSign className="w-7 h-7 text-[#0F5B55]" />
              Salary Advances & Loans Recovery Manager
            </h1>
            <p className="mt-1 text-[14px] leading-5 font-normal text-[#66706B]">
              Configure recovery start month & monthly EMI auto-deductions during payroll runs.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 h-11 bg-[#0F5B55] hover:bg-[#08463F] text-white text-[14px] leading-5 font-semibold rounded-[8px] shadow-brand-xs transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Sanction New Loan / Advance</span>
          </button>
        </div>

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs overflow-hidden">
          <table className="w-full text-left text-[#202522]">
            <thead className="bg-[#F3F0E9]/60 border-b border-[#E5E2DB]">
              <tr>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Employee</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Loan Category</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Sanctioned Principal</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Monthly EMI</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Recovered Amount</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Outstanding Balance</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E2DB]">
              {loans.map(l => {
                const emp = employees.find(e => e.id === l.employeeId);
                return (
                  <tr key={l.id} className="hover:bg-[#F3F0E9]/50">
                    <td className="px-4 py-3.5 text-[15px] leading-5 font-medium text-[#202522]">{emp?.firstName} {emp?.lastName} ({emp?.employeeCode})</td>
                    <td className="px-4 py-3.5 text-[15px] leading-5 font-medium text-[#0F5B55]">{l.loanType}</td>
                    <td className="px-4 py-3.5 font-mono text-[15px] leading-5 font-semibold text-[#202522]">₹{l.principalAmount}</td>
                    <td className="px-4 py-3.5 font-mono text-[15px] leading-5 font-semibold text-[#C68A28]">₹{l.monthlyEmiAmount} / mo</td>
                    <td className="px-4 py-3.5 font-mono text-[15px] leading-5 font-semibold text-[#23865B]">₹{l.recoveredAmount}</td>
                    <td className="px-4 py-3.5 font-mono text-[15px] leading-5 font-semibold text-[#C94B45]">₹{l.balanceAmount}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[12px] leading-4 font-semibold bg-[#23865B]/10 text-[#23865B] border border-[#23865B]/20">
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

