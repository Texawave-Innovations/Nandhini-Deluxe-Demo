'use client';

import React from 'react';
import { Minus, Plus, Trash2, Send } from 'lucide-react';
import { OrderLineItem } from '@/types/pos';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

interface CartPanelProps {
  items: OrderLineItem[];
  onIncrement: (item: OrderLineItem) => void;
  onDecrement: (item: OrderLineItem) => void;
  onRemove: (item: OrderLineItem) => void;
  onSendKOT: () => void;
  sendDisabled?: boolean;
  footer?: React.ReactNode;
}

export default function CartPanel({ items, onIncrement, onDecrement, onRemove, onSendKOT, sendDisabled, footer }: CartPanelProps) {
  const gross = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);

  return (
    <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[#E5E2DB] flex-shrink-0">
        <h3 className="text-[14px] font-semibold text-[#202522]">Current Order</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.length === 0 && <div className="text-[13px] text-[#66706B] text-center py-10">Tap menu items to add them here.</div>}
        {items.map((it) => (
          <div key={it.id} className="p-2.5 bg-[#F8F5EE] rounded-lg">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[13px] font-medium text-[#202522] flex-1">{it.name}</span>
              <button onClick={() => onRemove(it)} className="text-[#C94B45] p-0.5"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <div className="flex items-center gap-2">
                <button onClick={() => onDecrement(it)} className="w-6 h-6 rounded-full bg-white border border-[#E5E2DB] flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                <span className="text-[13px] font-semibold w-5 text-center">{it.qty}</span>
                <button onClick={() => onIncrement(it)} className="w-6 h-6 rounded-full bg-white border border-[#E5E2DB] flex items-center justify-center"><Plus className="w-3 h-3" /></button>
              </div>
              <span className="text-[13px] font-semibold text-[#0F5B55]">{inr(it.qty * it.unitPrice)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-[#E5E2DB] flex-shrink-0 space-y-3">
        <div className="flex items-center justify-between text-[14px] font-semibold text-[#202522]">
          <span>Subtotal</span><span>{inr(gross)}</span>
        </div>
        <button
          onClick={onSendKOT}
          disabled={sendDisabled || items.length === 0}
          className="w-full h-11 bg-[#0F5B55] hover:bg-[#08463F] disabled:bg-[#E5E2DB] disabled:text-[#66706B] text-white font-semibold text-[14px] rounded-[8px] flex items-center justify-center gap-2 transition-all"
        >
          <Send className="w-4 h-4" /> Send KOT to Kitchen
        </button>
        {footer}
      </div>
    </div>
  );
}
