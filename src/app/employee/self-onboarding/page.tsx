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
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            New Employee Self-Onboarding Wizard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Submit statutory bank accounts, PAN/Aadhaar details, and emergency contacts.</p>
        </div>

        {isCompleted ? (
          <div className="p-8 bg-emerald-50 rounded-lg border border-emerald-200 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="font-bold text-slate-900 text-base">Self-Onboarding Completed!</h3>
            <p className="text-xs text-slate-600">HR has received your bank & tax details for monthly payroll configuration.</p>
          </div>
        ) : (
          <form onSubmit={handleFinish} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Bank Account & Tax Details</h3>

            <div>
              <label className="text-xs font-semibold block mb-1">Bank Name</label>
              <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} required className="w-full border text-xs p-2 rounded" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">Account Number</label>
                <input type="text" value={accountNo} onChange={e => setAccountNo(e.target.value)} required className="w-full border text-xs p-2 rounded" />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">IFSC Code</label>
                <input type="text" value={ifsc} onChange={e => setIfsc(e.target.value)} required className="w-full border text-xs p-2 rounded" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">PAN Card Number</label>
              <input type="text" value={pan} onChange={e => setPan(e.target.value)} required className="w-full border text-xs p-2 rounded" />
            </div>

            <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded shadow">
              Submit Onboarding Profile to HR
            </button>
          </form>
        )}
      </div>
    </EmployeePortalLayout>
  );
}

