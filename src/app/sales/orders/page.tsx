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
import { useSalesStore } from '@/store/sales-store';
import { useHRMSStore } from '@/store/hrms-store';
import { outletService } from '@/services/outletService';
import { INITIAL_MENU_ITEMS } from '@/mock-data/menu.seed';
import { SalesOrder, SalesOrderStatus } from '@/types/sales';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const STATUS_TONE: Record<SalesOrderStatus, ChipTone> = {
  DRAFT: 'neutral', CONFIRMED: 'info', FULFILLED: 'warning', INVOICED: 'success', CANCELLED: 'danger',
};
const STATUS_ACTION_LABEL: Partial<Record<SalesOrderStatus, string>> = { DRAFT: 'Confirm', CONFIRMED: 'Fulfill' };

export default function SalesOrdersPage() {
  const router = useRouter();
  const { salesOrders, customers, createSalesOrder, confirmSalesOrder, fulfillSalesOrder } = useSalesStore();
  const { locations } = useHRMSStore();
  const outlets = outletService.listOutlets(locations);

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? id;
  const outletName = (id: string) => locations.find((l) => l.id === id)?.name ?? id;

  const [showNew, setShowNew] = useState(false);
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? '');
  const [outletId, setOutletId] = useState(outlets[0]?.id ?? '');
  const [deliveryDate, setDeliveryDate] = useState('2026-08-31');
  const [lines, setLines] = useState<LineItemRow[]>([{ itemId: INITIAL_MENU_ITEMS[0]?.id ?? '', qty: 20, rate: INITIAL_MENU_ITEMS[0]?.basePrice ?? 0 }]);

  const columns: DataTableColumn<SalesOrder>[] = [
    { key: 'so', header: 'SO Number', render: (so) => so.soNumber },
    { key: 'customer', header: 'Customer', render: (so) => customerName(so.customerId) },
    { key: 'outlet', header: 'Outlet', render: (so) => outletName(so.outletId) },
    { key: 'lines', header: 'Lines', render: (so) => so.lines.length },
    { key: 'amount', header: 'Amount', render: (so) => inr(so.totalAmount) },
    { key: 'status', header: 'Status', render: (so) => <StatusChip label={so.status} tone={STATUS_TONE[so.status]} /> },
    {
      key: 'action', header: 'Action', render: (so) => STATUS_ACTION_LABEL[so.status] ? (
        <button
          onClick={(e) => { e.stopPropagation(); so.status === 'DRAFT' ? confirmSalesOrder(so.id, 'Sales Executive') : fulfillSalesOrder(so.id, 'Outlet Manager'); }}
          className="px-3 py-1.5 bg-[#0F5B55] hover:bg-[#08463F] text-white text-[12px] font-semibold rounded-lg"
        >
          {STATUS_ACTION_LABEL[so.status]}
        </button>
      ) : <span className="text-[11px] text-[#66706B]">—</span>,
    },
  ];

  const submitNewSO = () => {
    if (!customerId || !outletId || lines.some((l) => !l.itemId || l.qty <= 0)) return;
    createSalesOrder({
      customerId, outletId, deliveryDate, requestedBy: 'Sales Executive',
      lines: lines.map((l) => {
        const item = INITIAL_MENU_ITEMS.find((m) => m.id === l.itemId);
        return { menuItemId: l.itemId, name: item?.name ?? l.itemId, qty: l.qty, rate: l.rate ?? item?.basePrice ?? 0, taxPercent: item?.taxPercent ?? 5 };
      }),
    });
    setShowNew(false);
    setLines([{ itemId: INITIAL_MENU_ITEMS[0]?.id ?? '', qty: 20, rate: INITIAL_MENU_ITEMS[0]?.basePrice ?? 0 }]);
  };

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader
          title="Sales Orders"
          subtitle="Draft → Confirm → Fulfill. Fulfillment consumes stock via the Recipe/BOM engine, the same event-driven path POS billing uses."
          actions={<button onClick={() => setShowNew(true)} className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[13px] rounded-[8px] flex items-center gap-2"><Plus className="w-4 h-4" /> New Sales Order</button>}
        />
        <DataTable
          columns={columns} rows={[...salesOrders].sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())}
          keyField={(so) => so.id} onRowClick={(so) => router.push(`/sales/orders/${so.id}`)}
        />
      </div>

      <Modal
        open={showNew} onClose={() => setShowNew(false)} title="New Sales Order" maxWidthClass="max-w-xl"
        footer={<>
          <button onClick={() => setShowNew(false)} className="px-4 py-2 text-[13px] font-semibold text-[#66706B]">Cancel</button>
          <button onClick={submitNewSO} className="px-4 py-2 bg-[#0F5B55] text-white text-[13px] font-semibold rounded-[8px]">Create as Draft</button>
        </>}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Customer</label>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]">
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Fulfilling Outlet</label>
              <select value={outletId} onChange={(e) => setOutletId(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]">
                {outlets.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Delivery Date</label>
            <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Line Items</label>
            <LineItemEditor lines={lines} itemOptions={INITIAL_MENU_ITEMS} onChange={setLines} showRate qtyLabel="Qty" />
          </div>
        </div>
      </Modal>
    </ShellLayout>
  );
}
