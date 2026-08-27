'use client';

import React from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { Workflow, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function ApprovalWorkflowsPage() {
  const { regularizationRequests, leaveRequests, overtimeRequests = [] } = useHRMSStore() as any;

  return (
    <ShellLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Workflow className="w-5 h-5 text-blue-600" />
            Configurable Multi-Step Approval Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Unified inbox for Leave, Regularization, Overtime, and Roster Change approvals.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Active Workflow Hierarchy</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border rounded font-semibold text-slate-800">
              1. Employee Submission
            </div>
            <div className="p-3 bg-slate-50 border rounded font-semibold text-slate-800">
              2. Reporting Supervisor
            </div>
            <div className="p-3 bg-slate-50 border rounded font-semibold text-slate-800">
              3. Department Manager
            </div>
            <div className="p-3 bg-amber-50 border border-amber-300 rounded font-bold text-amber-900">
              4. HR Admin Final Approval
            </div>
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}

