'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import StatusChip from '@/components/ui/StatusChip';
import Modal from '@/components/ui/Modal';
import { Plus, MapPin } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';
import { Location, OutletType } from '@/types/erp-core';

const TYPE_TONE: Record<OutletType, 'brand' | 'info' | 'warning' | 'success' | 'neutral'> = {
  RESTAURANT: 'brand', HOTEL: 'info', BANQUET: 'warning', HYBRID: 'success', CENTRAL_KITCHEN: 'neutral', CORPORATE: 'neutral',
};

export default function OutletMasterPage() {
  const { locations, regions, businessUnits, addLocation } = useHRMSStore();
  const outlets = locations.filter((l) => l.isOutlet);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', city: 'Bengaluru', address: '', outletType: 'RESTAURANT' as OutletType, businessUnitId: businessUnits[0]?.id ?? 'bu-1' });

  const columns: DataTableColumn<Location>[] = [
    { key: 'name', header: 'Outlet', render: (o) => (
      <div>
        <div className="font-semibold text-[#202522]">{o.name}</div>
        <div className="text-[11px] text-[#66706B]">{o.code}</div>
      </div>
    ) },
    { key: 'region', header: 'Region', render: (o) => regions.find((r) => r.id === o.regionId)?.name ?? '—' },
    { key: 'type', header: 'Type', render: (o) => <StatusChip label={o.outletType} tone={TYPE_TONE[o.outletType]} /> },
    { key: 'features', header: 'Features', render: (o) => (
      <div className="flex flex-wrap gap-1">
        {o.features.hasRestaurant && <StatusChip label="Restaurant" tone="neutral" />}
        {o.features.hasHotel && <StatusChip label="Hotel" tone="neutral" />}
        {o.features.hasBanquet && <StatusChip label="Banquet" tone="neutral" />}
        {o.features.hasLiquorSection && <StatusChip label="Liquor" tone="neutral" />}
      </div>
    ) },
    { key: 'address', header: 'Address', render: (o) => <span className="text-[#66706B]">{o.address}</span> },
    { key: 'status', header: 'Status', render: (o) => <StatusChip label={o.status} tone={o.status === 'ACTIVE' ? 'success' : 'neutral'} /> },
  ];

  const handleAdd = () => {
    if (!form.name || !form.code) return;
    addLocation({
      businessUnitId: form.businessUnitId, regionId: 'reg-1', code: form.code, name: form.name, city: form.city, address: form.address,
      outletType: form.outletType, isOutlet: true, status: 'ACTIVE', openedDate: new Date().toISOString().substring(0, 10),
      features: {
        hasRestaurant: form.outletType === 'RESTAURANT' || form.outletType === 'HYBRID' || form.outletType === 'HOTEL',
        hasHotel: form.outletType === 'HOTEL' || form.outletType === 'HYBRID',
        hasBanquet: form.outletType === 'BANQUET' || form.outletType === 'HYBRID',
        hasLiquorSection: true, hasKitchen: true, hasInventoryStore: true,
      },
    });
    setShowAdd(false);
    setForm({ name: '', code: '', city: 'Bengaluru', address: '', outletType: 'RESTAURANT', businessUnitId: businessUnits[0]?.id ?? 'bu-1' });
  };

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader
          title="Outlet Master"
          subtitle={`${outlets.length} active outlets across ${regions.length} region(s) — Restaurant, Hotel, Banquet and Hybrid formats.`}
          actions={
            <button onClick={() => setShowAdd(true)} className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[13px] rounded-[8px] flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Outlet
            </button>
          }
        />
        <DataTable columns={columns} rows={outlets} keyField={(o) => o.id} />
      </div>

      <Modal
        open={showAdd} onClose={() => setShowAdd(false)} title="Add Outlet" subtitle="Creates a new Outlet Master record"
        footer={<>
          <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-[13px] font-semibold text-[#66706B]">Cancel</button>
          <button onClick={handleAdd} className="px-4 py-2 bg-[#0F5B55] text-white text-[13px] font-semibold rounded-[8px]">Create Outlet</button>
        </>}
      >
        <div className="space-y-3">
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Outlet Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Basavanagudi" className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Outlet Code</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="BSV-REST" className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Outlet Type</label>
              <select value={form.outletType} onChange={(e) => setForm({ ...form, outletType: e.target.value as OutletType })} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]">
                <option value="RESTAURANT">Restaurant</option>
                <option value="HOTEL">Hotel</option>
                <option value="BANQUET">Banquet</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Address</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, area" className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
          </div>
          <div className="flex items-center gap-2 text-[12px] text-[#66706B] bg-[#F3F0E9] rounded-lg p-2.5">
            <MapPin className="w-3.5 h-3.5" /> All outlets are created under Bangalore region and go live immediately in the Outlet Switcher.
          </div>
        </div>
      </Modal>
    </ShellLayout>
  );
}
