'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import StatusChip, { ChipTone } from '@/components/ui/StatusChip';
import Modal from '@/components/ui/Modal';
import { Bike, Receipt } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';
import { usePOSStore } from '@/store/pos-store';
import { useOutletStore } from '@/store/outlet-store';
import { outletService } from '@/services/outletService';
import { ROLE_LABELS } from '@/permissions/roleAccess';
import { BillType, OrderStatus, OrderType } from '@/types/pos';

const TABS: { type: OrderType; label: string }[] = [
  { type: 'DINE_IN', label: 'Dine-In' }, { type: 'TAKEAWAY', label: 'Takeaway' }, { type: 'DELIVERY', label: 'Delivery' },
  { type: 'ROOM_SERVICE', label: 'Room Service' }, { type: 'BANQUET', label: 'Banquet' },
];
const ORDER_STATUS_TONE: Record<OrderStatus, ChipTone> = {
  OPEN: 'neutral', KOT_SENT: 'warning', PREPARING: 'info', READY: 'success', SERVED: 'brand', BILLED: 'info', CLOSED: 'success', CANCELLED: 'danger',
};

export default function OpenOrdersPage() {
  const router = useRouter();
  const { locations, currentRole } = useHRMSStore();
  const { orders, tables, generateBill, importChannelOrder, discounts } = usePOSStore();
  const { selectedOutletId, businessDate } = useOutletStore();
  const outlets = outletService.listOutlets(locations);
  const effectiveOutletId = selectedOutletId === 'ALL' ? outlets[0]?.id : selectedOutletId;

  const [tab, setTab] = useState<OrderType>('DINE_IN');
  const [billOrderId, setBillOrderId] = useState<string | null>(null);
  const [billType, setBillType] = useState<BillType>('NORMAL');
  const [discountId, setDiscountId] = useState('');
  const [reason, setReason] = useState('');

  const scoped = orders.filter((o) => o.outletId === effectiveOutletId && o.orderType === tab && !['CLOSED', 'CANCELLED'].includes(o.status));
  const billOrder = orders.find((o) => o.id === billOrderId);
  const actor = ROLE_LABELS[currentRole];

  const openBillModal = (orderId: string) => {
    setBillOrderId(orderId); setBillType('NORMAL'); setDiscountId(''); setReason('');
  };

  const confirmBill = () => {
    if (!billOrderId) return;
    const bill = generateBill(billOrderId, {
      billType, discountId: discountId || undefined, createdBy: actor,
      complimentaryReason: billType === 'COMPLIMENTARY' ? reason : undefined,
      complimentaryRequestedBy: billType === 'COMPLIMENTARY' ? actor : undefined,
    });
    setBillOrderId(null);
    router.push('/pos/bills');
  };

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader
          title="Open Orders"
          subtitle={outlets.find((o) => o.id === effectiveOutletId)?.name}
          actions={
            <div className="flex items-center gap-2">
              <button onClick={() => effectiveOutletId && importChannelOrder(effectiveOutletId, 'SWIGGY_DELIVERY')} className="h-9 px-3 bg-white border border-[#E5E2DB] text-[13px] font-semibold rounded-lg flex items-center gap-1.5"><Bike className="w-3.5 h-3.5 text-[#C68A28]" /> Simulate Swiggy Order</button>
              <button onClick={() => effectiveOutletId && importChannelOrder(effectiveOutletId, 'ZOMATO_DELIVERY')} className="h-9 px-3 bg-white border border-[#E5E2DB] text-[13px] font-semibold rounded-lg flex items-center gap-1.5"><Bike className="w-3.5 h-3.5 text-[#C94B45]" /> Simulate Zomato Order</button>
            </div>
          }
        />

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {TABS.map((t) => (
            <button key={t.type} onClick={() => setTab(t.type)} className={`px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap ${tab === t.type ? 'bg-[#0F5B55] text-white' : 'bg-white border border-[#E5E2DB] text-[#202522]'}`}>{t.label}</button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scoped.map((o) => {
            const table = o.tableId ? tables.find((t) => t.id === o.tableId) : undefined;
            const gross = o.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
            return (
              <div key={o.id} className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#0F5B55]">{o.orderNumber}</span>
                  <StatusChip label={o.status} tone={ORDER_STATUS_TONE[o.status]} />
                </div>
                <div className="text-[11px] text-[#66706B] mt-1">
                  {table ? `Table ${table.code}` : o.roomNumber ? `Room ${o.roomNumber}` : o.externalOrderRef ?? '—'}
                  {o.channel !== 'DIRECT' && ` • ${o.channel.replace('_', ' ')}`}
                </div>
                <div className="mt-2 space-y-0.5">
                  {o.items.slice(0, 4).map((it) => <div key={it.id} className="text-[12px] text-[#202522]">{it.qty}× {it.name}</div>)}
                  {o.items.length > 4 && <div className="text-[11px] text-[#66706B]">+{o.items.length - 4} more</div>}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[13px] font-bold text-[#202522]">₹{gross.toLocaleString('en-IN')}</span>
                  {(o.status === 'SERVED' || o.status === 'READY' || o.status === 'KOT_SENT') && !o.billId && (
                    <button onClick={() => openBillModal(o.id)} className="px-3 py-1.5 bg-[#0F5B55] hover:bg-[#08463F] text-white text-[11px] font-semibold rounded-lg flex items-center gap-1"><Receipt className="w-3 h-3" /> Generate Bill</button>
                  )}
                </div>
              </div>
            );
          })}
          {scoped.length === 0 && <div className="col-span-full text-[13px] text-[#66706B] bg-white border border-[#E5E2DB] rounded-[10px] p-8 text-center">No open {tab.replace('_', ' ').toLowerCase()} orders.</div>}
        </div>
      </div>

      <Modal
        open={!!billOrderId} onClose={() => setBillOrderId(null)} title="Generate Bill" subtitle={billOrder?.orderNumber}
        footer={<>
          <button onClick={() => setBillOrderId(null)} className="px-4 py-2 text-[13px] font-semibold text-[#66706B]">Cancel</button>
          <button onClick={confirmBill} className="px-4 py-2 bg-[#0F5B55] text-white text-[13px] font-semibold rounded-[8px]">Generate Bill</button>
        </>}
      >
        <div className="space-y-3">
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Bill Type</label>
            <select value={billType} onChange={(e) => setBillType(e.target.value as BillType)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]">
              <option value="NORMAL">Normal</option>
              <option value="COMPLIMENTARY">Complimentary</option>
              <option value="NON_CHARGEABLE">Non-Chargeable</option>
            </select>
          </div>
          {billType === 'NORMAL' && (
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Discount (optional)</label>
              <select value={discountId} onChange={(e) => setDiscountId(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]">
                <option value="">No discount</option>
                {discounts.filter((d) => d.status === 'ACTIVE').map((d) => <option key={d.id} value={d.id}>{d.name} ({d.type === 'PERCENTAGE' ? `${d.value}%` : `₹${d.value}`})</option>)}
              </select>
            </div>
          )}
          {billType === 'COMPLIMENTARY' && (
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Reason</label>
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Guest relations gesture" className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
              <div className="text-[11px] text-[#C68A28] mt-1">Complimentary bills require Manager Approval before they're marked paid — you'll approve it on the Complimentary Bills screen.</div>
            </div>
          )}
        </div>
      </Modal>
    </ShellLayout>
  );
}
