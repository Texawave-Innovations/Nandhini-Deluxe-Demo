'use client';

import React from 'react';
import Link from 'next/link';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import KpiCard from '@/components/ui/KpiCard';
import StatusChip, { ChipTone } from '@/components/ui/StatusChip';
import { ArrowRight, RefreshCw, CheckCircle2, AlertTriangle, HelpCircle, Wallet } from 'lucide-react';
import { useReconciliationStore } from '@/store/reconciliation-store';
import { reconciliationService } from '@/services/reconciliationService';
import { ReconciliationStatus } from '@/types/reconciliation';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const STATUS_TONE: Record<ReconciliationStatus, ChipTone> = { MATCHED: 'success', MISMATCH: 'danger', UNMATCHED: 'neutral' };

export default function ReconciliationDashboardPage() {
  const { bankTransactions, matches, runAutoMatch } = useReconciliationStore();
  const summary = reconciliationService.computeReconciliationSummary(matches);
  const exceptions = reconciliationService.flagVarianceExceptions(matches).slice(0, 6);
  const txnById = new Map(bankTransactions.map((t) => [t.id, t]));

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader
          title="Bank Reconciliation"
          subtitle="Matches the bank statement against POS settlements, aggregator payouts, and vendor payments."
          actions={<button onClick={runAutoMatch} className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[13px] rounded-[8px] flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Run Auto-Match</button>}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Matched" value={summary.matchedCount} icon={CheckCircle2} valueColorClass="text-[#23865B]" />
          <KpiCard label="Mismatched" value={summary.mismatchCount} icon={AlertTriangle} valueColorClass="text-[#C94B45]" />
          <KpiCard label="Unmatched" value={summary.unmatchedCount} icon={HelpCircle} valueColorClass="text-[#66706B]" />
          <KpiCard label="Total Variance" value={inr(summary.totalVarianceAmount)} icon={Wallet} valueColorClass="text-[#C68A28]" />
        </div>

        <Link href="/reconciliation/bank-statement" className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs hover:border-[#0F5B55] transition-all flex items-center justify-between">
          <div><div className="text-[14px] font-semibold text-[#202522]">Bank Statement</div><div className="text-[12px] text-[#66706B] mt-0.5">Full statement with per-line match status, and manual match for exceptions.</div></div>
          <ArrowRight className="w-4 h-4 text-[#66706B]" />
        </Link>

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
          <h3 className="text-sm font-semibold text-[#202522] mb-3">Reconciliation Exceptions</h3>
          <div className="space-y-2 text-[13px]">
            {exceptions.length === 0 && <div className="text-[#66706B]">No exceptions — every bank line is cleanly matched.</div>}
            {exceptions.map((m) => {
              const txn = txnById.get(m.bankTransactionId);
              return (
                <div key={m.id} className="flex items-center justify-between p-2.5 bg-[#F3F0E9] rounded-md">
                  <span>{m.sourceLabel} vs Bank {txn?.description ?? ''} ({inr(m.bankAmount)}{m.varianceAmount !== 0 ? ` Δ ${inr(Math.abs(m.varianceAmount))}` : ''})</span>
                  <StatusChip label={m.status === 'MATCHED' ? 'Matched' : m.status === 'MISMATCH' ? 'Review Required' : 'Unmatched'} tone={STATUS_TONE[m.status]} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}
