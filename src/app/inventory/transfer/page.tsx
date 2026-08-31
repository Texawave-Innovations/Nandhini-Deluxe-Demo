'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import StatusChip, { ChipTone } from '@/components/ui/StatusChip';
import Modal from '@/components/ui/Modal';
import { ArrowRight, Plus, Trash2, Truck } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';
import { useInventoryStore } from '@/store/inventory-store';
import { outletService } from '@/services/outletService';
import { StockTransferStatus } from '@/types/inventory';

const STATUS_TONE: Record<StockTransferStatus, ChipTone> = {
  REQUESTED: 'neutral', APPROVED: 'info', DISPATCHED: 'warning', IN_TRANSIT: 'warning', RECEIVED: 'success', CANCELLED: 'danger',
};
const STATUS_ACTION_LABEL: Partial<Record<StockTransferStatus, string>> = {
  REQUESTED: 'Approve', APPROVED: 'Dispatch', DISPATCHED: 'Mark In Transit', IN_TRANSIT: 'Receive at Destination',
};

export default function InventoryTransferPage() {
  const { locations } = useHRMSStore();
  const { items, transfers, requestTransfer, advanceTransfer } = useInventoryStore();
  const outlets = outletService.listOutlets(locations);

  const [showNew, setShowNew] = useState(false);
  const [source, setSource] = useState(outlets[0]?.id ?? '');
  const [destination, setDestination] = useState(outlets[1]?.id ?? '');
  const [lines, setLines] = useState<{ itemId: string; qty: number }[]>([{ itemId: items[0]?.id ?? '', qty: 10 }]);

  const outletName = (id: string) => outlets.find((o) => o.id === id)?.name ?? id;
  const itemName = (id: string) => items.find((i) => i.id === id)?.name ?? id;

  const submitTransfer = () => {
    if (!source || !destination || source === destination || lines.length === 0) return;
    requestTransfer(source, destination, lines.filter((l) => l.itemId && l.qty > 0), 'Outlet Manager (Indiranagar)');
    setShowNew(false);
    setLines([{ itemId: items[0]?.id ?? '', qty: 10 }]);
  };

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader
          title="Inter-Outlet Stock Transfer"
          subtitle="Request → Approve → Dispatch → In Transit → Receive. Dispatch deducts from the source outlet's ledger; Receive adds to the destination's."
          actions={
            <button onClick={() => setShowNew(true)} className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[13px] rounded-[8px] flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Transfer Request
            </button>
          }
        />

        <div className="space-y-3">
          {transfers.length === 0 && <div className="text-[13px] text-[#66706B] bg-white border border-[#E5E2DB] rounded-[10px] p-6 text-center">No transfers yet. Create one to see the approval pipeline in action.</div>}
          {transfers.map((t) => (
            <div key={t.id} className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="text-[13px] font-semibold text-[#202522] flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#0F5B55]" /> {t.transferNumber}
                  </div>
                  <div className="text-[13px] text-[#202522] flex items-center gap-2 mt-1">
                    {outletName(t.sourceOutletId)} <ArrowRight className="w-3.5 h-3.5 text-[#66706B]" /> {outletName(t.destinationOutletId)}
                  </div>
                  <div className="text-[12px] text-[#66706B] mt-1">
                    {t.items.map((l) => `${itemName(l.itemId)} ${l.qty}`).join(', ')}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusChip label={t.status} tone={STATUS_TONE[t.status]} />
                  {STATUS_ACTION_LABEL[t.status] && (
                    <button
                      onClick={() => advanceTransfer(t.id, 'Outlet Manager')}
                      className="px-3.5 py-1.5 bg-[#0F5B55] hover:bg-[#08463F] text-white text-[12px] font-semibold rounded-lg"
                    >
                      {STATUS_ACTION_LABEL[t.status]}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={showNew} onClose={() => setShowNew(false)} title="New Stock Transfer Request" maxWidthClass="max-w-xl"
        footer={<>
          <button onClick={() => setShowNew(false)} className="px-4 py-2 text-[13px] font-semibold text-[#66706B]">Cancel</button>
          <button onClick={submitTransfer} className="px-4 py-2 bg-[#0F5B55] text-white text-[13px] font-semibold rounded-[8px]">Submit Request</button>
        </>}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Source Outlet</label>
              <select value={source} onChange={(e) => setSource(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]">
                {outlets.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Destination Outlet</label>
              <select value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]">
                {outlets.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-semibold text-[#66706B] block">Items</label>
            {lines.map((line, i) => (
              <div key={i} className="flex items-center gap-2">
                <select value={line.itemId} onChange={(e) => setLines(lines.map((l, li) => li === i ? { ...l, itemId: e.target.value } : l))} className="flex-1 border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]">
                  {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                </select>
                <input type="number" value={line.qty} onChange={(e) => setLines(lines.map((l, li) => li === i ? { ...l, qty: Number(e.target.value) } : l))} className="w-24 border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
                <button onClick={() => setLines(lines.filter((_, li) => li !== i))} className="p-2 text-[#C94B45] hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            <button onClick={() => setLines([...lines, { itemId: items[0]?.id ?? '', qty: 5 }])} className="text-[12px] text-[#0F5B55] font-semibold">+ Add another item</button>
          </div>
        </div>
      </Modal>
    </ShellLayout>
  );
}
