'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { useLedgerStore } from '@/store/ledger-store';
import { VoucherExportBatch } from '@/types/ledger';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function TallyExportHistoryPage() {
  const { exportBatches } = useLedgerStore();
  const [preview, setPreview] = useState<VoucherExportBatch | undefined>(undefined);

  const columns: DataTableColumn<VoucherExportBatch>[] = [
    { key: 'batch', header: 'Batch Number', render: (b) => b.batchNumber },
    { key: 'by', header: 'Exported By', render: (b) => b.exportedBy },
    { key: 'date', header: 'Exported At', render: (b) => b.exportedAt.substring(0, 10) },
    { key: 'count', header: 'Voucher Count', render: (b) => b.voucherCount },
    { key: 'value', header: 'Total Value', render: (b) => inr(b.totalValue) },
  ];

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader title="Tally Export History" subtitle="Past export runs — click a batch to view its mock XML payload." />
        <DataTable columns={columns} rows={[...exportBatches].sort((a, b) => new Date(b.exportedAt).getTime() - new Date(a.exportedAt).getTime())} keyField={(b) => b.id} onRowClick={setPreview} emptyMessage="No export batches yet." />
      </div>

      <Modal open={!!preview} onClose={() => setPreview(undefined)} title={preview?.batchNumber ?? ''} subtitle="Mock Tally XML preview" maxWidthClass="max-w-2xl">
        <pre className="text-[11px] bg-[#F3F0E9] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">{preview?.xmlPreview}</pre>
      </Modal>
    </ShellLayout>
  );
}
