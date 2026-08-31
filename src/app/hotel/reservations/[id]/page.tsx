'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import StatusChip, { ChipTone } from '@/components/ui/StatusChip';
import Modal from '@/components/ui/Modal';
import { ArrowLeft, LogIn, LogOut, RefreshCw, UtensilsCrossed } from 'lucide-react';
import { useHotelStore } from '@/store/hotel-store';
import { useHRMSStore } from '@/store/hrms-store';
import { FolioLine, ReservationStatus } from '@/types/hotel';
import { PaymentMode } from '@/types/pos';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const RES_TONE: Record<ReservationStatus, ChipTone> = {
  BOOKED: 'info', CHECKED_IN: 'brand', CHECKED_OUT: 'success', CANCELLED: 'danger', NO_SHOW: 'warning',
};
const PAYMENT_MODES: PaymentMode[] = ['CASH', 'CARD', 'UPI', 'RAZORPAY'];

export default function ReservationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { reservations, rooms, folios, checkIn, generateFolio, checkOut } = useHotelStore();
  const { locations } = useHRMSStore();

  const reservation = reservations.find((r) => r.id === params.id);
  const room = rooms.find((r) => r.id === reservation?.roomId);
  const outlet = locations.find((l) => l.id === reservation?.locationId);
  const folio = folios.find((f) => f.reservationId === params.id);

  const [showCheckout, setShowCheckout] = useState(false);
  const [payMode, setPayMode] = useState<PaymentMode>('CASH');
  const [payRef, setPayRef] = useState('');

  useEffect(() => {
    if (reservation && reservation.status === 'CHECKED_IN') generateFolio(reservation.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservation?.id, reservation?.status]);

  if (!reservation) {
    return <ShellLayout><div className="text-[13px] text-[#66706B]">Reservation not found. <button onClick={() => router.push('/hotel/reservations')} className="text-[#0F5B55] font-semibold">Back</button></div></ShellLayout>;
  }

  const lineColumns: DataTableColumn<FolioLine>[] = [
    { key: 'type', header: 'Type', render: (l) => l.type.replace('_', ' ') },
    { key: 'desc', header: 'Description', render: (l) => l.description },
    { key: 'amount', header: 'Amount', render: (l) => inr(l.amount) },
  ];

  const balanceDue = folio ? Math.round((folio.totalAmount - folio.amountPaid) * 100) / 100 : 0;

  const submitCheckout = () => {
    checkOut(reservation.id, payMode, payRef || undefined);
    setShowCheckout(false);
  };

  return (
    <ShellLayout>
      <div className="space-y-5">
        <button onClick={() => router.push('/hotel/reservations')} className="flex items-center gap-1.5 text-[13px] text-[#66706B] hover:text-[#202522]"><ArrowLeft className="w-4 h-4" /> Back to Reservations</button>

        <SectionHeader
          title={reservation.reservationNumber}
          subtitle={`${reservation.guestName} • ${outlet?.name ?? reservation.locationId} • Room ${room?.roomNumber ?? reservation.roomId} • ${reservation.checkInDate} → ${reservation.checkOutDate}`}
          actions={<>
            <StatusChip label={reservation.status} tone={RES_TONE[reservation.status]} />
            {reservation.status === 'BOOKED' && <button onClick={() => checkIn(reservation.id)} className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[13px] rounded-[8px] flex items-center gap-2"><LogIn className="w-4 h-4" /> Check In</button>}
            {reservation.status === 'CHECKED_IN' && <button onClick={() => setShowCheckout(true)} className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[13px] rounded-[8px] flex items-center gap-2"><LogOut className="w-4 h-4" /> Check Out</button>}
          </>}
        />

        {reservation.status === 'CHECKED_IN' && (
          <div className="bg-[#F3F0E9] border border-[#E5E2DB] rounded-[10px] p-3.5 text-[13px] text-[#66706B] flex items-center justify-between flex-wrap gap-2">
            <span>Place a Room Service order for room <strong className="text-[#202522]">{room?.roomNumber}</strong> from POS — once billed, it appears on this folio automatically.</span>
            <div className="flex items-center gap-2">
              <button onClick={() => router.push('/pos/new-order')} className="px-3 py-1.5 bg-white border border-[#E5E2DB] hover:border-[#0F5B55] text-[#202522] text-[12px] font-semibold rounded-lg flex items-center gap-1.5"><UtensilsCrossed className="w-3.5 h-3.5" /> New POS Order</button>
              <button onClick={() => generateFolio(reservation.id)} className="px-3 py-1.5 bg-white border border-[#E5E2DB] hover:border-[#0F5B55] text-[#202522] text-[12px] font-semibold rounded-lg flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Refresh Folio</button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-[14px] font-semibold text-[#202522]">Folio {folio ? `— Total ${inr(folio.totalAmount)}` : ''}</h3>
          {folio ? (
            <>
              <DataTable columns={lineColumns} rows={folio.lines} keyField={(l) => `${l.type}-${l.sourceBillId ?? l.description}`} />
              <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-4 shadow-brand-xs flex items-center justify-between">
                <div className="text-[13px] text-[#66706B]">Paid {inr(folio.amountPaid)} • Balance Due <span className="font-semibold text-[#C94B45]">{inr(balanceDue)}</span></div>
                <StatusChip label={folio.status} tone={folio.status === 'SETTLED' ? 'success' : 'warning'} />
              </div>
            </>
          ) : (
            <div className="text-[13px] text-[#66706B]">Folio will be generated once the guest checks in.</div>
          )}
        </div>
      </div>

      <Modal
        open={showCheckout} onClose={() => setShowCheckout(false)} title="Check Out & Settle Folio" subtitle={reservation.reservationNumber} maxWidthClass="max-w-md"
        footer={<>
          <button onClick={() => setShowCheckout(false)} className="px-4 py-2 text-[13px] font-semibold text-[#66706B]">Cancel</button>
          <button onClick={submitCheckout} className="px-4 py-2 bg-[#0F5B55] text-white text-[13px] font-semibold rounded-[8px]">Confirm Check-Out</button>
        </>}
      >
        <div className="space-y-3">
          <div className="bg-[#F3F0E9] rounded-lg p-3 text-[13px] text-[#202522]">Balance due: <span className="font-semibold">{inr(balanceDue)}</span></div>
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Payment Mode</label>
            <select value={payMode} onChange={(e) => setPayMode(e.target.value as PaymentMode)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]">
              {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {payMode !== 'CASH' && (
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Reference No.</label>
              <input value={payRef} onChange={(e) => setPayRef(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
            </div>
          )}
        </div>
      </Modal>
    </ShellLayout>
  );
}
