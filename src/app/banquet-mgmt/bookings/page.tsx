'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import StatusChip, { ChipTone } from '@/components/ui/StatusChip';
import Modal from '@/components/ui/Modal';
import { Plus } from 'lucide-react';
import { useBanquetStore } from '@/store/banquet-store';
import { useHRMSStore } from '@/store/hrms-store';
import { BanquetBooking, BanquetBookingStatus } from '@/types/banquet-mgmt';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const STATUS_TONE: Record<BanquetBookingStatus, ChipTone> = {
  ENQUIRY: 'neutral', CONFIRMED: 'info', COMPLETED: 'success', CANCELLED: 'danger',
};
const PACKAGES = [
  { name: 'Silver Wedding Package', ratePerPlate: 900 },
  { name: 'Gold Corporate Package', ratePerPlate: 1100 },
  { name: 'Platinum Celebration Package', ratePerPlate: 1400 },
];

export default function BanquetBookingsPage() {
  const router = useRouter();
  const { halls, bookings, createBooking } = useBanquetStore();
  const { locations } = useHRMSStore();
  const banquetLocations = locations.filter((l) => l.features.hasBanquet);
  const locationName = (id: string) => locations.find((l) => l.id === id)?.name ?? id;
  const hallName = (id: string) => halls.find((h) => h.id === id)?.name ?? id;

  const [showNew, setShowNew] = useState(false);
  const [locationId, setLocationId] = useState(banquetLocations[0]?.id ?? '');
  const hallsHere = halls.filter((h) => h.locationId === locationId);
  const [hallId, setHallId] = useState(hallsHere[0]?.id ?? '');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [eventDate, setEventDate] = useState('2026-09-05');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('23:00');
  const [expectedGuests, setExpectedGuests] = useState(150);
  const [packageIdx, setPackageIdx] = useState(0);

  const columns: DataTableColumn<BanquetBooking>[] = [
    { key: 'booking', header: 'Booking', render: (b) => b.bookingNumber },
    { key: 'customer', header: 'Customer', render: (b) => b.customerName },
    { key: 'hall', header: 'Hall', render: (b) => hallName(b.hallId) },
    { key: 'outlet', header: 'Outlet', render: (b) => locationName(b.locationId) },
    { key: 'event', header: 'Event Date', render: (b) => b.eventDate },
    { key: 'guests', header: 'Guests', render: (b) => b.expectedGuests },
    { key: 'amount', header: 'Package Amount', render: (b) => inr(b.packageAmount) },
    { key: 'status', header: 'Status', render: (b) => <StatusChip label={b.status} tone={STATUS_TONE[b.status]} /> },
  ];

  const openNew = () => {
    const loc = banquetLocations[0]?.id ?? '';
    setLocationId(loc);
    setHallId(halls.find((h) => h.locationId === loc)?.id ?? '');
    setCustomerName(''); setCustomerPhone(''); setEventDate('2026-09-05'); setStartTime('18:00'); setEndTime('23:00'); setExpectedGuests(150); setPackageIdx(0);
    setShowNew(true);
  };

  const submitNew = () => {
    if (!locationId || !hallId || !customerName || !customerPhone) return;
    const pkg = PACKAGES[packageIdx];
    createBooking({
      locationId, hallId, customerName, customerPhone, eventDate, startTime, endTime,
      expectedGuests, packageName: pkg.name, ratePerPlate: pkg.ratePerPlate,
    });
    setShowNew(false);
  };

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader
          title="Bookings"
          subtitle="Enquiry → Confirm (with advance) → Event day catering via POS → Final Bill → Balance settlement."
          actions={<button onClick={openNew} className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[13px] rounded-[8px] flex items-center gap-2"><Plus className="w-4 h-4" /> New Enquiry</button>}
        />
        <DataTable
          columns={columns} rows={[...bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
          keyField={(b) => b.id} onRowClick={(b) => router.push(`/banquet-mgmt/bookings/${b.id}`)}
        />
      </div>

      <Modal
        open={showNew} onClose={() => setShowNew(false)} title="New Banquet Enquiry" maxWidthClass="max-w-lg"
        footer={<>
          <button onClick={() => setShowNew(false)} className="px-4 py-2 text-[13px] font-semibold text-[#66706B]">Cancel</button>
          <button onClick={submitNew} className="px-4 py-2 bg-[#0F5B55] text-white text-[13px] font-semibold rounded-[8px]">Create Enquiry</button>
        </>}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Outlet</label>
              <select value={locationId} onChange={(e) => { setLocationId(e.target.value); setHallId(halls.find((h) => h.locationId === e.target.value)?.id ?? ''); }} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]">
                {banquetLocations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Hall</label>
              <select value={hallId} onChange={(e) => setHallId(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]">
                {hallsHere.map((h) => <option key={h.id} value={h.id}>{h.name} (cap {h.capacity})</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Customer Name</label>
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Customer Phone</label>
              <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Event Date</label>
              <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Start</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">End</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Expected Guests</label>
              <input type="number" min={1} value={expectedGuests} onChange={(e) => setExpectedGuests(Number(e.target.value))} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Package</label>
              <select value={packageIdx} onChange={(e) => setPackageIdx(Number(e.target.value))} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]">
                {PACKAGES.map((p, i) => <option key={p.name} value={i}>{p.name} — ₹{p.ratePerPlate}/plate</option>)}
              </select>
            </div>
          </div>
          <div className="text-[12px] text-[#66706B]">Estimated package amount: <span className="font-semibold text-[#202522]">{inr(expectedGuests * PACKAGES[packageIdx].ratePerPlate)}</span></div>
        </div>
      </Modal>
    </ShellLayout>
  );
}
