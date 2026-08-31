'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import StatusChip, { ChipTone } from '@/components/ui/StatusChip';
import Modal from '@/components/ui/Modal';
import Drawer from '@/components/ui/Drawer';
import ThreeWayMatchPanel from '@/components/finance/ThreeWayMatchPanel';
import { Plus } from 'lucide-react';
import { useFinanceStore } from '@/store/finance-store';
import { usePurchaseStore } from '@/store/purchase-store';
import { useVendorStore } from '@/store/vendor-store';
import { useInventoryStore } from '@/store/inventory-store';
import { BillStatus, VendorBill } from '@/types/finance';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const BILL_TONE: Record<BillStatus, ChipTone> = {
  MATCHED: 'success', MISMATCH: 'danger', APPROVED: 'info', PARTIALLY_PAID: 'warning', PAID: 'success', CANCELLED: 'neutral',
};

export default function VendorBillsPage() {
  const { vendorBills, createBillFromGRN, approveBill } = useFinanceStore();
  const { grns } = usePurchaseStore();
  const { vendors } = useVendorStore();
  const { items } = useInventoryStore();

  const vendorName = (id: string) => vendors.find((v) => v.id === id)?.name ?? id;
  const itemName = (id: string) => items.find((i) => i.id === id)?.name ?? id;
  const unbilledGRNs = grns.filter((g) => g.status === 'POSTED' && !vendorBills.some((b) => b.grnId === g.id));

  const [showNew, setShowNew] = useState(false);
  const [grnId, setGrnId] = useState(unbilledGRNs[0]?.id ?? '');
  const [vendorInvoiceNumber, setVendorInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('2026-08-30');
  const [taxPercent, setTaxPercent] = useState(5);
  const [selectedBill, setSelectedBill] = useState<VendorBill | undefined>(undefined);
  const [overrideRemarks, setOverrideRemarks] = useState('');

  const openNew = () => {
    setGrnId(unbilledGRNs[0]?.id ?? '');
    setVendorInvoiceNumber('');
    setInvoiceDate('2026-08-30');
    setTaxPercent(5);
    setShowNew(true);
  };

  const submitBill = () => {
    if (!grnId || !vendorInvoiceNumber) return;
    createBillFromGRN({ grnId, vendorInvoiceNumber, invoiceDate, taxPercent, createdBy: 'Finance Executive' });
    setShowNew(false);
  };

  const columns: DataTableColumn<VendorBill>[] = [
    { key: 'bill', header: 'Bill', render: (b) => (<div><div className="font-medium">{b.billNumber}</div><div className="text-[11px] text-[#66706B]">{b.vendorInvoiceNumber}</div></div>) },
    { key: 'vendor', header: 'Vendor', render: (b) => vendorName(b.vendorId) },
    { key: 'due', header: 'Due Date', render: (b) => b.dueDate },
    { key: 'amount', header: 'Amount', render: (b) => inr(b.totalAmount) },
    { key: 'paid', header: 'Paid', render: (b) => inr(b.amountPaid) },
    { key: 'status', header: 'Status', render: (b) => <StatusChip label={b.status} tone={BILL_TONE[b.status]} /> },
  ];

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader
          title="Vendor Bills"
          subtitle="Every bill runs the 3-way match (PO vs GRN vs Bill) the moment it's created from a GRN."
          actions={<button onClick={openNew} disabled={unbilledGRNs.length === 0} className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] disabled:opacity-40 text-white font-semibold text-[13px] rounded-[8px] flex items-center gap-2"><Plus className="w-4 h-4" /> New Bill from GRN</button>}
        />
        <DataTable
          columns={columns} rows={[...vendorBills].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
          keyField={(b) => b.id} onRowClick={(b) => { setSelectedBill(b); setOverrideRemarks(''); }}
        />
      </div>

      <Modal
        open={showNew} onClose={() => setShowNew(false)} title="New Vendor Bill from GRN" maxWidthClass="max-w-lg"
        footer={<>
          <button onClick={() => setShowNew(false)} className="px-4 py-2 text-[13px] font-semibold text-[#66706B]">Cancel</button>
          <button onClick={submitBill} className="px-4 py-2 bg-[#0F5B55] text-white text-[13px] font-semibold rounded-[8px]">Create Bill</button>
        </>}
      >
        <div className="space-y-3">
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Goods Receipt Note</label>
            <select value={grnId} onChange={(e) => setGrnId(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]">
              {unbilledGRNs.map((g) => <option key={g.id} value={g.id}>{g.grnNumber} — {vendorName(g.vendorId)} ({inr(g.totalAmount)})</option>)}
            </select>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Vendor Invoice Number</label>
            <input value={vendorInvoiceNumber} onChange={(e) => setVendorInvoiceNumber(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" placeholder="As printed on the vendor's invoice" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Invoice Date</label>
              <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Tax %</label>
              <input type="number" value={taxPercent} onChange={(e) => setTaxPercent(Number(e.target.value))} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
            </div>
          </div>
        </div>
      </Modal>

      <Drawer
        open={!!selectedBill} onClose={() => setSelectedBill(undefined)} title={selectedBill?.billNumber ?? ''} subtitle={selectedBill ? vendorName(selectedBill.vendorId) : ''}
        widthClass="max-w-2xl"
        footer={selectedBill && selectedBill.status !== 'APPROVED' && selectedBill.status !== 'PAID' && selectedBill.status !== 'PARTIALLY_PAID' ? (
          <div className="space-y-2">
            {selectedBill.status === 'MISMATCH' && (
              <input value={overrideRemarks} onChange={(e) => setOverrideRemarks(e.target.value)} placeholder="Override remarks (required to approve a mismatched bill)" className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
            )}
            <div className="flex justify-end">
              <button
                onClick={() => { approveBill(selectedBill.id, 'Finance Manager', selectedBill.status === 'MISMATCH' ? overrideRemarks : undefined); setSelectedBill(undefined); }}
                disabled={selectedBill.status === 'MISMATCH' && !overrideRemarks}
                className="px-4 py-2 bg-[#0F5B55] disabled:opacity-40 text-white text-[13px] font-semibold rounded-[8px]"
              >
                Approve Bill
              </button>
            </div>
          </div>
        ) : undefined}
      >
        {selectedBill && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <div><span className="text-[#66706B]">Vendor Invoice</span><div className="font-medium">{selectedBill.vendorInvoiceNumber}</div></div>
              <div><span className="text-[#66706B]">Due Date</span><div className="font-medium">{selectedBill.dueDate}</div></div>
              <div><span className="text-[#66706B]">Total Amount</span><div className="font-medium">{inr(selectedBill.totalAmount)}</div></div>
              <div><span className="text-[#66706B]">Paid</span><div className="font-medium">{inr(selectedBill.amountPaid)}</div></div>
            </div>
            {selectedBill.matchResult && <ThreeWayMatchPanel matchResult={selectedBill.matchResult} itemName={itemName} />}
          </div>
        )}
      </Drawer>
    </ShellLayout>
  );
}
