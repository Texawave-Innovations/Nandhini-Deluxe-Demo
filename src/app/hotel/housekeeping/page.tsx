'use client';

import React from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import StatusChip from '@/components/ui/StatusChip';
import { Sparkles } from 'lucide-react';
import { useHotelStore } from '@/store/hotel-store';
import { useHRMSStore } from '@/store/hrms-store';
import { Room } from '@/types/hotel';

export default function HousekeepingPage() {
  const { rooms, markRoomClean } = useHotelStore();
  const { locations } = useHRMSStore();
  const locationName = (id: string) => locations.find((l) => l.id === id)?.name ?? id;

  const dirtyRooms = rooms.filter((r) => r.status === 'DIRTY');

  const columns: DataTableColumn<Room>[] = [
    { key: 'room', header: 'Room', render: (r) => <span className="font-mono font-semibold">{r.roomNumber}</span> },
    { key: 'outlet', header: 'Outlet', render: (r) => locationName(r.locationId) },
    { key: 'type', header: 'Type', render: (r) => r.roomType },
    { key: 'status', header: 'Status', render: (r) => <StatusChip label={r.status} tone="warning" /> },
    {
      key: 'action', header: 'Action', render: (r) => (
        <button onClick={(e) => { e.stopPropagation(); markRoomClean(r.id); }} className="px-3 py-1.5 bg-[#0F5B55] hover:bg-[#08463F] text-white text-[12px] font-semibold rounded-lg">Mark Clean</button>
      ),
    },
  ];

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader title="Housekeeping" subtitle="Rooms awaiting cleaning after checkout — mark clean to return a room to Vacant." />
        <DataTable columns={columns} rows={dirtyRooms} keyField={(r) => r.id} emptyMessage={
          "No rooms pending housekeeping — every checked-out room has been cleaned."
        } />
        {dirtyRooms.length === 0 && (
          <div className="flex items-center gap-2 text-[13px] text-[#66706B]"><Sparkles className="w-4 h-4 text-[#23865B]" /> All caught up.</div>
        )}
      </div>
    </ShellLayout>
  );
}
