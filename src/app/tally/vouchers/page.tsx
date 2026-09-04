'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import StatusChip, { ChipTone } from '@/components/ui/StatusChip';
import Drawer from '@/components/ui/Drawer';
import { FileOutput, Plus, Undo2, CheckCircle2, Paperclip } from 'lucide-react';
import { useLedgerStore } from '@/store/ledger-store';
import { Voucher, VoucherStatus } from '@/types/ledger';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const STATUS_TONE: Record<VoucherStatus, ChipTone> = { DRAFT: 'info', POSTED: 'success', REVERSED: 'neutral' };

export default function TallyVouchersPage() {
  const { vouchers, ledgerAccounts, postVoucher, reverseVoucher, exportBatch } = useLedgerStore();
  const [selected, setSelected] = useState<string[]>([]);
  const [detail, setDetail] = useState<Voucher | undefined>(undefined);
  const [actionError, setActionError] = useState<string | undefined>(undefined);

  const accountName = (id: string) => ledgerAccounts.find((a) => a.id === id)?.name ?? id;
  const toggle = (id: string) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const exportable = (v: Voucher) => v.status === 'POSTED' && !v.exportBatchId;
  const sorted = [...vouchers].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const columns: DataTableColumn<Voucher>[] = [
    {
      key: 'select', header: '',
      render: (v) => exportable(v) ? <input type="checkbox" checked={selected.includes(v.id)} onChange={() => toggle(v.id)} onClick={(e) => e.stopPropagation()} /> : null,
    },
    { key: 'type', header: 'Type', render: (v) => v.voucherType.replace('_', ' ') },
    { key: 'number', header: 'Voucher No', render: (v) => v.voucherNumber },
    { key: 'date', header: 'Date', render: (v) => v.voucherDate },
    { key: 'narration', header: 'Narration', render: (v) => <span className="line-clamp-1">{v.narration}</span> },
    { key: 'amount', header: 'Amount', render: (v) => inr(computeTotal(v)) },
    { key: 'status', header: 'Status', render: (v) => <StatusChip label={v.status} tone={STATUS_TONE[v.status]} /> },
    { key: 'export', header: 'Export', render: (v) => v.status !== 'POSTED' ? <span className="text-[#66706B]">—</span> : <StatusChip label={v.exportBatchId ? 'Exported' : 'Pending'} tone={v.exportBatchId ? 'success' : 'warning'} /> },
  ];

  function computeTotal(v: Voucher) {
    return v.lines.filter((l) => l.drCr === 'DEBIT').reduce((s, l) => s + l.amount, 0);
  }

  const handlePost = (id: string) => {
    const res = postVoucher(id, 'Finance Executive');
    if (!res.ok) setActionError(res.error);
    else { setActionError(undefined); setDetail(useLedgerStore.getState().vouchers.find((v) => v.id === id)); }
  };
  const handleReverse = (id: string) => {
    const res = reverseVoucher(id, 'Finance Executive');
    if (!res.ok) setActionError(res.error);
    else { setActionError(undefined); setDetail(undefined); }
  };

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader
          title="Vouchers"
          subtitle="Every voucher — auto-derived and manual. Posted vouchers are immutable; correct one via Reverse, never a silent edit."
          actions={
            <div className="flex items-center gap-2">
              <Link href="/tally/vouchers/new" className="h-10 px-4 bg-white border border-[#E5E2DB] hover:border-[#0F5B55] text-[#202522] font-semibold text-[13px] rounded-[8px] flex items-center gap-2"><Plus className="w-4 h-4" /> New Voucher</Link>
              <button
                onClick={() => { const res = exportBatch(selected, 'Finance Executive'); if (!res.ok) setActionError(res.error); else { setActionError(undefined); setSelected([]); } }}
                disabled={selected.length === 0}
                className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] disabled:opacity-40 text-white font-semibold text-[13px] rounded-[8px] flex items-center gap-2"
              ><FileOutput className="w-4 h-4" /> Export Selected ({selected.length})</button>
            </div>
          }
        />
        {actionError && <div className="text-[13px] text-[#C94B45] bg-[#C94B45]/5 border border-[#C94B45]/30 rounded-lg px-3 py-2">{actionError}</div>}
        <DataTable columns={columns} rows={sorted} keyField={(v) => v.id} onRowClick={setDetail} emptyMessage="No vouchers yet." />
      </div>

      <Drawer open={!!detail} onClose={() => setDetail(undefined)} title={detail?.voucherNumber ?? ''} subtitle={detail ? `${detail.voucherType.replace('_', ' ')} • ${detail.voucherDate}` : ''} widthClass="max-w-lg">
        {detail && (
          <div className="space-y-4">
            <div><div className="text-[12px] font-semibold text-[#66706B] mb-1">Narration</div><div className="text-[13px] text-[#202522]">{detail.narration}</div></div>
            {detail.attachmentName && (
              <div className="flex items-center gap-1.5 text-[12px] text-[#66706B]"><Paperclip className="w-3.5 h-3.5" /> {detail.attachmentName}</div>
            )}
            <div>
              <div className="text-[12px] font-semibold text-[#66706B] mb-1.5">Ledger Entries</div>
              <div className="border border-[#E5E2DB] rounded-lg overflow-hidden">
                <table className="w-full text-[12px]">
                  <thead className="bg-[#F3F0E9] text-[#66706B]"><tr><th className="text-left px-3 py-2">Account</th><th className="text-left px-3 py-2">Particulars</th><th className="text-right px-3 py-2">Debit</th><th className="text-right px-3 py-2">Credit</th></tr></thead>
                  <tbody>
                    {detail.lines.map((l, i) => (
                      <tr key={i} className="border-t border-[#E5E2DB]">
                        <td className="px-3 py-2">{accountName(l.ledgerAccountId)}</td>
                        <td className="px-3 py-2 text-[#66706B]">{l.particulars}</td>
                        <td className="px-3 py-2 text-right">{l.drCr === 'DEBIT' ? inr(l.amount) : '—'}</td>
                        <td className="px-3 py-2 text-right">{l.drCr === 'CREDIT' ? inr(l.amount) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {detail.status === 'REVERSED' && <div className="text-[12px] text-[#66706B]">Reversed by voucher {vouchers.find((v) => v.id === detail.reversedByVoucherId)?.voucherNumber ?? detail.reversedByVoucherId}.</div>}
            {detail.reversesVoucherId && <div className="text-[12px] text-[#66706B]">This reverses {vouchers.find((v) => v.id === detail.reversesVoucherId)?.voucherNumber ?? detail.reversesVoucherId}.</div>}

            <div className="flex items-center gap-2 pt-2">
              {detail.status === 'DRAFT' && (
                <>
                  <Link href={`/tally/vouchers/new?draftId=${detail.id}`} className="h-9 px-3 border border-[#E5E2DB] rounded-lg text-[12px] font-semibold text-[#202522] hover:border-[#0F5B55]">Edit Draft</Link>
                  <button onClick={() => handlePost(detail.id)} className="h-9 px-3 bg-[#0F5B55] hover:bg-[#08463F] text-white rounded-lg text-[12px] font-semibold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Post Voucher</button>
                </>
              )}
              {detail.status === 'POSTED' && (
                <button onClick={() => handleReverse(detail.id)} className="h-9 px-3 border border-[#C94B45] text-[#C94B45] rounded-lg text-[12px] font-semibold flex items-center gap-1.5 hover:bg-[#C94B45]/5"><Undo2 className="w-3.5 h-3.5" /> Reverse Voucher</button>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </ShellLayout>
  );
}
