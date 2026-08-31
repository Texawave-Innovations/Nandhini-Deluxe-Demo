'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import KpiCard from '@/components/ui/KpiCard';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import StatusChip, { ChipTone } from '@/components/ui/StatusChip';
import { ArrowLeft, Wallet, ShoppingCart, Receipt, CheckCircle2 } from 'lucide-react';
import { useSalesStore } from '@/store/sales-store';
import { useHRMSStore } from '@/store/hrms-store';
import { salesService } from '@/services/salesService';
import { SalesOrder, SalesOrderStatus, SalesInvoice, SalesInvoiceStatus, CustomerPayment } from '@/types/sales';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const AS_OF_DATE = '2026-08-31';

const SO_TONE: Record<SalesOrderStatus, ChipTone> = {
  DRAFT: 'neutral', CONFIRMED: 'info', FULFILLED: 'warning', INVOICED: 'success', CANCELLED: 'danger',
};
const INVOICE_TONE: Record<SalesInvoiceStatus, ChipTone> = {
  UNPAID: 'warning', PARTIALLY_PAID: 'info', PAID: 'success', CANCELLED: 'neutral',
};

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { customers, salesOrders, invoices, customerPayments } = useSalesStore();
  const { locations } = useHRMSStore();

  const customer = customers.find((c) => c.id === params.id);
  if (!customer) {
    return (
      <ShellLayout>
        <div className="text-[13px] text-[#66706B]">Customer not found. <button onClick={() => router.push('/sales/customers')} className="text-[#0F5B55] font-semibold">Back to Customers</button></div>
      </ShellLayout>
    );
  }

  const outletName = (id: string) => locations.find((l) => l.id === id)?.name ?? id;
  const customerSOs = salesOrders.filter((so) => so.customerId === customer.id);
  const customerInvoices = invoices.filter((i) => i.customerId === customer.id);
  const customerPaymentsList = customerPayments.filter((p) => p.customerId === customer.id);
  const outstanding = salesService.computeOutstandingForCustomer(invoices, customer.id);
  const aging = salesService.getCustomerAgingBuckets(invoices, customer.id, AS_OF_DATE);
  const receivedLifetime = customerPaymentsList.reduce((s, p) => s + p.amount, 0);

  const soColumns: DataTableColumn<SalesOrder>[] = [
    { key: 'so', header: 'SO Number', render: (so) => so.soNumber },
    { key: 'outlet', header: 'Outlet', render: (so) => outletName(so.outletId) },
    { key: 'amount', header: 'Amount', render: (so) => inr(so.totalAmount) },
    { key: 'status', header: 'Status', render: (so) => <StatusChip label={so.status} tone={SO_TONE[so.status]} /> },
  ];
  const invoiceColumns: DataTableColumn<SalesInvoice>[] = [
    { key: 'inv', header: 'Invoice Number', render: (i) => i.invoiceNumber },
    { key: 'due', header: 'Due Date', render: (i) => i.dueDate },
    { key: 'amount', header: 'Amount', render: (i) => inr(i.totalAmount) },
    { key: 'received', header: 'Received', render: (i) => inr(i.amountReceived) },
    { key: 'status', header: 'Status', render: (i) => <StatusChip label={i.status.replace('_', ' ')} tone={INVOICE_TONE[i.status]} /> },
  ];
  const paymentColumns: DataTableColumn<CustomerPayment>[] = [
    { key: 'pay', header: 'Payment Number', render: (p) => p.paymentNumber },
    { key: 'mode', header: 'Mode', render: (p) => p.mode },
    { key: 'ref', header: 'Reference', render: (p) => p.referenceNo ?? '—' },
    { key: 'amount', header: 'Amount', render: (p) => inr(p.amount) },
    { key: 'date', header: 'Received At', render: (p) => p.receivedAt.substring(0, 10) },
  ];

  return (
    <ShellLayout>
      <div className="space-y-5">
        <button onClick={() => router.push('/sales/customers')} className="flex items-center gap-1.5 text-[13px] text-[#66706B] hover:text-[#202522]"><ArrowLeft className="w-4 h-4" /> Back to Customers</button>

        <SectionHeader title={customer.name} subtitle={`${customer.code} • ${customer.type} • Net ${customer.paymentTermsDays} payment terms • ${customer.contactPerson}, ${customer.phone}`} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Outstanding" value={inr(outstanding)} icon={Wallet} valueColorClass={outstanding > 0 ? 'text-[#C94B45]' : 'text-[#23865B]'} />
          <KpiCard label="Overdue (31+ days)" value={inr(aging.d30 + aging.d60 + aging.d90plus)} icon={Receipt} valueColorClass="text-[#C68A28]" />
          <KpiCard label="Total Sales Orders" value={customerSOs.length} icon={ShoppingCart} />
          <KpiCard label="Received (Lifetime)" value={inr(receivedLifetime)} icon={CheckCircle2} valueColorClass="text-[#23865B]" />
        </div>

        <div className="space-y-2">
          <h3 className="text-[14px] font-semibold text-[#202522]">Sales Order History</h3>
          <DataTable columns={soColumns} rows={customerSOs} keyField={(so) => so.id} emptyMessage="No sales orders for this customer yet." />
        </div>

        <div className="space-y-2">
          <h3 className="text-[14px] font-semibold text-[#202522]">Invoice History</h3>
          <DataTable columns={invoiceColumns} rows={customerInvoices} keyField={(i) => i.id} emptyMessage="No invoices yet." />
        </div>

        <div className="space-y-2">
          <h3 className="text-[14px] font-semibold text-[#202522]">Payment History</h3>
          <DataTable columns={paymentColumns} rows={customerPaymentsList} keyField={(p) => p.id} emptyMessage="No payments recorded yet." />
        </div>
      </div>
    </ShellLayout>
  );
}
