'use client';

import React, { useMemo, useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import { useHRMSStore } from '@/store/hrms-store';
import { usePOSStore } from '@/store/pos-store';
import { useOutletStore } from '@/store/outlet-store';
import { outletService } from '@/services/outletService';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
type Tab = 'ITEM' | 'CATEGORY' | 'PAYMENT' | 'CHANNEL';

export default function POSReportsPage() {
  const { locations } = useHRMSStore();
  const { bills, orders, payments, menuItems, menuCategories } = usePOSStore();
  const { selectedOutletId, businessDate } = useOutletStore();
  const outlets = outletService.listOutlets(locations);
  const scopeIds = selectedOutletId === 'ALL' ? outlets.map((o) => o.id) : [selectedOutletId];
  const [tab, setTab] = useState<Tab>('ITEM');

  const scopedBills = bills.filter((b) => scopeIds.includes(b.outletId) && b.businessDate === businessDate && b.status !== 'VOID');
  const billIds = new Set(scopedBills.map((b) => b.id));
  const scopedOrders = orders.filter((o) => o.billId && billIds.has(o.billId));

  const itemRows = useMemo(() => {
    const map = new Map<string, { name: string; categoryId: string; qty: number; revenue: number }>();
    scopedOrders.forEach((o) => o.items.forEach((it) => {
      const existing = map.get(it.menuItemId) ?? { name: it.name, categoryId: menuItems.find((m) => m.id === it.menuItemId)?.categoryId ?? '', qty: 0, revenue: 0 };
      existing.qty += it.qty; existing.revenue += it.qty * it.unitPrice;
      map.set(it.menuItemId, existing);
    }));
    return Array.from(map.entries()).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.revenue - a.revenue);
  }, [scopedOrders, menuItems]);

  const categoryRows = useMemo(() => {
    const map = new Map<string, number>();
    itemRows.forEach((r) => map.set(r.categoryId, (map.get(r.categoryId) ?? 0) + r.revenue));
    return Array.from(map.entries()).map(([categoryId, revenue]) => ({ categoryId, name: menuCategories.find((c) => c.id === categoryId)?.name ?? categoryId, revenue })).sort((a, b) => b.revenue - a.revenue);
  }, [itemRows, menuCategories]);

  const paymentRows = useMemo(() => {
    const scopedPayments = payments.filter((p) => billIds.has(p.billId) && p.status === 'SUCCESS');
    const map = new Map<string, { amount: number; count: number }>();
    scopedPayments.forEach((p) => {
      const e = map.get(p.mode) ?? { amount: 0, count: 0 };
      e.amount += p.amount; e.count += 1;
      map.set(p.mode, e);
    });
    return Array.from(map.entries()).map(([mode, v]) => ({ mode, ...v })).sort((a, b) => b.amount - a.amount);
  }, [payments, billIds]);

  const channelRows = useMemo(() => {
    const map = new Map<string, number>();
    scopedOrders.forEach((o) => {
      const bill = scopedBills.find((b) => b.id === o.billId);
      if (!bill) return;
      map.set(o.channel, (map.get(o.channel) ?? 0) + bill.netAmount);
    });
    return Array.from(map.entries()).map(([channel, revenue]) => ({ channel, revenue })).sort((a, b) => b.revenue - a.revenue);
  }, [scopedOrders, scopedBills]);

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader title="POS Reports" subtitle={`Business Date ${businessDate} — ${scopedBills.length} bill(s)`} />
        <div className="flex items-center gap-2">
          {(['ITEM', 'CATEGORY', 'PAYMENT', 'CHANNEL'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-full text-[13px] font-semibold ${tab === t ? 'bg-[#0F5B55] text-white' : 'bg-white border border-[#E5E2DB] text-[#202522]'}`}>{t.charAt(0) + t.slice(1).toLowerCase()}-wise</button>
          ))}
        </div>

        {tab === 'ITEM' && <DataTable rows={itemRows} keyField={(r) => r.id} columns={[
          { key: 'name', header: 'Item', render: (r) => r.name },
          { key: 'qty', header: 'Qty Sold', render: (r) => r.qty },
          { key: 'revenue', header: 'Revenue', render: (r) => inr(r.revenue) },
        ] as DataTableColumn<typeof itemRows[0]>[]} />}

        {tab === 'CATEGORY' && <DataTable rows={categoryRows} keyField={(r) => r.categoryId} columns={[
          { key: 'name', header: 'Category', render: (r) => r.name },
          { key: 'revenue', header: 'Revenue', render: (r) => inr(r.revenue) },
        ] as DataTableColumn<typeof categoryRows[0]>[]} />}

        {tab === 'PAYMENT' && <DataTable rows={paymentRows} keyField={(r) => r.mode} columns={[
          { key: 'mode', header: 'Payment Mode', render: (r) => r.mode },
          { key: 'count', header: 'Transactions', render: (r) => r.count },
          { key: 'amount', header: 'Amount', render: (r) => inr(r.amount) },
        ] as DataTableColumn<typeof paymentRows[0]>[]} />}

        {tab === 'CHANNEL' && <DataTable rows={channelRows} keyField={(r) => r.channel} columns={[
          { key: 'channel', header: 'Channel', render: (r) => r.channel.replace('_', ' ') },
          { key: 'revenue', header: 'Revenue', render: (r) => inr(r.revenue) },
        ] as DataTableColumn<typeof channelRows[0]>[]} />}
      </div>
    </ShellLayout>
  );
}
