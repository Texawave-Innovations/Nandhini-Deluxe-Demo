'use client';

// Shared "live insights" computation — the exact same deterministic aiInsightsService calls the
// /ai hub page used to inline in its own useMemo. Extracted so the bottom-right AI Assistant
// widget (components/ai/AIAssistantWidget.tsx) can surface the identical open/high-severity
// counts and insight list without duplicating (and risking drift from) the hub's logic.

import { useMemo } from 'react';
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

export function useAIInsights() {
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

  const ackByKey = useMemo(() => new Map(acknowledgements.map((a) => [a.insightKey, a])), [acknowledgements]);
  const openInsights = useMemo(() => insights.filter((i) => !ackByKey.has(i.key)), [insights, ackByKey]);
  const highSeverityOpen = useMemo(() => openInsights.filter((i) => i.severity === 'HIGH'), [openInsights]);

  // Grouped by ALL insights (not just open ones) — the /ai hub renders acknowledged insights
  // dimmed inline via InsightCard rather than hiding them, so this must match that behavior.
  const byCategory = useMemo(() => {
    const grouped: Record<AIInsightCategory, AIInsight[]> = { INVENTORY: [], FINANCE: [], SALES: [] };
    insights.forEach((i) => grouped[i.category].push(i));
    return grouped;
  }, [insights]);

  return { insights, openInsights, highSeverityOpen, byCategory, ackByKey, acknowledgements, acknowledgeInsight };
}
