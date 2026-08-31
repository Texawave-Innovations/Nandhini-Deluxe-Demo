'use client';

import React, { useMemo, useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import KpiCard from '@/components/ui/KpiCard';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import DateRangePicker from '@/components/reports/DateRangePicker';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Package, CalendarClock, TrendingDown } from 'lucide-react';
import { useInventoryStore } from '@/store/inventory-store';
import { useOutletStore } from '@/store/outlet-store';
import { inventoryService } from '@/services/inventoryService';
import { reportsService, WastageRow } from '@/services/reportsService';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function InventoryReportsPage() {
  const { ledgerEntries, items, batches } = useInventoryStore();
  const { businessDate } = useOutletStore();

  const [fromDate, setFromDate] = useState(businessDate);
  const [toDate, setToDate] = useState(businessDate);

  const wastage = reportsService.computeWastageReport(ledgerEntries, items, fromDate, toDate);
  const wastageCost = wastage.reduce((s, w) => s + w.cost, 0);
  const wastageQty = wastage.reduce((s, w) => s + w.qty, 0);

  const stockBalances = inventoryService.computeCurrentStock(ledgerEntries);
  const lowStock = inventoryService.getLowStockItems(items, stockBalances);
  const expiring = inventoryService.getExpiringBatches(batches, businessDate, 7);

  const consumptionByDay = useMemo(() => {
    const totals = new Map<string, number>();
    ledgerEntries
      .filter((e) => e.entryType === 'CONSUMPTION' && e.createdAt.substring(0, 10) >= fromDate && e.createdAt.substring(0, 10) <= toDate)
      .forEach((e) => {
        const date = e.createdAt.substring(0, 10);
        totals.set(date, (totals.get(date) ?? 0) + Math.abs(e.qty));
      });
    return Array.from(totals.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, qty]) => ({ date: date.substring(5), qty: Math.round(qty * 10) / 10 }));
  }, [ledgerEntries, fromDate, toDate]);

  const wastageColumns: DataTableColumn<WastageRow>[] = [
    { key: 'name', header: 'Item', render: (r) => r.name },
    { key: 'qty', header: 'Qty Wasted', render: (r) => r.qty.toFixed(1) },
    { key: 'cost', header: 'Cost', render: (r) => inr(r.cost) },
  ];

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader title="Inventory Reports" subtitle="Consumption trend, wastage cost, and low-stock / expiry summary across all outlets." />
        <DateRangePicker fromDate={fromDate} toDate={toDate} anchorDate={businessDate} onChange={(f, t) => { setFromDate(f); setToDate(t); }} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Wastage Cost (in range)" value={inr(wastageCost)} icon={TrendingDown} valueColorClass="text-[#C68A28]" sublabel={`${wastageQty.toFixed(1)} units`} />
          <KpiCard label="Low Stock Items" value={lowStock.length} icon={Package} valueColorClass="text-[#C94B45]" />
          <KpiCard label="Expiring / Expired (7 days)" value={expiring.length} icon={CalendarClock} valueColorClass="text-[#C68A28]" />
          <KpiCard label="Items Tracked" value={items.length} icon={Package} />
        </div>

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
          <h3 className="text-sm font-semibold text-[#202522] mb-3">Total Consumption by Day (all items, all outlets)</h3>
          {consumptionByDay.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-[13px] text-[#66706B]">No consumption recorded in this range.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={consumptionByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E2DB" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#66706B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#66706B' }} />
                <Tooltip />
                <Bar dataKey="qty" fill="#0F5B55" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-[14px] font-semibold text-[#202522]">Wastage by Item</h3>
          <DataTable columns={wastageColumns} rows={wastage} keyField={(r) => r.itemId} emptyMessage="No wastage recorded in this range." />
        </div>
      </div>
    </ShellLayout>
  );
}
