// AI Insights domain service: deterministic rule-based heuristics over live store data — the same
// "honest mock" convention as tallyService's cosmetic XML export, applied to "AI". Every function
// is a pure read; AIInsight.description is deliberately human-readable copy (formatted currency
// included) since an insight IS presentation text, unlike the raw-number services elsewhere.

import { Location } from '@/types/erp-core';
import { InventoryItem, StockLedgerEntry } from '@/types/inventory';
import { Vendor } from '@/types/vendor';
import { VendorBill } from '@/types/finance';
import { Customer, SalesInvoice } from '@/types/sales';
import { Bill } from '@/types/pos';
import { ReconciliationMatch } from '@/types/reconciliation';
import { AIInsight, AIInsightSeverity } from '@/types/ai';
import { inventoryService } from '@/services/inventoryService';
import { vendorService } from '@/services/vendorService';
import { salesService } from '@/services/salesService';

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const SEVERITY_RANK: Record<AIInsightSeverity, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
const bySeverityDesc = (a: AIInsight, b: AIInsight) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];

export const aiInsightsService = {
  // Groups CONSUMPTION ledger entries per outlet+item into a trailing "prior" window (days 8-28
  // ago) and a "recent" window (days 1-7 ago); flags a >=25% jump in daily average as an anomaly.
  // Requires at least 5 prior-window days and 3 recent-window days of real data before flagging,
  // so this stays honest rather than reacting to sparse/coincidental data.
  detectConsumptionAnomalies(ledgerEntries: StockLedgerEntry[], items: InventoryItem[], locations: Location[], businessDate: string): AIInsight[] {
    const asOf = new Date(businessDate).getTime();
    const groups = new Map<string, { older: number; recent: number; olderDays: Set<number>; recentDays: Set<number> }>();

    ledgerEntries.filter((e) => e.entryType === 'CONSUMPTION').forEach((e) => {
      const daysAgoN = Math.floor((asOf - new Date(e.createdAt).getTime()) / 86400000);
      if (daysAgoN < 1 || daysAgoN > 28) return;
      const key = `${e.outletId}::${e.itemId}`;
      const g = groups.get(key) ?? { older: 0, recent: 0, olderDays: new Set<number>(), recentDays: new Set<number>() };
      const qty = Math.abs(e.qty);
      if (daysAgoN <= 7) { g.recent += qty; g.recentDays.add(daysAgoN); } else { g.older += qty; g.olderDays.add(daysAgoN); }
      groups.set(key, g);
    });

    const insights: AIInsight[] = [];
    groups.forEach((g, key) => {
      if (g.olderDays.size < 5 || g.recentDays.size < 3) return;
      const olderAvgDaily = g.older / g.olderDays.size;
      const recentAvgDaily = g.recent / g.recentDays.size;
      if (olderAvgDaily <= 0) return;
      const pctChange = ((recentAvgDaily - olderAvgDaily) / olderAvgDaily) * 100;
      if (pctChange < 25) return;

      const [outletId, itemId] = key.split('::');
      const item = items.find((i) => i.id === itemId);
      const outlet = locations.find((l) => l.id === outletId);
      const itemName = item?.name ?? itemId;
      const outletName = outlet?.name ?? outletId;
      insights.push({
        key: `consumption-spike-${key}`,
        category: 'INVENTORY',
        severity: pctChange >= 50 ? 'HIGH' : 'MEDIUM',
        title: `${itemName} consumption trending up at ${outletName}`,
        description: `${itemName} consumption at ${outletName} is trending ${Math.round(pctChange)}% above its 4-week trailing average (${recentAvgDaily.toFixed(1)}/day this week vs ${olderAvgDaily.toFixed(1)}/day prior).`,
        suggestedAction: 'Review recipe portioning and recent order volume for this item at this outlet.',
        computedAt: new Date().toISOString(),
      });
    });
    return insights.sort(bySeverityDesc);
  },

  // Items at or below reorder level (current stock summed org-wide from the ledger, same
  // computeCurrentStock/getLowStockItems the Dashboard already uses) get a reorder suggestion
  // sized to the item's Reorder Qty.
  suggestReorders(items: InventoryItem[], ledgerEntries: StockLedgerEntry[]): AIInsight[] {
    const balances = inventoryService.computeCurrentStock(ledgerEntries);
    const low = inventoryService.getLowStockItems(items, balances);
    return low
      .map((it): AIInsight => ({
        key: `reorder-${it.id}`,
        category: 'INVENTORY',
        severity: it.currentQty <= 0 ? 'HIGH' : it.currentQty < it.reorderLevel * 0.5 ? 'HIGH' : 'MEDIUM',
        title: `Reorder ${it.name}`,
        description: `${it.name} is at ${it.currentQty} against a reorder level of ${it.reorderLevel}.`,
        suggestedAction: `Raise a Purchase Order for ~${it.reorderQty} ${it.name}.`,
        computedAt: new Date().toISOString(),
      }))
      .sort(bySeverityDesc)
      .slice(0, 8);
  },

  // Top vendors by outstanding with any overdue (31+ day) balance — the AI-graduated version of
  // the dashboard's pre-existing "vendor outstanding due within two days" alert line.
  rankVendorRisk(vendors: Vendor[], vendorBills: VendorBill[], businessDate: string): AIInsight[] {
    const ranked = vendorService.rankVendorsByOutstanding(vendors, vendorBills).filter((v) => v.outstanding > 0);
    const insights: AIInsight[] = [];
    ranked.slice(0, 5).forEach((v) => {
      const aging = vendorService.getVendorAgingBuckets(vendorBills, v.id, businessDate);
      const overdue = aging.d30 + aging.d60 + aging.d90plus;
      if (overdue <= 0) return;
      insights.push({
        key: `vendor-risk-${v.id}`,
        category: 'FINANCE',
        severity: aging.d90plus > 0 ? 'HIGH' : aging.d60 > 0 ? 'MEDIUM' : 'LOW',
        title: `${v.name} payment overdue`,
        description: `${v.name} has ${inr(overdue)} overdue out of ${inr(v.outstanding)} total outstanding.`,
        suggestedAction: 'Schedule a vendor payment to avoid supply disruption.',
        computedAt: new Date().toISOString(),
      });
    });
    return insights.sort(bySeverityDesc);
  },

  // The AR mirror of rankVendorRisk — customers whose Sales Order/Invoice credit is overdue.
  rankCustomerRisk(customers: Customer[], invoices: SalesInvoice[], businessDate: string): AIInsight[] {
    const ranked = salesService.rankCustomersByOutstanding(customers, invoices).filter((c) => c.outstanding > 0);
    const insights: AIInsight[] = [];
    ranked.slice(0, 5).forEach((c) => {
      const aging = salesService.getCustomerAgingBuckets(invoices, c.id, businessDate);
      const overdue = aging.d30 + aging.d60 + aging.d90plus;
      if (overdue <= 0) return;
      insights.push({
        key: `customer-risk-${c.id}`,
        category: 'FINANCE',
        severity: aging.d90plus > 0 ? 'HIGH' : aging.d60 > 0 ? 'MEDIUM' : 'LOW',
        title: `${c.name} receivable overdue`,
        description: `${c.name} has ${inr(overdue)} overdue out of ${inr(c.outstanding)} total receivable.`,
        suggestedAction: 'Follow up for collection or consider tightening credit terms on the next Sales Order.',
        computedAt: new Date().toISOString(),
      });
    });
    return insights.sort(bySeverityDesc);
  },

  // The AI-graduated version of the dashboard's pre-existing "3 settlement mismatches" line — now
  // reading live reconciliation-store.matches instead of a hardcoded count.
  detectSettlementMismatches(matches: ReconciliationMatch[]): AIInsight[] {
    const mismatched = matches.filter((m) => m.status === 'MISMATCH');
    const unmatched = matches.filter((m) => m.status === 'UNMATCHED');
    if (mismatched.length + unmatched.length === 0) return [];
    return [{
      key: 'settlement-mismatches',
      category: 'FINANCE',
      severity: mismatched.length > 0 ? 'HIGH' : 'MEDIUM',
      title: 'Bank reconciliation exceptions require review',
      description: `${mismatched.length} mismatched and ${unmatched.length} unmatched bank transaction(s) are pending review across POS, channel settlements, and vendor payments.`,
      suggestedAction: 'Open Reconciliation and manually resolve the flagged transactions.',
      computedAt: new Date().toISOString(),
    }];
  },

  // Simple trailing-7-day moving-average projection — explicitly labeled a heuristic, not a
  // statistical forecast, consistent with this app's honesty-about-mock-data convention.
  forecastNextWeekRevenue(bills: Bill[], businessDate: string): AIInsight[] {
    const asOf = new Date(businessDate).getTime();
    const dailyTotals = new Map<number, number>();
    bills.filter((b) => b.status !== 'VOID').forEach((b) => {
      const daysAgoN = Math.floor((asOf - new Date(b.businessDate).getTime()) / 86400000);
      if (daysAgoN < 0 || daysAgoN > 13) return;
      dailyTotals.set(daysAgoN, (dailyTotals.get(daysAgoN) ?? 0) + b.netAmount);
    });

    let recent = 0, recentDays = 0, prior = 0, priorDays = 0;
    for (let d = 0; d <= 13; d++) {
      const v = dailyTotals.get(d) ?? 0;
      if (d <= 6) { recent += v; recentDays++; } else { prior += v; priorDays++; }
    }
    if (recentDays === 0 || priorDays === 0 || prior <= 0) return [];

    const recentAvg = recent / recentDays;
    const priorAvg = prior / priorDays;
    const pctChange = Math.round(((recentAvg - priorAvg) / priorAvg) * 100);
    const projectedNextWeek = Math.round(recentAvg * 7);

    return [{
      key: 'revenue-forecast',
      category: 'SALES',
      severity: 'LOW',
      title: 'Next-week revenue projection',
      description: `Trailing 7-day average is ${inr(recentAvg)}/day, ${pctChange >= 0 ? 'up' : 'down'} ${Math.abs(pctChange)}% vs the prior week — projected sales in scope next week is ~${inr(projectedNextWeek)}. Simple moving-average heuristic, not a statistical forecast.`,
      computedAt: new Date().toISOString(),
    }];
  },
};
