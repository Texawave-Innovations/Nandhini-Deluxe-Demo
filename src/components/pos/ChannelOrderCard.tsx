import React from 'react';
import { Bike } from 'lucide-react';
import StatusChip from '@/components/ui/StatusChip';
import { POSOrder } from '@/types/pos';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const PLATFORM_COLOR: Record<string, string> = {
  SWIGGY_DELIVERY: 'text-[#C68A28]', SWIGGY_DINEOUT: 'text-[#C68A28]',
  ZOMATO_DELIVERY: 'text-[#C94B45]', ZOMATO_DINEOUT: 'text-[#C94B45]',
};

export default function ChannelOrderCard({ order }: { order: POSOrder }) {
  const gross = order.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
  return (
    <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bike className={`w-4 h-4 ${PLATFORM_COLOR[order.channel] ?? 'text-[#66706B]'}`} />
          <span className="text-[13px] font-bold text-[#202522]">{order.externalOrderRef}</span>
        </div>
        <StatusChip label={order.channel.replace('_', ' ')} tone="warning" />
      </div>
      <div className="text-[12px] text-[#66706B] mt-1.5">{order.items.map((it) => `${it.qty}x ${it.name}`).join(', ')}</div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[14px] font-bold text-[#0F5B55]">{inr(gross)}</span>
        <StatusChip label={order.status} tone={order.status === 'CLOSED' ? 'success' : 'info'} />
      </div>
    </div>
  );
}
