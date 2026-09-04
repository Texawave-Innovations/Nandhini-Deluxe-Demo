'use client';

import React from 'react';
import Link from 'next/link';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import KpiCard from '@/components/ui/KpiCard';
import StatusChip from '@/components/ui/StatusChip';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ComposedChart, Line, Legend } from 'recharts';
import { ArrowRight, Wallet, TrendingUp, TrendingDown, Landmark, Bike, GitMerge } from 'lucide-react';
import { useFinanceStore } from '@/store/finance-store';
import { useSalesStore } from '@/store/sales-store';
import { useLedgerStore } from '@/store/ledger-store';
import { useReconciliationStore } from '@/store/reconciliation-store';
import { usePOSStore } from '@/store/pos-store';
import { ledgerService } from '@/services/ledgerService';
import { reconciliationService } from '@/services/reconciliationService';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const drCr = (n: number, side: 'DEBIT' | 'CREDIT') => `${inr(n)} ${side === 'DEBIT' ? 'Dr' : 'Cr'}`;
const BUSINESS_DATE = '2026-08-31';

export default function FinanceDashboardPage() {
  const { vendorBills } = useFinanceStore();
  const { invoices } = useSalesStore();
  const { ledgerAccounts, vouchers } = useLedgerStore();
  const { bankTransactions, matches } = useReconciliationStore();
  const { channelSettlements } = usePOSStore();

  // Every number below reads off the ledger/BRS layer — the same LedgerAccount/Voucher/
  // ReconciliationMatch data the Vendor/Customer/Aggregator Ledger and Bank Statement screens
  // read, never a separately computed dashboard-only total.
  const payablesAgeing = ledgerService.computeAgeingBuckets(
    vendorBills.filter((b) => b.status !== 'CANCELLED').map((b) => ({ outstanding: b.totalAmount - b.amountPaid, dueDate: b.dueDate })),
    BUSINESS_DATE,
  );
  const receivablesAgeing = ledgerService.computeAgeingBuckets(
    invoices.filter((i) => i.status !== 'CANCELLED').map((i) => ({ outstanding: i.totalAmount - i.amountReceived, dueDate: i.dueDate })),
    BUSINESS_DATE,
  );

  const bankAccounts = ledgerAccounts.filter((a) => a.accountType === 'BANK' || a.accountType === 'CASH');
  const unmatchedCount = matches.filter((m) => m.status !== 'MATCHED').length;
  const unreconciledAmount = reconciliationService.computeUnreconciledAmount(matches);

  const aggregatorSummaries = ledgerService.buildAggregatorLedgerSummaries(channelSettlements, matches);
  const cashFlowTrend = ledgerService.buildActualCashFlowTrend(vouchers, 8, BUSINESS_DATE);

  const ageingChartData = (a: typeof payablesAgeing) => [
    { name: '0-15d', value: a.b0to15 }, { name: '15-30d', value: a.b15to30 }, { name: '30-60d', value: a.b30to60 }, { name: '60+d', value: a.b60plus },
  ];

  return (
    <ShellLayout>
      <div className="space-y-6">
        <SectionHeader title="Finance — Unified Dashboard" subtitle="Payables, Receivables, Bank Position, Aggregator Dues and Cash Flow — every figure reads from the same Ledger and Bank Reconciliation data as its detail screen." />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Total Payables" value={inr(payablesAgeing.total)} icon={Wallet} valueColorClass="text-[#C94B45]" sublabel={`Overdue: ${inr(payablesAgeing.total - payablesAgeing.b0to15)}`} />
          <KpiCard label="Total Receivables" value={inr(receivablesAgeing.total)} icon={Wallet} valueColorClass="text-[#23865B]" sublabel={`Overdue: ${inr(receivablesAgeing.total - receivablesAgeing.b0to15)}`} />
          <KpiCard label="Total Unreconciled Amount" value={inr(unreconciledAmount)} icon={GitMerge} valueColorClass={unreconciledAmount > 0 ? 'text-[#C68A28]' : 'text-[#23865B]'} sublabel={`${unmatchedCount} bank line(s)`} />
          <KpiCard label="Net Cash (last 8 weeks, actual)" value={inr(Math.abs(cashFlowTrend.reduce((s, w) => s + w.net, 0)))} icon={cashFlowTrend.reduce((s, w) => s + w.net, 0) >= 0 ? TrendingUp : TrendingDown} valueColorClass={cashFlowTrend.reduce((s, w) => s + w.net, 0) >= 0 ? 'text-[#23865B]' : 'text-[#C94B45]'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
            <h3 className="text-sm font-semibold text-[#202522] mb-3">Payables Ageing</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ageingChartData(payablesAgeing)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E2DB" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#66706B' }} />
                <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: '#66706B' }} />
                <Tooltip formatter={(v: number) => inr(v)} />
                <Bar dataKey="value" fill="#C94B45" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
            <h3 className="text-sm font-semibold text-[#202522] mb-3">Receivables Ageing</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ageingChartData(receivablesAgeing)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E2DB" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#66706B' }} />
                <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: '#66706B' }} />
                <Tooltip formatter={(v: number) => inr(v)} />
                <Bar dataKey="value" fill="#23865B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
            <h3 className="text-sm font-semibold text-[#202522] mb-3 flex items-center gap-2"><Landmark className="w-4 h-4 text-[#0F5B55]" /> Bank Position</h3>
            <div className="space-y-2">
              {bankAccounts.map((a) => {
                const bal = ledgerService.computeRunningBalance(a, vouchers, BUSINESS_DATE);
                return (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-[#F3F0E9] rounded-lg">
                    <div>
                      <div className="text-[13px] font-medium text-[#202522]">{a.name}</div>
                      <div className="text-[12px] text-[#66706B]">{drCr(bal.balance, bal.drCr)}</div>
                    </div>
                    {a.accountType === 'BANK' ? (
                      <StatusChip label={unmatchedCount === 0 ? 'Reconciled' : `${unmatchedCount} unmatched`} tone={unmatchedCount === 0 ? 'success' : 'warning'} />
                    ) : (
                      <StatusChip label="Not bank-reconciled" tone="neutral" />
                    )}
                  </div>
                );
              })}
            </div>
            <Link href="/reconciliation/bank-statement" className="text-[12px] text-[#0F5B55] font-semibold mt-3 inline-block">View bank statement →</Link>
          </div>

          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
            <h3 className="text-sm font-semibold text-[#202522] mb-3 flex items-center gap-2"><Bike className="w-4 h-4 text-[#0F5B55]" /> Aggregator Dues</h3>
            <div className="space-y-2">
              {aggregatorSummaries.map((s) => {
                const hasVariance = s.rows.some((r) => r.varianceFlag);
                return (
                  <div key={s.platform} className="flex items-center justify-between p-3 bg-[#F3F0E9] rounded-lg">
                    <div>
                      <div className="text-[13px] font-medium text-[#202522]">{s.platform === 'SWIGGY' ? 'Swiggy' : 'Zomato'}</div>
                      <div className="text-[12px] text-[#66706B]">Expected {inr(s.expectedNetPayout)} • Received {inr(s.actualBankCreditReceived)}</div>
                    </div>
                    {hasVariance
                      ? <StatusChip label="Variance" tone="danger" />
                      : <StatusChip label="On track" tone="success" />}
                  </div>
                );
              })}
            </div>
            <Link href="/finance/aggregators" className="text-[12px] text-[#0F5B55] font-semibold mt-3 inline-block">View aggregator ledgers →</Link>
          </div>
        </div>

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#202522] flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#0F5B55]" /> Cash In vs Cash Out (last 8 weeks, actual)</h3>
            <Link href="/finance/projection" className="text-[12px] text-[#0F5B55] font-semibold flex items-center gap-1">Forward-looking projection <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={cashFlowTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E2DB" />
              <XAxis dataKey="weekLabel" tick={{ fontSize: 11, fill: '#66706B' }} />
              <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: '#66706B' }} />
              <Tooltip formatter={(v: number) => inr(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="cashIn" name="Cash In" fill="#23865B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cashOut" name="Cash Out" fill="#C94B45" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="net" name="Net" stroke="#0F5B55" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Link href="/finance/bills" className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs hover:border-[#0F5B55] transition-all flex items-center justify-between">
            <div><div className="text-[14px] font-semibold text-[#202522]">Vendor Bills</div><div className="text-[12px] text-[#66706B] mt-0.5">Bill-from-GRN creation, 3-way match viewer, and approval.</div></div>
            <ArrowRight className="w-4 h-4 text-[#66706B]" />
          </Link>
          <Link href="/finance/payments" className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs hover:border-[#0F5B55] transition-all flex items-center justify-between">
            <div><div className="text-[14px] font-semibold text-[#202522]">Vendor Payments</div><div className="text-[12px] text-[#66706B] mt-0.5">Record a payment and allocate it across a vendor's outstanding bills.</div></div>
            <ArrowRight className="w-4 h-4 text-[#66706B]" />
          </Link>
          <Link href="/finance/aggregators" className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs hover:border-[#0F5B55] transition-all flex items-center justify-between">
            <div><div className="text-[14px] font-semibold text-[#202522]">Aggregator Ledgers</div><div className="text-[12px] text-[#66706B] mt-0.5">Swiggy/Zomato gross sales, commission, and expected vs actual bank payout.</div></div>
            <ArrowRight className="w-4 h-4 text-[#66706B]" />
          </Link>
          <Link href="/finance/projection" className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs hover:border-[#0F5B55] transition-all flex items-center justify-between">
            <div><div className="text-[14px] font-semibold text-[#202522]">Finance Projection</div><div className="text-[12px] text-[#66706B] mt-0.5">Derived cash-in/cash-out forecast — read-only, no direct entry.</div></div>
            <ArrowRight className="w-4 h-4 text-[#66706B]" />
          </Link>
        </div>
      </div>
    </ShellLayout>
  );
}
