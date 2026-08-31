'use client';

import React, { useEffect, useState } from 'react';
import { CreditCard, CheckCircle2, Loader2, Send } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { posService } from '@/services/posService';
import { EDCSessionStatus } from '@/types/pos';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

interface EDCModalProps {
  open: boolean;
  amount: number;
  provider?: string; // configurable — actual EDC provider TBD with the client
  onClose: () => void;
  onSuccess: (referenceNo: string) => void;
}

export default function EDCModal({ open, amount, provider = 'Configurable EDC Provider', onClose, onSuccess }: EDCModalProps) {
  const [status, setStatus] = useState<EDCSessionStatus>('SENDING');
  const [refNo] = useState(() => posService.generateTransactionId('CARD'));

  useEffect(() => {
    if (!open) { setStatus('SENDING'); return; }
    const t1 = setTimeout(() => setStatus('WAITING_CUSTOMER'), 1200);
    const t2 = setTimeout(() => setStatus('SUCCESS'), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [open]);

  useEffect(() => {
    if (status === 'SUCCESS') {
      const t = setTimeout(() => onSuccess(refNo), 800);
      return () => clearTimeout(t);
    }
  }, [status, onSuccess, refNo]);

  return (
    <Modal open={open} onClose={onClose} title="Card / EDC Payment" subtitle={provider} maxWidthClass="max-w-sm">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-28 h-28 rounded-full bg-[#F3F0E9] flex items-center justify-center">
          <CreditCard className="w-12 h-12 text-[#0F5B55]" />
        </div>
        <div className="text-[24px] font-bold text-[#202522]">{inr(amount)}</div>
        <div className="text-[12px] text-[#66706B]">Ref: {refNo}</div>

        <div className="w-full space-y-2">
          <div className={`flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] font-semibold ${status === 'SENDING' ? 'bg-[#3377A8]/10 text-[#3377A8]' : 'bg-[#F3F0E9] text-[#66706B]'}`}>
            {status === 'SENDING' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Sending amount to card machine
          </div>
          <div className={`flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] font-semibold ${status === 'WAITING_CUSTOMER' ? 'bg-[#C68A28]/10 text-[#C68A28]' : status === 'SUCCESS' ? 'bg-[#F3F0E9] text-[#66706B]' : 'bg-[#F3F0E9] text-[#66706B]/40'}`}>
            {status === 'WAITING_CUSTOMER' && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Waiting for customer (tap / insert card)
          </div>
          <div className={`flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] font-semibold ${status === 'SUCCESS' ? 'bg-[#23865B]/10 text-[#23865B]' : 'bg-[#F3F0E9] text-[#66706B]/40'}`}>
            {status === 'SUCCESS' && <CheckCircle2 className="w-3.5 h-3.5" />} Payment Successful
          </div>
        </div>
      </div>
    </Modal>
  );
}
