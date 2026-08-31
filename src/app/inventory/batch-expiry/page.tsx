'use client';

import React from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import StatusChip from '@/components/ui/StatusChip';
import { useHRMSStore } from '@/store/hrms-store';
import { useInventoryStore } from '@/store/inventory-store';
import { useOutletStore } from '@/store/outlet-store';
import { outletService } from '@/services/outletService';
import { StockBatch } from '@/types/inventory';

interface Row extends StockBatch { daysToExpiry: number; itemName: string; outletName: string }

export default function BatchExpiryPage() {
  const { locations } = useHRMSStore();
  const { items, batches } = useInventoryStore();
  const { businessDate } = useOutletStore();

  const asOf = new Date(businessDate).getTime();
  const rows: Row[] = batches
    .filter((b) => b.expiryDate)
    .map((b) => ({
      ...b,
      daysToExpiry: Math.ceil((new Date(b.expiryDate!).getTime() - asOf) / 86400000),
      itemName: items.find((i) => i.id === b.itemId)?.name ?? b.itemId,
      outletName: outletService.getOutletById(locations, b.outletId)?.name ?? b.outletId,
    }))
    .sort((a, b) => a.daysToExpiry - b.daysToExpiry);

  const columns: DataTableColumn<Row>[] = [
    { key: 'batch', header: 'Batch No.', render: (r) => <span className="font-medium text-[#202522]">{r.batchNo}</span> },
    { key: 'item', header: 'Item', render: (r) => r.itemName },
    { key: 'outlet', header: 'Outlet', render: (r) => r.outletName },
    { key: 'qty', header: 'Qty', render: (r) => r.qty },
    { key: 'mfg', header: 'Mfg Date', render: (r) => r.mfgDate ?? '—' },
    { key: 'exp', header: 'Expiry Date', render: (r) => r.expiryDate },
    { key: 'vendor', header: 'Vendor / GRN', render: (r) => <span className="text-[#66706B]">{r.vendorName} • {r.grnRef}</span> },
    { key: 'status', header: 'Status', render: (r) => r.daysToExpiry < 0
      ? <StatusChip label="Expired" tone="danger" />
      : r.daysToExpiry <= 3 ? <StatusChip label={`Expiring in ${r.daysToExpiry}d`} tone="warning" /> : <StatusChip label="Fresh" tone="success" /> },
  ];

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader title="Batch & Expiry Tracking" subtitle="Perishable items tracked by batch, manufacturing date and expiry — flagged as Expiring Soon or Expired as of the selected business date." />
        <DataTable columns={columns} rows={rows} keyField={(r) => r.id} emptyMessage="No batches tracked." />
      </div>
    </ShellLayout>
  );
}
