'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import StatusChip, { ChipTone } from '@/components/ui/StatusChip';
import { useHRMSStore } from '@/store/hrms-store';
import { useInventoryStore } from '@/store/inventory-store';
import { outletService } from '@/services/outletService';
import { StockLedgerEntry, StockLedgerEntryType } from '@/types/inventory';

const TYPE_TONE: Record<StockLedgerEntryType, ChipTone> = {
  OPENING: 'neutral', PURCHASE: 'success', TRANSFER_IN: 'info', TRANSFER_OUT: 'warning',
  CONSUMPTION: 'brand', WASTAGE: 'danger', ADJUSTMENT: 'info', RETURN: 'neutral',
};

export default function StockLedgerPage() {
  const { locations } = useHRMSStore();
  const { items, ledgerEntries, uomLabel } = useInventoryStore();
  const outlets = outletService.listOutlets(locations);
  const [outletId, setOutletId] = useState(outlets[0]?.id ?? 'loc-1');
  const [typeFilter, setTypeFilter] = useState<'ALL' | StockLedgerEntryType>('ALL');

  const rows = ledgerEntries
    .filter((e) => e.outletId === outletId && (typeFilter === 'ALL' || e.entryType === typeFilter))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 300);

  const columns: DataTableColumn<StockLedgerEntry>[] = [
    { key: 'date', header: 'Date/Time', render: (e) => <span className="text-[#66706B] text-[12px]">{new Date(e.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span> },
    { key: 'item', header: 'Item', render: (e) => items.find((i) => i.id === e.itemId)?.name ?? e.itemId },
    { key: 'type', header: 'Movement', render: (e) => <StatusChip label={e.entryType} tone={TYPE_TONE[e.entryType]} /> },
    { key: 'qty', header: 'Qty', render: (e) => <span className={e.qty >= 0 ? 'text-[#23865B] font-semibold' : 'text-[#C94B45] font-semibold'}>{e.qty >= 0 ? '+' : ''}{e.qty} {uomLabel(items.find((i) => i.id === e.itemId)?.uomId ?? '')}</span> },
    { key: 'balance', header: 'Balance After', render: (e) => e.balanceAfter },
    { key: 'remarks', header: 'Remarks', render: (e) => <span className="text-[#66706B]">{e.remarks ?? '—'}</span> },
    { key: 'by', header: 'By', render: (e) => e.createdBy },
  ];

  const types: (StockLedgerEntryType)[] = ['OPENING', 'PURCHASE', 'TRANSFER_IN', 'TRANSFER_OUT', 'CONSUMPTION', 'WASTAGE', 'ADJUSTMENT', 'RETURN'];

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader
          title="Stock Ledger"
          subtitle="Every movement is an append-only ledger entry — opening, purchase, transfer, recipe consumption, wastage, and manual adjustment."
          actions={
            <div className="flex items-center gap-2">
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px] bg-white">
                <option value="ALL">All Movements</option>
                {types.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={outletId} onChange={(e) => setOutletId(e.target.value)} className="border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px] bg-white">
                {outlets.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          }
        />
        <DataTable columns={columns} rows={rows} keyField={(e) => e.id} emptyMessage="No ledger entries for this outlet yet." />
      </div>
    </ShellLayout>
  );
}
