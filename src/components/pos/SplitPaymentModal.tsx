'use client';

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { PaymentMode } from '@/types/pos';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const MODES: PaymentMode[] = ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'OTHER'];

interface SplitPaymentModalProps {
  open: boolean;
  netAmount: number;
  onClose: () => void;
  onConfirm: (entries: { mode: PaymentMode; amount: number }[]) => void;
}

export default function SplitPaymentModal({ open, netAmount, onClose, onConfirm }: SplitPaymentModalProps) {
  const [rows, setRows] = useState<{ mode: PaymentMode; amount: number }[]>([{ mode: 'CASH', amount: netAmount }]);

  const total = rows.reduce((s, r) => s + (r.amount || 0), 0);
  const remaining = Number((netAmount - total).toFixed(2));

  const updateRow = (i: number, patch: Partial<{ mode: PaymentMode; amount: number }>) => {
    setRows(rows.map((r, ri) => ri === i ? { ...r, ...patch } : r));
  };

  const confirm = () => {
    if (remaining !== 0) return;
    onConfirm(rows.filter((r) => r.amount > 0));
    setRows([{ mode: 'CASH', amount: netAmount }]);
  };

  return (
    <Modal
      open={open} onClose={onClose} title="Split Payment" subtitle={`Bill Total: ${inr(netAmount)}`}
      footer={<>
        <button onClick={onClose} className="px-4 py-2 text-[13px] font-semibold text-[#66706B]">Cancel</button>
        <button onClick={confirm} disabled={remaining !== 0} className="px-4 py-2 bg-[#0F5B55] disabled:bg-[#E5E2DB] disabled:text-[#66706B] text-white text-[13px] font-semibold rounded-[8px]">Confirm Payment</button>
      </>}
    >
      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <select value={row.mode} onChange={(e) => updateRow(i, { mode: e.target.value as PaymentMode })} className="border border-[#E5E2DB] rounded-lg px-2.5 py-2 text-[13px] w-32">
              {MODES.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
            </select>
            <input type="number" value={row.amount} onChange={(e) => updateRow(i, { amount: Number(e.target.value) })} className="flex-1 border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
            {rows.length > 1 && (
              <button onClick={() => setRows(rows.filter((_, ri) => ri !== i))} className="p-2 text-[#C94B45] hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
            )}
          </div>
        ))}
        <button onClick={() => setRows([...rows, { mode: 'UPI', amount: Math.max(0, remaining) }])} className="text-[12px] text-[#0F5B55] font-semibold flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add payment mode</button>

        <div className={`flex items-center justify-between p-3 rounded-lg text-[13px] font-semibold ${remaining === 0 ? 'bg-[#23865B]/10 text-[#23865B]' : 'bg-[#C94B45]/10 text-[#C94B45]'}`}>
          <span>{remaining === 0 ? 'Fully Allocated' : remaining > 0 ? 'Remaining' : 'Over-allocated'}</span>
          <span>{inr(Math.abs(remaining))}</span>
        </div>
      </div>
    </Modal>
  );
}
