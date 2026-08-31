'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import StatusChip, { ChipTone } from '@/components/ui/StatusChip';
import Drawer from '@/components/ui/Drawer';
import { useSalesStore } from '@/store/sales-store';
import { SalesInvoice, SalesInvoiceStatus } from '@/types/sales';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const STATUS_TONE: Record<SalesInvoiceStatus, ChipTone> = {
  UNPAID: 'warning', PARTIALLY_PAID: 'info', PAID: 'success', CANCELLED: 'neutral',
};

export default function SalesInvoicesPage() {
  const { invoices, customers } = useSalesStore();
  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? id;

  const [selected, setSelected] = useState<SalesInvoice | undefined>(undefined);

  const columns: DataTableColumn<SalesInvoice>[] = [
    { key: 'inv', header: 'Invoice', render: (i) => (<div><div className="font-medium">{i.invoiceNumber}</div><div className="text-[11px] text-[#66706B]">{i.soId}</div></div>) },
    { key: 'customer', header: 'Customer', render: (i) => customerName(i.customerId) },
    { key: 'due', header: 'Due Date', render: (i) => i.dueDate },
    { key: 'amount', header: 'Amount', render: (i) => inr(i.totalAmount) },
    { key: 'received', header: 'Received', render: (i) => inr(i.amountReceived) },
    { key: 'status', header: 'Status', render: (i) => <StatusChip label={i.status.replace('_', ' ')} tone={STATUS_TONE[i.status]} /> },
  ];

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader title="Invoices" subtitle="Invoices raised from fulfilled Sales Orders — create one from a Sales Order's detail page." />
        <DataTable
          columns={columns} rows={[...invoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
          keyField={(i) => i.id} onRowClick={(i) => setSelected(i)}
        />
      </div>

      <Drawer open={!!selected} onClose={() => setSelected(undefined)} title={selected?.invoiceNumber ?? ''} subtitle={selected ? customerName(selected.customerId) : ''} widthClass="max-w-xl">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <div><span className="text-[#66706B]">Invoice Date</span><div className="font-medium">{selected.invoiceDate}</div></div>
              <div><span className="text-[#66706B]">Due Date</span><div className="font-medium">{selected.dueDate}</div></div>
              <div><span className="text-[#66706B]">Total Amount</span><div className="font-medium">{inr(selected.totalAmount)}</div></div>
              <div><span className="text-[#66706B]">Received</span><div className="font-medium">{inr(selected.amountReceived)}</div></div>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-[#202522] mb-2">Line Items</h4>
              <div className="space-y-1.5">
                {selected.lines.map((l, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-[#F3F0E9] rounded-md text-[13px]">
                    <span>{l.name} × {l.qty}</span>
                    <span className="font-medium">{inr(l.lineTotal)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </ShellLayout>
  );
}
