'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import StatusChip from '@/components/ui/StatusChip';
import Modal from '@/components/ui/Modal';
import LineItemEditor, { LineItemRow } from '@/components/purchase/LineItemEditor';
import { Plus } from 'lucide-react';
import { usePurchaseStore } from '@/store/purchase-store';
import { useVendorStore } from '@/store/vendor-store';
import { useHRMSStore } from '@/store/hrms-store';
import { useInventoryStore } from '@/store/inventory-store';
import { GRN } from '@/types/purchase';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function GRNListPage() {
  const { purchaseOrders, grns, postGRN } = usePurchaseStore();
  const { vendors } = useVendorStore();
  const { locations } = useHRMSStore();
  const { items } = useInventoryStore();

  const receivablePOs = purchaseOrders.filter((po) => po.status === 'APPROVED' || po.status === 'PARTIALLY_RECEIVED');
  const [showNew, setShowNew] = useState(false);
  const [poId, setPoId] = useState(receivablePOs[0]?.id ?? '');
  const [invoiceRefNo, setInvoiceRefNo] = useState('');
  const [lines, setLines] = useState<LineItemRow[]>([]);

  const vendorName = (id: string) => vendors.find((v) => v.id === id)?.name ?? id;
  const outletName = (id: string) => locations.find((l) => l.id === id)?.name ?? id;

  const selectPO = (id: string) => {
    setPoId(id);
    const po = purchaseOrders.find((p) => p.id === id);
    setLines(po ? po.lines.filter((l) => l.receivedQty < l.orderedQty).map((l) => ({ itemId: l.itemId, qty: l.orderedQty - l.receivedQty, referenceQty: l.orderedQty })) : []);
  };

  const openNew = () => {
    setInvoiceRefNo('');
    if (receivablePOs[0]) selectPO(receivablePOs[0].id);
    setShowNew(true);
  };

  const submitGRN = () => {
    const validLines = lines.filter((l) => l.qty > 0).map((l) => ({ itemId: l.itemId, receivedQty: l.qty, batchNo: `${poId}-${l.itemId}` }));
    if (!poId || validLines.length === 0) return;
    postGRN({ poId, lines: validLines, receivedBy: 'Outlet Manager', invoiceRefNo: invoiceRefNo || undefined });
    setShowNew(false);
  };

  const columns: DataTableColumn<GRN>[] = [
    { key: 'grn', header: 'GRN Number', render: (g) => g.grnNumber },
    { key: 'po', header: 'PO Number', render: (g) => purchaseOrders.find((p) => p.id === g.poId)?.poNumber ?? g.poId },
    { key: 'vendor', header: 'Vendor', render: (g) => vendorName(g.vendorId) },
    { key: 'outlet', header: 'Outlet', render: (g) => outletName(g.outletId) },
    { key: 'received', header: 'Received At', render: (g) => g.receivedAt.substring(0, 10) },
    { key: 'amount', header: 'Amount', render: (g) => inr(g.totalAmount) },
    { key: 'status', header: 'Status', render: (g) => <StatusChip label={g.status} tone={g.status === 'POSTED' ? 'success' : 'danger'} /> },
  ];

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader
          title="Goods Receipt (GRN)"
          subtitle="Posting a GRN raises PURCHASE stock-ledger entries directly against the receiving outlet's Inventory."
          actions={<button onClick={openNew} disabled={receivablePOs.length === 0} className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] disabled:opacity-40 text-white font-semibold text-[13px] rounded-[8px] flex items-center gap-2"><Plus className="w-4 h-4" /> New GRN</button>}
        />
        <DataTable columns={columns} rows={[...grns].sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())} keyField={(g) => g.id} />
      </div>

      <Modal
        open={showNew} onClose={() => setShowNew(false)} title="New Goods Receipt" maxWidthClass="max-w-xl"
        footer={<>
          <button onClick={() => setShowNew(false)} className="px-4 py-2 text-[13px] font-semibold text-[#66706B]">Cancel</button>
          <button onClick={submitGRN} className="px-4 py-2 bg-[#0F5B55] text-white text-[13px] font-semibold rounded-[8px]">Post GRN</button>
        </>}
      >
        <div className="space-y-3">
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Against Purchase Order</label>
            <select value={poId} onChange={(e) => selectPO(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]">
              {receivablePOs.map((po) => <option key={po.id} value={po.id}>{po.poNumber} — {vendorName(po.vendorId)} ({outletName(po.outletId)})</option>)}
            </select>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Vendor Invoice / Challan Number</label>
            <input value={invoiceRefNo} onChange={(e) => setInvoiceRefNo(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" placeholder="e.g. INV-2026-0451" />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Received Quantities</label>
            {lines.length === 0 ? (
              <div className="text-[13px] text-[#66706B]">All lines on this PO are already fully received.</div>
            ) : (
              <LineItemEditor lines={lines} itemOptions={items} onChange={setLines} showReferenceQty qtyLabel="Received Qty" allowAddRemove={false} />
            )}
          </div>
        </div>
      </Modal>
    </ShellLayout>
  );
}
