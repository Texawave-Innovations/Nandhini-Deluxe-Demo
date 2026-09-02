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
import { useHotelStore } from '@/store/hotel-store';
import { useBanquetStore } from '@/store/banquet-store';
import { aiInsightsService } from '@/services/aiInsightsService';
import { AIInsight, AIInsightCategory } from '@/types/ai';

const AS_OF_DATE = '2026-08-31';

export function useAIInsights() {
  const { ledgerEntries, items, batches } = useInventoryStore();
  const { locations, employees, attendanceRecords } = useHRMSStore();
  const { businessDate } = useOutletStore();
  const { vendors } = useVendorStore();
  const { vendorBills } = useFinanceStore();
  const { customers, invoices } = useSalesStore();
  const { matches } = useReconciliationStore();
  const { bills, orders, menuItems } = usePOSStore();
  const { acknowledgements, acknowledgeInsight } = useAIStore();
  const { rooms, reservations, folios } = useHotelStore();
  const { halls, bookings } = useBanquetStore();

  const insights = useMemo<AIInsight[]>(() => [
    ...aiInsightsService.detectConsumptionAnomalies(ledgerEntries, items, locations, businessDate),
    ...aiInsightsService.suggestReorders(items, ledgerEntries),
    ...aiInsightsService.rankVendorRisk(vendors, vendorBills, AS_OF_DATE),
    ...aiInsightsService.rankCustomerRisk(customers, invoices, AS_OF_DATE),
    ...aiInsightsService.detectSettlementMismatches(matches),
    ...aiInsightsService.forecastNextWeekRevenue(bills, businessDate),
    // Tier 1
    ...aiInsightsService.flagCashierAnomalies(bills, businessDate),
    ...aiInsightsService.suggestCrossSellOpportunity(bills, orders, menuItems),
    ...aiInsightsService.detectVendorBillAnomalies(vendorBills, items),
    ...aiInsightsService.projectCashFlowGap(vendorBills, invoices, AS_OF_DATE),
    ...aiInsightsService.benchmarkOutletPerformance(bills, locations, businessDate),
    ...aiInsightsService.flagAttendancePatterns(attendanceRecords, employees, businessDate),
    ...aiInsightsService.flagTrendingReorderRisk(ledgerEntries, items, businessDate),
    ...aiInsightsService.flagExpiringBatches(batches, items, locations, businessDate),
    ...aiInsightsService.suggestGuestPersonalization(reservations, folios),
    ...aiInsightsService.flagNoShowRisk(reservations, businessDate),
    ...aiInsightsService.suggestRoomRateAdjustment(rooms, reservations, locations, businessDate),
    ...aiInsightsService.flagBanquetDemandGaps(halls, bookings, businessDate),
  ], [
    ledgerEntries, items, locations, businessDate, vendors, vendorBills, customers, invoices, matches, bills,
    orders, menuItems, attendanceRecords, employees, batches, rooms, reservations, folios, halls, bookings,
  ]);

  const ackByKey = useMemo(() => new Map(acknowledgements.map((a) => [a.insightKey, a])), [acknowledgements]);
  const openInsights = useMemo(() => insights.filter((i) => !ackByKey.has(i.key)), [insights, ackByKey]);
  const highSeverityOpen = useMemo(() => openInsights.filter((i) => i.severity === 'HIGH'), [openInsights]);

  // Grouped by ALL insights (not just open ones) — the /ai hub renders acknowledged insights
  // dimmed inline via InsightCard rather than hiding them, so this must match that behavior.
  const byCategory = useMemo(() => {
    const grouped: Record<AIInsightCategory, AIInsight[]> = {
      INVENTORY: [], FINANCE: [], SALES: [], POS: [], HR: [], HOTEL: [], BANQUET: [], EXECUTIVE: [],
    };
    insights.forEach((i) => grouped[i.category].push(i));
    return grouped;
  }, [insights]);

  return { insights, openInsights, highSeverityOpen, byCategory, ackByKey, acknowledgements, acknowledgeInsight };
}
