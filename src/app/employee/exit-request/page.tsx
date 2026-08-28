'use client';

import React, { useState } from 'react';
import EmployeePortalLayout from '@/components/layout/EmployeePortalLayout';
import { UserMinus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function ESSExitRequestPage() {
  const { exitRequests, submitExitRequest, employees } = useHRMSStore();
  const currentUser = employees[0];

  const [resignationDate, setResignationDate] = useState('2026-08-27');
  const [lastDate, setLastDate] = useState('2026-09-27');
  const [reason, setReason] = useState('Personal reasons & relocation');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitExitRequest({
      employeeId: currentUser.id,
      resignationDate,
      expectedLastWorkingDay: lastDate,
      reason,
      noticePeriodDays: 30
    });
    setIsSubmitted(true);
  };

  return (
    <EmployeePortalLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-[30px] leading-[38px] font-semibold tracking-[-0.02em] text-[#202522] flex items-center gap-2">
            <UserMinus className="w-7 h-7 text-[#C94B45]" />
            Resignation Submission & Offboarding Clearance
          </h1>
          <p className="mt-1 text-[14px] leading-5 font-normal text-[#66706B]">Submit resignation request and monitor department clearance status.</p>
        </div>

        {isSubmitted ? (
          <div className="p-6 bg-[#C59A45]/10 rounded-[10px] border border-[#C59A45]/30 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-[#C59A45] mx-auto" />
            <h3 className="font-semibold text-[#202522] text-[18px]">Resignation Application Submitted</h3>
            <p className="text-[14px] text-[#66706B]">Notice Period Active (30 Days). Your last working date is set for {lastDate}.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[10px] border border-[#E5E2DB] shadow-brand-xs space-y-4">
            <div className="bg-[#F8F5EE] p-3.5 rounded-[8px] border border-[#E5E2DB] text-[14px] leading-5 text-[#202522] space-y-1">
              <div className="font-semibold text-[#0F5B55]">Employee: {currentUser.firstName} {currentUser.lastName} ({currentUser.employeeCode})</div>
              <div>Standard Notice Period: 30 Days</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">Resignation Date</label>
                <input type="date" value={resignationDate} onChange={e => setResignationDate(e.target.value)} required className="w-full h-11 border border-[#E5E2DB] text-[15px] px-3.5 rounded-[8px] text-[#202522]" />
              </div>
              <div>
                <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">Expected Last Working Day</label>
                <input type="date" value={lastDate} onChange={e => setLastDate(e.target.value)} required className="w-full h-11 border border-[#E5E2DB] text-[15px] px-3.5 rounded-[8px] text-[#202522]" />
              </div>
            </div>

            <div>
              <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">Reason for Resignation</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} required className="w-full border border-[#E5E2DB] text-[15px] p-3 rounded-[8px] text-[#202522] h-28" />
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-[#C94B45] hover:bg-[#a83c37] text-white font-semibold text-[14px] leading-5 rounded-[8px] shadow-brand-xs cursor-pointer"
            >
              Submit Resignation Notice
            </button>
          </form>
        )}
      </div>
    </EmployeePortalLayout>
  );
}

