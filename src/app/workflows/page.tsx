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
          <h1 className="text-[30px] leading-[38px] font-semibold tracking-[-0.02em] text-[#202522] flex items-center gap-2">
            <Workflow className="w-7 h-7 text-[#0F5B55]" />
            Configurable Multi-Step Approval Engine
          </h1>
          <p className="mt-1 text-[14px] leading-5 font-normal text-[#66706B]">
            Unified inbox for Leave, Regularization, Overtime, and Roster Change approvals.
          </p>
        </div>

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs space-y-4">
          <h2 className="text-[20px] leading-[28px] font-semibold text-[#0F5B55]">Active Workflow Hierarchy</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-[15px] leading-5">
            <div className="p-3.5 bg-[#F8F5EE] border border-[#E5E2DB] rounded-[8px] font-medium text-[#202522]">
              1. Employee Submission
            </div>
            <div className="p-3.5 bg-[#F8F5EE] border border-[#E5E2DB] rounded-[8px] font-medium text-[#202522]">
              2. Reporting Supervisor
            </div>
            <div className="p-3.5 bg-[#F8F5EE] border border-[#E5E2DB] rounded-[8px] font-medium text-[#202522]">
              3. Department Manager
            </div>
            <div className="p-3.5 bg-[#C59A45]/10 border border-[#C59A45]/40 rounded-[8px] font-semibold text-[#08463F]">
              4. HR Admin Final Approval
            </div>
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}

