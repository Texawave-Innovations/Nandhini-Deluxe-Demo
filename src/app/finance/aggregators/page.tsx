'use client';

import React from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import KpiCard from '@/components/ui/KpiCard';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import StatusChip, { ChipTone } from '@/components/ui/StatusChip';
import { Bike, TrendingUp, Percent, Receipt, Landmark, AlertTriangle } from 'lucide-react';
import { usePOSStore } from '@/store/pos-store';
import { useReconciliationStore } from '@/store/reconciliation-store';
import { ledgerService, AggregatorSettlementRow, AggregatorRowStatus } from '@/services/ledgerService';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const PLATFORM_ICON: Record<'SWIGGY' | 'ZOMATO', typeof Bike> = { SWIGGY: Bike, ZOMATO: Bike };
const ROW_STATUS_TONE: Record<AggregatorRowStatus, ChipTone> = {
  MATCHED: 'success', MISMATCH: 'danger', UNMATCHED: 'warning', PENDING_SETTLEMENT: 'neutral',
};
const ROW_STATUS_LABEL: Record<AggregatorRowStatus, string> = {
  MATCHED: 'Matched', MISMATCH: 'Variance', UNMATCHED: 'Awaiting Bank Match', PENDING_SETTLEMENT: 'Pending Settlement',
};

export default function AggregatorLedgersPage() {
  const { channelSettlements } = usePOSStore();
  const { matches } = useReconciliationStore();

  const summaries = ledgerService.buildAggregatorLedgerSummaries(channelSettlements, matches);

  const columns: DataTableColumn<AggregatorSettlementRow>[] = [
    { key: 'date', header: 'Settlement Date', render: (r) => r.settlementDate ?? '—' },
    { key: 'ref', header: 'Order Ref', render: (r) => r.externalOrderRef },
    { key: 'gross', header: 'Gross Sales', render: (r) => inr(r.grossSales) },
    { key: 'commission', header: 'Commission', render: (r) => inr(r.commission) },
    { key: 'tax', header: 'Tax', render: (r) => inr(r.tax) },
    { key: 'expected', header: 'Expected Net Payout', render: (r) => inr(r.expectedNetPayout) },
    { key: 'actual', header: 'Actual Bank Credit', render: (r) => (r.actualBankCredit !== null ? inr(r.actualBankCredit) : '—') },
    {
      key: 'variance', header: 'Variance',
      render: (r) => r.variance !== null
        ? <span className={r.varianceFlag ? 'text-[#C94B45] font-semibold' : 'text-[#66706B]'}>{inr(r.variance)}</span>
        : <span className="text-[#66706B]">—</span>,
    },
    { key: 'status', header: 'Status', render: (r) => <StatusChip label={ROW_STATUS_LABEL[r.status]} tone={ROW_STATUS_TONE[r.status]} /> },
  ];

  return (
    <ShellLayout>
      <div className="space-y-6">
        <SectionHeader
          title="Aggregator Ledgers"
          subtitle="Swiggy & Zomato settlements — gross sales, commission/tax deductions, and expected vs actual bank payout. Actual bank credit is read from the Bank Reconciliation engine, not recomputed here — variance is simply expected minus actual, flagged whenever it exceeds rounding."
        />

        {summaries.map((s) => {
          const Icon = PLATFORM_ICON[s.platform];
          const hasVariance = s.rows.some((r) => r.varianceFlag);
          return (
            <div key={s.platform} className="space-y-2">
              <h3 className="text-[14px] font-semibold text-[#202522] flex items-center gap-1.5">
                <Icon className="w-4 h-4" /> {s.platform === 'SWIGGY' ? 'Swiggy' : 'Zomato'}
                {hasVariance && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#C94B45] bg-[#C94B45]/10 rounded-full px-2 py-0.5 ml-1">
                    <AlertTriangle className="w-3 h-3" /> Variance detected
                  </span>
                )}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <KpiCard label="Gross Sales" value={inr(s.grossSales)} icon={TrendingUp} />
                <KpiCard label="Commission" value={inr(s.commission)} icon={Percent} valueColorClass="text-[#C68A28]" />
                <KpiCard label="Tax" value={inr(s.tax)} icon={Receipt} valueColorClass="text-[#C68A28]" />
                <KpiCard label="Expected Net Payout" value={inr(s.expectedNetPayout)} icon={Landmark} />
                <KpiCard
                  label="Actual Bank Credit"
                  value={inr(s.actualBankCreditReceived)}
                  icon={Landmark}
                  valueColorClass={s.variance !== 0 ? 'text-[#C94B45]' : 'text-[#23865B]'}
                />
              </div>
              <DataTable columns={columns} rows={s.rows} keyField={(r) => r.settlementId} emptyMessage={`No ${s.platform === 'SWIGGY' ? 'Swiggy' : 'Zomato'} settlements yet.`} />
            </div>
          );
        })}
      </div>
    </ShellLayout>
  );
}
