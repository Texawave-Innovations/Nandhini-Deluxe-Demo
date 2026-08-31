'use client';

import React from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import { useBanquetStore } from '@/store/banquet-store';
import { useHRMSStore } from '@/store/hrms-store';
import { BanquetHall } from '@/types/banquet-mgmt';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function BanquetHallsPage() {
  const { halls } = useBanquetStore();
  const { locations } = useHRMSStore();
  const locationName = (id: string) => locations.find((l) => l.id === id)?.name ?? id;

  const columns: DataTableColumn<BanquetHall>[] = [
    { key: 'name', header: 'Hall', render: (h) => h.name },
    { key: 'outlet', header: 'Outlet', render: (h) => locationName(h.locationId) },
    { key: 'capacity', header: 'Capacity', render: (h) => `${h.capacity} guests` },
    { key: 'rate', header: 'Rate / Event', render: (h) => inr(h.ratePerEvent) },
  ];

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader title="Hall Master" subtitle="Banquet halls across all banquet & hybrid outlets — the master bookings are made against." />
        <DataTable columns={columns} rows={halls} keyField={(h) => h.id} />
      </div>
    </ShellLayout>
  );
}
