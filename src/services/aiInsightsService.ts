// AI Insights domain service: deterministic rule-based heuristics over live store data — the same
// "honest mock" convention as tallyService's cosmetic XML export, applied to "AI". Every function
// is a pure read; AIInsight.description is deliberately human-readable copy (formatted currency
// included) since an insight IS presentation text, unlike the raw-number services elsewhere.

import { Location } from '@/types/erp-core';
import { InventoryItem, StockBatch, StockLedgerEntry } from '@/types/inventory';
import { Vendor } from '@/types/vendor';
import { VendorBill } from '@/types/finance';
import { Customer, SalesInvoice } from '@/types/sales';
import { Bill, POSOrder } from '@/types/pos';
import { MenuItem } from '@/types/menu';
import { ReconciliationMatch } from '@/types/reconciliation';
import { Employee } from '@/types/employee';
import { AttendanceRecord } from '@/types/attendance-leave';
import { Room, Reservation, Folio } from '@/types/hotel';
import { BanquetHall, BanquetBooking } from '@/types/banquet-mgmt';
import { AIInsight, AIInsightSeverity } from '@/types/ai';
import { inventoryService } from '@/services/inventoryService';
import { vendorService } from '@/services/vendorService';
import { salesService } from '@/services/salesService';
import { financeService } from '@/services/financeService';
import { reportsService } from '@/services/reportsService';

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

  // --- Tier 1 additions below: same deterministic-heuristic convention, five more operating
  // areas (POS, HR, Hotel, Banquet, cross-outlet Executive) layered onto the original three.

  // Per outlet+cashier (Bill.createdBy), trailing 14 days: discounts+complimentary as a % of
  // gross vs that outlet's own average — flags a cashier running well above their peers, not an
  // absolute threshold, so this stays fair across outlets with genuinely different discount mixes.
  flagCashierAnomalies(bills: Bill[], businessDate: string): AIInsight[] {
    const asOf = new Date(businessDate).getTime();
    const inWindow = bills.filter((b) => {
      const daysAgoN = Math.floor((asOf - new Date(b.businessDate).getTime()) / 86400000);
      return daysAgoN >= 0 && daysAgoN <= 13 && b.status !== 'VOID';
    });

    const outletTotals = new Map<string, { gross: number; concession: number }>();
    const cashierTotals = new Map<string, { outletId: string; cashier: string; gross: number; concession: number; count: number }>();

    inWindow.forEach((b) => {
      const concession = b.discountAmount + b.complimentaryAmount;
      const ot = outletTotals.get(b.outletId) ?? { gross: 0, concession: 0 };
      ot.gross += b.grossAmount; ot.concession += concession;
      outletTotals.set(b.outletId, ot);

      const key = `${b.outletId}::${b.createdBy}`;
      const ct = cashierTotals.get(key) ?? { outletId: b.outletId, cashier: b.createdBy, gross: 0, concession: 0, count: 0 };
      ct.gross += b.grossAmount; ct.concession += concession; ct.count += 1;
      cashierTotals.set(key, ct);
    });

    const insights: AIInsight[] = [];
    cashierTotals.forEach((ct, key) => {
      if (ct.count < 5 || ct.gross <= 0) return;
      const ot = outletTotals.get(ct.outletId);
      if (!ot || ot.gross <= 0) return;
      const cashierRate = (ct.concession / ct.gross) * 100;
      const outletRate = (ot.concession / ot.gross) * 100;
      if (outletRate <= 0 || cashierRate < outletRate * 1.75 || cashierRate - outletRate < 5) return;

      insights.push({
        key: `cashier-concession-${key}`,
        category: 'POS',
        severity: cashierRate >= outletRate * 2.5 ? 'HIGH' : 'MEDIUM',
        title: `${ct.cashier} running high discounts/comps`,
        description: `${ct.cashier} has waived ${cashierRate.toFixed(1)}% of billed value via discounts and complimentary bills over the last 14 days, vs ${outletRate.toFixed(1)}% outlet average across ${ct.count} bills.`,
        suggestedAction: 'Review recent discount and complimentary approvals for this cashier.',
        computedAt: new Date().toISOString(),
      });
    });
    return insights.sort(bySeverityDesc).slice(0, 5);
  },

  // Simple market-basket lift: finds the single most-ordered item org-wide, then the popular item
  // least likely to appear alongside it — a concrete bundle/combo suggestion, not a generic tip.
  suggestCrossSellOpportunity(bills: Bill[], orders: POSOrder[], menuItems: MenuItem[]): AIInsight[] {
    const validOrderIds = new Set(bills.filter((b) => b.status !== 'VOID').map((b) => b.orderId));
    const scopedOrders = orders.filter((o) => validOrderIds.has(o.id));
    if (scopedOrders.length < 20) return [];

    const itemName = new Map(menuItems.map((m) => [m.id, m.name]));
    const itemOrderCount = new Map<string, number>();
    scopedOrders.forEach((o) => {
      Array.from(new Set(o.items.map((it) => it.menuItemId))).forEach((id) => {
        itemOrderCount.set(id, (itemOrderCount.get(id) ?? 0) + 1);
      });
    });

    const topItems = Array.from(itemOrderCount.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([id]) => id);
    if (topItems.length < 2) return [];
    const anchorId = topItems[0];
    const anchorCount = itemOrderCount.get(anchorId) ?? 0;
    if (anchorCount < 15) return [];

    const pairCount = new Map<string, number>();
    scopedOrders.forEach((o) => {
      const ids = new Set(o.items.map((it) => it.menuItemId));
      if (!ids.has(anchorId)) return;
      topItems.forEach((id) => { if (id !== anchorId && ids.has(id)) pairCount.set(id, (pairCount.get(id) ?? 0) + 1); });
    });

    let bestId = '';
    let bestAttachRate = 1;
    topItems.forEach((id) => {
      if (id === anchorId) return;
      const attachRate = (pairCount.get(id) ?? 0) / anchorCount;
      if (attachRate < bestAttachRate) { bestAttachRate = attachRate; bestId = id; }
    });
    if (!bestId || bestAttachRate > 0.3) return [];

    const anchorName = itemName.get(anchorId) ?? anchorId;
    const bestName = itemName.get(bestId) ?? bestId;
    return [{
      key: `cross-sell-${anchorId}-${bestId}`,
      category: 'POS',
      severity: 'LOW',
      title: `Bundle opportunity: ${anchorName} + ${bestName}`,
      description: `${Math.round((1 - bestAttachRate) * 100)}% of orders with ${anchorName} skip ${bestName} — both sell well on their own, suggesting a combo or billing-time prompt could lift average ticket.`,
      suggestedAction: `Train cashiers to suggest ${bestName} when billing a ${anchorName} order, or bundle them as a combo.`,
      computedAt: new Date().toISOString(),
    }];
  },

  // Two independent checks over Vendor Bills: (a) the same invoice number billed twice for the
  // same vendor, (b) a vendor+item rate that has drifted upward across recent bills without a
  // renegotiated PO — both catch problems a manual glance at a bill list would miss.
  detectVendorBillAnomalies(vendorBills: VendorBill[], items: InventoryItem[]): AIInsight[] {
    const itemName = new Map(items.map((i) => [i.id, i.name]));
    const insights: AIInsight[] = [];

    const byVendorInvoice = new Map<string, VendorBill[]>();
    vendorBills.forEach((b) => {
      if (!b.vendorInvoiceNumber) return;
      const key = `${b.vendorId}::${b.vendorInvoiceNumber}`;
      byVendorInvoice.set(key, [...(byVendorInvoice.get(key) ?? []), b]);
    });
    byVendorInvoice.forEach((group, key) => {
      if (group.length < 2) return;
      const invoiceNo = key.split('::')[1];
      insights.push({
        key: `dup-invoice-${key}`,
        category: 'FINANCE',
        severity: 'HIGH',
        title: `Duplicate vendor invoice number ${invoiceNo}`,
        description: `Invoice ${invoiceNo} appears on ${group.length} separate bills (${group.map((b) => b.billNumber).join(', ')}) for the same vendor — check for a duplicate entry before payment.`,
        suggestedAction: 'Verify with the vendor and cancel the duplicate bill if confirmed.',
        computedAt: new Date().toISOString(),
      });
    });

    const byVendorItem = new Map<string, { date: string; rate: number }[]>();
    vendorBills.forEach((b) => {
      b.lines.forEach((l) => {
        const key = `${b.vendorId}::${l.itemId}`;
        byVendorItem.set(key, [...(byVendorItem.get(key) ?? []), { date: b.invoiceDate, rate: l.rate }]);
      });
    });
    byVendorItem.forEach((entries, key) => {
      if (entries.length < 3) return;
      const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
      const earliest = sorted[0].rate;
      const latest = sorted[sorted.length - 1].rate;
      if (earliest <= 0) return;
      const pctChange = ((latest - earliest) / earliest) * 100;
      if (pctChange < 8) return;
      const itemId = key.split('::')[1];
      insights.push({
        key: `rate-creep-${key}`,
        category: 'FINANCE',
        severity: pctChange >= 20 ? 'HIGH' : 'MEDIUM',
        title: `${itemName.get(itemId) ?? itemId} rate drifting upward with this vendor`,
        description: `Rate for ${itemName.get(itemId) ?? itemId} has risen ${Math.round(pctChange)}% across ${sorted.length} bills (${sorted[0].rate.toFixed(2)} → ${latest.toFixed(2)}) without a renegotiated PO.`,
        suggestedAction: 'Confirm the new rate with the vendor or renegotiate before the next PO.',
        computedAt: new Date().toISOString(),
      });
    });

    return insights.sort(bySeverityDesc).slice(0, 6);
  },

  // Nets near-term AP against near-term AR using the existing aging-bucket helpers (current + the
  // first overdue bucket on each side) instead of a bespoke forecast — an honest proxy for
  // "payables pressure building faster than collections," not a claimed statistical forecast.
  projectCashFlowGap(vendorBills: VendorBill[], invoices: SalesInvoice[], businessDate: string): AIInsight[] {
    const ap = financeService.computeAPAging(vendorBills, businessDate);
    const ar = salesService.computeARAging(invoices, businessDate);
    if (ap.total <= 0 && ar.total <= 0) return [];

    const apDueSoon = ap.current + ap.d30;
    const arDueSoon = ar.current + ar.d30;
    const gap = apDueSoon - arDueSoon;
    if (gap < 50000) return [];

    return [{
      key: 'cash-flow-gap',
      category: 'FINANCE',
      severity: gap >= 200000 ? 'HIGH' : 'MEDIUM',
      title: 'Near-term payables outpacing receivables',
      description: `Vendor bills due soon (${inr(apDueSoon)}) outweigh customer collections expected in the same window (${inr(arDueSoon)}) by ${inr(gap)} — total AP outstanding is ${inr(ap.total)} against total AR of ${inr(ar.total)}.`,
      suggestedAction: 'Prioritize collections on the largest overdue accounts, or stagger vendor payments this week.',
      computedAt: new Date().toISOString(),
    }];
  },

  // Reuses reportsService.computeOutletComparison (the same function Reports & Analytics already
  // renders) rather than recomputing outlet revenue — flags an outlet trailing its own peer
  // median, a distinct signal from any single-outlet trend check.
  benchmarkOutletPerformance(bills: Bill[], outlets: Location[], businessDate: string): AIInsight[] {
    const posOutlets = outlets.filter((o) => o.isOutlet);
    if (posOutlets.length < 4) return [];
    const from = new Date(businessDate);
    from.setDate(from.getDate() - 6);
    const fromDate = from.toISOString().substring(0, 10);
    const rows = reportsService.computeOutletComparison(bills, posOutlets, fromDate, businessDate).filter((r) => r.value > 0);
    if (rows.length < 4) return [];

    const sortedValues = [...rows.map((r) => r.value)].sort((a, b) => a - b);
    const median = sortedValues[Math.floor(sortedValues.length / 2)];
    if (median <= 0) return [];

    return rows
      .filter((r) => r.value < median * 0.6)
      .map((r): AIInsight => ({
        key: `outlet-underperform-${r.outletId}`,
        category: 'EXECUTIVE',
        severity: r.value < median * 0.4 ? 'HIGH' : 'MEDIUM',
        title: `${r.name} trailing its peer outlets`,
        description: `${r.name}'s trailing 7-day revenue (${inr(r.value)}) is ${Math.round((1 - r.value / median) * 100)}% below the ${rows.length}-outlet median (${inr(median)}).`,
        suggestedAction: 'Compare footfall, staffing, and local promotions against better-performing peer outlets.',
        computedAt: new Date().toISOString(),
      }))
      .sort(bySeverityDesc)
      .slice(0, 3);
  },

  // Trailing 30-day LATE/ABSENT counts per employee — deliberately neutral phrasing ("worth a
  // conversation," not "at risk") since this surfaces to managers, not as a punitive score.
  flagAttendancePatterns(attendanceRecords: AttendanceRecord[], employees: Employee[], businessDate: string): AIInsight[] {
    const asOf = new Date(businessDate).getTime();
    const inWindow = attendanceRecords.filter((r) => {
      const daysAgoN = Math.floor((asOf - new Date(r.date).getTime()) / 86400000);
      return daysAgoN >= 0 && daysAgoN <= 29;
    });

    const byEmployee = new Map<string, { late: number; absent: number }>();
    inWindow.forEach((r) => {
      const e = byEmployee.get(r.employeeId) ?? { late: 0, absent: 0 };
      if (r.status === 'LATE') e.late += 1;
      if (r.status === 'ABSENT') e.absent += 1;
      byEmployee.set(r.employeeId, e);
    });

    const empName = new Map(employees.map((e) => [e.id, `${e.firstName} ${e.lastName}`]));
    const insights: AIInsight[] = [];
    byEmployee.forEach((counts, employeeId) => {
      if (counts.late < 4 && counts.absent < 3) return;
      const name = empName.get(employeeId) ?? employeeId;
      insights.push({
        key: `attendance-pattern-${employeeId}`,
        category: 'HR',
        severity: counts.absent >= 4 ? 'HIGH' : 'MEDIUM',
        title: `${name} — attendance pattern worth a conversation`,
        description: `${name} has ${counts.late} late arrival(s) and ${counts.absent} unplanned absence(s) in the trailing 30 days.`,
        suggestedAction: 'A brief check-in from the reporting manager, and confirm shift/roster fit.',
        computedAt: new Date().toISOString(),
      });
    });
    return insights.sort(bySeverityDesc).slice(0, 6);
  },

  // Complements (does not duplicate) suggestReorders: catches items already ABOVE their static
  // reorder level whose recent consumption trend still implies a stockout inside 3 days — exactly
  // the case a static reorder-level rule misses.
  flagTrendingReorderRisk(ledgerEntries: StockLedgerEntry[], items: InventoryItem[], businessDate: string): AIInsight[] {
    const asOf = new Date(businessDate).getTime();
    const balanceByItem = new Map(inventoryService.computeCurrentStock(ledgerEntries).map((b) => [b.itemId, b.qty]));

    const recentConsumption = new Map<string, { qty: number; days: Set<number> }>();
    ledgerEntries.filter((e) => e.entryType === 'CONSUMPTION').forEach((e) => {
      const daysAgoN = Math.floor((asOf - new Date(e.createdAt).getTime()) / 86400000);
      if (daysAgoN < 0 || daysAgoN > 6) return;
      const c = recentConsumption.get(e.itemId) ?? { qty: 0, days: new Set<number>() };
      c.qty += Math.abs(e.qty); c.days.add(daysAgoN);
      recentConsumption.set(e.itemId, c);
    });

    const insights: AIInsight[] = [];
    items.forEach((item) => {
      const currentQty = balanceByItem.get(item.id) ?? 0;
      if (currentQty <= item.reorderLevel) return; // already covered by suggestReorders
      const c = recentConsumption.get(item.id);
      if (!c || c.days.size < 3) return;
      const avgDaily = c.qty / c.days.size;
      if (avgDaily <= 0) return;
      const daysOfCover = currentQty / avgDaily;
      if (daysOfCover >= 3) return;

      insights.push({
        key: `trending-reorder-${item.id}`,
        category: 'INVENTORY',
        severity: daysOfCover < 1.5 ? 'HIGH' : 'MEDIUM',
        title: `${item.name} on track to run out despite being above reorder level`,
        description: `${item.name} is currently at ${currentQty} (above its ${item.reorderLevel} reorder level), but recent consumption of ${avgDaily.toFixed(1)}/day gives it only ~${daysOfCover.toFixed(1)} days of cover.`,
        suggestedAction: 'Raise a Purchase Order ahead of the static reorder point given the current consumption trend.',
        computedAt: new Date().toISOString(),
      });
    });
    return insights.sort(bySeverityDesc).slice(0, 6);
  },

  // Reuses inventoryService.getExpiringBatches — forward-looking (batches not yet wasted),
  // distinct from reportsService.computeWastageReport which is retrospective (already wasted).
  flagExpiringBatches(batches: StockBatch[], items: InventoryItem[], locations: Location[], businessDate: string): AIInsight[] {
    const itemName = new Map(items.map((i) => [i.id, i.name]));
    const outletName = new Map(locations.map((l) => [l.id, l.name]));

    return inventoryService.getExpiringBatches(batches, businessDate, 5)
      .filter((b) => b.qty > 0 && !b.isExpired)
      .map((b): AIInsight => ({
        key: `expiring-batch-${b.id}`,
        category: 'INVENTORY',
        severity: b.daysToExpiry <= 2 ? 'HIGH' : 'MEDIUM',
        title: `${itemName.get(b.itemId) ?? b.itemId} batch expiring in ${b.daysToExpiry} day(s)`,
        description: `Batch ${b.batchNo} of ${itemName.get(b.itemId) ?? b.itemId} (${b.qty} units) at ${outletName.get(b.outletId) ?? b.outletId} expires in ${b.daysToExpiry} day(s).`,
        suggestedAction: 'Move into a special, staff meal, or inter-outlet transfer before it turns to wastage.',
        computedAt: new Date().toISOString(),
      }))
      .sort(bySeverityDesc)
      .slice(0, 8);
  },

  // A CHECKED_IN guest whose phone number matches an earlier CHECKED_OUT stay: surfaces their
  // last stay's actual room-service order (from the Folio, already human-readable line text) as a
  // concrete personalization prompt, not a generic "greet returning guests" tip.
  suggestGuestPersonalization(reservations: Reservation[], folios: Folio[]): AIInsight[] {
    const byPhone = new Map<string, Reservation[]>();
    reservations.forEach((r) => byPhone.set(r.guestPhone, [...(byPhone.get(r.guestPhone) ?? []), r]));

    const insights: AIInsight[] = [];
    reservations.filter((r) => r.status === 'CHECKED_IN').forEach((current) => {
      const history = (byPhone.get(current.guestPhone) ?? [])
        .filter((r) => r.id !== current.id && r.status === 'CHECKED_OUT')
        .sort((a, b) => new Date(b.checkOutDate).getTime() - new Date(a.checkOutDate).getTime());
      if (history.length === 0) return;
      const lastStay = history[0];
      const lastFolio = folios.find((f) => f.reservationId === lastStay.id);
      const roomServiceLines = lastFolio?.lines.filter((l) => l.type === 'ROOM_SERVICE') ?? [];
      if (roomServiceLines.length === 0) return;

      insights.push({
        key: `guest-personalization-${current.id}`,
        category: 'HOTEL',
        severity: 'LOW',
        title: `${current.guestName} is a returning guest`,
        description: `${current.guestName} last stayed until ${lastStay.checkOutDate} and ordered: ${roomServiceLines.slice(0, 3).map((l) => l.description).join(', ')}. Worth a proactive room-service suggestion this stay.`,
        suggestedAction: 'Have the floor team offer their usual order proactively.',
        computedAt: new Date().toISOString(),
      });
    });
    return insights.slice(0, 5);
  },

  // A reservation still marked BOOKED on or after its own check-in date — the actual moment a
  // no-show becomes real, not a speculative days-in-advance prediction.
  flagNoShowRisk(reservations: Reservation[], businessDate: string): AIInsight[] {
    return reservations
      .filter((r) => r.status === 'BOOKED' && r.checkInDate <= businessDate)
      .map((r): AIInsight => {
        const daysOverdue = Math.floor((new Date(businessDate).getTime() - new Date(r.checkInDate).getTime()) / 86400000);
        return {
          key: `no-show-risk-${r.id}`,
          category: 'HOTEL',
          severity: daysOverdue > 0 ? 'HIGH' : 'MEDIUM',
          title: `${r.guestName} not yet checked in`,
          description: daysOverdue > 0
            ? `${r.guestName}'s reservation (${r.reservationNumber}) was due to check in on ${r.checkInDate}, ${daysOverdue} day(s) ago, and is still marked BOOKED.`
            : `${r.guestName}'s reservation (${r.reservationNumber}) is due to check in today and is still marked BOOKED.`,
          suggestedAction: 'Call the guest to confirm arrival, or release the room if unreachable.',
          computedAt: new Date().toISOString(),
        };
      })
      .sort(bySeverityDesc)
      .slice(0, 6);
  },

  // Per hotel outlet, near-term (next 3 days) booked-room-nights against total room-nights
  // available — a demand-based rate nudge, not a claim of an external events calendar.
  suggestRoomRateAdjustment(rooms: Room[], reservations: Reservation[], locations: Location[], businessDate: string): AIInsight[] {
    const outletIds = Array.from(new Set(rooms.map((r) => r.locationId)));
    const windowDates: string[] = [];
    const cursor = new Date(businessDate);
    for (let i = 0; i < 3; i++) {
      windowDates.push(cursor.toISOString().substring(0, 10));
      cursor.setDate(cursor.getDate() + 1);
    }

    const insights: AIInsight[] = [];
    outletIds.forEach((locationId) => {
      const outletRooms = rooms.filter((r) => r.locationId === locationId);
      if (outletRooms.length === 0) return;
      const roomIds = new Set(outletRooms.map((r) => r.id));
      const relevant = reservations.filter((r) => roomIds.has(r.roomId) && (r.status === 'BOOKED' || r.status === 'CHECKED_IN'));

      let bookedNights = 0;
      windowDates.forEach((d) => {
        relevant.forEach((r) => { if (r.checkInDate <= d && r.checkOutDate > d) bookedNights += 1; });
      });
      const capacityNights = outletRooms.length * windowDates.length;
      if (capacityNights === 0) return;
      const occupancy = bookedNights / capacityNights;
      const outletName = locations.find((l) => l.id === locationId)?.name ?? locationId;

      if (occupancy >= 0.85) {
        insights.push({
          key: `rate-up-${locationId}`,
          category: 'HOTEL',
          severity: 'MEDIUM',
          title: `${outletName} trending toward a sellout`,
          description: `${outletName} is booked at ${Math.round(occupancy * 100)}% occupancy for the next 3 days — a rate increase on remaining rooms is unlikely to cost bookings.`,
          suggestedAction: 'Raise the rate on remaining unbooked rooms for the next 3 nights.',
          computedAt: new Date().toISOString(),
        });
      } else if (occupancy <= 0.35) {
        insights.push({
          key: `rate-down-${locationId}`,
          category: 'HOTEL',
          severity: 'LOW',
          title: `${outletName} running well below capacity`,
          description: `${outletName} is booked at only ${Math.round(occupancy * 100)}% occupancy for the next 3 days — a short promotional rate could fill remaining rooms.`,
          suggestedAction: 'Consider a limited-time discounted rate or a local OTA push for the next 3 nights.',
          computedAt: new Date().toISOString(),
        });
      }
    });
    return insights.sort(bySeverityDesc).slice(0, 6);
  },

  // Any banquet hall with zero CONFIRMED bookings in the next 14 days — a plain calendar-gap
  // check, not a claimed demand forecast.
  flagBanquetDemandGaps(halls: BanquetHall[], bookings: BanquetBooking[], businessDate: string): AIInsight[] {
    const windowEnd = new Date(businessDate);
    windowEnd.setDate(windowEnd.getDate() + 14);
    const windowEndStr = windowEnd.toISOString().substring(0, 10);

    return halls
      .filter((hall) => !bookings.some((b) => b.hallId === hall.id && b.status === 'CONFIRMED' && b.eventDate >= businessDate && b.eventDate <= windowEndStr))
      .map((hall): AIInsight => ({
        key: `banquet-gap-${hall.id}`,
        category: 'BANQUET',
        severity: 'MEDIUM',
        title: `${hall.name} has no confirmed bookings in the next 2 weeks`,
        description: `${hall.name} (capacity ${hall.capacity}) has zero CONFIRMED bookings between ${businessDate} and ${windowEndStr}.`,
        suggestedAction: 'Push a promotional rate or reach out to recent enquiries for this hall.',
        computedAt: new Date().toISOString(),
      }))
      .slice(0, 6);
  },
};
