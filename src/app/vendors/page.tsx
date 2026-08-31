'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import KpiCard from '@/components/ui/KpiCard';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import StatusChip from '@/components/ui/StatusChip';
import Modal from '@/components/ui/Modal';
import { Plus, Truck, Wallet, AlertTriangle, Building2 } from 'lucide-react';
import { useVendorStore } from '@/store/vendor-store';
import { useFinanceStore } from '@/store/finance-store';
import { vendorService } from '@/services/vendorService';
import { Vendor, VendorCategory } from '@/types/vendor';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const CATEGORIES: VendorCategory[] = ['GROCERY', 'MEAT_POULTRY', 'SEAFOOD', 'VEGETABLES', 'DAIRY', 'SPICES', 'OILS_FATS', 'BEVERAGES', 'BAKERY', 'LIQUOR', 'PACKAGING', 'CLEANING'];

export default function VendorsPage() {
  const router = useRouter();
  const { vendors, addVendor } = useVendorStore();
  const { vendorBills } = useFinanceStore();

  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'GROCERY' as VendorCategory, contactPerson: '', phone: '', address: '', paymentTermsDays: 15 });

  const ranked = vendorService.rankVendorsByOutstanding(vendors, vendorBills);
  const totalOutstanding = ranked.reduce((s, v) => s + v.outstanding, 0);
  const overdueVendorCount = ranked.filter((v) => v.outstanding > 0).length;

  const columns: DataTableColumn<Vendor & { outstanding: number }>[] = [
    { key: 'name', header: 'Vendor', render: (v) => (<div><div className="font-medium text-[#202522]">{v.name}</div><div className="text-[11px] text-[#66706B]">{v.code}</div></div>) },
    { key: 'category', header: 'Category', render: (v) => v.category.replace('_', ' ') },
    { key: 'terms', header: 'Payment Terms', render: (v) => `Net ${v.paymentTermsDays}` },
    { key: 'outstanding', header: 'Outstanding', render: (v) => <span className={v.outstanding > 0 ? 'font-semibold text-[#C94B45]' : ''}>{inr(v.outstanding)}</span> },
    { key: 'status', header: 'Status', render: (v) => <StatusChip label={v.status} tone={v.status === 'ACTIVE' ? 'success' : 'neutral'} /> },
  ];

  const submitVendor = () => {
    if (!form.name || !form.contactPerson || !form.phone) return;
    addVendor({ ...form });
    setShowNew(false);
    setForm({ name: '', category: 'GROCERY', contactPerson: '', phone: '', address: '', paymentTermsDays: 15 });
  };

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader
          title="Vendor Master"
          subtitle="Suppliers feeding the procure-to-pay chain — Purchase, Goods Receipt, Vendor Bills and Payments all reference this master."
          actions={<button onClick={() => setShowNew(true)} className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[13px] rounded-[8px] flex items-center gap-2"><Plus className="w-4 h-4" /> Add Vendor</button>}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Total Vendors" value={vendors.length} icon={Truck} />
          <KpiCard label="Active Vendors" value={vendors.filter((v) => v.status === 'ACTIVE').length} icon={Building2} />
          <KpiCard label="Total Outstanding" value={inr(totalOutstanding)} icon={Wallet} valueColorClass="text-[#C94B45]" />
          <KpiCard label="Vendors With Dues" value={overdueVendorCount} icon={AlertTriangle} valueColorClass="text-[#C68A28]" />
        </div>

        <DataTable columns={columns} rows={ranked} keyField={(v) => v.id} onRowClick={(v) => router.push(`/vendors/${v.id}`)} />
      </div>

      <Modal
        open={showNew} onClose={() => setShowNew(false)} title="Add Vendor" maxWidthClass="max-w-lg"
        footer={<>
          <button onClick={() => setShowNew(false)} className="px-4 py-2 text-[13px] font-semibold text-[#66706B]">Cancel</button>
          <button onClick={submitVendor} className="px-4 py-2 bg-[#0F5B55] text-white text-[13px] font-semibold rounded-[8px]">Save Vendor</button>
        </>}
      >
        <div className="space-y-3">
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Vendor Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as VendorCategory })} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Payment Terms (days)</label>
              <input type="number" value={form.paymentTermsDays} onChange={(e) => setForm({ ...form, paymentTermsDays: Number(e.target.value) })} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Contact Person</label>
              <input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
            </div>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Address</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
          </div>
        </div>
      </Modal>
    </ShellLayout>
  );
}
