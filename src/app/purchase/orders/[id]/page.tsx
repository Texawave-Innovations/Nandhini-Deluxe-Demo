'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import StatusChip, { ChipTone } from '@/components/ui/StatusChip';
import Drawer from '@/components/ui/Drawer';
import LineItemEditor, { LineItemRow } from '@/components/purchase/LineItemEditor';
import { ArrowLeft, PackagePlus } from 'lucide-react';
import { usePurchaseStore } from '@/store/purchase-store';
import { useVendorStore } from '@/store/vendor-store';
import { useHRMSStore } from '@/store/hrms-store';
import { useInventoryStore } from '@/store/inventory-store';
import { GRN, POLineItem, POStatus } from '@/types/purchase';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const PO_TONE: Record<POStatus, ChipTone> = {
  DRAFT: 'neutral', SUBMITTED: 'info', APPROVED: 'info', PARTIALLY_RECEIVED: 'warning',
  RECEIVED: 'success', CLOSED: 'success', CANCELLED: 'danger', REJECTED: 'danger',
};

export default function PurchaseOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { purchaseOrders, grns, postGRN } = usePurchaseStore();
  const { vendors } = useVendorStore();
  const { locations } = useHRMSStore();
  const { items } = useInventoryStore();

  const po = purchaseOrders.find((p) => p.id === params.id);
  const [showReceive, setShowReceive] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [invoiceRefNo, setInvoiceRefNo] = useState('');
  const [receiveLines, setReceiveLines] = useState<LineItemRow[]>([]);

  const itemName = (id: string) => items.find((i) => i.id === id)?.name ?? id;

  if (!po) {
    return <ShellLayout><div className="text-[13px] text-[#66706B]">Purchase Order not found. <button onClick={() => router.push('/purchase/orders')} className="text-[#0F5B55] font-semibold">Back</button></div></ShellLayout>;
  }

  const vendor = vendors.find((v) => v.id === po.vendorId);
  const outlet = locations.find((l) => l.id === po.outletId);
  const linkedGRNs = grns.filter((g) => g.poId === po.id);
  const canReceive = po.status === 'APPROVED' || po.status === 'PARTIALLY_RECEIVED';

  const openReceive = () => {
    setReceiveLines(po.lines.filter((l) => l.receivedQty < l.orderedQty).map((l) => ({ itemId: l.itemId, qty: l.orderedQty - l.receivedQty, referenceQty: l.orderedQty })));
    setInvoiceRefNo('');
    setExpiryDate('');
    setShowReceive(true);
  };

  const submitReceive = () => {
    const lines = receiveLines.filter((l) => l.qty > 0).map((l) => ({
      itemId: l.itemId, receivedQty: l.qty, batchNo: `${po.poNumber}-${l.itemId}`, expiryDate: expiryDate || undefined,
    }));
    if (lines.length === 0) return;
    postGRN({ poId: po.id, lines, receivedBy: 'Outlet Manager', invoiceRefNo: invoiceRefNo || undefined });
    setShowReceive(false);
  };

  const lineColumns: DataTableColumn<POLineItem>[] = [
    { key: 'item', header: 'Item', render: (l) => itemName(l.itemId) },
    { key: 'ordered', header: 'Ordered Qty', render: (l) => l.orderedQty },
    { key: 'received', header: 'Received Qty', render: (l) => l.receivedQty },
    { key: 'rate', header: 'Rate', render: (l) => inr(l.rate) },
    { key: 'total', header: 'Line Total', render: (l) => inr(l.orderedQty * l.rate) },
  ];
  const grnColumns: DataTableColumn<GRN>[] = [
    { key: 'grn', header: 'GRN Number', render: (g) => g.grnNumber },
    { key: 'received', header: 'Received At', render: (g) => g.receivedAt.substring(0, 10) },
    { key: 'amount', header: 'Amount', render: (g) => inr(g.totalAmount) },
    { key: 'invoice', header: 'Vendor Invoice Ref', render: (g) => g.invoiceRefNo ?? '—' },
    { key: 'status', header: 'Status', render: (g) => <StatusChip label={g.status} tone={g.status === 'POSTED' ? 'success' : 'danger'} /> },
  ];

  return (
    <ShellLayout>
      <div className="space-y-5">
        <button onClick={() => router.push('/purchase/orders')} className="flex items-center gap-1.5 text-[13px] text-[#66706B] hover:text-[#202522]"><ArrowLeft className="w-4 h-4" /> Back to Purchase Orders</button>

        <SectionHeader
          title={po.poNumber}
          subtitle={`${vendor?.name ?? po.vendorId} • ${outlet?.name ?? po.outletId}`}
          actions={<>
            <StatusChip label={po.status} tone={PO_TONE[po.status]} />
            {canReceive && <button onClick={openReceive} className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[13px] rounded-[8px] flex items-center gap-2"><PackagePlus className="w-4 h-4" /> Receive Goods</button>}
          </>}
        />

        <div className="space-y-2">
          <h3 className="text-[14px] font-semibold text-[#202522]">Line Items — Total {inr(po.totalAmount)}</h3>
          <DataTable columns={lineColumns} rows={po.lines} keyField={(l) => l.itemId} />
        </div>

        <div className="space-y-2">
          <h3 className="text-[14px] font-semibold text-[#202522]">Goods Receipt Notes Against This PO</h3>
          <DataTable columns={grnColumns} rows={linkedGRNs} keyField={(g) => g.id} emptyMessage="No GRN posted yet." />
        </div>
      </div>

      <Drawer
        open={showReceive} onClose={() => setShowReceive(false)} title="Receive Goods (GRN)" subtitle={`Against ${po.poNumber}`}
        footer={<div className="flex justify-end gap-2">
          <button onClick={() => setShowReceive(false)} className="px-4 py-2 text-[13px] font-semibold text-[#66706B]">Cancel</button>
          <button onClick={submitReceive} className="px-4 py-2 bg-[#0F5B55] text-white text-[13px] font-semibold rounded-[8px]">Post GRN</button>
        </div>}
      >
        <div className="space-y-3">
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Vendor Invoice / Challan Number</label>
            <input value={invoiceRefNo} onChange={(e) => setInvoiceRefNo(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" placeholder="e.g. INV-2026-0451" />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Batch Expiry Date (if perishable)</label>
            <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Received Quantities</label>
            <LineItemEditor lines={receiveLines} itemOptions={items} onChange={setReceiveLines} showReferenceQty qtyLabel="Received Qty" allowAddRemove={false} />
          </div>
        </div>
      </Drawer>
    </ShellLayout>
  );
}
