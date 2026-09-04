'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import KpiCard from '@/components/ui/KpiCard';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import StatusChip, { ChipTone } from '@/components/ui/StatusChip';
import { ArrowLeft, Wallet, ShoppingCart, Receipt, CheckCircle2, BookOpenCheck, AlertTriangle } from 'lucide-react';
import { useSalesStore } from '@/store/sales-store';
import { useHRMSStore } from '@/store/hrms-store';
import { useLedgerStore } from '@/store/ledger-store';
import { salesService } from '@/services/salesService';
import { ledgerService, BillLedgerStatus, LedgerRegisterLine } from '@/services/ledgerService';
import { SalesOrder, SalesOrderStatus, SalesInvoice, SalesInvoiceStatus, CustomerPayment } from '@/types/sales';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const AS_OF_DATE = '2026-08-31';

const SO_TONE: Record<SalesOrderStatus, ChipTone> = {
  DRAFT: 'neutral', CONFIRMED: 'info', FULFILLED: 'warning', INVOICED: 'success', CANCELLED: 'danger',
};
const INVOICE_TONE: Record<SalesInvoiceStatus, ChipTone> = {
  UNPAID: 'warning', PARTIALLY_PAID: 'info', PAID: 'success', CANCELLED: 'neutral',
};
const LEDGER_STATUS_TONE: Record<BillLedgerStatus, ChipTone> = {
  UNPAID: 'info', PARTIALLY_PAID: 'warning', PAID: 'success', OVERDUE: 'danger',
};
const LEDGER_STATUS_LABEL: Record<BillLedgerStatus, string> = {
  UNPAID: 'Unpaid', PARTIALLY_PAID: 'Partially Paid', PAID: 'Paid', OVERDUE: 'Overdue',
};

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { customers, salesOrders, invoices, customerPayments } = useSalesStore();
  const { locations } = useHRMSStore();
  const { ledgerAccounts, vouchers } = useLedgerStore();

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
  const overCreditLimit = customer.creditLimit > 0 && outstanding > customer.creditLimit;

  // Ledger (double-entry) view: reads exclusively from the ledger domain (LedgerAccount +
  // Voucher) — the running-balance table and opening balance never recompute their own totals
  // from invoices/customerPayments directly. Ageing and per-invoice payment status do join back
  // to SalesInvoice for dueDate/amountReceived (vouchers don't carry a due date), but that's a
  // read-only join, not a duplicated total. Mirrors the Vendor Ledger pattern on /vendors/[id].
  const ledgerAccount = ledgerAccounts.find((a) => a.customerId === customer.id);
  const ledgerRegister = ledgerAccount ? ledgerService.buildLedgerRegister(ledgerAccount, vouchers, AS_OF_DATE) : null;
  const ledgerAgeing = ledgerService.computeAgeingBuckets(
    customerInvoices.filter((i) => i.status !== 'CANCELLED').map((i) => ({ outstanding: i.totalAmount - i.amountReceived, dueDate: i.dueDate })),
    AS_OF_DATE,
  );
  const invoiceLedgerStatus = (i: SalesInvoice): BillLedgerStatus =>
    ledgerService.deriveItemPaymentStatus({ totalAmount: i.totalAmount, paidAmount: i.amountReceived, dueDate: i.dueDate }, AS_OF_DATE);

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
    {
      key: 'paymentStatus', header: 'Payment Status',
      render: (i) => i.status === 'CANCELLED'
        ? <span className="text-[#66706B]">—</span>
        : <StatusChip label={LEDGER_STATUS_LABEL[invoiceLedgerStatus(i)]} tone={LEDGER_STATUS_TONE[invoiceLedgerStatus(i)]} />,
    },
  ];
  const paymentAllocationSummary = (p: CustomerPayment) =>
    p.allocations.map((a) => `${invoices.find((i) => i.id === a.invoiceId)?.invoiceNumber ?? a.invoiceId} (${inr(a.amount)})`).join(', ');
  const paymentColumns: DataTableColumn<CustomerPayment>[] = [
    { key: 'pay', header: 'Payment Number', render: (p) => p.paymentNumber },
    { key: 'mode', header: 'Mode', render: (p) => p.mode },
    { key: 'ref', header: 'Reference', render: (p) => p.referenceNo ?? '—' },
    { key: 'amount', header: 'Amount', render: (p) => inr(p.amount) },
    { key: 'date', header: 'Received At', render: (p) => p.receivedAt.substring(0, 10) },
    { key: 'applied', header: 'Applied To Invoices', render: (p) => <span className="text-[12px] text-[#66706B]">{paymentAllocationSummary(p)}</span> },
  ];
  const ledgerColumns: DataTableColumn<LedgerRegisterLine>[] = [
    { key: 'date', header: 'Date', render: (l) => l.voucherDate },
    { key: 'voucher', header: 'Voucher No', render: (l) => l.voucherNumber },
    { key: 'type', header: 'Type', render: (l) => l.voucherType.replace('_', ' ') },
    { key: 'particulars', header: 'Particulars', render: (l) => l.particulars },
    { key: 'debit', header: 'Debit', render: (l) => (l.debit > 0 ? inr(l.debit) : '—') },
    { key: 'credit', header: 'Credit', render: (l) => (l.credit > 0 ? inr(l.credit) : '—') },
    { key: 'balance', header: 'Balance', render: (l) => `${inr(l.balance)} ${l.balanceDrCr === 'DEBIT' ? 'Dr' : 'Cr'}` },
  ];

  return (
    <ShellLayout>
      <div className="space-y-5">
        <button onClick={() => router.push('/sales/customers')} className="flex items-center gap-1.5 text-[13px] text-[#66706B] hover:text-[#202522]"><ArrowLeft className="w-4 h-4" /> Back to Customers</button>

        <SectionHeader title={customer.name} subtitle={`${customer.code} • ${customer.type} • Net ${customer.paymentTermsDays} payment terms • ${customer.contactPerson}, ${customer.phone}`} />

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KpiCard label="Outstanding" value={inr(outstanding)} icon={Wallet} valueColorClass={outstanding > 0 ? 'text-[#C94B45]' : 'text-[#23865B]'} />
          <KpiCard label="Credit Limit" value={inr(customer.creditLimit)} icon={AlertTriangle} valueColorClass={overCreditLimit ? 'text-[#C94B45]' : undefined} />
          <KpiCard label="Overdue (31+ days)" value={inr(aging.d30 + aging.d60 + aging.d90plus)} icon={Receipt} valueColorClass="text-[#C68A28]" />
          <KpiCard label="Total Sales Orders" value={customerSOs.length} icon={ShoppingCart} />
          <KpiCard label="Received (Lifetime)" value={inr(receivedLifetime)} icon={CheckCircle2} valueColorClass="text-[#23865B]" />
        </div>

        {overCreditLimit && (
          <div className="flex items-center gap-2 rounded-lg border border-[#C94B45]/30 bg-[#C94B45]/5 px-4 py-2.5 text-[13px] text-[#C94B45]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Outstanding ({inr(outstanding)}) exceeds this customer&apos;s credit limit ({inr(customer.creditLimit)}) by {inr(outstanding - customer.creditLimit)}.
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-[14px] font-semibold text-[#202522] flex items-center gap-1.5"><BookOpenCheck className="w-4 h-4" /> Customer Ledger</h3>
          {ledgerAccount && ledgerRegister ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <KpiCard
                  label="Opening Balance"
                  value={`${inr(ledgerAccount.openingBalance)} ${ledgerAccount.openingBalanceDrCr === 'DEBIT' ? 'Dr' : 'Cr'}`}
                />
                <KpiCard label="0-15 Days" value={inr(ledgerAgeing.b0to15)} />
                <KpiCard label="15-30 Days" value={inr(ledgerAgeing.b15to30)} valueColorClass="text-[#C68A28]" />
                <KpiCard label="30-60 Days" value={inr(ledgerAgeing.b30to60)} valueColorClass="text-[#C68A28]" />
                <KpiCard label="60+ Days" value={inr(ledgerAgeing.b60plus)} valueColorClass="text-[#C94B45]" />
              </div>
              <DataTable
                columns={ledgerColumns}
                rows={ledgerRegister.lines}
                keyField={(l) => l.voucherId}
                emptyMessage="No ledger transactions yet."
              />
              <div className="text-[12px] text-[#66706B] text-right pr-1">
                Closing balance: <span className="font-semibold text-[#202522]">{inr(ledgerRegister.closingBalance)} {ledgerRegister.closingDrCr === 'DEBIT' ? 'Dr' : 'Cr'}</span>
              </div>
            </>
          ) : (
            <div className="text-[13px] text-[#66706B]">Ledger data is still loading…</div>
          )}
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
