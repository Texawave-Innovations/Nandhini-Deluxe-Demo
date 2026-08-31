'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import KpiCard from '@/components/ui/KpiCard';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import StatusChip, { ChipTone } from '@/components/ui/StatusChip';
import { ArrowLeft, Wallet, ShoppingBag, Receipt, CheckCircle2 } from 'lucide-react';
import { useVendorStore } from '@/store/vendor-store';
import { usePurchaseStore } from '@/store/purchase-store';
import { useFinanceStore } from '@/store/finance-store';
import { useHRMSStore } from '@/store/hrms-store';
import { vendorService } from '@/services/vendorService';
import { PurchaseOrder, POStatus } from '@/types/purchase';
import { VendorBill, BillStatus, VendorPayment } from '@/types/finance';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const PO_TONE: Record<POStatus, ChipTone> = {
  DRAFT: 'neutral', SUBMITTED: 'info', APPROVED: 'info', PARTIALLY_RECEIVED: 'warning',
  RECEIVED: 'success', CLOSED: 'success', CANCELLED: 'danger', REJECTED: 'danger',
};
const BILL_TONE: Record<BillStatus, ChipTone> = {
  MATCHED: 'success', MISMATCH: 'danger', APPROVED: 'info', PARTIALLY_PAID: 'warning', PAID: 'success', CANCELLED: 'neutral',
};

export default function VendorDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { vendors } = useVendorStore();
  const { purchaseOrders } = usePurchaseStore();
  const { vendorBills, vendorPayments } = useFinanceStore();
  const { locations } = useHRMSStore();

  const vendor = vendors.find((v) => v.id === params.id);
  if (!vendor) {
    return (
      <ShellLayout>
        <div className="text-[13px] text-[#66706B]">Vendor not found. <button onClick={() => router.push('/vendors')} className="text-[#0F5B55] font-semibold">Back to Vendors</button></div>
      </ShellLayout>
    );
  }

  const outletName = (id: string) => locations.find((l) => l.id === id)?.name ?? id;
  const vendorPOs = purchaseOrders.filter((po) => po.vendorId === vendor.id);
  const vendorBillsList = vendorBills.filter((b) => b.vendorId === vendor.id);
  const vendorPaymentsList = vendorPayments.filter((p) => p.vendorId === vendor.id);
  const outstanding = vendorService.computeOutstandingForVendor(vendorBills, vendor.id);
  const aging = vendorService.getVendorAgingBuckets(vendorBills, vendor.id, '2026-08-31');
  const paidYTD = vendorPaymentsList.reduce((s, p) => s + p.amount, 0);

  const poColumns: DataTableColumn<PurchaseOrder>[] = [
    { key: 'po', header: 'PO Number', render: (po) => po.poNumber },
    { key: 'outlet', header: 'Outlet', render: (po) => outletName(po.outletId) },
    { key: 'amount', header: 'Amount', render: (po) => inr(po.totalAmount) },
    { key: 'status', header: 'Status', render: (po) => <StatusChip label={po.status} tone={PO_TONE[po.status]} /> },
  ];
  const billColumns: DataTableColumn<VendorBill>[] = [
    { key: 'bill', header: 'Bill Number', render: (b) => (<div><div>{b.billNumber}</div><div className="text-[11px] text-[#66706B]">{b.vendorInvoiceNumber}</div></div>) },
    { key: 'due', header: 'Due Date', render: (b) => b.dueDate },
    { key: 'amount', header: 'Amount', render: (b) => inr(b.totalAmount) },
    { key: 'paid', header: 'Paid', render: (b) => inr(b.amountPaid) },
    { key: 'status', header: 'Status', render: (b) => <StatusChip label={b.status} tone={BILL_TONE[b.status]} /> },
  ];
  const paymentColumns: DataTableColumn<VendorPayment>[] = [
    { key: 'pay', header: 'Payment Number', render: (p) => p.paymentNumber },
    { key: 'mode', header: 'Mode', render: (p) => p.mode },
    { key: 'ref', header: 'Reference', render: (p) => p.referenceNo ?? '—' },
    { key: 'amount', header: 'Amount', render: (p) => inr(p.amount) },
    { key: 'date', header: 'Paid At', render: (p) => p.paidAt.substring(0, 10) },
  ];

  return (
    <ShellLayout>
      <div className="space-y-5">
        <button onClick={() => router.push('/vendors')} className="flex items-center gap-1.5 text-[13px] text-[#66706B] hover:text-[#202522]"><ArrowLeft className="w-4 h-4" /> Back to Vendors</button>

        <SectionHeader title={vendor.name} subtitle={`${vendor.code} • ${vendor.category.replace('_', ' ')} • Net ${vendor.paymentTermsDays} payment terms • ${vendor.contactPerson}, ${vendor.phone}`} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Outstanding" value={inr(outstanding)} icon={Wallet} valueColorClass={outstanding > 0 ? 'text-[#C94B45]' : 'text-[#23865B]'} />
          <KpiCard label="Overdue (31+ days)" value={inr(aging.d30 + aging.d60 + aging.d90plus)} icon={Receipt} valueColorClass="text-[#C68A28]" />
          <KpiCard label="Total Purchase Orders" value={vendorPOs.length} icon={ShoppingBag} />
          <KpiCard label="Paid (Lifetime)" value={inr(paidYTD)} icon={CheckCircle2} valueColorClass="text-[#23865B]" />
        </div>

        <div className="space-y-2">
          <h3 className="text-[14px] font-semibold text-[#202522]">Purchase Order History</h3>
          <DataTable columns={poColumns} rows={vendorPOs} keyField={(po) => po.id} emptyMessage="No purchase orders for this vendor yet." />
        </div>

        <div className="space-y-2">
          <h3 className="text-[14px] font-semibold text-[#202522]">Vendor Bill History</h3>
          <DataTable columns={billColumns} rows={vendorBillsList} keyField={(b) => b.id} emptyMessage="No vendor bills yet." />
        </div>

        <div className="space-y-2">
          <h3 className="text-[14px] font-semibold text-[#202522]">Payment History</h3>
          <DataTable columns={paymentColumns} rows={vendorPaymentsList} keyField={(p) => p.id} emptyMessage="No payments recorded yet." />
        </div>
      </div>
    </ShellLayout>
  );
}
