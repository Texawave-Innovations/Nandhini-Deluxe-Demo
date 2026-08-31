'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import StatusChip, { ChipTone } from '@/components/ui/StatusChip';
import Drawer from '@/components/ui/Drawer';
import BillReceipt from '@/components/pos/BillReceipt';
import { useHRMSStore } from '@/store/hrms-store';
import { usePOSStore } from '@/store/pos-store';
import { useOutletStore } from '@/store/outlet-store';
import { outletService } from '@/services/outletService';
import { Bill, BillType } from '@/types/pos';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const TYPE_TONE: Record<BillType, ChipTone> = { NORMAL: 'brand', COMPLIMENTARY: 'warning', NON_CHARGEABLE: 'info', VOID: 'danger' };

export default function BillsPage() {
  const router = useRouter();
  const { locations } = useHRMSStore();
  const { bills, orders, payments } = usePOSStore();
  const { selectedOutletId, businessDate } = useOutletStore();
  const outlets = outletService.listOutlets(locations);
  const scopeIds = selectedOutletId === 'ALL' ? outlets.map((o) => o.id) : [selectedOutletId];

  const [selected, setSelected] = useState<Bill | null>(null);
  const rows = bills.filter((b) => scopeIds.includes(b.outletId) && b.businessDate === businessDate).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const columns: DataTableColumn<Bill>[] = [
    { key: 'no', header: 'Bill No.', render: (b) => <span className="font-semibold text-[#0F5B55]">{b.billNumber}</span> },
    { key: 'outlet', header: 'Outlet', render: (b) => outletService.getOutletById(locations, b.outletId)?.name },
    { key: 'gross', header: 'Gross', render: (b) => inr(b.grossAmount) },
    { key: 'tax', header: 'Tax', render: (b) => inr(b.taxAmount) },
    { key: 'net', header: 'Net Amount', render: (b) => <span className="font-semibold">{inr(b.netAmount)}</span> },
    { key: 'type', header: 'Type', render: (b) => <StatusChip label={b.billType} tone={TYPE_TONE[b.billType]} /> },
    { key: 'status', header: 'Status', render: (b) => <StatusChip label={b.status} tone={b.status === 'PAID' ? 'success' : b.status === 'VOID' ? 'danger' : 'warning'} /> },
  ];

  const order = selected ? orders.find((o) => o.id === selected.orderId) : undefined;
  const billPayments = selected ? payments.filter((p) => p.billId === selected.id) : [];

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader title="Bills" subtitle={`Business Date ${businessDate} — ${rows.length} bill(s)`} />
        <DataTable columns={columns} rows={rows} keyField={(b) => b.id} onRowClick={setSelected} emptyMessage="No bills for this date yet." />
      </div>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.billNumber ?? ''} subtitle="Bill Detail">
        {selected && (
          <div className="space-y-4">
            <BillReceipt bill={selected} order={order} payments={billPayments} />
            {selected.status === 'OPEN' && selected.billType === 'NORMAL' && (
              <button onClick={() => router.push('/pos/payments')} className="w-full h-11 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[14px] rounded-[8px]">Collect Payment →</button>
            )}
            {selected.status === 'OPEN' && selected.billType === 'COMPLIMENTARY' && !selected.complimentaryApprovedBy && (
              <button onClick={() => router.push('/pos/complimentary')} className="w-full h-11 bg-[#C68A28] hover:bg-[#a4711f] text-white font-semibold text-[14px] rounded-[8px]">Go to Manager Approval →</button>
            )}
          </div>
        )}
      </Drawer>
    </ShellLayout>
  );
}
