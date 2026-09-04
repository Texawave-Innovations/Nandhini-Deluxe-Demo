'use client';

import React from 'react';
import Link from 'next/link';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import KpiCard from '@/components/ui/KpiCard';
import { ArrowRight, FileOutput, CheckCircle2, Calendar, BookOpenCheck, RefreshCw } from 'lucide-react';
import { useLedgerStore } from '@/store/ledger-store';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function TallyDashboardPage() {
  const { vouchers, exportBatches, generateVouchersFromHistoricalEvents } = useLedgerStore();

  const pendingExport = vouchers.filter((v) => v.status === 'POSTED' && !v.exportBatchId);
  const draftCount = vouchers.filter((v) => v.status === 'DRAFT').length;
  const exportedThisMonth = exportBatches.filter((b) => b.exportedAt.startsWith('2026-08'));
  const lastExport = [...exportBatches].sort((a, b) => new Date(b.exportedAt).getTime() - new Date(a.exportedAt).getTime())[0];
  const totalExportedValue = exportBatches.reduce((s, b) => s + b.totalValue, 0);

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader
          title="Tally / Accounting"
          subtitle="Double-entry vouchers — auto-derived from Vendor Bills, Vendor Payments, Sales Invoices and Customer Payments, plus manual Journal/Payment/Receipt/Contra/Note entries. Mock XML export, no live Tally connection."
        />

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KpiCard label="Drafts Awaiting Post" value={draftCount} icon={FileOutput} valueColorClass="text-[#3377A8]" />
          <KpiCard label="Posted, Pending Export" value={pendingExport.length} icon={FileOutput} valueColorClass="text-[#C68A28]" />
          <KpiCard label="Exported This Month" value={exportedThisMonth.length} icon={CheckCircle2} valueColorClass="text-[#23865B]" />
          <KpiCard label="Last Export" value={lastExport ? lastExport.exportedAt.substring(0, 10) : '—'} icon={Calendar} />
          <KpiCard label="Total Exported Value" value={inr(totalExportedValue)} icon={BookOpenCheck} />
        </div>

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#202522]">Refresh Derived Vouchers</h3>
            <p className="text-[12px] text-[#66706B] mt-0.5">Re-checks Vendor Bills / Payments / Sales Invoices / Customer Payments for any not yet recorded as a voucher. Safe to run any time — already-derived vouchers are never duplicated.</p>
          </div>
          <button onClick={() => generateVouchersFromHistoricalEvents()} className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[13px] rounded-[8px] flex items-center gap-2 shrink-0"><RefreshCw className="w-4 h-4" /> Refresh Vouchers</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link href="/tally/vouchers" className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs hover:border-[#0F5B55] transition-all flex items-center justify-between">
            <div><div className="text-[14px] font-semibold text-[#202522]">Vouchers</div><div className="text-[12px] text-[#66706B] mt-0.5">Review, post, reverse, and export vouchers.</div></div>
            <ArrowRight className="w-4 h-4 text-[#66706B]" />
          </Link>
          <Link href="/tally/vouchers/new" className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs hover:border-[#0F5B55] transition-all flex items-center justify-between">
            <div><div className="text-[14px] font-semibold text-[#202522]">New Voucher</div><div className="text-[12px] text-[#66706B] mt-0.5">Manual Payment / Receipt / Journal / Contra / Debit / Credit Note entry.</div></div>
            <ArrowRight className="w-4 h-4 text-[#66706B]" />
          </Link>
          <Link href="/tally/export-history" className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs hover:border-[#0F5B55] transition-all flex items-center justify-between">
            <div><div className="text-[14px] font-semibold text-[#202522]">Export History</div><div className="text-[12px] text-[#66706B] mt-0.5">Past export batches with the mock XML payload for each run.</div></div>
            <ArrowRight className="w-4 h-4 text-[#66706B]" />
          </Link>
        </div>
      </div>
    </ShellLayout>
  );
}
