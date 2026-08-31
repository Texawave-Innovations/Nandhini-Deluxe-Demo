'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import StatusChip, { ChipTone } from '@/components/ui/StatusChip';
import Modal from '@/components/ui/Modal';
import BankMatchPicker, { MatchCandidate } from '@/components/reconciliation/BankMatchPicker';
import { useReconciliationStore } from '@/store/reconciliation-store';
import { usePOSStore } from '@/store/pos-store';
import { useFinanceStore } from '@/store/finance-store';
import { BankTransaction, ReconciliationStatus } from '@/types/reconciliation';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const STATUS_TONE: Record<ReconciliationStatus, ChipTone> = { MATCHED: 'success', MISMATCH: 'danger', UNMATCHED: 'neutral' };

export default function BankStatementPage() {
  const { bankTransactions, matches, manuallyMatch, markReviewed } = useReconciliationStore();
  const { payments, channelSettlements } = usePOSStore();
  const { vendorPayments } = useFinanceStore();

  const [pickerTxn, setPickerTxn] = useState<BankTransaction | undefined>(undefined);
  const matchByTxnId = new Map(matches.map((m) => [m.bankTransactionId, m]));
  const usedSourceIds = new Set(matches.filter((m) => m.sourceId).map((m) => m.sourceId));

  const buildCandidates = (txn: BankTransaction): MatchCandidate[] => {
    const withinDays = (dateStr: string) => Math.abs(new Date(dateStr).getTime() - new Date(txn.transactionDate).getTime()) / 86400000 <= 7;
    const candidates: MatchCandidate[] = [];
    if (txn.type === 'CREDIT') {
      payments.filter((p) => p.status === 'SUCCESS' && !usedSourceIds.has(p.id) && withinDays(p.createdAt)).forEach((p) => {
        candidates.push({ type: 'POS_PAYMENT', id: p.id, label: `${p.mode} Payment ${p.referenceNo ?? ''}`, amount: p.amount, date: p.createdAt.substring(0, 10) });
      });
      channelSettlements.filter((s) => s.status === 'SETTLED' && !usedSourceIds.has(s.id) && s.settlementDate && withinDays(s.settlementDate)).forEach((s) => {
        candidates.push({ type: 'CHANNEL_SETTLEMENT', id: s.id, label: `${s.platform} Settlement ${s.externalOrderRef}`, amount: s.netSettlement, date: s.settlementDate! });
      });
    } else {
      vendorPayments.filter((p) => p.status === 'SUCCESS' && !usedSourceIds.has(p.id) && withinDays(p.paidAt)).forEach((p) => {
        candidates.push({ type: 'VENDOR_PAYMENT', id: p.id, label: `Vendor Payment ${p.paymentNumber}`, amount: p.amount, date: p.paidAt.substring(0, 10) });
      });
    }
    return candidates.sort((a, b) => Math.abs(a.amount - txn.amount) - Math.abs(b.amount - txn.amount));
  };

  const columns: DataTableColumn<BankTransaction>[] = [
    { key: 'date', header: 'Date', render: (t) => t.transactionDate },
    { key: 'desc', header: 'Description', render: (t) => t.description },
    { key: 'ref', header: 'Reference', render: (t) => t.referenceNo },
    { key: 'type', header: 'Type', render: (t) => t.type },
    { key: 'amount', header: 'Amount', render: (t) => inr(t.amount) },
    { key: 'match', header: 'Matched With', render: (t) => matchByTxnId.get(t.id)?.sourceLabel ?? '—' },
    {
      key: 'status', header: 'Status', render: (t) => {
        const m = matchByTxnId.get(t.id);
        return m ? <StatusChip label={m.status} tone={STATUS_TONE[m.status]} /> : <StatusChip label="PENDING" tone="neutral" />;
      },
    },
    {
      key: 'action', header: 'Action', render: (t) => {
        const m = matchByTxnId.get(t.id);
        if (!m || m.status === 'MATCHED') return <span className="text-[11px] text-[#66706B]">—</span>;
        return (
          <div className="flex gap-2">
            <button onClick={() => setPickerTxn(t)} className="px-2.5 py-1 bg-[#0F5B55] text-white text-[11px] font-semibold rounded">Match</button>
            {m.status === 'MISMATCH' && !m.reviewedBy && <button onClick={() => markReviewed(m.id, 'Finance Executive')} className="px-2.5 py-1 border border-[#E5E2DB] text-[#202522] text-[11px] font-semibold rounded">Mark Reviewed</button>}
          </div>
        );
      },
    },
  ];

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader title="Bank Statement" subtitle="Every line's match status, with a manual-match picker for anything the auto-match algorithm couldn't resolve." />
        <DataTable columns={columns} rows={[...bankTransactions].sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())} keyField={(t) => t.id} />
      </div>

      <Modal open={!!pickerTxn} onClose={() => setPickerTxn(undefined)} title="Manual Match" subtitle={pickerTxn ? `${pickerTxn.description} • ${inr(pickerTxn.amount)}` : ''} maxWidthClass="max-w-lg">
        {pickerTxn && (
          <BankMatchPicker
            candidates={buildCandidates(pickerTxn)}
            onConfirm={(c) => { manuallyMatch(pickerTxn.id, c.type, c.id, c.label, c.amount, 'Finance Executive'); setPickerTxn(undefined); }}
          />
        )}
      </Modal>
    </ShellLayout>
  );
}
