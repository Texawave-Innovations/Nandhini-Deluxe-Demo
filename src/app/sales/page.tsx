'use client';

import React from 'react';
import Link from 'next/link';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import KpiCard from '@/components/ui/KpiCard';
import StatusChip, { ChipTone } from '@/components/ui/StatusChip';
import { ArrowRight, ShoppingCart, Wallet, FileText, Building2 } from 'lucide-react';
import { useSalesStore } from '@/store/sales-store';
import { salesService } from '@/services/salesService';
import { SalesInvoiceStatus } from '@/types/sales';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const AS_OF_DATE = '2026-08-31';
const INVOICE_TONE: Record<SalesInvoiceStatus, ChipTone> = {
  UNPAID: 'warning', PARTIALLY_PAID: 'info', PAID: 'success', CANCELLED: 'neutral',
};

export default function SalesDashboardPage() {
  const { customers, salesOrders, invoices } = useSalesStore();

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? id;
  const aging = salesService.computeARAging(invoices, AS_OF_DATE);
  const openSOs = salesOrders.filter((so) => ['DRAFT', 'CONFIRMED', 'FULFILLED'].includes(so.status));
  const thisMonthInvoiced = invoices.filter((i) => i.invoiceDate.startsWith('2026-08')).reduce((s, i) => s + i.totalAmount, 0);
  const recentInvoices = [...invoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader
          title="Sales"
          subtitle="Corporate & institutional catering accounts — Sales Order fulfillment consumes stock through the same Recipe/BOM engine as POS."
          actions={<Link href="/sales/orders" className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[13px] rounded-[8px] flex items-center gap-2">New Sales Order</Link>}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Open Sales Orders" value={openSOs.length} icon={ShoppingCart} />
          <KpiCard label="Invoiced (Aug 2026)" value={inr(thisMonthInvoiced)} icon={FileText} valueColorClass="text-[#0F5B55]" />
          <KpiCard label="AR Outstanding" value={inr(aging.total)} icon={Wallet} valueColorClass="text-[#C94B45]" />
          <KpiCard label="Active Customers" value={customers.filter((c) => c.status === 'ACTIVE').length} icon={Building2} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link href="/sales/customers" className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs hover:border-[#0F5B55] transition-all flex items-center justify-between">
            <div><div className="text-[14px] font-semibold text-[#202522]">Customers</div><div className="text-[12px] text-[#66706B] mt-0.5">Corporate & institutional accounts, credit terms and statements.</div></div>
            <ArrowRight className="w-4 h-4 text-[#66706B]" />
          </Link>
          <Link href="/sales/orders" className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs hover:border-[#0F5B55] transition-all flex items-center justify-between">
            <div><div className="text-[14px] font-semibold text-[#202522]">Sales Orders</div><div className="text-[12px] text-[#66706B] mt-0.5">Draft → Confirm → Fulfill → Invoice pipeline.</div></div>
            <ArrowRight className="w-4 h-4 text-[#66706B]" />
          </Link>
          <Link href="/sales/invoices" className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs hover:border-[#0F5B55] transition-all flex items-center justify-between">
            <div><div className="text-[14px] font-semibold text-[#202522]">Invoices</div><div className="text-[12px] text-[#66706B] mt-0.5">Invoices raised from fulfilled Sales Orders.</div></div>
            <ArrowRight className="w-4 h-4 text-[#66706B]" />
          </Link>
          <Link href="/sales/payments" className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs hover:border-[#0F5B55] transition-all flex items-center justify-between">
            <div><div className="text-[14px] font-semibold text-[#202522]">Customer Payments</div><div className="text-[12px] text-[#66706B] mt-0.5">Record a receipt and allocate it across a customer's outstanding invoices.</div></div>
            <ArrowRight className="w-4 h-4 text-[#66706B]" />
          </Link>
        </div>

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs p-4">
          <h3 className="text-sm font-semibold text-[#202522] mb-3">Recent Invoices</h3>
          <div className="space-y-2">
            {recentInvoices.length === 0 && <div className="text-[13px] text-[#66706B]">No invoices yet.</div>}
            {recentInvoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-2.5 bg-[#F3F0E9] rounded-md text-[13px]">
                <div>
                  <span className="font-medium text-[#202522]">{inv.invoiceNumber}</span>
                  <span className="text-[#66706B]"> • {customerName(inv.customerId)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#202522] font-medium">{inr(inv.totalAmount)}</span>
                  <StatusChip label={inv.status.replace('_', ' ')} tone={INVOICE_TONE[inv.status]} />
                </div>
              </div>
            ))}
          </div>
          <Link href="/sales/invoices" className="text-[12px] text-[#0F5B55] font-semibold mt-3 inline-block">View all invoices →</Link>
        </div>
      </div>
    </ShellLayout>
  );
}
