'use client';

import React from 'react';
import Link from 'next/link';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import TableGrid from '@/components/pos/TableGrid';
import { Plus } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';
import { usePOSStore } from '@/store/pos-store';
import { useOutletStore } from '@/store/outlet-store';
import { outletService } from '@/services/outletService';

const LEGEND = [
  { label: 'Available', className: 'bg-[#23865B]/10 border-[#23865B]/30 text-[#23865B]' },
  { label: 'Occupied', className: 'bg-[#C94B45]/10 border-[#C94B45]/30 text-[#C94B45]' },
  { label: 'Reserved', className: 'bg-[#C68A28]/10 border-[#C68A28]/30 text-[#C68A28]' },
  { label: 'Billing', className: 'bg-[#3377A8]/10 border-[#3377A8]/30 text-[#3377A8]' },
];

export default function TablesPage() {
  const { locations } = useHRMSStore();
  const { floors, tables } = usePOSStore();
  const { selectedOutletId } = useOutletStore();
  const outlets = outletService.listOutlets(locations);
  const effectiveOutletId = selectedOutletId === 'ALL' ? outlets[0]?.id : selectedOutletId;

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader
          title="Tables"
          subtitle={outlets.find((o) => o.id === effectiveOutletId)?.name}
          actions={<Link href="/pos/new-order" className="h-10 px-4 bg-[#0F5B55] text-white text-[13px] font-semibold rounded-[8px] flex items-center gap-2"><Plus className="w-4 h-4" /> New Order</Link>}
        />
        <div className="flex items-center gap-4">
          {LEGEND.map((l) => (
            <span key={l.label} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${l.className}`}>{l.label}</span>
          ))}
        </div>
        <TableGrid floors={floors.filter((f) => f.outletId === effectiveOutletId)} tables={tables.filter((t) => t.outletId === effectiveOutletId)} />
      </div>
    </ShellLayout>
  );
}
