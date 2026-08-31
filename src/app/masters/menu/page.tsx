'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import StatusChip from '@/components/ui/StatusChip';
import Modal from '@/components/ui/Modal';
import { Pencil, Leaf, Beef } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';
import { usePOSStore } from '@/store/pos-store';
import { outletService } from '@/services/outletService';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function MenuMasterPage() {
  const { locations } = useHRMSStore();
  const { menuCategories, menuItems, menuOverrides, upsertMenuOverride } = usePOSStore();
  const outlets = outletService.listOutlets(locations);

  const [outletId, setOutletId] = useState(outlets[0]?.id ?? 'loc-1');
  const [activeCat, setActiveCat] = useState<string>('ALL');
  const [editing, setEditing] = useState<{ id: string; name: string; basePrice: number } | null>(null);
  const [overridePrice, setOverridePrice] = useState('');
  const [overrideEnabled, setOverrideEnabled] = useState(true);

  const filteredItems = menuItems.filter((m) => activeCat === 'ALL' || m.categoryId === activeCat);
  const overrideFor = (itemId: string) => menuOverrides.find((o) => o.outletId === outletId && o.menuItemId === itemId);

  const openEdit = (item: { id: string; name: string; basePrice: number }) => {
    const ovr = overrideFor(item.id);
    setOverridePrice(String(ovr?.priceOverride ?? item.basePrice));
    setOverrideEnabled(ovr?.isEnabled ?? true);
    setEditing(item);
  };

  const saveOverride = () => {
    if (!editing) return;
    const price = Number(overridePrice);
    upsertMenuOverride(outletId, editing.id, {
      isEnabled: overrideEnabled,
      priceOverride: price !== editing.basePrice ? price : undefined,
    });
    setEditing(null);
  };

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader
          title="Menu Master"
          subtitle={`${menuItems.length} organization-level items across ${menuCategories.length} categories. Configure per-outlet price, tax and availability overrides below.`}
          actions={
            <select value={outletId} onChange={(e) => setOutletId(e.target.value)} className="border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px] bg-white">
              {outlets.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          }
        />

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          <button onClick={() => setActiveCat('ALL')} className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap ${activeCat === 'ALL' ? 'bg-[#0F5B55] text-white' : 'bg-white border border-[#E5E2DB] text-[#202522]'}`}>All</button>
          {menuCategories.map((c) => (
            <button key={c.id} onClick={() => setActiveCat(c.id)} className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap ${activeCat === c.id ? 'bg-[#0F5B55] text-white' : 'bg-white border border-[#E5E2DB] text-[#202522]'}`}>{c.name}</button>
          ))}
        </div>

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs overflow-hidden">
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-[#F3F0E9] z-10">
                <tr className="border-b border-[#E5E2DB]">
                  <th className="text-left px-4 py-2.5 font-semibold text-[#66706B] uppercase text-[11px]">Item</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-[#66706B] uppercase text-[11px]">Base Price</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-[#66706B] uppercase text-[11px]">Outlet Price</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-[#66706B] uppercase text-[11px]">Tax %</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-[#66706B] uppercase text-[11px]">Status</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-[#66706B] uppercase text-[11px]"></th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const ovr = overrideFor(item.id);
                  const effectivePrice = ovr?.priceOverride ?? item.basePrice;
                  const isEnabled = ovr ? ovr.isEnabled : true;
                  return (
                    <tr key={item.id} className="border-b border-[#E5E2DB] last:border-0 hover:bg-[#F8F5EE]">
                      <td className="px-4 py-2 flex items-center gap-2">
                        <span>{item.imageEmoji}</span>
                        <span className="text-[#202522] font-medium">{item.name}</span>
                        {item.isVeg ? <Leaf className="w-3 h-3 text-[#23865B]" /> : !item.isLiquor && <Beef className="w-3 h-3 text-[#C94B45]" />}
                      </td>
                      <td className="px-4 py-2 text-[#66706B]">{inr(item.basePrice)}</td>
                      <td className="px-4 py-2 font-semibold text-[#202522]">{inr(effectivePrice)} {ovr?.priceOverride && <span className="text-[10px] text-[#C68A28] font-normal">(override)</span>}</td>
                      <td className="px-4 py-2 text-[#66706B]">{ovr?.taxPercentOverride ?? item.taxPercent}%</td>
                      <td className="px-4 py-2"><StatusChip label={isEnabled ? 'Enabled' : 'Disabled'} tone={isEnabled ? 'success' : 'neutral'} /></td>
                      <td className="px-4 py-2">
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-[#F3F0E9] text-[#66706B]"><Pencil className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        open={!!editing} onClose={() => setEditing(null)} title={`Outlet Override — ${editing?.name ?? ''}`}
        subtitle={outlets.find((o) => o.id === outletId)?.name}
        footer={<>
          <button onClick={() => setEditing(null)} className="px-4 py-2 text-[13px] font-semibold text-[#66706B]">Cancel</button>
          <button onClick={saveOverride} className="px-4 py-2 bg-[#0F5B55] text-white text-[13px] font-semibold rounded-[8px]">Save Override</button>
        </>}
      >
        <div className="space-y-3">
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Outlet Price (₹)</label>
            <input type="number" value={overridePrice} onChange={(e) => setOverridePrice(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
          </div>
          <label className="flex items-center gap-2 text-[13px] text-[#202522]">
            <input type="checkbox" checked={overrideEnabled} onChange={(e) => setOverrideEnabled(e.target.checked)} />
            Enabled at this outlet
          </label>
        </div>
      </Modal>
    </ShellLayout>
  );
}
