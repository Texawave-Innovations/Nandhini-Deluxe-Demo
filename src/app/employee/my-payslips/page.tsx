'use client';

import React from 'react';
import EmployeePortalLayout from '@/components/layout/EmployeePortalLayout';
import { FileText, Download, Printer, DollarSign } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function MyPayslipsPage() {
  const { employees } = useHRMSStore();
  const currentUser = employees[0];

  const handleDownloadPdf = (month: string) => {
    // TexaWave PDF Payslip Generation simulation (jsPDF autotable format)
    alert(`Generating PDF Payslip for ${currentUser.firstName} ${currentUser.lastName} (${month})... File downloaded!`);
  };

  return (
    <EmployeePortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            My Monthly Payslips & Earnings Breakdown
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View earnings, statutory PF/ESI deductions, advance recoveries, and download branded PDF payslips.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['August 2026', 'July 2026', 'June 2026'].map((month, idx) => (
            <div key={month} className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase">
                    PAID
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">Payslip: {month}</h3>
                </div>
                <button
                  onClick={() => handleDownloadPdf(month)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Basic Pay & HRA:</span>
                  <span className="font-mono font-bold">₹28,500</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Overtime Pay (4.5 hrs):</span>
                  <span className="font-mono font-bold">+₹1,250</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Provident Fund (PF 12%):</span>
                  <span className="font-mono font-bold">-₹1,800</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>ESI Contribution (0.75%):</span>
                  <span className="font-mono font-bold">-₹225</span>
                </div>
                <div className="flex justify-between text-amber-700">
                  <span>Salary Loan Recovery EMI:</span>
                  <span className="font-mono font-bold">-₹5,000</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                  <span>Net Payable Amount:</span>
                  <span className="text-emerald-700 font-mono">₹22,725</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </EmployeePortalLayout>
  );
}

