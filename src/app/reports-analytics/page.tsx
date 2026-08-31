'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import KpiCard from '@/components/ui/KpiCard';
import DateRangePicker from '@/components/reports/DateRangePicker';
import { ArrowRight, IndianRupee, Wallet, TrendingDown, ShoppingCart } from 'lucide-react';
import { usePOSStore } from '@/store/pos-store';
import { useInventoryStore } from '@/store/inventory-store';
import { useFinanceStore } from '@/store/finance-store';
import { useSalesStore } from '@/store/sales-store';
import { useOutletStore } from '@/store/outlet-store';
import { reportsService } from '@/services/reportsService';
import { financeService } from '@/services/financeService';
import { salesService } from '@/services/salesService';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const AS_OF_DATE = '2026-08-31';

export default function ReportsAnalyticsHubPage() {
  const { businessDate } = useOutletStore();
  const { bills } = usePOSStore();
  const { ledgerEntries, items } = useInventoryStore();
  const { vendorBills } = useFinanceStore();
  const { invoices } = useSalesStore();

  const [fromDate, setFromDate] = useState(businessDate);
  const [toDate, setToDate] = useState(businessDate);

  const scopedBills = bills.filter((b) => b.status !== 'VOID' && b.businessDate >= fromDate && b.businessDate <= toDate);
  const totalSales = scopedBills.reduce((s, b) => s + b.netAmount, 0);
  const apAging = financeService.computeAPAging(vendorBills, AS_OF_DATE);
  const arAging = salesService.computeARAging(invoices, AS_OF_DATE);
  const wastage = reportsService.computeWastageReport(ledgerEntries, items, fromDate, toDate);
  const wastageCost = wastage.reduce((s, w) => s + w.cost, 0);

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader title="Reports & Analytics" subtitle="Cross-module reporting over Sales, Inventory, Purchase and Finance — pick a date range and drill in." />

        <DateRangePicker fromDate={fromDate} toDate={toDate} anchorDate={businessDate} onChange={(f, t) => { setFromDate(f); setToDate(t); }} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Total Sales (in range)" value={inr(totalSales)} icon={IndianRupee} valueColorClass="text-[#0F5B55]" sublabel={`${scopedBills.length} bills`} />
          <KpiCard label="AP Outstanding" value={inr(apAging.total)} icon={Wallet} valueColorClass="text-[#C94B45]" />
          <KpiCard label="AR Outstanding" value={inr(arAging.total)} icon={ShoppingCart} valueColorClass="text-[#C94B45]" />
          <KpiCard label="Wastage Cost (in range)" value={inr(wastageCost)} icon={TrendingDown} valueColorClass="text-[#C68A28]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link href="/reports-analytics/sales" className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs hover:border-[#0F5B55] transition-all flex items-center justify-between">
            <div><div className="text-[14px] font-semibold text-[#202522]">Sales Reports</div><div className="text-[12px] text-[#66706B] mt-0.5">Trend, outlet comparison, category/item breakdown, channel commission.</div></div>
            <ArrowRight className="w-4 h-4 text-[#66706B]" />
          </Link>
          <Link href="/reports-analytics/inventory" className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs hover:border-[#0F5B55] transition-all flex items-center justify-between">
            <div><div className="text-[14px] font-semibold text-[#202522]">Inventory Reports</div><div className="text-[12px] text-[#66706B] mt-0.5">Wastage cost, low-stock and expiry summary.</div></div>
            <ArrowRight className="w-4 h-4 text-[#66706B]" />
          </Link>
          <Link href="/reports-analytics/finance" className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs hover:border-[#0F5B55] transition-all flex items-center justify-between">
            <div><div className="text-[14px] font-semibold text-[#202522]">Finance Reports</div><div className="text-[12px] text-[#66706B] mt-0.5">AP + AR aging side by side, reconciliation summary.</div></div>
            <ArrowRight className="w-4 h-4 text-[#66706B]" />
          </Link>
        </div>
      </div>
    </ShellLayout>
  );
}
