'use client';

import React from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { ShieldCheck, History, User, Activity, Clock } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function AuditTrailPage() {
  const { auditLogs } = useHRMSStore();

  return (
    <ShellLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-[30px] leading-[38px] font-semibold tracking-[-0.02em] text-[#202522] flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-[#0F5B55]" />
            Centralized ERP System Audit Trail
          </h1>
          <p className="mt-1 text-[14px] leading-5 font-normal text-[#66706B]">
            Immutable log tracking of user actions, approvals, roster publishes, and master updates across the platform.
          </p>
        </div>

        {/* Audit Log Table Requirement #18 */}
        <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[#202522]">
              <thead className="bg-[#F3F0E9]/60 border-b border-[#E5E2DB]">
                <tr>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Timestamp</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">User & Role</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Module</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Action</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Record Title / ID</th>
                  <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2DB]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F3F0E9]/50">
                    <td className="px-4 py-3.5 font-mono text-[12px] font-medium text-[#66706B]">{log.timestamp}</td>
                    <td className="px-4 py-3.5">
                      <div className="text-[15px] leading-5 font-medium text-[#202522]">{log.userName}</div>
                      <div className="text-[12px] text-[#66706B] font-semibold mt-0.5">{log.userRole}</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[13px] text-[#0F5B55] font-semibold">{log.module}</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[12px] leading-4 font-semibold ${
                        log.action === 'CREATE' ? 'bg-[#23865B]/10 text-[#23865B] border border-[#23865B]/20' :
                        log.action === 'APPROVE' || log.action === 'PUBLISH' ? 'bg-[#3377A8]/10 text-[#3377A8] border border-[#3377A8]/20' :
                        log.action === 'UPDATE' || log.action === 'ASSIGN' ? 'bg-[#C68A28]/10 text-[#C68A28] border border-[#C68A28]/20' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[15px] leading-5 font-medium text-[#202522]">{log.recordTitle}</td>
                    <td className="px-4 py-3.5 font-mono text-[12px] text-[#66706B]">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}

