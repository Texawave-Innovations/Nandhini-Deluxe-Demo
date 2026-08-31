'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import StatusChip, { ChipTone } from '@/components/ui/StatusChip';
import Modal from '@/components/ui/Modal';
import { Plus } from 'lucide-react';
import { useHotelStore } from '@/store/hotel-store';
import { useHRMSStore } from '@/store/hrms-store';
import { Reservation, ReservationStatus } from '@/types/hotel';

const RES_TONE: Record<ReservationStatus, ChipTone> = {
  BOOKED: 'info', CHECKED_IN: 'brand', CHECKED_OUT: 'success', CANCELLED: 'danger', NO_SHOW: 'warning',
};

export default function HotelReservationsPage() {
  const router = useRouter();
  const { rooms, reservations, createReservation, checkIn } = useHotelStore();
  const { locations } = useHRMSStore();
  const hotelLocations = locations.filter((l) => l.features.hasHotel);
  const locationName = (id: string) => locations.find((l) => l.id === id)?.name ?? id;
  const roomLabel = (id: string) => rooms.find((r) => r.id === id)?.roomNumber ?? id;

  const [showNew, setShowNew] = useState(false);
  const [locationId, setLocationId] = useState(hotelLocations[0]?.id ?? '');
  const roomsHere = rooms.filter((r) => r.locationId === locationId);
  const [roomId, setRoomId] = useState(roomsHere[0]?.id ?? '');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [checkInDate, setCheckInDate] = useState('2026-08-30');
  const [checkOutDate, setCheckOutDate] = useState('2026-09-01');
  const [numberOfGuests, setNumberOfGuests] = useState(2);

  const selectedRoom = rooms.find((r) => r.id === roomId);

  const columns: DataTableColumn<Reservation>[] = [
    { key: 'res', header: 'Reservation', render: (r) => r.reservationNumber },
    { key: 'guest', header: 'Guest', render: (r) => r.guestName },
    { key: 'outlet', header: 'Outlet', render: (r) => locationName(r.locationId) },
    { key: 'room', header: 'Room', render: (r) => roomLabel(r.roomId) },
    { key: 'dates', header: 'Stay', render: (r) => `${r.checkInDate} → ${r.checkOutDate}` },
    { key: 'status', header: 'Status', render: (r) => <StatusChip label={r.status} tone={RES_TONE[r.status]} /> },
    {
      key: 'action', header: 'Action', render: (r) => r.status === 'BOOKED' ? (
        <button onClick={(e) => { e.stopPropagation(); checkIn(r.id); }} className="px-3 py-1.5 bg-[#0F5B55] hover:bg-[#08463F] text-white text-[12px] font-semibold rounded-lg">Check In</button>
      ) : <span className="text-[11px] text-[#66706B]">—</span>,
    },
  ];

  const openNew = () => {
    const loc = hotelLocations[0]?.id ?? '';
    setLocationId(loc);
    const firstRoom = rooms.find((r) => r.locationId === loc);
    setRoomId(firstRoom?.id ?? '');
    setGuestName(''); setGuestPhone(''); setCheckInDate('2026-08-30'); setCheckOutDate('2026-09-01'); setNumberOfGuests(2);
    setShowNew(true);
  };

  const submitNew = () => {
    if (!locationId || !roomId || !guestName || !guestPhone || !selectedRoom) return;
    createReservation({
      locationId, roomId, guestName, guestPhone, checkInDate, checkOutDate,
      numberOfGuests, ratePerNight: selectedRoom.rateInr,
    });
    setShowNew(false);
  };

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader
          title="Reservations"
          subtitle="Book → Check-in → Room Service (via POS) → Check-out with folio settlement."
          actions={<button onClick={openNew} className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[13px] rounded-[8px] flex items-center gap-2"><Plus className="w-4 h-4" /> New Reservation</button>}
        />
        <DataTable
          columns={columns} rows={[...reservations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
          keyField={(r) => r.id} onRowClick={(r) => router.push(`/hotel/reservations/${r.id}`)}
        />
      </div>

      <Modal
        open={showNew} onClose={() => setShowNew(false)} title="New Reservation" maxWidthClass="max-w-lg"
        footer={<>
          <button onClick={() => setShowNew(false)} className="px-4 py-2 text-[13px] font-semibold text-[#66706B]">Cancel</button>
          <button onClick={submitNew} className="px-4 py-2 bg-[#0F5B55] text-white text-[13px] font-semibold rounded-[8px]">Create Reservation</button>
        </>}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Outlet</label>
              <select value={locationId} onChange={(e) => { setLocationId(e.target.value); const fr = rooms.find((r) => r.locationId === e.target.value); setRoomId(fr?.id ?? ''); }} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]">
                {hotelLocations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Room</label>
              <select value={roomId} onChange={(e) => setRoomId(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]">
                {roomsHere.map((r) => <option key={r.id} value={r.id}>{r.roomNumber} — {r.roomType} (₹{r.rateInr}/night)</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Guest Name</label>
              <input value={guestName} onChange={(e) => setGuestName(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Guest Phone</label>
              <input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Check-In</label>
              <input type="date" value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Check-Out</label>
              <input type="date" value={checkOutDate} onChange={(e) => setCheckOutDate(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Guests</label>
              <input type="number" min={1} value={numberOfGuests} onChange={(e) => setNumberOfGuests(Number(e.target.value))} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
            </div>
          </div>
        </div>
      </Modal>
    </ShellLayout>
  );
}
