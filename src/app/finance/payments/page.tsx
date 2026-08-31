'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { Plus } from 'lucide-react';
import { useFinanceStore } from '@/store/finance-store';
import { useVendorStore } from '@/store/vendor-store';
import { vendorService } from '@/services/vendorService';
import { VendorPayment, VendorPaymentMode } from '@/types/finance';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const MODES: VendorPaymentMode[] = ['NEFT', 'RTGS', 'UPI', 'CHEQUE', 'CASH'];

export default function VendorPaymentsPage() {
  const { vendorPayments, vendorBills, recordVendorPayment } = useFinanceStore();
  const { vendors } = useVendorStore();

  const vendorName = (id: string) => vendors.find((v) => v.id === id)?.name ?? id;
  const ranked = vendorService.rankVendorsByOutstanding(vendors, vendorBills).filter((v) => v.outstanding > 0);

  const [showNew, setShowNew] = useState(false);
  const [vendorId, setVendorId] = useState(ranked[0]?.id ?? '');
  const [amount, setAmount] = useState(ranked[0]?.outstanding ?? 0);
  const [mode, setMode] = useState<VendorPaymentMode>('NEFT');
  const [referenceNo, setReferenceNo] = useState('');

  const openNew = () => {
    setVendorId(ranked[0]?.id ?? '');
    setAmount(ranked[0]?.outstanding ?? 0);
    setMode('NEFT');
    setReferenceNo('');
    setShowNew(true);
  };

  const submitPayment = () => {
    if (!vendorId || amount <= 0) return;
    recordVendorPayment({ vendorId, amount, mode, referenceNo: referenceNo || undefined, paidBy: 'Finance Executive' });
    setShowNew(false);
  };

  const columns: DataTableColumn<VendorPayment>[] = [
    { key: 'pay', header: 'Payment Number', render: (p) => p.paymentNumber },
    { key: 'vendor', header: 'Vendor', render: (p) => vendorName(p.vendorId) },
    { key: 'mode', header: 'Mode', render: (p) => p.mode },
    { key: 'ref', header: 'Reference', render: (p) => p.referenceNo ?? '—' },
    { key: 'bills', header: 'Bills Allocated', render: (p) => p.allocations.length },
    { key: 'amount', header: 'Amount', render: (p) => inr(p.amount) },
    { key: 'date', header: 'Paid At', render: (p) => p.paidAt.substring(0, 10) },
  ];

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader
          title="Vendor Payments"
          subtitle="A payment is allocated FIFO by due date across the vendor's outstanding bills unless specific bills are chosen."
          actions={<button onClick={openNew} disabled={ranked.length === 0} className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] disabled:opacity-40 text-white font-semibold text-[13px] rounded-[8px] flex items-center gap-2"><Plus className="w-4 h-4" /> Record Payment</button>}
        />
        <DataTable columns={columns} rows={[...vendorPayments].sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())} keyField={(p) => p.id} />
      </div>

      <Modal
        open={showNew} onClose={() => setShowNew(false)} title="Record Vendor Payment" maxWidthClass="max-w-lg"
        footer={<>
          <button onClick={() => setShowNew(false)} className="px-4 py-2 text-[13px] font-semibold text-[#66706B]">Cancel</button>
          <button onClick={submitPayment} className="px-4 py-2 bg-[#0F5B55] text-white text-[13px] font-semibold rounded-[8px]">Record Payment</button>
        </>}
      >
        <div className="space-y-3">
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Vendor</label>
            <select value={vendorId} onChange={(e) => { setVendorId(e.target.value); setAmount(ranked.find((v) => v.id === e.target.value)?.outstanding ?? 0); }} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]">
              {ranked.map((v) => <option key={v.id} value={v.id}>{v.name} — Outstanding {inr(v.outstanding)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Amount</label>
              <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Mode</label>
              <select value={mode} onChange={(e) => setMode(e.target.value as VendorPaymentMode)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]">
                {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Bank Reference / UTR</label>
            <input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" placeholder="e.g. NEFT-482910" />
          </div>
        </div>
      </Modal>
    </ShellLayout>
  );
}
