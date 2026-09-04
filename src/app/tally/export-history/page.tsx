'use client';

import React, { useMemo, useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import StatusChip, { ChipTone } from '@/components/ui/StatusChip';
import { Code2, User, CalendarDays, ListChecks, Wallet } from 'lucide-react';
import { useLedgerStore } from '@/store/ledger-store';
import { Voucher, VoucherExportBatch, VoucherStatus } from '@/types/ledger';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const STATUS_TONE: Record<VoucherStatus, ChipTone> = { DRAFT: 'info', POSTED: 'success', REVERSED: 'neutral' };

function computeTotal(v: Voucher) {
  return v.lines.filter((l) => l.drCr === 'DEBIT').reduce((s, l) => s + l.amount, 0);
}

export default function TallyExportHistoryPage() {
  const { exportBatches, vouchers, ledgerAccounts } = useLedgerStore();
  const [preview, setPreview] = useState<VoucherExportBatch | undefined>(undefined);
  const [showXml, setShowXml] = useState(false);

  const accountName = (id: string) => ledgerAccounts.find((a) => a.id === id)?.name ?? id;

  const batchVouchers = useMemo(() => {
    if (!preview) return [];
    return preview.voucherIds
      .map((id) => vouchers.find((v) => v.id === id))
      .filter((v): v is Voucher => !!v);
  }, [preview, vouchers]);

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
        <SectionHeader title="Tally Export History" subtitle="Past export runs — click a batch to view the vouchers it contains." />
        <DataTable columns={columns} rows={[...exportBatches].sort((a, b) => new Date(b.exportedAt).getTime() - new Date(a.exportedAt).getTime())} keyField={(b) => b.id} onRowClick={(b) => { setPreview(b); setShowXml(false); }} emptyMessage="No export batches yet." />
      </div>

      <Modal
        open={!!preview}
        onClose={() => setPreview(undefined)}
        title={preview?.batchNumber ?? ''}
        subtitle={`Exported to Tally • ${preview?.voucherCount ?? 0} voucher${preview?.voucherCount === 1 ? '' : 's'}`}
        maxWidthClass="max-w-3xl"
      >
        {preview && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-[#F8F5EE] border border-[#E5E2DB] rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#66706B] mb-1"><User className="w-3.5 h-3.5" /> Exported By</div>
                <div className="text-[13px] font-semibold text-[#202522]">{preview.exportedBy}</div>
              </div>
              <div className="bg-[#F8F5EE] border border-[#E5E2DB] rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#66706B] mb-1"><CalendarDays className="w-3.5 h-3.5" /> Exported At</div>
                <div className="text-[13px] font-semibold text-[#202522]">{preview.exportedAt.substring(0, 10)}</div>
              </div>
              <div className="bg-[#F8F5EE] border border-[#E5E2DB] rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#66706B] mb-1"><ListChecks className="w-3.5 h-3.5" /> Voucher Count</div>
                <div className="text-[13px] font-semibold text-[#202522]">{preview.voucherCount}</div>
              </div>
              <div className="bg-[#F8F5EE] border border-[#E5E2DB] rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#66706B] mb-1"><Wallet className="w-3.5 h-3.5" /> Total Value</div>
                <div className="text-[13px] font-semibold text-[#202522]">{inr(preview.totalValue)}</div>
              </div>
            </div>

            <div className="space-y-3">
              {batchVouchers.map((v) => (
                <div key={v.id} className="border border-[#E5E2DB] rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-[#F3F0E9]">
                    <div>
                      <span className="text-[13px] font-semibold text-[#202522]">{v.voucherNumber}</span>
                      <span className="text-[12px] text-[#66706B] ml-2">{v.voucherType.replace('_', ' ')} • {v.voucherDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-[#202522]">{inr(computeTotal(v))}</span>
                      <StatusChip label={v.status} tone={STATUS_TONE[v.status]} />
                    </div>
                  </div>
                  <div className="px-3 py-2 text-[12px] text-[#66706B] border-t border-[#E5E2DB]">{v.narration}</div>
                  <table className="w-full text-[12px] border-t border-[#E5E2DB]">
                    <thead className="bg-white text-[#66706B]"><tr><th className="text-left px-3 py-1.5 font-medium">Account</th><th className="text-left px-3 py-1.5 font-medium">Particulars</th><th className="text-right px-3 py-1.5 font-medium">Debit</th><th className="text-right px-3 py-1.5 font-medium">Credit</th></tr></thead>
                    <tbody>
                      {v.lines.map((l, i) => (
                        <tr key={i} className="border-t border-[#E5E2DB]">
                          <td className="px-3 py-1.5">{accountName(l.ledgerAccountId)}</td>
                          <td className="px-3 py-1.5 text-[#66706B]">{l.particulars}</td>
                          <td className="px-3 py-1.5 text-right">{l.drCr === 'DEBIT' ? inr(l.amount) : '—'}</td>
                          <td className="px-3 py-1.5 text-right">{l.drCr === 'CREDIT' ? inr(l.amount) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            <div>
              <button
                onClick={() => setShowXml((s) => !s)}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0F5B55] hover:text-[#08463F]"
              >
                <Code2 className="w-3.5 h-3.5" /> {showXml ? 'Hide' : 'View'} raw Tally XML payload
              </button>
              {showXml && (
                <pre className="mt-2 text-[11px] bg-[#F3F0E9] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">{preview.xmlPreview}</pre>
              )}
            </div>
          </div>
        )}
      </Modal>
    </ShellLayout>
  );
}
