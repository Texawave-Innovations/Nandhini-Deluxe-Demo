'use client';

import React from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import KOTBoard from '@/components/pos/KOTBoard';
import { useHRMSStore } from '@/store/hrms-store';
import { usePOSStore } from '@/store/pos-store';
import { useOutletStore } from '@/store/outlet-store';
import { outletService } from '@/services/outletService';

export default function KOTBoardPage() {
  const { locations } = useHRMSStore();
  const { kots, advanceKOT } = usePOSStore();
  const { selectedOutletId } = useOutletStore();
  const outlets = outletService.listOutlets(locations);
  const effectiveOutletId = selectedOutletId === 'ALL' ? outlets[0]?.id : selectedOutletId;

  const scoped = kots.filter((k) => k.outletId === effectiveOutletId);

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader title="Kitchen Order Tickets" subtitle={`${outlets.find((o) => o.id === effectiveOutletId)?.name} — Kitchen Display`} />
        <KOTBoard kots={scoped} onAdvance={(k) => advanceKOT(k.id)} />
      </div>
    </ShellLayout>
  );
}
