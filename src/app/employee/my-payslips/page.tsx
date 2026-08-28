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
          <h1 className="text-[30px] leading-[38px] font-semibold tracking-[-0.02em] text-[#202522] flex items-center gap-2">
            <FileText className="w-7 h-7 text-[#0F5B55]" />
            My Monthly Payslips & Earnings Breakdown
          </h1>
          <p className="mt-1 text-[14px] leading-5 font-normal text-[#66706B]">
            View earnings, statutory PF/ESI deductions, advance recoveries, and download branded PDF payslips.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['August 2026', 'July 2026', 'June 2026'].map((month) => (
            <div key={month} className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-[#E5E2DB]">
                <div>
                  <span className="text-[12px] font-semibold bg-[#23865B]/10 text-[#23865B] border border-[#23865B]/20 px-2.5 py-0.5 rounded-full uppercase">
                    PAID
                  </span>
                  <h3 className="text-[17px] leading-6 font-semibold text-[#202522] mt-1.5">Payslip: {month}</h3>
                </div>
                <button
                  onClick={() => handleDownloadPdf(month)}
                  className="flex items-center space-x-2 h-11 px-4 bg-[#0F5B55] hover:bg-[#08463F] text-white text-[14px] leading-5 font-semibold rounded-[8px] shadow-brand-xs transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
              </div>

              <div className="space-y-2 text-[14px] leading-5 text-[#202522]">
                <div className="flex justify-between">
                  <span className="text-[#66706B] font-medium">Basic Pay & HRA:</span>
                  <span className="font-mono font-semibold">₹28,500</span>
                </div>
                <div className="flex justify-between text-[#23865B]">
                  <span className="font-medium">Overtime Pay (4.5 hrs):</span>
                  <span className="font-mono font-semibold">+₹1,250</span>
                </div>
                <div className="flex justify-between text-[#C94B45]">
                  <span className="font-medium">Provident Fund (PF 12%):</span>
                  <span className="font-mono font-semibold">-₹1,800</span>
                </div>
                <div className="flex justify-between text-[#C94B45]">
                  <span className="font-medium">ESI Contribution (0.75%):</span>
                  <span className="font-mono font-semibold">-₹225</span>
                </div>
                <div className="flex justify-between text-[#C68A28]">
                  <span className="font-medium">Salary Loan Recovery EMI:</span>
                  <span className="font-mono font-semibold">-₹5,000</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-[#E5E2DB] text-[16px] font-semibold text-[#202522]">
                  <span>Net Payable Amount:</span>
                  <span className="text-[#23865B] font-mono text-[24px] font-bold">₹22,725</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </EmployeePortalLayout>
  );
}

