'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import KpiCard from '@/components/ui/KpiCard';
import StatusChip from '@/components/ui/StatusChip';
import { Package, AlertTriangle, CalendarClock, TrendingDown } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';
import { useInventoryStore } from '@/store/inventory-store';
import { useOutletStore } from '@/store/outlet-store';
import { outletService } from '@/services/outletService';
import { inventoryService } from '@/services/inventoryService';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function InventoryDashboardPage() {
  const { locations } = useHRMSStore();
  const { items, ledgerEntries, batches, consumptionEvents } = useInventoryStore();
  const { selectedOutletId, businessDate } = useOutletStore();

  const outlets = outletService.listOutlets(locations);
  const scopeIds = selectedOutletId === 'ALL' ? outlets.map((o) => o.id) : [selectedOutletId];
  const scopedLedger = ledgerEntries.filter((e) => scopeIds.includes(e.outletId));

  const balances = inventoryService.computeCurrentStock(scopedLedger);
  const stockValue = useMemo(() => balances.reduce((s, b) => {
    const item = items.find((i) => i.id === b.itemId);
    return s + (item ? item.standardCost * Math.max(0, b.qty) : 0);
  }, 0), [balances, items]);

  const lowStock = inventoryService.getLowStockItems(items, balances);
  const expiring = inventoryService.getExpiringBatches(batches.filter((b) => scopeIds.includes(b.outletId)), businessDate, 3);
  const recentConsumption = consumptionEvents.filter((c) => scopeIds.includes(c.outletId)).slice(-8).reverse();

  return (
    <ShellLayout>
      <div className="space-y-6">
        <SectionHeader title="Inventory Dashboard" subtitle={`${selectedOutletId === 'ALL' ? 'All outlets' : outlets.find((o) => o.id === selectedOutletId)?.name} • Main Kitchen Store`} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Stock Value (at cost)" value={inr(stockValue)} icon={Package} valueColorClass="text-[#0F5B55]" />
          <KpiCard label="Low Stock Items" value={lowStock.length} icon={AlertTriangle} valueColorClass="text-[#C94B45]" />
          <KpiCard label="Expiring / Expired Batches" value={expiring.length} icon={CalendarClock} valueColorClass="text-[#C68A28]" />
          <KpiCard label="Items Tracked" value={items.length} icon={TrendingDown} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#202522]">Low Stock Items</h3>
              <Link href="/inventory/stock" className="text-[12px] text-[#0F5B55] font-semibold">View all →</Link>
            </div>
            <div className="space-y-2">
              {lowStock.slice(0, 8).map((it) => (
                <div key={it.id} className="flex items-center justify-between p-2.5 bg-[#F3F0E9] rounded-md text-[13px]">
                  <span className="text-[#202522] font-medium">{it.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#66706B]">{it.currentQty} / reorder {it.reorderLevel}</span>
                    <StatusChip label="Low" tone="danger" />
                  </div>
                </div>
              ))}
              {lowStock.length === 0 && <div className="text-[13px] text-[#66706B]">All items above reorder level.</div>}
            </div>
          </div>

          <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#202522]">Expiring / Expired Batches</h3>
              <Link href="/inventory/batch-expiry" className="text-[12px] text-[#0F5B55] font-semibold">View all →</Link>
            </div>
            <div className="space-y-2">
              {expiring.slice(0, 8).map((b) => {
                const item = items.find((i) => i.id === b.itemId);
                return (
                  <div key={b.id} className="flex items-center justify-between p-2.5 bg-[#F3F0E9] rounded-md text-[13px]">
                    <span className="text-[#202522] font-medium">{item?.name ?? b.itemId}</span>
                    <StatusChip label={b.isExpired ? 'Expired' : `${b.daysToExpiry}d left`} tone={b.isExpired ? 'danger' : 'warning'} />
                  </div>
                );
              })}
              {expiring.length === 0 && <div className="text-[13px] text-[#66706B]">No batches nearing expiry.</div>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs p-5">
          <h3 className="text-sm font-semibold text-[#202522] mb-3">Recent Recipe Consumption (POS → Recipe → Stock Ledger)</h3>
          <div className="space-y-2">
            {recentConsumption.length === 0 && <div className="text-[13px] text-[#66706B]">No sales-driven consumption yet — run a POS order through to Bill to see this populate.</div>}
            {recentConsumption.map((c) => (
              <div key={c.id} className="p-2.5 bg-[#F3F0E9] rounded-md text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#202522] font-medium">{c.qtySold}x {c.menuItemName}</span>
                  <span className="text-[11px] text-[#66706B]">{new Date(c.createdAt).toLocaleTimeString()}</span>
                </div>
                <div className="text-[11px] text-[#66706B] mt-0.5">
                  {c.ingredientsConsumed.map((i) => `${i.itemName} -${i.qty}${i.uomCode}`).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}
