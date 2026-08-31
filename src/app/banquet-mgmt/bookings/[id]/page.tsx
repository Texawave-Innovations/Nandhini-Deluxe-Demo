'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import StatusChip, { ChipTone } from '@/components/ui/StatusChip';
import Modal from '@/components/ui/Modal';
import { ArrowLeft, CheckCircle2, FileText, RefreshCw, UtensilsCrossed, Wallet } from 'lucide-react';
import { useBanquetStore } from '@/store/banquet-store';
import { useHRMSStore } from '@/store/hrms-store';
import { BanquetBillLine, BanquetBookingStatus } from '@/types/banquet-mgmt';
import { PaymentMode } from '@/types/pos';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const STATUS_TONE: Record<BanquetBookingStatus, ChipTone> = {
  ENQUIRY: 'neutral', CONFIRMED: 'info', COMPLETED: 'success', CANCELLED: 'danger',
};
const PAYMENT_MODES: PaymentMode[] = ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER'];

export default function BanquetBookingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { bookings, halls, finalBills, confirmBooking, generateFinalBill, settleBalance } = useBanquetStore();
  const { locations } = useHRMSStore();

  const booking = bookings.find((b) => b.id === params.id);
  const hall = halls.find((h) => h.id === booking?.hallId);
  const outlet = locations.find((l) => l.id === booking?.locationId);
  const finalBill = finalBills.find((f) => f.bookingId === params.id);

  const [showConfirm, setShowConfirm] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [advMode, setAdvMode] = useState<PaymentMode>('BANK_TRANSFER');
  const [advRef, setAdvRef] = useState('');

  const [showSettle, setShowSettle] = useState(false);
  const [balMode, setBalMode] = useState<PaymentMode>('CASH');
  const [balRef, setBalRef] = useState('');

  if (!booking || !hall) {
    return <ShellLayout><div className="text-[13px] text-[#66706B]">Booking not found. <button onClick={() => router.push('/banquet-mgmt/bookings')} className="text-[#0F5B55] font-semibold">Back</button></div></ShellLayout>;
  }

  const lineColumns: DataTableColumn<BanquetBillLine>[] = [
    { key: 'type', header: 'Type', render: (l) => l.type.replace('_', ' ') },
    { key: 'desc', header: 'Description', render: (l) => l.description },
    { key: 'amount', header: 'Amount', render: (l) => inr(l.amount) },
  ];

  const openConfirm = () => {
    setAdvanceAmount(Math.round(booking.packageAmount * 0.3 * 100) / 100);
    setAdvMode('BANK_TRANSFER'); setAdvRef('');
    setShowConfirm(true);
  };
  const submitConfirm = () => {
    confirmBooking(booking.id, advanceAmount, advMode, advRef || undefined);
    setShowConfirm(false);
  };

  const openSettle = () => { setBalMode('CASH'); setBalRef(''); setShowSettle(true); };
  const submitSettle = () => {
    settleBalance(booking.id, balMode, balRef || undefined);
    setShowSettle(false);
  };

  return (
    <ShellLayout>
      <div className="space-y-5">
        <button onClick={() => router.push('/banquet-mgmt/bookings')} className="flex items-center gap-1.5 text-[13px] text-[#66706B] hover:text-[#202522]"><ArrowLeft className="w-4 h-4" /> Back to Bookings</button>

        <SectionHeader
          title={booking.bookingNumber}
          subtitle={`${booking.customerName} • ${outlet?.name ?? booking.locationId} • ${hall.name} • ${booking.eventDate} ${booking.startTime}-${booking.endTime}`}
          actions={<>
            <StatusChip label={booking.status} tone={STATUS_TONE[booking.status]} />
            {booking.status === 'ENQUIRY' && <button onClick={openConfirm} className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[13px] rounded-[8px] flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Confirm Booking</button>}
            {booking.status === 'CONFIRMED' && <button onClick={() => generateFinalBill(booking.id)} className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[13px] rounded-[8px] flex items-center gap-2"><FileText className="w-4 h-4" /> {finalBill ? 'Refresh Final Bill' : 'Generate Final Bill'}</button>}
            {booking.status === 'CONFIRMED' && finalBill && finalBill.status === 'OPEN' && <button onClick={openSettle} className="h-10 px-4 bg-[#C59A45] hover:bg-[#B08838] text-white font-semibold text-[13px] rounded-[8px] flex items-center gap-2"><Wallet className="w-4 h-4" /> Settle Balance</button>}
          </>}
        />

        {booking.status === 'CONFIRMED' && (
          <div className="bg-[#F3F0E9] border border-[#E5E2DB] rounded-[10px] p-3.5 text-[13px] text-[#66706B] flex items-center justify-between flex-wrap gap-2">
            <span>Place event-day catering through POS as a <strong className="text-[#202522]">Banquet</strong> order and pick this booking — once billed, it appears on the final bill automatically.</span>
            <div className="flex items-center gap-2">
              <button onClick={() => router.push('/pos/new-order')} className="px-3 py-1.5 bg-white border border-[#E5E2DB] hover:border-[#0F5B55] text-[#202522] text-[12px] font-semibold rounded-lg flex items-center gap-1.5"><UtensilsCrossed className="w-3.5 h-3.5" /> New POS Order</button>
              {finalBill && <button onClick={() => generateFinalBill(booking.id)} className="px-3 py-1.5 bg-white border border-[#E5E2DB] hover:border-[#0F5B55] text-[#202522] text-[12px] font-semibold rounded-lg flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-4 shadow-brand-xs">
            <div className="text-[12px] text-[#66706B]">Package Amount</div>
            <div className="text-[20px] font-bold text-[#202522] mt-1">{inr(booking.packageAmount)}</div>
          </div>
          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-4 shadow-brand-xs">
            <div className="text-[12px] text-[#66706B]">Advance Paid</div>
            <div className="text-[20px] font-bold text-[#23865B] mt-1">{inr(booking.advanceAmount)}</div>
          </div>
          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-4 shadow-brand-xs">
            <div className="text-[12px] text-[#66706B]">Expected Guests</div>
            <div className="text-[20px] font-bold text-[#202522] mt-1">{booking.expectedGuests}</div>
          </div>
        </div>

        {finalBill && (
          <div className="space-y-2">
            <h3 className="text-[14px] font-semibold text-[#202522]">Final Bill — Total {inr(finalBill.totalAmount)}</h3>
            <DataTable columns={lineColumns} rows={finalBill.lines} keyField={(l) => `${l.type}-${l.sourceBillId ?? l.description}`} />
            <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-4 shadow-brand-xs flex items-center justify-between">
              <div className="text-[13px] text-[#66706B]">Advance Adjusted {inr(finalBill.advanceAdjusted)} • Balance Due <span className="font-semibold text-[#C94B45]">{inr(finalBill.balanceDue)}</span></div>
              <StatusChip label={finalBill.status} tone={finalBill.status === 'SETTLED' ? 'success' : 'warning'} />
            </div>
          </div>
        )}
      </div>

      <Modal
        open={showConfirm} onClose={() => setShowConfirm(false)} title="Confirm Booking & Record Advance" subtitle={booking.bookingNumber} maxWidthClass="max-w-md"
        footer={<>
          <button onClick={() => setShowConfirm(false)} className="px-4 py-2 text-[13px] font-semibold text-[#66706B]">Cancel</button>
          <button onClick={submitConfirm} className="px-4 py-2 bg-[#0F5B55] text-white text-[13px] font-semibold rounded-[8px]">Confirm & Record Advance</button>
        </>}
      >
        <div className="space-y-3">
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Advance Amount</label>
            <input type="number" min={0} value={advanceAmount} onChange={(e) => setAdvanceAmount(Number(e.target.value))} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Payment Mode</label>
            <select value={advMode} onChange={(e) => setAdvMode(e.target.value as PaymentMode)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]">
              {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {advMode !== 'CASH' && (
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Reference No.</label>
              <input value={advRef} onChange={(e) => setAdvRef(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={showSettle} onClose={() => setShowSettle(false)} title="Settle Balance" subtitle={booking.bookingNumber} maxWidthClass="max-w-md"
        footer={<>
          <button onClick={() => setShowSettle(false)} className="px-4 py-2 text-[13px] font-semibold text-[#66706B]">Cancel</button>
          <button onClick={submitSettle} className="px-4 py-2 bg-[#0F5B55] text-white text-[13px] font-semibold rounded-[8px]">Confirm Settlement</button>
        </>}
      >
        <div className="space-y-3">
          <div className="bg-[#F3F0E9] rounded-lg p-3 text-[13px] text-[#202522]">Balance due: <span className="font-semibold">{inr(finalBill?.balanceDue ?? 0)}</span></div>
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Payment Mode</label>
            <select value={balMode} onChange={(e) => setBalMode(e.target.value as PaymentMode)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]">
              {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {balMode !== 'CASH' && (
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Reference No.</label>
              <input value={balRef} onChange={(e) => setBalRef(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
            </div>
          )}
        </div>
      </Modal>
    </ShellLayout>
  );
}
