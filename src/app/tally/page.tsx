'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import KpiCard from '@/components/ui/KpiCard';
import { ArrowRight, FileOutput, CheckCircle2, Calendar, BookOpenCheck } from 'lucide-react';
import { useTallyStore } from '@/store/tally-store';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function TallyDashboardPage() {
  const { vouchers, exportBatches, generateVouchersForPeriod } = useTallyStore();
  const [fromDate, setFromDate] = useState('2026-08-10');
  const [toDate, setToDate] = useState('2026-08-31');

  const pending = vouchers.filter((v) => v.status === 'PENDING_EXPORT');
  const exportedThisMonth = exportBatches.filter((b) => b.exportedAt.startsWith('2026-08'));
  const lastExport = [...exportBatches].sort((a, b) => new Date(b.exportedAt).getTime() - new Date(a.exportedAt).getTime())[0];
  const totalExportedValue = exportBatches.reduce((s, b) => s + b.totalValue, 0);

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader title="Tally / Accounting Export" subtitle="Purchase and Payment vouchers generated from posted GRNs and settled Vendor Payments — mock export, no live Tally connection." />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Vouchers Pending Export" value={pending.length} icon={FileOutput} valueColorClass="text-[#C68A28]" />
          <KpiCard label="Exported This Month" value={exportedThisMonth.length} icon={CheckCircle2} valueColorClass="text-[#23865B]" />
          <KpiCard label="Last Export" value={lastExport ? lastExport.exportedAt.substring(0, 10) : '—'} icon={Calendar} />
          <KpiCard label="Total Exported Value" value={inr(totalExportedValue)} icon={BookOpenCheck} />
        </div>

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
          <h3 className="text-sm font-semibold text-[#202522] mb-3">Generate Vouchers for Period</h3>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">From</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">To</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
            </div>
            <button onClick={() => generateVouchersForPeriod(fromDate, toDate)} className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[13px] rounded-[8px]">Generate Vouchers</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link href="/tally/vouchers" className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs hover:border-[#0F5B55] transition-all flex items-center justify-between">
            <div><div className="text-[14px] font-semibold text-[#202522]">Vouchers</div><div className="text-[12px] text-[#66706B] mt-0.5">Review pending vouchers and export a selected batch.</div></div>
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
