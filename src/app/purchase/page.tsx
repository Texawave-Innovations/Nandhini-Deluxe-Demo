'use client';

import React from 'react';
import Link from 'next/link';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import KpiCard from '@/components/ui/KpiCard';
import StatusChip, { ChipTone } from '@/components/ui/StatusChip';
import { ArrowRight, ShoppingBag, Clock, PackageCheck, TrendingUp } from 'lucide-react';
import { usePurchaseStore } from '@/store/purchase-store';
import { useVendorStore } from '@/store/vendor-store';
import { useHRMSStore } from '@/store/hrms-store';
import { POStatus } from '@/types/purchase';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const PO_TONE: Record<POStatus, ChipTone> = {
  DRAFT: 'neutral', SUBMITTED: 'info', APPROVED: 'info', PARTIALLY_RECEIVED: 'warning',
  RECEIVED: 'success', CLOSED: 'success', CANCELLED: 'danger', REJECTED: 'danger',
};

export default function PurchaseDashboardPage() {
  const { purchaseOrders, grns } = usePurchaseStore();
  const { vendors } = useVendorStore();
  const { locations } = useHRMSStore();

  const vendorName = (id: string) => vendors.find((v) => v.id === id)?.name ?? id;
  const outletName = (id: string) => locations.find((l) => l.id === id)?.name ?? id;

  const openPOs = purchaseOrders.filter((po) => ['DRAFT', 'SUBMITTED', 'APPROVED', 'PARTIALLY_RECEIVED'].includes(po.status));
  const pendingApproval = purchaseOrders.filter((po) => po.status === 'SUBMITTED');
  const thisMonthReceived = grns.filter((g) => g.status === 'POSTED' && g.receivedAt.startsWith('2026-08')).reduce((s, g) => s + g.totalAmount, 0);
  const recentPOs = [...purchaseOrders].sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()).slice(0, 8);

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader
          title="Purchase"
          subtitle="Purchase Orders and Goods Receipt — GRN posting is the only path that moves stock into the Inventory ledger."
          actions={<Link href="/purchase/orders" className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[13px] rounded-[8px] flex items-center gap-2">New Purchase Order</Link>}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Open Purchase Orders" value={openPOs.length} icon={ShoppingBag} />
          <KpiCard label="Pending Approval" value={pendingApproval.length} icon={Clock} valueColorClass="text-[#C68A28]" />
          <KpiCard label="Value Received (Aug 2026)" value={inr(thisMonthReceived)} icon={TrendingUp} valueColorClass="text-[#0F5B55]" />
          <KpiCard label="GRNs Posted" value={grns.filter((g) => g.status === 'POSTED').length} icon={PackageCheck} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link href="/purchase/orders" className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs hover:border-[#0F5B55] transition-all flex items-center justify-between">
            <div><div className="text-[14px] font-semibold text-[#202522]">Purchase Orders</div><div className="text-[12px] text-[#66706B] mt-0.5">Create, submit, approve and track POs through their lifecycle.</div></div>
            <ArrowRight className="w-4 h-4 text-[#66706B]" />
          </Link>
          <Link href="/purchase/grn" className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs hover:border-[#0F5B55] transition-all flex items-center justify-between">
            <div><div className="text-[14px] font-semibold text-[#202522]">Goods Receipt (GRN)</div><div className="text-[12px] text-[#66706B] mt-0.5">Receive against an approved PO — posts stock straight into the Inventory ledger.</div></div>
            <ArrowRight className="w-4 h-4 text-[#66706B]" />
          </Link>
        </div>

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs p-4">
          <h3 className="text-sm font-semibold text-[#202522] mb-3">Recent Purchase Orders</h3>
          <div className="space-y-2">
            {recentPOs.length === 0 && <div className="text-[13px] text-[#66706B]">No purchase orders yet.</div>}
            {recentPOs.map((po) => (
              <div key={po.id} className="flex items-center justify-between p-2.5 bg-[#F3F0E9] rounded-md text-[13px]">
                <div>
                  <span className="font-medium text-[#202522]">{po.poNumber}</span>
                  <span className="text-[#66706B]"> • {vendorName(po.vendorId)} • {outletName(po.outletId)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#202522] font-medium">{inr(po.totalAmount)}</span>
                  <StatusChip label={po.status} tone={PO_TONE[po.status]} />
                </div>
              </div>
            ))}
          </div>
          <Link href="/purchase/orders" className="text-[12px] text-[#0F5B55] font-semibold mt-3 inline-block">View all purchase orders →</Link>
        </div>
      </div>
    </ShellLayout>
  );
}
