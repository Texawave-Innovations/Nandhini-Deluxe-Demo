'use client';

import React from 'react';
import Link from 'next/link';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import KpiCard from '@/components/ui/KpiCard';
import StatusChip, { ChipTone } from '@/components/ui/StatusChip';
import { BedDouble, IndianRupee, LogIn, LogOut, Sparkles } from 'lucide-react';
import { useHotelStore } from '@/store/hotel-store';
import { useHRMSStore } from '@/store/hrms-store';
import { useOutletStore } from '@/store/outlet-store';
import { hotelService } from '@/services/hotelService';
import { RoomStatus } from '@/types/hotel';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const ROOM_STATUS_TONE: Record<RoomStatus, ChipTone> = {
  VACANT: 'success', OCCUPIED: 'brand', RESERVED: 'info', DIRTY: 'warning', OUT_OF_SERVICE: 'danger',
};

export default function HotelDashboardPage() {
  const { rooms, reservations, folios } = useHotelStore();
  const { locations } = useHRMSStore();
  const { businessDate } = useOutletStore();

  const hotelLocations = locations.filter((l) => l.features.hasHotel);
  const occupancy = hotelService.computeOccupancy(rooms);
  const revenue = hotelService.computeHotelRevenue(folios);
  const { arrivals, departures } = hotelService.computeArrivalsDepartures(reservations, businessDate);
  const inHouse = reservations.filter((r) => r.status === 'CHECKED_IN');
  const locationName = (id: string) => locations.find((l) => l.id === id)?.name ?? id;
  const roomLabel = (id: string) => rooms.find((r) => r.id === id)?.roomNumber ?? id;

  return (
    <ShellLayout>
      <div className="space-y-6">
        <SectionHeader
          title="Hotel Operations"
          subtitle="Room master, reservations and folio billing across all hotel & hybrid outlets. Room Service charges are picked up live from POS."
          actions={<Link href="/hotel/reservations" className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[13px] rounded-[8px] flex items-center gap-2"><BedDouble className="w-4 h-4" /> Reservations</Link>}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Occupancy" value={`${occupancy.occupancyPct}%`} icon={BedDouble} sublabel={`${occupancy.occupied} of ${occupancy.totalRooms} rooms`} />
          <KpiCard label="In-House Guests" value={inHouse.length} icon={BedDouble} />
          <KpiCard label="Hotel Revenue (settled folios)" value={inr(revenue)} icon={IndianRupee} valueColorClass="text-[#0F5B55]" />
          <KpiCard label="Arrivals / Departures Today" value={`${arrivals.length} / ${departures.length}`} icon={LogIn} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
            <h3 className="text-sm font-semibold text-[#202522] mb-3 flex items-center gap-2"><LogIn className="w-4 h-4 text-[#23865B]" />Arrivals Today ({businessDate})</h3>
            <div className="space-y-2">
              {arrivals.length === 0 && <div className="text-[13px] text-[#66706B]">No arrivals scheduled.</div>}
              {arrivals.map((r) => (
                <Link key={r.id} href={`/hotel/reservations/${r.id}`} className="flex items-center justify-between p-2.5 bg-[#F3F0E9] rounded-md text-[13px] hover:bg-[#EFEAE0]">
                  <span className="font-medium text-[#202522]">{r.guestName} — Room {roomLabel(r.roomId)}</span>
                  <span className="text-[#66706B]">{locationName(r.locationId)}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
            <h3 className="text-sm font-semibold text-[#202522] mb-3 flex items-center gap-2"><LogOut className="w-4 h-4 text-[#C94B45]" />Departures Today ({businessDate})</h3>
            <div className="space-y-2">
              {departures.length === 0 && <div className="text-[13px] text-[#66706B]">No departures scheduled.</div>}
              {departures.map((r) => (
                <Link key={r.id} href={`/hotel/reservations/${r.id}`} className="flex items-center justify-between p-2.5 bg-[#F3F0E9] rounded-md text-[13px] hover:bg-[#EFEAE0]">
                  <span className="font-medium text-[#202522]">{r.guestName} — Room {roomLabel(r.roomId)}</span>
                  <span className="text-[#66706B]">{locationName(r.locationId)}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#202522] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#C59A45]" />Room Status Board</h3>
          {hotelLocations.map((loc) => (
            <div key={loc.id} className="bg-white rounded-[10px] border border-[#E5E2DB] p-4 shadow-brand-xs">
              <div className="text-[13px] font-semibold text-[#202522] mb-2.5">{loc.name}</div>
              <div className="flex flex-wrap gap-2">
                {rooms.filter((r) => r.locationId === loc.id).map((r) => (
                  <div key={r.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E5E2DB] bg-[#F8F5EE] text-[12px]">
                    <span className="font-mono font-semibold text-[#202522]">{r.roomNumber}</span>
                    <StatusChip label={r.status} tone={ROOM_STATUS_TONE[r.status]} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ShellLayout>
  );
}
