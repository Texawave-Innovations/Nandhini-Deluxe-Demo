'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import StatusChip, { ChipTone } from '@/components/ui/StatusChip';
import Modal from '@/components/ui/Modal';
import BankMatchPicker, { MatchCandidate } from '@/components/reconciliation/BankMatchPicker';
import { Upload, Plus, CheckCircle2 } from 'lucide-react';
import { useReconciliationStore } from '@/store/reconciliation-store';
import { usePOSStore } from '@/store/pos-store';
import { useFinanceStore } from '@/store/finance-store';
import { useSalesStore } from '@/store/sales-store';
import { BankTransaction, ReconciliationStatus } from '@/types/reconciliation';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const STATUS_TONE: Record<ReconciliationStatus, ChipTone> = { MATCHED: 'success', SUGGESTED: 'warning', UNMATCHED: 'neutral' };

const NARRATION_SOURCES: BankTransaction['narrationSource'][] = ['UPI', 'CARD_SETTLEMENT', 'GATEWAY_SETTLEMENT', 'NEFT', 'RTGS', 'CHEQUE', 'OTHER'];

export default function BankStatementPage() {
  const { bankTransactions, matches, manuallyMatch, splitMatch, confirmSuggestedMatch, markReviewed, addManualBankTransaction } = useReconciliationStore();
  const { payments, channelSettlements } = usePOSStore();
  const { vendorPayments } = useFinanceStore();
  const { customerPayments } = useSalesStore();

  const [pickerTxn, setPickerTxn] = useState<BankTransaction | undefined>(undefined);
  const [showAddLine, setShowAddLine] = useState(false);
  const [newLine, setNewLine] = useState({ transactionDate: new Date().toISOString().slice(0, 10), description: '', referenceNo: '', type: 'CREDIT' as 'CREDIT' | 'DEBIT', amount: '', narrationSource: 'OTHER' as BankTransaction['narrationSource'] });

  const matchesByTxnId = new Map<string, typeof matches>();
  matches.forEach((m) => matchesByTxnId.set(m.bankTransactionId, [...(matchesByTxnId.get(m.bankTransactionId) ?? []), m]));
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
      customerPayments.filter((p) => p.status === 'SUCCESS' && !usedSourceIds.has(p.id) && withinDays(p.receivedAt)).forEach((p) => {
        candidates.push({ type: 'CUSTOMER_PAYMENT', id: p.id, label: `Customer Receipt ${p.paymentNumber}`, amount: p.amount, date: p.receivedAt.substring(0, 10) });
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
    {
      key: 'match', header: 'Matched With', render: (t) => {
        const ms = matchesByTxnId.get(t.id);
        if (!ms || ms.length === 0) return '—';
        return ms.length === 1 ? ms[0].sourceLabel : `${ms.length}-way split: ${ms.map((m) => m.sourceLabel).join(', ')}`;
      },
    },
    {
      key: 'status', header: 'Status', render: (t) => {
        const ms = matchesByTxnId.get(t.id);
        if (!ms || ms.length === 0) return <StatusChip label="PENDING" tone="neutral" />;
        const status = ms[0].status;
        return <StatusChip label={status === 'MATCHED' ? 'Matched' : status === 'SUGGESTED' ? 'Suggested' : 'Unmatched'} tone={STATUS_TONE[status]} />;
      },
    },
    {
      key: 'action', header: 'Action', render: (t) => {
        const ms = matchesByTxnId.get(t.id);
        const m = ms?.[0];
        if (!m || m.status === 'MATCHED') return <span className="text-[11px] text-[#66706B]">—</span>;
        return (
          <div className="flex gap-2">
            {m.status === 'SUGGESTED' && (
              <button onClick={() => confirmSuggestedMatch(m.id, 'Finance Executive')} className="px-2.5 py-1 bg-[#23865B] text-white text-[11px] font-semibold rounded flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Confirm</button>
            )}
            <button onClick={() => setPickerTxn(t)} className="px-2.5 py-1 bg-[#0F5B55] text-white text-[11px] font-semibold rounded">{m.status === 'SUGGESTED' ? 'Review' : 'Match'}</button>
            {m.status === 'SUGGESTED' && !m.reviewedBy && <button onClick={() => markReviewed(m.id, 'Finance Executive')} className="px-2.5 py-1 border border-[#E5E2DB] text-[#202522] text-[11px] font-semibold rounded">Mark Reviewed</button>}
          </div>
        );
      },
    },
  ];

  const submitNewLine = () => {
    const amount = parseFloat(newLine.amount);
    if (!newLine.description || !newLine.referenceNo || !(amount > 0)) return;
    addManualBankTransaction({ ...newLine, amount });
    setShowAddLine(false);
    setNewLine({ transactionDate: new Date().toISOString().slice(0, 10), description: '', referenceNo: '', type: 'CREDIT', amount: '', narrationSource: 'OTHER' });
  };

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader
          title="Bank Statement"
          subtitle="Every line's match status — Suggested matches need a one-click confirm, Unmatched needs manual (or split) matching."
          actions={
            <div className="flex items-center gap-2">
              <button onClick={() => setShowAddLine(true)} className="h-10 px-4 bg-white border border-[#E5E2DB] hover:border-[#0F5B55] text-[#202522] font-semibold text-[13px] rounded-[8px] flex items-center gap-2"><Plus className="w-4 h-4" /> Add Bank Line</button>
              <Link href="/reconciliation/bank-statement/import" className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[13px] rounded-[8px] flex items-center gap-2"><Upload className="w-4 h-4" /> Import Statement</Link>
            </div>
          }
        />
        <DataTable columns={columns} rows={[...bankTransactions].sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())} keyField={(t) => t.id} />
      </div>

      <Modal open={!!pickerTxn} onClose={() => setPickerTxn(undefined)} title="Match Bank Line" subtitle={pickerTxn ? `${pickerTxn.description} • ${inr(pickerTxn.amount)}` : ''} maxWidthClass="max-w-lg">
        {pickerTxn && (
          <BankMatchPicker
            candidates={buildCandidates(pickerTxn)}
            bankAmount={pickerTxn.amount}
            onConfirm={(c) => { manuallyMatch(pickerTxn.id, c.type, c.id, c.label, c.amount, 'Finance Executive'); setPickerTxn(undefined); }}
            onConfirmSplit={(allocations) => {
              splitMatch(pickerTxn.id, allocations.map((a) => ({ sourceType: a.candidate.type, sourceId: a.candidate.id, sourceLabel: a.candidate.label, amount: a.amount })), 'Finance Executive');
              setPickerTxn(undefined);
            }}
          />
        )}
      </Modal>

      <Modal open={showAddLine} onClose={() => setShowAddLine(false)} title="Add Bank Line" subtitle="Manual entry for a bank-statement line not covered by an import." maxWidthClass="max-w-lg">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[12px] font-semibold text-[#66706B] block mb-1">Date</label><input type="date" value={newLine.transactionDate} onChange={(e) => setNewLine((s) => ({ ...s, transactionDate: e.target.value }))} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" /></div>
            <div><label className="text-[12px] font-semibold text-[#66706B] block mb-1">Type</label><select value={newLine.type} onChange={(e) => setNewLine((s) => ({ ...s, type: e.target.value as 'CREDIT' | 'DEBIT' }))} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]"><option value="CREDIT">Credit</option><option value="DEBIT">Debit</option></select></div>
          </div>
          <div><label className="text-[12px] font-semibold text-[#66706B] block mb-1">Description</label><input type="text" value={newLine.description} onChange={(e) => setNewLine((s) => ({ ...s, description: e.target.value }))} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[12px] font-semibold text-[#66706B] block mb-1">Reference No</label><input type="text" value={newLine.referenceNo} onChange={(e) => setNewLine((s) => ({ ...s, referenceNo: e.target.value }))} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" /></div>
            <div><label className="text-[12px] font-semibold text-[#66706B] block mb-1">Amount</label><input type="number" min="0" step="0.01" value={newLine.amount} onChange={(e) => setNewLine((s) => ({ ...s, amount: e.target.value }))} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" /></div>
          </div>
          <div><label className="text-[12px] font-semibold text-[#66706B] block mb-1">Source</label><select value={newLine.narrationSource} onChange={(e) => setNewLine((s) => ({ ...s, narrationSource: e.target.value as BankTransaction['narrationSource'] }))} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]">{NARRATION_SOURCES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select></div>
          <button onClick={submitNewLine} className="w-full px-4 py-2 bg-[#0F5B55] hover:bg-[#08463F] text-white text-[13px] font-semibold rounded-[8px]">Add Line</button>
        </div>
      </Modal>
    </ShellLayout>
  );
}
