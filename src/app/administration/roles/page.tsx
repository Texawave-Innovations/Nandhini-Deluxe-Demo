'use client';

import React from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import StatusChip from '@/components/ui/StatusChip';
import { Check } from 'lucide-react';
import { MODULE_NAV } from '@/constants/navigation';
import { ROLE_LABELS, ROLE_MODULE_ACCESS, ROLE_OUTLET_SCOPE } from '@/permissions/roleAccess';
import { UserRole } from '@/types/erp-core';

export default function RolesAccessPage() {
  const roles = Object.keys(ROLE_LABELS) as UserRole[];

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader
          title="Roles & Access"
          subtitle="Read-only view of the role → module access matrix. Switch the demo role from the header to see the sidebar and Outlet Switcher respond live."
        />

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="text-[12px] w-full">
              <thead>
                <tr className="bg-[#F3F0E9] border-b border-[#E5E2DB]">
                  <th className="text-left px-3 py-2.5 font-semibold text-[#66706B] uppercase sticky left-0 bg-[#F3F0E9] z-10">Role</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-[#66706B] uppercase">Outlet Scope</th>
                  {MODULE_NAV.map((m) => (
                    <th key={m.id} className="text-center px-2 py-2.5 font-semibold text-[#66706B] uppercase whitespace-nowrap">{m.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role} className="border-b border-[#E5E2DB] last:border-0 hover:bg-[#F8F5EE]">
                    <td className="px-3 py-2 font-medium text-[#202522] whitespace-nowrap sticky left-0 bg-white">{ROLE_LABELS[role]}</td>
                    <td className="px-3 py-2"><StatusChip label={ROLE_OUTLET_SCOPE[role]} tone={ROLE_OUTLET_SCOPE[role] === 'ALL' ? 'brand' : 'neutral'} /></td>
                    {MODULE_NAV.map((m) => (
                      <td key={m.id} className="text-center px-2 py-2">
                        {ROLE_MODULE_ACCESS[role].includes(m.id) && <Check className="w-3.5 h-3.5 text-[#23865B] mx-auto" />}
                      </td>
                    ))}
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
