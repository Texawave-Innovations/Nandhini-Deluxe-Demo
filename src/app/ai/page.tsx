'use client';

import React, { useMemo } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import KpiCard from '@/components/ui/KpiCard';
import InsightCard from '@/components/ai/InsightCard';
import { Sparkles, AlertTriangle, CheckCircle2, Package, Wallet, TrendingUp } from 'lucide-react';
import { useInventoryStore } from '@/store/inventory-store';
import { useHRMSStore } from '@/store/hrms-store';
import { useOutletStore } from '@/store/outlet-store';
import { useVendorStore } from '@/store/vendor-store';
import { useFinanceStore } from '@/store/finance-store';
import { useSalesStore } from '@/store/sales-store';
import { useReconciliationStore } from '@/store/reconciliation-store';
import { usePOSStore } from '@/store/pos-store';
import { useAIStore } from '@/store/ai-store';
import { aiInsightsService } from '@/services/aiInsightsService';
import { AIInsight, AIInsightCategory } from '@/types/ai';

const AS_OF_DATE = '2026-08-31';
const CATEGORY_META: Record<AIInsightCategory, { label: string; icon: typeof Package }> = {
  INVENTORY: { label: 'Inventory', icon: Package },
  FINANCE: { label: 'Finance', icon: Wallet },
  SALES: { label: 'Sales', icon: TrendingUp },
};

export default function AIInsightsPage() {
  const { ledgerEntries, items } = useInventoryStore();
  const { locations } = useHRMSStore();
  const { businessDate } = useOutletStore();
  const { vendors } = useVendorStore();
  const { vendorBills } = useFinanceStore();
  const { customers, invoices } = useSalesStore();
  const { matches } = useReconciliationStore();
  const { bills } = usePOSStore();
  const { acknowledgements, acknowledgeInsight } = useAIStore();

  const insights = useMemo<AIInsight[]>(() => [
    ...aiInsightsService.detectConsumptionAnomalies(ledgerEntries, items, locations, businessDate),
    ...aiInsightsService.suggestReorders(items, ledgerEntries),
    ...aiInsightsService.rankVendorRisk(vendors, vendorBills, AS_OF_DATE),
    ...aiInsightsService.rankCustomerRisk(customers, invoices, AS_OF_DATE),
    ...aiInsightsService.detectSettlementMismatches(matches),
    ...aiInsightsService.forecastNextWeekRevenue(bills, businessDate),
  ], [ledgerEntries, items, locations, businessDate, vendors, vendorBills, customers, invoices, matches, bills]);

  const ackByKey = new Map(acknowledgements.map((a) => [a.insightKey, a]));
  const openCount = insights.filter((i) => !ackByKey.has(i.key)).length;
  const highSeverityCount = insights.filter((i) => i.severity === 'HIGH' && !ackByKey.has(i.key)).length;

  const byCategory: Record<AIInsightCategory, AIInsight[]> = { INVENTORY: [], FINANCE: [], SALES: [] };
  insights.forEach((i) => byCategory[i.category].push(i));

  return (
    <ShellLayout>
      <div className="space-y-6">
        <SectionHeader title="AI Insights" subtitle="Deterministic, rule-based insights computed live from Inventory, Finance and Sales data — not a hosted model, same honesty convention as the Tally export." />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Open Insights" value={openCount} icon={Sparkles} />
          <KpiCard label="High Severity" value={highSeverityCount} icon={AlertTriangle} valueColorClass={highSeverityCount > 0 ? 'text-[#C94B45]' : 'text-[#23865B]'} />
          <KpiCard label="Acknowledged" value={acknowledgements.length} icon={CheckCircle2} valueColorClass="text-[#23865B]" />
          <KpiCard label="Total Computed" value={insights.length} icon={Sparkles} />
        </div>

        {(Object.keys(CATEGORY_META) as AIInsightCategory[]).map((cat) => {
          const meta = CATEGORY_META[cat];
          const rows = byCategory[cat];
          return (
            <div key={cat} className="space-y-3">
              <div className="flex items-center gap-2">
                <meta.icon className="w-4 h-4 text-[#0F5B55]" />
                <h3 className="text-[15px] font-semibold text-[#202522]">{meta.label}</h3>
              </div>
              {rows.length === 0 ? (
                <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-4 text-[13px] text-[#66706B]">No {meta.label.toLowerCase()} insights right now.</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {rows.map((insight) => (
                    <InsightCard
                      key={insight.key} insight={insight} acknowledgement={ackByKey.get(insight.key)}
                      onAcknowledge={() => acknowledgeInsight(insight.key, 'Corporate Management')}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ShellLayout>
  );
}
