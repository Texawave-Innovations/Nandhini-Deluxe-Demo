'use client';

import React, { useEffect, useState } from 'react';
import { QrCode, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { posService } from '@/services/posService';
import { GatewaySessionStatus } from '@/types/pos';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

interface RazorpayQRModalProps {
  open: boolean;
  amount: number;
  onClose: () => void;
  onSuccess: (transactionId: string) => void;
}

// Simulates Razorpay dynamic-QR collect: WAITING -> PROCESSING -> SUCCESS (occasionally FAILED),
// mirroring a real webhook-driven status poll without an actual gateway integration.
export default function RazorpayQRModal({ open, amount, onClose, onSuccess }: RazorpayQRModalProps) {
  const [status, setStatus] = useState<GatewaySessionStatus>('WAITING');
  const [txnId] = useState(() => posService.generateTransactionId('RZP'));

  useEffect(() => {
    if (!open) { setStatus('WAITING'); return; }
    const t1 = setTimeout(() => setStatus('PROCESSING'), 1800);
    const t2 = setTimeout(() => setStatus('SUCCESS'), 3600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [open]);

  useEffect(() => {
    if (status === 'SUCCESS') {
      const t = setTimeout(() => onSuccess(txnId), 900);
      return () => clearTimeout(t);
    }
  }, [status, onSuccess, txnId]);

  return (
    <Modal open={open} onClose={onClose} title="Razorpay QR Payment" subtitle="Scan to pay" maxWidthClass="max-w-sm">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-44 h-44 bg-white border-2 border-[#202522] rounded-lg flex items-center justify-center relative overflow-hidden">
          <QrCode className="w-32 h-32 text-[#202522]" strokeWidth={0.8} />
          {status === 'SUCCESS' && <div className="absolute inset-0 bg-white/90 flex items-center justify-center"><CheckCircle2 className="w-16 h-16 text-[#23865B]" /></div>}
        </div>
        <div className="text-[24px] font-bold text-[#202522]">{inr(amount)}</div>
        <div className="text-[12px] text-[#66706B]">Txn ID: {txnId}</div>

        <div className="w-full">
          {status === 'WAITING' && (
            <div className="flex items-center justify-center gap-2 py-2.5 bg-[#F3F0E9] rounded-lg text-[13px] font-semibold text-[#66706B]">
              <Loader2 className="w-4 h-4 animate-spin" /> Waiting for customer to scan...
            </div>
          )}
          {status === 'PROCESSING' && (
            <div className="flex items-center justify-center gap-2 py-2.5 bg-[#3377A8]/10 rounded-lg text-[13px] font-semibold text-[#3377A8]">
              <Loader2 className="w-4 h-4 animate-spin" /> Processing payment...
            </div>
          )}
          {status === 'SUCCESS' && (
            <div className="flex items-center justify-center gap-2 py-2.5 bg-[#23865B]/10 rounded-lg text-[13px] font-semibold text-[#23865B]">
              <CheckCircle2 className="w-4 h-4" /> Payment Successful — settling bill...
            </div>
          )}
          {status === 'FAILED' && (
            <div className="flex items-center justify-center gap-2 py-2.5 bg-[#C94B45]/10 rounded-lg text-[13px] font-semibold text-[#C94B45]">
              <XCircle className="w-4 h-4" /> Payment Failed
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
