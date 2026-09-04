'use client';

import React from 'react';
import Link from 'next/link';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import KpiCard from '@/components/ui/KpiCard';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ArrowRight, Wallet, AlertOctagon, FileWarning, Receipt } from 'lucide-react';
import { useFinanceStore } from '@/store/finance-store';
import { financeService } from '@/services/financeService';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const BUSINESS_DATE = '2026-08-31';

export default function FinanceDashboardPage() {
  const { vendorBills } = useFinanceStore();
  const aging = financeService.computeAPAging(vendorBills, BUSINESS_DATE);
  const mismatchedBills = vendorBills.filter((b) => b.status === 'MISMATCH');

  const agingChartData = [
    { name: 'Current', value: aging.current },
    { name: '1-30 Days', value: aging.d30 },
    { name: '31-60 Days', value: aging.d60 },
    { name: '61+ Days', value: aging.d90plus },
  ];

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader title="Finance — Accounts Payable" subtitle="Vendor Bills, 3-way match, and payment allocation across the outstanding book." />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Total Payables" value={inr(aging.total)} icon={Wallet} valueColorClass="text-[#C94B45]" />
          <KpiCard label="Overdue 31-60 Days" value={inr(aging.d60)} icon={AlertOctagon} valueColorClass="text-[#C68A28]" />
          <KpiCard label="Overdue 61+ Days" value={inr(aging.d90plus)} icon={AlertOctagon} valueColorClass="text-[#C94B45]" />
          <KpiCard label="Bills Mismatched" value={mismatchedBills.length} icon={FileWarning} valueColorClass="text-[#C94B45]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link href="/finance/bills" className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs hover:border-[#0F5B55] transition-all flex items-center justify-between">
            <div><div className="text-[14px] font-semibold text-[#202522]">Vendor Bills</div><div className="text-[12px] text-[#66706B] mt-0.5">Bill-from-GRN creation, 3-way match viewer, and approval.</div></div>
            <ArrowRight className="w-4 h-4 text-[#66706B]" />
          </Link>
          <Link href="/finance/payments" className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs hover:border-[#0F5B55] transition-all flex items-center justify-between">
            <div><div className="text-[14px] font-semibold text-[#202522]">Vendor Payments</div><div className="text-[12px] text-[#66706B] mt-0.5">Record a payment and allocate it across a vendor's outstanding bills.</div></div>
            <ArrowRight className="w-4 h-4 text-[#66706B]" />
          </Link>
          <Link href="/finance/aggregators" className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs hover:border-[#0F5B55] transition-all flex items-center justify-between">
            <div><div className="text-[14px] font-semibold text-[#202522]">Aggregator Ledgers</div><div className="text-[12px] text-[#66706B] mt-0.5">Swiggy/Zomato gross sales, commission, and expected vs actual bank payout.</div></div>
            <ArrowRight className="w-4 h-4 text-[#66706B]" />
          </Link>
        </div>

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
          <h3 className="text-sm font-semibold text-[#202522] mb-3 flex items-center gap-2"><Receipt className="w-4 h-4 text-[#0F5B55]" />AP Aging</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={agingChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E2DB" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#66706B' }} />
              <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: '#66706B' }} />
              <Tooltip formatter={(v: number) => inr(v)} />
              <Bar dataKey="value" fill="#0F5B55" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ShellLayout>
  );
}
