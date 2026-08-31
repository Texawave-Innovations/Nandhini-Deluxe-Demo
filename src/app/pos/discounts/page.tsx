'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import StatusChip from '@/components/ui/StatusChip';
import Modal from '@/components/ui/Modal';
import { Plus, ShieldCheck } from 'lucide-react';
import { usePOSStore } from '@/store/pos-store';
import { Discount } from '@/types/pos';

export default function DiscountsPage() {
  const { discounts, addDiscount, updateDiscount } = usePOSStore();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED', value: 10, maxAmount: '', approvalRequired: false });

  const columns: DataTableColumn<Discount>[] = [
    { key: 'name', header: 'Discount', render: (d) => <span className="font-medium text-[#202522]">{d.name}</span> },
    { key: 'value', header: 'Value', render: (d) => d.type === 'PERCENTAGE' ? `${d.value}%` : `₹${d.value}` },
    { key: 'max', header: 'Max Amount', render: (d) => d.maxAmount ? `₹${d.maxAmount}` : '—' },
    { key: 'outlets', header: 'Applicable Outlets', render: (d) => d.applicableOutletIds === 'ALL' ? 'All Outlets' : `${d.applicableOutletIds.length} outlet(s)` },
    { key: 'validity', header: 'Validity', render: (d) => `${d.validFrom} → ${d.validTo}` },
    { key: 'approval', header: 'Approval', render: (d) => d.approvalRequired ? <StatusChip label="Manager Approval Required" tone="warning" /> : <StatusChip label="Auto-Apply" tone="success" /> },
    { key: 'status', header: 'Status', render: (d) => (
      <button onClick={() => updateDiscount(d.id, { status: d.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}>
        <StatusChip label={d.status} tone={d.status === 'ACTIVE' ? 'success' : 'neutral'} />
      </button>
    ) },
  ];

  const handleAdd = () => {
    if (!form.name) return;
    addDiscount({
      name: form.name, type: form.type, value: form.value, maxAmount: form.maxAmount ? Number(form.maxAmount) : undefined,
      applicableOutletIds: 'ALL', validFrom: '2026-01-01', validTo: '2026-12-31', approvalRequired: form.approvalRequired, status: 'ACTIVE',
    });
    setShowAdd(false);
    setForm({ name: '', type: 'PERCENTAGE', value: 10, maxAmount: '', approvalRequired: false });
  };

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader
          title="Discount Master"
          subtitle="Configurable discounts applied at bill generation — percentage or fixed, with optional caps and manager approval."
          actions={<button onClick={() => setShowAdd(true)} className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[13px] rounded-[8px] flex items-center gap-2"><Plus className="w-4 h-4" /> Add Discount</button>}
        />
        <DataTable columns={columns} rows={discounts} keyField={(d) => d.id} />
      </div>

      <Modal
        open={showAdd} onClose={() => setShowAdd(false)} title="Add Discount"
        footer={<>
          <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-[13px] font-semibold text-[#66706B]">Cancel</button>
          <button onClick={handleAdd} className="px-4 py-2 bg-[#0F5B55] text-white text-[13px] font-semibold rounded-[8px]">Create Discount</button>
        </>}
      >
        <div className="space-y-3">
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Discount Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Staff Meal Discount" className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]">
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Value</label>
              <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
            </div>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Maximum Amount (optional)</label>
            <input type="number" value={form.maxAmount} onChange={(e) => setForm({ ...form, maxAmount: e.target.value })} placeholder="No cap" className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
          </div>
          <label className="flex items-center gap-2 text-[13px] text-[#202522]">
            <input type="checkbox" checked={form.approvalRequired} onChange={(e) => setForm({ ...form, approvalRequired: e.target.checked })} />
            <ShieldCheck className="w-3.5 h-3.5 text-[#C68A28]" /> Requires Manager Approval
          </label>
        </div>
      </Modal>
    </ShellLayout>
  );
}
