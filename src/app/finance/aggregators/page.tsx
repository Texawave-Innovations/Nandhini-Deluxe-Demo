'use client';

import React, { useState } from 'react';
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
  const [activePlatform, setActivePlatform] = useState<'SWIGGY' | 'ZOMATO'>('SWIGGY');

  const summaries = ledgerService.buildAggregatorLedgerSummaries(channelSettlements, matches);
  const active = summaries.find((s) => s.platform === activePlatform);

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

        <div className="flex items-center gap-1 border-b border-[#E5E2DB]">
          {summaries.map((s) => {
            const Icon = PLATFORM_ICON[s.platform];
            const hasVariance = s.rows.some((r) => r.varianceFlag);
            const isActive = s.platform === activePlatform;
            return (
              <button
                key={s.platform}
                onClick={() => setActivePlatform(s.platform)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold border-b-2 -mb-px transition-colors ${
                  isActive ? 'border-[#0F5B55] text-[#0F5B55]' : 'border-transparent text-[#66706B] hover:text-[#202522]'
                }`}
              >
                <Icon className="w-4 h-4" /> {s.platform === 'SWIGGY' ? 'Swiggy' : 'Zomato'}
                {hasVariance && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#C94B45] bg-[#C94B45]/10 rounded-full px-2 py-0.5">
                    <AlertTriangle className="w-3 h-3" /> Variance
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {active && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <KpiCard label="Gross Sales" value={inr(active.grossSales)} icon={TrendingUp} />
              <KpiCard label="Commission" value={inr(active.commission)} icon={Percent} valueColorClass="text-[#C68A28]" />
              <KpiCard label="Tax" value={inr(active.tax)} icon={Receipt} valueColorClass="text-[#C68A28]" />
              <KpiCard label="Expected Net Payout" value={inr(active.expectedNetPayout)} icon={Landmark} />
              <KpiCard
                label="Actual Bank Credit"
                value={inr(active.actualBankCreditReceived)}
                icon={Landmark}
                valueColorClass={active.variance !== 0 ? 'text-[#C94B45]' : 'text-[#23865B]'}
              />
            </div>
            <DataTable columns={columns} rows={active.rows} keyField={(r) => r.settlementId} emptyMessage={`No ${active.platform === 'SWIGGY' ? 'Swiggy' : 'Zomato'} settlements yet.`} />
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
