'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import KpiCard from '@/components/ui/KpiCard';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import StatusChip from '@/components/ui/StatusChip';
import Modal from '@/components/ui/Modal';
import { Plus, Building2, Wallet, AlertTriangle, Users } from 'lucide-react';
import { useSalesStore } from '@/store/sales-store';
import { salesService } from '@/services/salesService';
import { Customer, CustomerType } from '@/types/sales';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const TYPES: CustomerType[] = ['CORPORATE', 'INSTITUTIONAL'];

export default function CustomersPage() {
  const router = useRouter();
  const { customers, invoices, addCustomer } = useSalesStore();

  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'CORPORATE' as CustomerType, contactPerson: '', phone: '', billingAddress: '', creditLimit: 200000, paymentTermsDays: 30 });

  const ranked = salesService.rankCustomersByOutstanding(customers, invoices);
  const totalOutstanding = ranked.reduce((s, c) => s + c.outstanding, 0);
  const customersWithDues = ranked.filter((c) => c.outstanding > 0).length;

  const columns: DataTableColumn<Customer & { outstanding: number }>[] = [
    { key: 'name', header: 'Customer', render: (c) => (<div><div className="font-medium text-[#202522]">{c.name}</div><div className="text-[11px] text-[#66706B]">{c.code}</div></div>) },
    { key: 'type', header: 'Type', render: (c) => c.type },
    { key: 'terms', header: 'Payment Terms', render: (c) => `Net ${c.paymentTermsDays}` },
    { key: 'limit', header: 'Credit Limit', render: (c) => inr(c.creditLimit) },
    { key: 'outstanding', header: 'Outstanding', render: (c) => <span className={c.outstanding > 0 ? 'font-semibold text-[#C94B45]' : ''}>{inr(c.outstanding)}</span> },
    { key: 'status', header: 'Status', render: (c) => <StatusChip label={c.status} tone={c.status === 'ACTIVE' ? 'success' : 'neutral'} /> },
  ];

  const submitCustomer = () => {
    if (!form.name || !form.contactPerson || !form.phone) return;
    addCustomer({ ...form });
    setShowNew(false);
    setForm({ name: '', type: 'CORPORATE', contactPerson: '', phone: '', billingAddress: '', creditLimit: 200000, paymentTermsDays: 30 });
  };

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader
          title="Customers"
          subtitle="Corporate & institutional catering accounts feeding Sales Orders, Invoices and Customer Payments."
          actions={<button onClick={() => setShowNew(true)} className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[13px] rounded-[8px] flex items-center gap-2"><Plus className="w-4 h-4" /> Add Customer</button>}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Total Customers" value={customers.length} icon={Users} />
          <KpiCard label="Active Customers" value={customers.filter((c) => c.status === 'ACTIVE').length} icon={Building2} />
          <KpiCard label="Total Outstanding" value={inr(totalOutstanding)} icon={Wallet} valueColorClass="text-[#C94B45]" />
          <KpiCard label="Customers With Dues" value={customersWithDues} icon={AlertTriangle} valueColorClass="text-[#C68A28]" />
        </div>

        <DataTable columns={columns} rows={ranked} keyField={(c) => c.id} onRowClick={(c) => router.push(`/sales/customers/${c.id}`)} />
      </div>

      <Modal
        open={showNew} onClose={() => setShowNew(false)} title="Add Customer" maxWidthClass="max-w-lg"
        footer={<>
          <button onClick={() => setShowNew(false)} className="px-4 py-2 text-[13px] font-semibold text-[#66706B]">Cancel</button>
          <button onClick={submitCustomer} className="px-4 py-2 bg-[#0F5B55] text-white text-[13px] font-semibold rounded-[8px]">Save Customer</button>
        </>}
      >
        <div className="space-y-3">
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Customer Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as CustomerType })} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]">
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
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
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Credit Limit</label>
            <input type="number" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: Number(e.target.value) })} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Billing Address</label>
            <input value={form.billingAddress} onChange={(e) => setForm({ ...form, billingAddress: e.target.value })} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
          </div>
        </div>
      </Modal>
    </ShellLayout>
  );
}
