'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import StatusChip from '@/components/ui/StatusChip';
import { useHRMSStore } from '@/store/hrms-store';
import { useInventoryStore } from '@/store/inventory-store';
import { useOutletStore } from '@/store/outlet-store';
import { outletService } from '@/services/outletService';
import { inventoryService } from '@/services/inventoryService';
import { InventoryItem } from '@/types/inventory';

interface StockRow extends InventoryItem { currentQty: number }

export default function CurrentStockPage() {
  const { locations } = useHRMSStore();
  const { items, ledgerEntries, categories, uomLabel } = useInventoryStore();
  const { selectedOutletId } = useOutletStore();
  const outlets = outletService.listOutlets(locations);
  const [outletId, setOutletId] = useState(selectedOutletId !== 'ALL' ? selectedOutletId : outlets[0]?.id ?? 'loc-1');
  const [search, setSearch] = useState('');

  const balances = inventoryService.computeCurrentStock(ledgerEntries, outletId);
  const byItem = new Map(balances.map((b) => [b.itemId, b.qty]));
  const rows: StockRow[] = items
    .map((i) => ({ ...i, currentQty: byItem.get(i.id) ?? 0 }))
    .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  const columns: DataTableColumn<StockRow>[] = [
    { key: 'name', header: 'Item', render: (r) => <div><div className="font-medium text-[#202522]">{r.name}</div><div className="text-[11px] text-[#66706B]">{categories.find((c) => c.id === r.categoryId)?.name}</div></div> },
    { key: 'qty', header: 'Current Stock', render: (r) => <span className="font-semibold">{r.currentQty} {uomLabel(r.uomId)}</span> },
    { key: 'reorder', header: 'Reorder Level', render: (r) => `${r.reorderLevel} ${uomLabel(r.uomId)}` },
    { key: 'status', header: 'Status', render: (r) => r.currentQty <= r.reorderLevel ? <StatusChip label="Low Stock" tone="danger" /> : <StatusChip label="Healthy" tone="success" /> },
    { key: 'value', header: 'Stock Value', render: (r) => `₹${(r.currentQty * r.standardCost).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` },
  ];

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader
          title="Current Stock"
          subtitle="Live balance per item, derived entirely from the Stock Ledger — Main Kitchen Store."
          actions={
            <div className="flex items-center gap-2">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search item..." className="border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px] w-48" />
              <select value={outletId} onChange={(e) => setOutletId(e.target.value)} className="border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px] bg-white">
                {outlets.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          }
        />
        <DataTable columns={columns} rows={rows} keyField={(r) => r.id} />
      </div>
    </ShellLayout>
  );
}
