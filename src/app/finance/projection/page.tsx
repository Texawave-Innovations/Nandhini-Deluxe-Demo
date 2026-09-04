'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import KpiCard from '@/components/ui/KpiCard';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Scale, Bike } from 'lucide-react';
import { useSalesStore } from '@/store/sales-store';
import { useFinanceStore } from '@/store/finance-store';
import { usePOSStore } from '@/store/pos-store';
import { useReconciliationStore } from '@/store/reconciliation-store';
import { projectionService, CashEvent } from '@/services/projectionService';
import { ledgerService } from '@/services/ledgerService';
import { RECURRING_EXPENSE_TEMPLATES } from '@/mock-data/recurringExpenses.seed';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const AS_OF_DATE = '2026-08-31';
const HORIZON_WEEKS = 8;

const CATEGORY_LABEL: Record<CashEvent['category'], string> = {
  RECEIVABLE: 'Customer Invoice', AGGREGATOR_PAYOUT: 'Aggregator Payout', PAYABLE: 'Vendor Bill', RECURRING_EXPENSE: 'Recurring Expense',
};

export default function FinanceProjectionPage() {
  const { invoices } = useSalesStore();
  const { vendorBills } = useFinanceStore();
  const { channelSettlements } = usePOSStore();
  const { matches } = useReconciliationStore();
  const [granularity, setGranularity] = useState<'WEEK' | 'MONTH'>('WEEK');

  const horizonEndExclusive = new Date(AS_OF_DATE);
  horizonEndExclusive.setDate(horizonEndExclusive.getDate() + HORIZON_WEEKS * 7);
  const horizonEnd = horizonEndExclusive.toISOString().slice(0, 10);

  const aggregatorSummaries = ledgerService.buildAggregatorLedgerSummaries(channelSettlements, matches);
  const aggregatorRows = aggregatorSummaries.flatMap((s) => s.rows);

  const receivables = projectionService.buildReceivablesForecast(invoices);
  const aggregatorPayouts = projectionService.buildAggregatorPayoutForecast(aggregatorRows);
  const payables = projectionService.buildPayablesForecast(vendorBills);
  const recurringExpenses = projectionService.buildRecurringExpenseForecast(RECURRING_EXPENSE_TEMPLATES, AS_OF_DATE, horizonEnd);

  const inflowEvents = [...receivables, ...aggregatorPayouts].filter((e) => e.date >= AS_OF_DATE && e.date < horizonEnd).sort((a, b) => a.date.localeCompare(b.date));
  const outflowEvents = [...payables, ...recurringExpenses].filter((e) => e.date >= AS_OF_DATE && e.date < horizonEnd).sort((a, b) => a.date.localeCompare(b.date));

  const totalInflow = inflowEvents.reduce((s, e) => s + e.amount, 0);
  const totalOutflow = outflowEvents.reduce((s, e) => s + e.amount, 0);
  const netCash = totalInflow - totalOutflow;

  const chartData = projectionService.bucketCashEvents(inflowEvents, outflowEvents, granularity, AS_OF_DATE, horizonEnd);

  const eventColumns: DataTableColumn<CashEvent>[] = [
    { key: 'date', header: 'Expected Date', render: (e) => e.date },
    { key: 'label', header: 'Description', render: (e) => e.label },
    { key: 'category', header: 'Source', render: (e) => CATEGORY_LABEL[e.category] },
    { key: 'amount', header: 'Amount', render: (e) => inr(e.amount) },
  ];

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader
          title="Finance Projection"
          subtitle={`Next ${HORIZON_WEEKS} weeks, derived from Receivables due dates, Aggregator payout schedules, Payables due dates, and recurring expenses. Read-only — nothing here is entered directly or feeds back into the ledger.`}
        />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <KpiCard label="Projected Cash In" value={inr(totalInflow)} icon={TrendingUp} valueColorClass="text-[#23865B]" />
          <KpiCard label="Projected Cash Out" value={inr(totalOutflow)} icon={TrendingDown} valueColorClass="text-[#C94B45]" />
          <KpiCard label="Projected Net Cash" value={inr(Math.abs(netCash))} icon={Scale} valueColorClass={netCash >= 0 ? 'text-[#23865B]' : 'text-[#C94B45]'} />
        </div>

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#202522] flex items-center gap-2"><Bike className="w-4 h-4 text-[#0F5B55]" /> Cash In vs Cash Out</h3>
            <div className="flex items-center gap-1 bg-[#F3F0E9] rounded-lg p-1">
              {(['WEEK', 'MONTH'] as const).map((g) => (
                <button key={g} onClick={() => setGranularity(g)} className={`px-3 py-1 text-[12px] font-semibold rounded-md ${granularity === g ? 'bg-white shadow-sm text-[#202522]' : 'text-[#66706B]'}`}>{g === 'WEEK' ? 'Weekly' : 'Monthly'}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E2DB" />
              <XAxis dataKey="bucketLabel" tick={{ fontSize: 11, fill: '#66706B' }} />
              <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: '#66706B' }} />
              <Tooltip formatter={(v: number) => inr(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="inflow" name="Cash In" fill="#23865B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outflow" name="Cash Out" fill="#C94B45" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="net" name="Net" stroke="#0F5B55" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="text-[14px] font-semibold text-[#202522]">Upcoming Cash Inflows</h3>
            <DataTable columns={eventColumns} rows={inflowEvents} keyField={(e) => `${e.category}-${e.label}-${e.date}`} emptyMessage="No projected inflows in this window." />
          </div>
          <div className="space-y-2">
            <h3 className="text-[14px] font-semibold text-[#202522]">Upcoming Cash Outflows</h3>
            <DataTable columns={eventColumns} rows={outflowEvents} keyField={(e) => `${e.category}-${e.label}-${e.date}`} emptyMessage="No projected outflows in this window." />
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}
