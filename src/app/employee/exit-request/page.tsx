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
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserMinus className="w-5 h-5 text-red-600" />
            Resignation Submission & Offboarding Clearance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Submit resignation request and monitor department clearance status.</p>
        </div>

        {isSubmitted ? (
          <div className="p-6 bg-amber-50 rounded-lg border border-amber-200 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-amber-600 mx-auto" />
            <h3 className="font-bold text-slate-900 text-base">Resignation Application Submitted</h3>
            <p className="text-xs text-slate-600">Notice Period Active (30 Days). Your last working date is set for {lastDate}.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <div className="bg-slate-50 p-3 rounded border text-xs text-slate-700 space-y-1">
              <div className="font-bold">Employee: {currentUser.firstName} {currentUser.lastName} ({currentUser.employeeCode})</div>
              <div>Standard Notice Period: 30 Days</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">Resignation Date</label>
                <input type="date" value={resignationDate} onChange={e => setResignationDate(e.target.value)} required className="w-full border text-xs p-2 rounded" />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Expected Last Working Day</label>
                <input type="date" value={lastDate} onChange={e => setLastDate(e.target.value)} required className="w-full border text-xs p-2 rounded" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Reason for Resignation</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} required className="w-full border text-xs p-2 rounded h-24" />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded shadow"
            >
              Submit Resignation Notice
            </button>
          </form>
        )}
      </div>
    </EmployeePortalLayout>
  );
}

