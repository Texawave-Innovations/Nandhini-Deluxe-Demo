'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import StatusChip, { ChipTone } from '@/components/ui/StatusChip';
import Modal from '@/components/ui/Modal';
import { ArrowLeft, CheckCircle2, PackageCheck, FileText } from 'lucide-react';
import { useSalesStore } from '@/store/sales-store';
import { useHRMSStore } from '@/store/hrms-store';
import { SalesOrderLineItem, SalesOrderStatus } from '@/types/sales';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const SO_TONE: Record<SalesOrderStatus, ChipTone> = {
  DRAFT: 'neutral', CONFIRMED: 'info', FULFILLED: 'warning', INVOICED: 'success', CANCELLED: 'danger',
};

export default function SalesOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { salesOrders, invoices, customers, confirmSalesOrder, fulfillSalesOrder, generateInvoice } = useSalesStore();
  const { locations } = useHRMSStore();

  const so = salesOrders.find((s) => s.id === params.id);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState('2026-08-31');
  const [taxPercent, setTaxPercent] = useState(5);

  if (!so) {
    return <ShellLayout><div className="text-[13px] text-[#66706B]">Sales Order not found. <button onClick={() => router.push('/sales/orders')} className="text-[#0F5B55] font-semibold">Back</button></div></ShellLayout>;
  }

  const customer = customers.find((c) => c.id === so.customerId);
  const outlet = locations.find((l) => l.id === so.outletId);
  const linkedInvoice = invoices.find((i) => i.soId === so.id);

  const openInvoice = () => {
    setInvoiceDate('2026-08-31');
    setTaxPercent(so.lines[0]?.taxPercent ?? 5);
    setShowInvoice(true);
  };

  const submitInvoice = () => {
    generateInvoice({ soId: so.id, invoiceDate, taxPercent, createdBy: 'Sales Executive' });
    setShowInvoice(false);
  };

  const lineColumns: DataTableColumn<SalesOrderLineItem>[] = [
    { key: 'item', header: 'Item', render: (l) => l.name },
    { key: 'qty', header: 'Qty', render: (l) => l.qty },
    { key: 'rate', header: 'Rate', render: (l) => inr(l.rate) },
    { key: 'total', header: 'Line Total', render: (l) => inr(l.qty * l.rate) },
  ];

  return (
    <ShellLayout>
      <div className="space-y-5">
        <button onClick={() => router.push('/sales/orders')} className="flex items-center gap-1.5 text-[13px] text-[#66706B] hover:text-[#202522]"><ArrowLeft className="w-4 h-4" /> Back to Sales Orders</button>

        <SectionHeader
          title={so.soNumber}
          subtitle={`${customer?.name ?? so.customerId} • ${outlet?.name ?? so.outletId} • Delivery ${so.deliveryDate}`}
          actions={<>
            <StatusChip label={so.status} tone={SO_TONE[so.status]} />
            {so.status === 'DRAFT' && <button onClick={() => confirmSalesOrder(so.id, 'Sales Executive')} className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[13px] rounded-[8px] flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Confirm</button>}
            {so.status === 'CONFIRMED' && <button onClick={() => fulfillSalesOrder(so.id, 'Outlet Manager')} className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[13px] rounded-[8px] flex items-center gap-2"><PackageCheck className="w-4 h-4" /> Fulfill</button>}
            {so.status === 'FULFILLED' && <button onClick={openInvoice} className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[13px] rounded-[8px] flex items-center gap-2"><FileText className="w-4 h-4" /> Generate Invoice</button>}
          </>}
        />

        {so.status === 'FULFILLED' && (
          <div className="bg-[#F3F0E9] border border-[#E5E2DB] rounded-[10px] p-3.5 text-[13px] text-[#66706B]">
            Fulfilling this order posted CONSUMPTION stock-ledger entries via the Recipe/BOM engine — see <button onClick={() => router.push('/inventory/ledger')} className="text-[#0F5B55] font-semibold">Stock Ledger</button> filtered to {outlet?.name ?? so.outletId}.
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-[14px] font-semibold text-[#202522]">Line Items — Total {inr(so.totalAmount)}</h3>
          <DataTable columns={lineColumns} rows={so.lines} keyField={(l) => l.menuItemId} />
        </div>

        {linkedInvoice && (
          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-4 shadow-brand-xs flex items-center justify-between">
            <div>
              <div className="text-[14px] font-semibold text-[#202522]">{linkedInvoice.invoiceNumber}</div>
              <div className="text-[12px] text-[#66706B]">Due {linkedInvoice.dueDate} • {inr(linkedInvoice.totalAmount)} • Received {inr(linkedInvoice.amountReceived)}</div>
            </div>
            <button onClick={() => router.push('/sales/invoices')} className="text-[12px] text-[#0F5B55] font-semibold">View Invoices →</button>
          </div>
        )}
      </div>

      <Modal
        open={showInvoice} onClose={() => setShowInvoice(false)} title="Generate Invoice" subtitle={so.soNumber} maxWidthClass="max-w-md"
        footer={<>
          <button onClick={() => setShowInvoice(false)} className="px-4 py-2 text-[13px] font-semibold text-[#66706B]">Cancel</button>
          <button onClick={submitInvoice} className="px-4 py-2 bg-[#0F5B55] text-white text-[13px] font-semibold rounded-[8px]">Create Invoice</button>
        </>}
      >
        <div className="space-y-3">
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Invoice Date</label>
            <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Tax %</label>
            <input type="number" value={taxPercent} onChange={(e) => setTaxPercent(Number(e.target.value))} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
          </div>
        </div>
      </Modal>
    </ShellLayout>
  );
}
