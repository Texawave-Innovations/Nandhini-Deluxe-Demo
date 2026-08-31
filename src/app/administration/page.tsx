'use client';

import React from 'react';
import Link from 'next/link';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import KpiCard from '@/components/ui/KpiCard';
import { ShieldCheck, Users2, ClipboardList, ArrowRight } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';
import { ROLE_MODULE_ACCESS } from '@/permissions/roleAccess';

export default function AdministrationHubPage() {
  const { employees, auditLogs } = useHRMSStore();

  return (
    <ShellLayout>
      <div className="space-y-6">
        <SectionHeader title="Administration" subtitle="Users, roles, outlet access and system audit trail for the Nandhini Deluxe ERP." />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Active Users" value={employees.filter((e) => e.status === 'ACTIVE').length} icon={Users2} />
          <KpiCard label="Roles Configured" value={Object.keys(ROLE_MODULE_ACCESS).length} icon={ShieldCheck} />
          <KpiCard label="Audit Events Logged" value={auditLogs.length} icon={ClipboardList} />
          <KpiCard label="Outlets Live" value={16} icon={ShieldCheck} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link href="/administration/roles" className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs hover:border-[#0F5B55] transition-all flex items-center justify-between">
            <div>
              <div className="text-[14px] font-semibold text-[#202522]">Roles & Access</div>
              <div className="text-[12px] text-[#66706B] mt-0.5">Module and outlet-scope matrix for every role, driving sidebar visibility live.</div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#66706B]" />
          </Link>
          <Link href="/audit" className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs hover:border-[#0F5B55] transition-all flex items-center justify-between">
            <div>
              <div className="text-[14px] font-semibold text-[#202522]">Audit Logs</div>
              <div className="text-[12px] text-[#66706B] mt-0.5">Full system trail — create/update/approve/void across every module.</div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#66706B]" />
          </Link>
        </div>

        <div className="bg-[#F3F0E9] border border-[#E5E2DB] rounded-[10px] p-4 text-[13px] text-[#66706B]">
          Users, Integration Configuration and Notification Settings are part of the Phase 2 build-out.
        </div>
      </div>
    </ShellLayout>
  );
}
