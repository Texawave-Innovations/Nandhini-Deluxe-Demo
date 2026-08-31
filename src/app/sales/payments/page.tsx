'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { Plus } from 'lucide-react';
import { useSalesStore } from '@/store/sales-store';
import { salesService } from '@/services/salesService';
import { CustomerPayment, CustomerPaymentMode } from '@/types/sales';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const MODES: CustomerPaymentMode[] = ['NEFT', 'RTGS', 'UPI', 'CHEQUE', 'CASH'];

export default function CustomerPaymentsPage() {
  const { customerPayments, customers, invoices, recordCustomerPayment } = useSalesStore();

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? id;
  const ranked = salesService.rankCustomersByOutstanding(customers, invoices).filter((c) => c.outstanding > 0);

  const [showNew, setShowNew] = useState(false);
  const [customerId, setCustomerId] = useState(ranked[0]?.id ?? '');
  const [amount, setAmount] = useState(ranked[0]?.outstanding ?? 0);
  const [mode, setMode] = useState<CustomerPaymentMode>('NEFT');
  const [referenceNo, setReferenceNo] = useState('');

  const openNew = () => {
    setCustomerId(ranked[0]?.id ?? '');
    setAmount(ranked[0]?.outstanding ?? 0);
    setMode('NEFT');
    setReferenceNo('');
    setShowNew(true);
  };

  const submitPayment = () => {
    if (!customerId || amount <= 0) return;
    recordCustomerPayment({ customerId, amount, mode, referenceNo: referenceNo || undefined, receivedBy: 'Sales Executive' });
    setShowNew(false);
  };

  const columns: DataTableColumn<CustomerPayment>[] = [
    { key: 'pay', header: 'Payment Number', render: (p) => p.paymentNumber },
    { key: 'customer', header: 'Customer', render: (p) => customerName(p.customerId) },
    { key: 'mode', header: 'Mode', render: (p) => p.mode },
    { key: 'ref', header: 'Reference', render: (p) => p.referenceNo ?? '—' },
    { key: 'invoices', header: 'Invoices Allocated', render: (p) => p.allocations.length },
    { key: 'amount', header: 'Amount', render: (p) => inr(p.amount) },
    { key: 'date', header: 'Received At', render: (p) => p.receivedAt.substring(0, 10) },
  ];

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader
          title="Customer Payments"
          subtitle="A receipt is allocated FIFO by due date across the customer's outstanding invoices unless specific invoices are chosen."
          actions={<button onClick={openNew} disabled={ranked.length === 0} className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] disabled:opacity-40 text-white font-semibold text-[13px] rounded-[8px] flex items-center gap-2"><Plus className="w-4 h-4" /> Record Payment</button>}
        />
        <DataTable columns={columns} rows={[...customerPayments].sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())} keyField={(p) => p.id} />
      </div>

      <Modal
        open={showNew} onClose={() => setShowNew(false)} title="Record Customer Payment" maxWidthClass="max-w-lg"
        footer={<>
          <button onClick={() => setShowNew(false)} className="px-4 py-2 text-[13px] font-semibold text-[#66706B]">Cancel</button>
          <button onClick={submitPayment} className="px-4 py-2 bg-[#0F5B55] text-white text-[13px] font-semibold rounded-[8px]">Record Payment</button>
        </>}
      >
        <div className="space-y-3">
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Customer</label>
            <select value={customerId} onChange={(e) => { setCustomerId(e.target.value); setAmount(ranked.find((c) => c.id === e.target.value)?.outstanding ?? 0); }} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]">
              {ranked.map((c) => <option key={c.id} value={c.id}>{c.name} — Outstanding {inr(c.outstanding)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Amount</label>
              <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Mode</label>
              <select value={mode} onChange={(e) => setMode(e.target.value as CustomerPaymentMode)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]">
                {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Bank Reference / UTR</label>
            <input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" placeholder="e.g. NEFT-712450" />
          </div>
        </div>
      </Modal>
    </ShellLayout>
  );
}
