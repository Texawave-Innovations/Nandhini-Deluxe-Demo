'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import StatusChip, { ChipTone } from '@/components/ui/StatusChip';
import Modal from '@/components/ui/Modal';
import LineItemEditor, { LineItemRow } from '@/components/purchase/LineItemEditor';
import { Plus } from 'lucide-react';
import { usePurchaseStore } from '@/store/purchase-store';
import { useVendorStore } from '@/store/vendor-store';
import { useHRMSStore } from '@/store/hrms-store';
import { useInventoryStore } from '@/store/inventory-store';
import { outletService } from '@/services/outletService';
import { PurchaseOrder, POStatus } from '@/types/purchase';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const STATUS_TONE: Record<POStatus, ChipTone> = {
  DRAFT: 'neutral', SUBMITTED: 'info', APPROVED: 'info', PARTIALLY_RECEIVED: 'warning',
  RECEIVED: 'success', CLOSED: 'success', CANCELLED: 'danger', REJECTED: 'danger',
};
const STATUS_ACTION_LABEL: Partial<Record<POStatus, string>> = { DRAFT: 'Submit', SUBMITTED: 'Approve' };

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const { purchaseOrders, createPO, submitPO, approvePO } = usePurchaseStore();
  const { vendors } = useVendorStore();
  const { locations } = useHRMSStore();
  const { items } = useInventoryStore();
  const outlets = outletService.listOutlets(locations);

  const vendorName = (id: string) => vendors.find((v) => v.id === id)?.name ?? id;
  const outletName = (id: string) => locations.find((l) => l.id === id)?.name ?? id;

  const [showNew, setShowNew] = useState(false);
  const [vendorId, setVendorId] = useState(vendors[0]?.id ?? '');
  const [outletId, setOutletId] = useState(outlets[0]?.id ?? '');
  const [lines, setLines] = useState<LineItemRow[]>([{ itemId: items[0]?.id ?? '', qty: 10, rate: items[0]?.standardCost ?? 0 }]);

  const columns: DataTableColumn<PurchaseOrder>[] = [
    { key: 'po', header: 'PO Number', render: (po) => po.poNumber },
    { key: 'vendor', header: 'Vendor', render: (po) => vendorName(po.vendorId) },
    { key: 'outlet', header: 'Outlet', render: (po) => outletName(po.outletId) },
    { key: 'lines', header: 'Lines', render: (po) => po.lines.length },
    { key: 'amount', header: 'Amount', render: (po) => inr(po.totalAmount) },
    { key: 'status', header: 'Status', render: (po) => <StatusChip label={po.status} tone={STATUS_TONE[po.status]} /> },
    {
      key: 'action', header: 'Action', render: (po) => STATUS_ACTION_LABEL[po.status] ? (
        <button
          onClick={(e) => { e.stopPropagation(); po.status === 'DRAFT' ? submitPO(po.id) : approvePO(po.id, 'Outlet Manager'); }}
          className="px-3 py-1.5 bg-[#0F5B55] hover:bg-[#08463F] text-white text-[12px] font-semibold rounded-lg"
        >
          {STATUS_ACTION_LABEL[po.status]}
        </button>
      ) : po.status === 'SUBMITTED' ? null : (
        <span className="text-[11px] text-[#66706B]">—</span>
      ),
    },
  ];

  const submitNewPO = () => {
    if (!vendorId || !outletId || lines.some((l) => !l.itemId || l.qty <= 0)) return;
    createPO({ vendorId, outletId, lines: lines.map((l) => ({ itemId: l.itemId, orderedQty: l.qty, rate: l.rate ?? 0 })), requestedBy: 'Purchase Manager' });
    setShowNew(false);
    setLines([{ itemId: items[0]?.id ?? '', qty: 10, rate: items[0]?.standardCost ?? 0 }]);
  };

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader
          title="Purchase Orders"
          subtitle="Draft → Submit → Approve. Approved POs become receivable against a Goods Receipt Note."
          actions={<button onClick={() => setShowNew(true)} className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[13px] rounded-[8px] flex items-center gap-2"><Plus className="w-4 h-4" /> New PO</button>}
        />
        <DataTable
          columns={columns} rows={[...purchaseOrders].sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())}
          keyField={(po) => po.id} onRowClick={(po) => router.push(`/purchase/orders/${po.id}`)}
        />
      </div>

      <Modal
        open={showNew} onClose={() => setShowNew(false)} title="New Purchase Order" maxWidthClass="max-w-xl"
        footer={<>
          <button onClick={() => setShowNew(false)} className="px-4 py-2 text-[13px] font-semibold text-[#66706B]">Cancel</button>
          <button onClick={submitNewPO} className="px-4 py-2 bg-[#0F5B55] text-white text-[13px] font-semibold rounded-[8px]">Create as Draft</button>
        </>}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Vendor</label>
              <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]">
                {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Receiving Outlet</label>
              <select value={outletId} onChange={(e) => setOutletId(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]">
                {outlets.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Line Items</label>
            <LineItemEditor lines={lines} itemOptions={items} onChange={setLines} showRate qtyLabel="Ordered Qty" />
          </div>
        </div>
      </Modal>
    </ShellLayout>
  );
}
