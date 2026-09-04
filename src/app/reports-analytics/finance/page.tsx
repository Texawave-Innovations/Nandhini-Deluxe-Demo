'use client';

import React from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import KpiCard from '@/components/ui/KpiCard';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Wallet, ShoppingCart, GitMerge } from 'lucide-react';
import { useFinanceStore } from '@/store/finance-store';
import { useSalesStore } from '@/store/sales-store';
import { useReconciliationStore } from '@/store/reconciliation-store';
import { financeService } from '@/services/financeService';
import { salesService } from '@/services/salesService';
import { reconciliationService } from '@/services/reconciliationService';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const AS_OF_DATE = '2026-08-31';

export default function FinanceReportsPage() {
  const { vendorBills } = useFinanceStore();
  const { invoices } = useSalesStore();
  const { matches } = useReconciliationStore();

  const apAging = financeService.computeAPAging(vendorBills, AS_OF_DATE);
  const arAging = salesService.computeARAging(invoices, AS_OF_DATE);
  const reconciliationSummary = reconciliationService.computeReconciliationSummary(matches);

  const agingChartData = [
    { name: 'Current', AP: apAging.current, AR: arAging.current },
    { name: '1-30 Days', AP: apAging.d30, AR: arAging.d30 },
    { name: '31-60 Days', AP: apAging.d60, AR: arAging.d60 },
    { name: '61+ Days', AP: apAging.d90plus, AR: arAging.d90plus },
  ];

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader title="Finance Reports" subtitle="Payables (AP) vs Receivables (AR) aging side by side, plus bank reconciliation status." />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Total Payables (AP)" value={inr(apAging.total)} icon={Wallet} valueColorClass="text-[#C94B45]" />
          <KpiCard label="Total Receivables (AR)" value={inr(arAging.total)} icon={ShoppingCart} valueColorClass="text-[#C94B45]" />
          <KpiCard label="Reconciliation Matched" value={reconciliationSummary.matchedCount} icon={GitMerge} valueColorClass="text-[#23865B]" />
          <KpiCard label="Reconciliation Exceptions" value={reconciliationSummary.suggestedCount + reconciliationSummary.unmatchedCount} icon={GitMerge} valueColorClass="text-[#C68A28]" />
        </div>

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
          <h3 className="text-sm font-semibold text-[#202522] mb-3">AP vs AR Aging</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={agingChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E2DB" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#66706B' }} />
              <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: '#66706B' }} />
              <Tooltip formatter={(v: number) => inr(v)} />
              <Bar dataKey="AP" fill="#C94B45" radius={[4, 4, 0, 0]} />
              <Bar dataKey="AR" fill="#0F5B55" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ShellLayout>
  );
}
