'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import StatusChip from '@/components/ui/StatusChip';
import RazorpayQRModal from '@/components/pos/RazorpayQRModal';
import EDCModal from '@/components/pos/EDCModal';
import SplitPaymentModal from '@/components/pos/SplitPaymentModal';
import { Wallet, CreditCard, QrCode, SplitSquareHorizontal, CheckCircle2 } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';
import { usePOSStore } from '@/store/pos-store';
import { useOutletStore } from '@/store/outlet-store';
import { outletService } from '@/services/outletService';
import { Bill, PaymentMode } from '@/types/pos';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function PaymentsPage() {
  const { locations } = useHRMSStore();
  const { bills, payments, recordPayment } = usePOSStore();
  const { selectedOutletId, businessDate } = useOutletStore();
  const outlets = outletService.listOutlets(locations);
  const scopeIds = selectedOutletId === 'ALL' ? outlets.map((o) => o.id) : [selectedOutletId];

  const pendingBills = bills.filter((b) => scopeIds.includes(b.outletId) && b.billType === 'NORMAL' && b.status === 'OPEN');
  const [activeBill, setActiveBill] = useState<Bill | null>(null);
  const [modal, setModal] = useState<'razorpay' | 'edc' | 'split' | null>(null);
  const [justPaid, setJustPaid] = useState<string | null>(null);

  const pay = (mode: PaymentMode, referenceNo?: string) => {
    if (!activeBill) return;
    recordPayment(activeBill.id, [{ mode, amount: activeBill.netAmount, referenceNo }]);
    setJustPaid(activeBill.id);
    setModal(null);
    setTimeout(() => setJustPaid(null), 2500);
    setActiveBill(null);
  };

  const paySplit = (entries: { mode: PaymentMode; amount: number }[]) => {
    if (!activeBill) return;
    recordPayment(activeBill.id, entries);
    setJustPaid(activeBill.id);
    setModal(null);
    setTimeout(() => setJustPaid(null), 2500);
    setActiveBill(null);
  };

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader title="Payments" subtitle={`${pendingBills.length} bill(s) awaiting payment — Business Date ${businessDate}`} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingBills.map((b) => (
            <div key={b.id} className={`bg-white rounded-[10px] border shadow-brand-xs p-4 transition-all ${activeBill?.id === b.id ? 'border-[#0F5B55] ring-1 ring-[#0F5B55]' : 'border-[#E5E2DB]'}`}>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#0F5B55]">{b.billNumber}</span>
                <StatusChip label="Awaiting Payment" tone="warning" />
              </div>
              <div className="text-[22px] font-bold text-[#202522] mt-2">{inr(b.netAmount)}</div>

              {activeBill?.id === b.id ? (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button onClick={() => pay('CASH')} className="flex flex-col items-center gap-1 py-2.5 bg-[#F3F0E9] hover:bg-[#0F5B55] hover:text-white rounded-lg text-[12px] font-semibold text-[#202522]"><Wallet className="w-4 h-4" /> Cash</button>
                  <button onClick={() => setModal('edc')} className="flex flex-col items-center gap-1 py-2.5 bg-[#F3F0E9] hover:bg-[#0F5B55] hover:text-white rounded-lg text-[12px] font-semibold text-[#202522]"><CreditCard className="w-4 h-4" /> Card / EDC</button>
                  <button onClick={() => setModal('razorpay')} className="flex flex-col items-center gap-1 py-2.5 bg-[#F3F0E9] hover:bg-[#0F5B55] hover:text-white rounded-lg text-[12px] font-semibold text-[#202522]"><QrCode className="w-4 h-4" /> UPI / Razorpay</button>
                  <button onClick={() => setModal('split')} className="flex flex-col items-center gap-1 py-2.5 bg-[#F3F0E9] hover:bg-[#0F5B55] hover:text-white rounded-lg text-[12px] font-semibold text-[#202522]"><SplitSquareHorizontal className="w-4 h-4" /> Split</button>
                </div>
              ) : (
                <button onClick={() => setActiveBill(b)} className="w-full mt-3 h-10 bg-[#0F5B55] hover:bg-[#08463F] text-white text-[13px] font-semibold rounded-[8px]">Collect Payment</button>
              )}
            </div>
          ))}
          {pendingBills.length === 0 && <div className="col-span-full text-[13px] text-[#66706B] bg-white border border-[#E5E2DB] rounded-[10px] p-8 text-center">No bills awaiting payment. Generate a bill from Open Orders first.</div>}
        </div>

        {justPaid && (
          <div className="fixed bottom-6 right-6 bg-[#23865B] text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50">
            <CheckCircle2 className="w-4 h-4" /> Payment recorded — bill settled.
          </div>
        )}
      </div>

      <RazorpayQRModal open={modal === 'razorpay'} amount={activeBill?.netAmount ?? 0} onClose={() => setModal(null)} onSuccess={(txnId) => pay('RAZORPAY', txnId)} />
      <EDCModal open={modal === 'edc'} amount={activeBill?.netAmount ?? 0} onClose={() => setModal(null)} onSuccess={(ref) => pay('CARD', ref)} />
      <SplitPaymentModal open={modal === 'split'} netAmount={activeBill?.netAmount ?? 0} onClose={() => setModal(null)} onConfirm={paySplit} />
    </ShellLayout>
  );
}
