'use client';

import React from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import StatusChip, { ChipTone } from '@/components/ui/StatusChip';
import { useHotelStore } from '@/store/hotel-store';
import { useHRMSStore } from '@/store/hrms-store';
import { Room, RoomStatus } from '@/types/hotel';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const ROOM_STATUS_TONE: Record<RoomStatus, ChipTone> = {
  VACANT: 'success', OCCUPIED: 'brand', RESERVED: 'info', DIRTY: 'warning', OUT_OF_SERVICE: 'danger',
};

export default function HotelRoomsPage() {
  const { rooms } = useHotelStore();
  const { locations } = useHRMSStore();
  const locationName = (id: string) => locations.find((l) => l.id === id)?.name ?? id;

  const columns: DataTableColumn<Room>[] = [
    { key: 'roomNumber', header: 'Room', render: (r) => <span className="font-mono font-semibold">{r.roomNumber}</span> },
    { key: 'outlet', header: 'Outlet', render: (r) => locationName(r.locationId) },
    { key: 'floor', header: 'Floor', render: (r) => r.floor },
    { key: 'type', header: 'Type', render: (r) => r.roomType },
    { key: 'occupancy', header: 'Max Occupancy', render: (r) => r.maxOccupancy },
    { key: 'rate', header: 'Rate / Night', render: (r) => inr(r.rateInr) },
    { key: 'status', header: 'Status', render: (r) => <StatusChip label={r.status} tone={ROOM_STATUS_TONE[r.status]} /> },
  ];

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader title="Room Master" subtitle="All rooms across hotel & hybrid outlets — the master reservations and folios are built against." />
        <DataTable columns={columns} rows={[...rooms].sort((a, b) => a.locationId.localeCompare(b.locationId) || a.roomNumber.localeCompare(b.roomNumber))} keyField={(r) => r.id} />
      </div>
    </ShellLayout>
  );
}
