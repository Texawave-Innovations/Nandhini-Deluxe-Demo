'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import StatusChip from '@/components/ui/StatusChip';
import { FileOutput } from 'lucide-react';
import { useTallyStore } from '@/store/tally-store';
import { TallyVoucher } from '@/types/tally';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function TallyVouchersPage() {
  const { vouchers, exportBatch } = useTallyStore();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const pending = vouchers.filter((v) => v.status === 'PENDING_EXPORT');

  const columns: DataTableColumn<TallyVoucher>[] = [
    {
      key: 'select', header: '', render: (v) => v.status === 'PENDING_EXPORT' ? (
        <input type="checkbox" checked={selected.includes(v.id)} onChange={() => toggle(v.id)} onClick={(e) => e.stopPropagation()} />
      ) : null,
    },
    { key: 'type', header: 'Type', render: (v) => v.voucherType },
    { key: 'number', header: 'Voucher Number', render: (v) => v.voucherNumber },
    { key: 'date', header: 'Date', render: (v) => v.voucherDate },
    { key: 'ledger', header: 'Ledger', render: (v) => v.ledgerName },
    { key: 'amount', header: 'Amount', render: (v) => inr(v.amount) },
    { key: 'status', header: 'Status', render: (v) => <StatusChip label={v.status} tone={v.status === 'EXPORTED' ? 'success' : 'warning'} /> },
  ];

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader
          title="Tally Vouchers"
          subtitle="Purchase vouchers (from GRNs) and Payment vouchers (from Vendor Payments) awaiting export."
          actions={<button onClick={() => { exportBatch(selected, 'Finance Executive'); setSelected([]); }} disabled={selected.length === 0} className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] disabled:opacity-40 text-white font-semibold text-[13px] rounded-[8px] flex items-center gap-2"><FileOutput className="w-4 h-4" /> Export Selected ({selected.length})</button>}
        />
        <DataTable columns={columns} rows={[...vouchers].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())} keyField={(v) => v.id} emptyMessage={pending.length === 0 && vouchers.length === 0 ? 'No vouchers yet — generate some from the Tally dashboard.' : 'No vouchers.'} />
      </div>
    </ShellLayout>
  );
}
