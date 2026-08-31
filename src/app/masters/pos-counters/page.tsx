'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import StatusChip from '@/components/ui/StatusChip';
import { Table2 } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';
import { usePOSStore } from '@/store/pos-store';
import { outletService } from '@/services/outletService';
import { TableStatus } from '@/types/pos';

const TABLE_TONE: Record<TableStatus, 'success' | 'danger' | 'warning' | 'info'> = {
  AVAILABLE: 'success', OCCUPIED: 'danger', RESERVED: 'warning', BILLING: 'info',
};

export default function POSCountersMasterPage() {
  const { locations } = useHRMSStore();
  const { counters, floors, tables } = usePOSStore();
  const outlets = outletService.listOutlets(locations);
  const [outletId, setOutletId] = useState(outlets[0]?.id ?? 'loc-1');

  const outletCounters = counters.filter((c) => c.outletId === outletId);
  const outletFloors = floors.filter((f) => f.outletId === outletId);

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader
          title="POS Counters & Tables"
          subtitle="Counter, dining floor and table layout master per outlet — used by the POS module's table map and order routing."
          actions={
            <select value={outletId} onChange={(e) => setOutletId(e.target.value)} className="border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px] bg-white">
              {outlets.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          }
        />

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs p-4">
          <h3 className="text-[13px] font-semibold text-[#202522] mb-2.5">POS Counters</h3>
          <div className="flex flex-wrap gap-2">
            {outletCounters.map((c) => (
              <div key={c.id} className="px-3 py-2 border border-[#E5E2DB] rounded-lg text-[13px] flex items-center gap-2">
                <span className="font-medium text-[#202522]">{c.name}</span>
                <StatusChip label={c.type} tone="brand" />
              </div>
            ))}
            {outletCounters.length === 0 && <span className="text-[13px] text-[#66706B]">No counters configured for this outlet.</span>}
          </div>
        </div>

        {outletFloors.map((floor) => (
          <div key={floor.id} className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs p-4">
            <h3 className="text-[13px] font-semibold text-[#202522] mb-2.5">{floor.name}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {tables.filter((t) => t.floorId === floor.id).map((t) => (
                <div key={t.id} className="border border-[#E5E2DB] rounded-lg p-3 text-center">
                  <Table2 className="w-4 h-4 mx-auto text-[#66706B] mb-1" />
                  <div className="text-[13px] font-semibold text-[#202522]">{t.code}</div>
                  <div className="text-[10px] text-[#66706B] mb-1.5">Seats {t.capacity}</div>
                  <StatusChip label={t.status} tone={TABLE_TONE[t.status]} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ShellLayout>
  );
}
