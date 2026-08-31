// Reports & Analytics domain service: stateless — no store, no Firebase path. Generalizes logic
// that used to live only as ad-hoc, hardcoded-date-range useMemo blocks inline in
// dashboard/page.tsx (salesTrend, topItems) into reusable, date-range-parameterized functions that
// both the Dashboard and the new /reports-analytics pages call. Every function is a pure read over
// already-hydrated store arrays — the same idiom the Dashboard already uses for
// inventoryService/financeService helpers.

import { Bill, ChannelOrderSettlement, POSOrder } from '@/types/pos';
import { Location } from '@/types/erp-core';
import { MenuItem } from '@/types/menu';
import { InventoryItem, StockLedgerEntry } from '@/types/inventory';

function inRange(dateStr: string, fromDate: string, toDate: string): boolean {
  return dateStr >= fromDate && dateStr <= toDate;
}

export interface TrendPoint {
  date: string;
  value: number;
}

export interface TopItemRow {
  menuItemId: string;
  name: string;
  qty: number;
  revenue: number;
}

export interface CategoryBreakdownRow {
  categoryId: string;
  qty: number;
  revenue: number;
}

export interface OutletComparisonRow {
  outletId: string;
  name: string;
  value: number;
}

export interface ChannelCommissionRow {
  platform: 'SWIGGY' | 'ZOMATO';
  orderCount: number;
  orderAmount: number;
  commission: number;
  netSettlement: number;
}

export interface WastageRow {
  itemId: string;
  name: string;
  qty: number;
  cost: number;
}

const billsInScope = (bills: Bill[], fromDate: string, toDate: string, outletIds?: string[]) =>
  bills.filter((b) => b.status !== 'VOID' && inRange(b.businessDate, fromDate, toDate) && (!outletIds || outletIds.includes(b.outletId)));

export const reportsService = {
  // One point per calendar day in [fromDate, toDate] — replaces the dashboard's old hardcoded
  // 5-date array with a real, arbitrary-length trailing window.
  computeSalesTrend(bills: Bill[], fromDate: string, toDate: string, outletIds?: string[]): TrendPoint[] {
    const points: TrendPoint[] = [];
    const cursor = new Date(`${fromDate}T00:00:00.000Z`);
    const end = new Date(`${toDate}T00:00:00.000Z`);
    while (cursor.getTime() <= end.getTime()) {
      const date = cursor.toISOString().substring(0, 10);
      const value = billsInScope(bills, date, date, outletIds).reduce((s, b) => s + b.netAmount, 0);
      points.push({ date: date.substring(5), value });
      cursor.setDate(cursor.getDate() + 1);
    }
    return points;
  },

  computeTopItems(bills: Bill[], orders: POSOrder[], fromDate: string, toDate: string, outletIds?: string[], limit = 10): TopItemRow[] {
    const scoped = billsInScope(bills, fromDate, toDate, outletIds);
    const ordersById = new Map(orders.map((o) => [o.id, o]));
    const byItem = new Map<string, TopItemRow>();
    scoped.forEach((b) => {
      const order = ordersById.get(b.orderId);
      order?.items.forEach((it) => {
        const existing = byItem.get(it.menuItemId) ?? { menuItemId: it.menuItemId, name: it.name, qty: 0, revenue: 0 };
        existing.qty += it.qty;
        existing.revenue += it.qty * it.unitPrice;
        byItem.set(it.menuItemId, existing);
      });
    });
    return Array.from(byItem.values()).sort((a, b) => b.qty - a.qty).slice(0, limit);
  },

  computeCategoryBreakdown(bills: Bill[], orders: POSOrder[], menuItems: MenuItem[], fromDate: string, toDate: string, outletIds?: string[]): CategoryBreakdownRow[] {
    const scoped = billsInScope(bills, fromDate, toDate, outletIds);
    const ordersById = new Map(orders.map((o) => [o.id, o]));
    const categoryByItem = new Map(menuItems.map((m) => [m.id, m.categoryId]));
    const byCategory = new Map<string, CategoryBreakdownRow>();
    scoped.forEach((b) => {
      const order = ordersById.get(b.orderId);
      order?.items.forEach((it) => {
        const categoryId = categoryByItem.get(it.menuItemId) ?? 'unknown';
        const existing = byCategory.get(categoryId) ?? { categoryId, qty: 0, revenue: 0 };
        existing.qty += it.qty;
        existing.revenue += it.qty * it.unitPrice;
        byCategory.set(categoryId, existing);
      });
    });
    return Array.from(byCategory.values()).sort((a, b) => b.revenue - a.revenue);
  },

  computeOutletComparison(bills: Bill[], outlets: Location[], fromDate: string, toDate: string): OutletComparisonRow[] {
    return outlets
      .map((o) => ({ outletId: o.id, name: o.name, value: billsInScope(bills, fromDate, toDate, [o.id]).reduce((s, b) => s + b.netAmount, 0) }))
      .sort((a, b) => b.value - a.value);
  },

  computeChannelCommissionReport(channelSettlements: ChannelOrderSettlement[], fromDate: string, toDate: string): ChannelCommissionRow[] {
    const scoped = channelSettlements.filter((s) => s.settlementDate && inRange(s.settlementDate, fromDate, toDate));
    const platforms: ChannelCommissionRow['platform'][] = ['SWIGGY', 'ZOMATO'];
    return platforms
      .map((platform) => {
        const rows = scoped.filter((s) => s.platform === platform);
        return {
          platform,
          orderCount: rows.length,
          orderAmount: Math.round(rows.reduce((s, r) => s + r.orderAmount, 0) * 100) / 100,
          commission: Math.round(rows.reduce((s, r) => s + r.commission, 0) * 100) / 100,
          netSettlement: Math.round(rows.reduce((s, r) => s + r.netSettlement, 0) * 100) / 100,
        };
      })
      .filter((r) => r.orderCount > 0);
  },

  computeWastageReport(ledgerEntries: StockLedgerEntry[], items: InventoryItem[], fromDate: string, toDate: string, outletIds?: string[]): WastageRow[] {
    const itemById = new Map(items.map((i) => [i.id, i]));
    const byItem = new Map<string, WastageRow>();
    ledgerEntries
      .filter((e) => e.entryType === 'WASTAGE' && (!outletIds || outletIds.includes(e.outletId)) && inRange(e.createdAt.substring(0, 10), fromDate, toDate))
      .forEach((e) => {
        const item = itemById.get(e.itemId);
        const qty = Math.abs(e.qty);
        const existing = byItem.get(e.itemId) ?? { itemId: e.itemId, name: item?.name ?? e.itemId, qty: 0, cost: 0 };
        existing.qty += qty;
        existing.cost += qty * (item?.standardCost ?? 0);
        byItem.set(e.itemId, existing);
      });
    return Array.from(byItem.values()).sort((a, b) => b.cost - a.cost);
  },
};
