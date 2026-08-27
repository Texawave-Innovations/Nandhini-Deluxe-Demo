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
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Centralized ERP System Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log tracking of user actions, approvals, roster publishes, and master updates across the platform.
          </p>
        </div>

        {/* Audit Log Table Requirement #18 */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-semibold">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">User & Role</th>
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Record Title / ID</th>
                  <th className="px-4 py-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-600">{log.timestamp}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{log.userName}</div>
                      <div className="text-[10px] text-slate-500 font-semibold">{log.userRole}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-blue-700 font-bold">{log.module}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-800' :
                        log.action === 'APPROVE' || log.action === 'PUBLISH' ? 'bg-blue-100 text-blue-800' :
                        log.action === 'UPDATE' || log.action === 'ASSIGN' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{log.recordTitle}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{log.ipAddress}</td>
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

