'use client';

import React from 'react';
import Link from 'next/link';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import KpiCard from '@/components/ui/KpiCard';
import StatusChip from '@/components/ui/StatusChip';
import { Plus, Table2, ClipboardList, Receipt, IndianRupee, Users } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';
import { usePOSStore } from '@/store/pos-store';
import { useOutletStore } from '@/store/outlet-store';
import { outletService } from '@/services/outletService';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function POSDashboardPage() {
  const { locations } = useHRMSStore();
  const { bills, orders, tables, kots } = usePOSStore();
  const { selectedOutletId, businessDate } = useOutletStore();
  const outlets = outletService.listOutlets(locations);
  const effectiveOutletId = selectedOutletId === 'ALL' ? outlets[0]?.id : selectedOutletId;

  const todaysBills = bills.filter((b) => b.outletId === effectiveOutletId && b.businessDate === businessDate && b.status !== 'VOID');
  const totalSales = todaysBills.reduce((s, b) => s + b.netAmount, 0);
  const avgBill = todaysBills.length ? Math.round(totalSales / todaysBills.length) : 0;
  const openOrders = orders.filter((o) => o.outletId === effectiveOutletId && !['CLOSED', 'CANCELLED'].includes(o.status));
  const activeKots = kots.filter((k) => k.outletId === effectiveOutletId && k.status !== 'SERVED');
  const outletTables = tables.filter((t) => t.outletId === effectiveOutletId);
  const occupied = outletTables.filter((t) => t.status !== 'AVAILABLE').length;

  return (
    <ShellLayout>
      <div className="space-y-6">
        <SectionHeader
          title="POS Dashboard"
          subtitle={outlets.find((o) => o.id === effectiveOutletId)?.name}
          actions={<Link href="/pos/new-order" className="h-11 px-5 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[14px] rounded-[8px] flex items-center gap-2"><Plus className="w-4 h-4" /> New Order</Link>}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Today's Sales" value={inr(totalSales)} icon={IndianRupee} valueColorClass="text-[#0F5B55]" sublabel={`${todaysBills.length} bills`} />
          <KpiCard label="Average Bill Value" value={inr(avgBill)} icon={Receipt} />
          <KpiCard label="Open Orders" value={openOrders.length} icon={ClipboardList} />
          <KpiCard label="Tables Occupied" value={`${occupied} / ${outletTables.length}`} icon={Table2} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/pos/tables" className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs hover:border-[#0F5B55] transition-all">
            <Table2 className="w-5 h-5 text-[#0F5B55] mb-2" />
            <div className="text-[14px] font-semibold text-[#202522]">Tables</div>
            <div className="text-[12px] text-[#66706B] mt-0.5">Live floor plan across all dining floors</div>
          </Link>
          <Link href="/pos/kot" className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs hover:border-[#0F5B55] transition-all">
            <ClipboardList className="w-5 h-5 text-[#0F5B55] mb-2" />
            <div className="text-[14px] font-semibold text-[#202522]">Kitchen Order Tickets</div>
            <div className="text-[12px] text-[#66706B] mt-0.5">{activeKots.length} active tickets in the kitchen</div>
          </Link>
          <Link href="/pos/day-close" className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs hover:border-[#0F5B55] transition-all">
            <Users className="w-5 h-5 text-[#0F5B55] mb-2" />
            <div className="text-[14px] font-semibold text-[#202522]">Day Close</div>
            <div className="text-[12px] text-[#66706B] mt-0.5">Reconcile cash and close the business day</div>
          </Link>
        </div>

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs p-5">
          <h3 className="text-sm font-semibold text-[#202522] mb-3">Recent Bills</h3>
          <div className="space-y-2">
            {todaysBills.slice(0, 8).map((b) => (
              <div key={b.id} className="flex items-center justify-between p-2.5 bg-[#F3F0E9] rounded-md text-[13px]">
                <span className="font-medium text-[#202522]">{b.billNumber}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[#66706B]">{inr(b.netAmount)}</span>
                  <StatusChip label={b.status} tone={b.status === 'PAID' ? 'success' : 'warning'} />
                </div>
              </div>
            ))}
            {todaysBills.length === 0 && <div className="text-[13px] text-[#66706B]">No bills yet today — start a New Order to begin the demo flow.</div>}
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}
