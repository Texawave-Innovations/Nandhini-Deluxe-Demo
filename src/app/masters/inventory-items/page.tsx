'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import StatusChip from '@/components/ui/StatusChip';
import { useInventoryStore } from '@/store/inventory-store';
import { InventoryItem } from '@/types/inventory';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function InventoryItemMasterPage() {
  const { items, categories, uoms, uomLabel } = useInventoryStore();
  const [activeCat, setActiveCat] = useState('ALL');

  const filtered = items.filter((i) => activeCat === 'ALL' || i.categoryId === activeCat);

  const columns: DataTableColumn<InventoryItem>[] = [
    { key: 'name', header: 'Item', render: (i) => (
      <div><div className="font-medium text-[#202522]">{i.name}</div><div className="text-[11px] text-[#66706B]">{i.code}</div></div>
    ) },
    { key: 'category', header: 'Category', render: (i) => categories.find((c) => c.id === i.categoryId)?.name ?? '—' },
    { key: 'uom', header: 'UOM', render: (i) => uomLabel(i.uomId) },
    { key: 'cost', header: 'Standard Cost', render: (i) => `${inr(i.standardCost)} / ${uomLabel(i.uomId)}` },
    { key: 'reorder', header: 'Reorder Level / Qty', render: (i) => `${i.reorderLevel} / ${i.reorderQty}` },
    { key: 'perishable', header: 'Perishable', render: (i) => i.isPerishable ? <StatusChip label="Perishable" tone="warning" /> : <StatusChip label="Non-Perishable" tone="neutral" /> },
    { key: 'status', header: 'Status', render: (i) => <StatusChip label={i.status} tone={i.status === 'ACTIVE' ? 'success' : 'neutral'} /> },
  ];

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader title="Inventory Items & UOM" subtitle={`${items.length} items across ${categories.length} categories • ${uoms.length} units of measure.`} />
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          <button onClick={() => setActiveCat('ALL')} className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap ${activeCat === 'ALL' ? 'bg-[#0F5B55] text-white' : 'bg-white border border-[#E5E2DB] text-[#202522]'}`}>All</button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setActiveCat(c.id)} className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap ${activeCat === c.id ? 'bg-[#0F5B55] text-white' : 'bg-white border border-[#E5E2DB] text-[#202522]'}`}>{c.name}</button>
          ))}
        </div>
        <DataTable columns={columns} rows={filtered} keyField={(i) => i.id} />
      </div>
    </ShellLayout>
  );
}
