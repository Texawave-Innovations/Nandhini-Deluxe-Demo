'use client';

import React, { useState } from 'react';
import EmployeePortalLayout from '@/components/layout/EmployeePortalLayout';
import { UserCheck, CheckCircle2 } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function ESSSelfOnboardingPage() {
  const [step, setStep] = useState(1);
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountNo, setAccountNo] = useState('501002345678');
  const [ifsc, setIfsc] = useState('HDFC0000240');
  const [pan, setPan] = useState('ABCDE1234F');
  const [isCompleted, setIsCompleted] = useState(false);

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCompleted(true);
  };

  return (
    <EmployeePortalLayout>
      <div className="space-y-6 max-w-xl mx-auto">
        <div>
          <h1 className="text-[30px] leading-[38px] font-semibold tracking-[-0.02em] text-[#202522] flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-[#0F5B55]" />
            New Employee Self-Onboarding Wizard
          </h1>
          <p className="mt-1 text-[14px] leading-5 font-normal text-[#66706B]">Submit statutory bank accounts, PAN/Aadhaar details, and emergency contacts.</p>
        </div>

        {isCompleted ? (
          <div className="p-8 bg-[#23865B]/10 rounded-[10px] border border-[#23865B]/30 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-[#23865B] mx-auto" />
            <h3 className="font-semibold text-[#202522] text-[18px]">Self-Onboarding Completed!</h3>
            <p className="text-[14px] text-[#66706B]">HR has received your bank & tax details for monthly payroll configuration.</p>
          </div>
        ) : (
          <form onSubmit={handleFinish} className="bg-white p-6 rounded-[10px] border border-[#E5E2DB] shadow-brand-xs space-y-4">
            <h3 className="text-[17px] font-semibold text-[#0F5B55]">Bank Account & Tax Details</h3>

            <div>
              <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">Bank Name</label>
              <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} required className="w-full h-11 border border-[#E5E2DB] text-[15px] px-3.5 rounded-[8px] text-[#202522]" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">Account Number</label>
                <input type="text" value={accountNo} onChange={e => setAccountNo(e.target.value)} required className="w-full h-11 border border-[#E5E2DB] text-[15px] px-3.5 rounded-[8px] text-[#202522]" />
              </div>
              <div>
                <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">IFSC Code</label>
                <input type="text" value={ifsc} onChange={e => setIfsc(e.target.value)} required className="w-full h-11 border border-[#E5E2DB] text-[15px] px-3.5 rounded-[8px] text-[#202522]" />
              </div>
            </div>

            <div>
              <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">PAN Card Number</label>
              <input type="text" value={pan} onChange={e => setPan(e.target.value)} required className="w-full h-11 border border-[#E5E2DB] text-[15px] px-3.5 rounded-[8px] text-[#202522]" />
            </div>

            <button type="submit" className="w-full h-11 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[14px] leading-5 rounded-[8px] shadow-brand-xs cursor-pointer">
              Submit Onboarding Profile to HR
            </button>
          </form>
        )}
      </div>
    </EmployeePortalLayout>
  );
}

