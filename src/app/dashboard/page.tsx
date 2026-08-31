'use client';

import React, { useMemo } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import Link from 'next/link';
import {
  IndianRupee, Wallet, CreditCard, Smartphone, Bike, UtensilsCrossed, BedDouble, PartyPopper,
  GitMerge, AlertTriangle, Package, CalendarClock, Users2, Sparkles, TrendingUp, Plus, Clock,
  Ticket, Receipt, ShoppingCart,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useHRMSStore } from '@/store/hrms-store';
import { usePOSStore } from '@/store/pos-store';
import { useInventoryStore } from '@/store/inventory-store';
import { usePurchaseStore } from '@/store/purchase-store';
import { useFinanceStore } from '@/store/finance-store';
import { useReconciliationStore } from '@/store/reconciliation-store';
import { useOutletStore } from '@/store/outlet-store';
import { outletService } from '@/services/outletService';
import { inventoryService } from '@/services/inventoryService';
import { financeService } from '@/services/financeService';
import { reconciliationService } from '@/services/reconciliationService';
import { vendorService } from '@/services/vendorService';
import { useVendorStore } from '@/store/vendor-store';
import { useSalesStore } from '@/store/sales-store';
import { useAIStore } from '@/store/ai-store';
import { salesService } from '@/services/salesService';
import { aiInsightsService } from '@/services/aiInsightsService';
import { reportsService } from '@/services/reportsService';
import KpiCard from '@/components/ui/KpiCard';
import StatusChip from '@/components/ui/StatusChip';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const PIE_COLORS = ['#0F5B55', '#C59A45', '#3377A8', '#C68A28', '#C94B45', '#23865B'];

export default function DashboardPage() {
  const {
    employees, attendanceRecords, regularizationRequests, leaveRequests, hrTickets, expenseClaims,
    locations, banquetEvents,
  } = useHRMSStore();
  const { bills, payments, orders, dayCloses, menuItems } = usePOSStore();
  const { ledgerEntries, items, batches } = useInventoryStore();
  const { purchaseOrders } = usePurchaseStore();
  const { vendorBills } = useFinanceStore();
  const { vendors } = useVendorStore();
  const { matches: reconciliationMatches, bankTransactions } = useReconciliationStore();
  const { customers, invoices } = useSalesStore();
  const { acknowledgements } = useAIStore();
  const { selectedOutletId, businessDate } = useOutletStore();

  const outlets = outletService.listOutlets(locations);
  const scopeOutletIds = selectedOutletId === 'ALL' ? outlets.map((o) => o.id) : [selectedOutletId];
  const scopeLabel = selectedOutletId === 'ALL' ? 'All Outlets' : outletService.getOutletById(locations, selectedOutletId)?.name;

  // ---- Bills / payments in scope for the selected business date ----
  const todaysBills = useMemo(
    () => bills.filter((b) => b.businessDate === businessDate && scopeOutletIds.includes(b.outletId) && b.status !== 'VOID'),
    [bills, businessDate, scopeOutletIds]
  );
  const todaysBillIds = new Set(todaysBills.map((b) => b.id));
  const todaysPayments = payments.filter((p) => todaysBillIds.has(p.billId) && p.status === 'SUCCESS');
  const todaysOrdersById = useMemo(() => new Map(orders.map((o) => [o.id, o])), [orders]);

  const sumByMode = (mode: string) => todaysPayments.filter((p) => p.mode === mode).reduce((s, p) => s + p.amount, 0);
  const sumByChannel = (channel: string) => todaysBills.filter((b) => todaysOrdersById.get(b.orderId)?.channel === channel).reduce((s, b) => s + b.netAmount, 0);

  const totalSales = todaysBills.reduce((s, b) => s + b.netAmount, 0);
  const cashSales = sumByMode('CASH');
  const upiSales = sumByMode('UPI');
  const cardSales = sumByMode('CARD');
  const swiggyDelivery = sumByChannel('SWIGGY_DELIVERY');
  const zomatoDelivery = sumByChannel('ZOMATO_DELIVERY');
  const swiggyDineout = sumByChannel('SWIGGY_DINEOUT');
  const zomatoDineout = sumByChannel('ZOMATO_DINEOUT');

  // ---- Outlet comparison (always across all outlets, for this business date) ----
  const outletComparison = useMemo(() => {
    return outlets
      .map((o) => ({
        name: o.name,
        value: bills.filter((b) => b.outletId === o.id && b.businessDate === businessDate && b.status !== 'VOID').reduce((s, b) => s + b.netAmount, 0),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [outlets, bills, businessDate]);

  // ---- Payment mode distribution ----
  const paymentModeDist = useMemo(() => {
    const modes = ['CASH', 'UPI', 'CARD', 'SWIGGY', 'ZOMATO'];
    return modes.map((m) => ({ name: m, value: sumByMode(m) })).filter((d) => d.value > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todaysPayments]);

  // ---- Sales trend, trailing 5 days ending on the selected business date ----
  const salesTrendFrom = useMemo(() => {
    const d = new Date(`${businessDate}T00:00:00.000Z`);
    d.setDate(d.getDate() - 4);
    return d.toISOString().substring(0, 10);
  }, [businessDate]);
  const salesTrend = useMemo(
    () => reportsService.computeSalesTrend(bills, salesTrendFrom, businessDate, scopeOutletIds),
    [bills, salesTrendFrom, businessDate, scopeOutletIds]
  );

  // ---- Top selling items ----
  const topItems = useMemo(() => {
    const qtyByItem = new Map<string, { name: string; qty: number; revenue: number }>();
    todaysBills.forEach((b) => {
      const order = todaysOrdersById.get(b.orderId);
      order?.items.forEach((it) => {
        const existing = qtyByItem.get(it.menuItemId) ?? { name: it.name, qty: 0, revenue: 0 };
        existing.qty += it.qty;
        existing.revenue += it.qty * it.unitPrice;
        qtyByItem.set(it.menuItemId, existing);
      });
    });
    return Array.from(qtyByItem.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [todaysBills, todaysOrdersById]);

  // ---- Inventory alerts, scoped to selected outlet(s) ----
  const scopedLedger = ledgerEntries.filter((e) => scopeOutletIds.includes(e.outletId));
  const stockBalances = inventoryService.computeCurrentStock(scopedLedger);
  const lowStockItems = inventoryService.getLowStockItems(items, stockBalances).slice(0, 5);
  const expiringBatches = inventoryService.getExpiringBatches(batches.filter((b) => scopeOutletIds.includes(b.outletId)), businessDate, 3);

  // ---- Cash variance from today's Day Close(s) in scope ----
  const scopedDayCloses = dayCloses.filter((d) => scopeOutletIds.includes(d.outletId) && d.businessDate === businessDate);
  const closedDayCloses = scopedDayCloses.filter((d) => d.status === 'CLOSED');
  const totalVariance = closedDayCloses.reduce((s, d) => s + (d.variance ?? 0), 0);

  // ---- Procure-to-pay + reconciliation KPIs (Phase 2 slice 1) ----
  const apAging = financeService.computeAPAging(vendorBills, businessDate);
  const pendingPOCount = purchaseOrders.filter((po) => po.status === 'SUBMITTED' || po.status === 'APPROVED').length;
  const reconciliationSummary = reconciliationService.computeReconciliationSummary(reconciliationMatches);
  const pendingReconciliationCount = reconciliationSummary.mismatchCount + reconciliationSummary.unmatchedCount;
  const rankedVendors = vendorService.rankVendorsByOutstanding(vendors, vendorBills);
  const topVendorOutstanding = rankedVendors[0];
  const reconciliationExceptions = reconciliationService.flagVarianceExceptions(reconciliationMatches).slice(0, 2);
  const txnById = new Map(bankTransactions.map((t) => [t.id, t]));

  // ---- Sales (AR) + AI Insights (Phase 2 slice 2) ----
  const arAging = salesService.computeARAging(invoices, businessDate);
  const rankedCustomers = salesService.rankCustomersByOutstanding(customers, invoices);
  const topCustomerOutstanding = rankedCustomers[0];
  const aiInsights = useMemo(() => [
    ...aiInsightsService.detectConsumptionAnomalies(ledgerEntries, items, locations, businessDate),
    ...aiInsightsService.suggestReorders(items, ledgerEntries),
    ...aiInsightsService.rankVendorRisk(vendors, vendorBills, businessDate),
    ...aiInsightsService.rankCustomerRisk(customers, invoices, businessDate),
    ...aiInsightsService.detectSettlementMismatches(reconciliationMatches),
  ], [ledgerEntries, items, locations, businessDate, vendors, vendorBills, customers, invoices, reconciliationMatches]);
  const ackedKeys = new Set(acknowledgements.map((a) => a.insightKey));
  const openAIInsights = aiInsights.filter((i) => !ackedKeys.has(i.key));
  const topAIInsights = [...openAIInsights].sort((a, b) => (b.severity === 'HIGH' ? 1 : 0) - (a.severity === 'HIGH' ? 1 : 0)).slice(0, 3);

  // ---- Banquet events today (existing HR banquet staffing data) ----
  const banquetEventsToday = banquetEvents.filter((e) => e.eventDate === businessDate);

  // ---- HR snapshot (unchanged from the original HR dashboard) ----
  const totalEmp = employees.length;
  const activeEmp = employees.filter((e) => e.status !== 'INACTIVE').length;
  const presentToday = attendanceRecords.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
  const absentToday = attendanceRecords.filter((r) => r.status === 'ABSENT').length;
  const onLeaveToday = attendanceRecords.filter((r) => r.status === 'ON_LEAVE').length;
  const pendingApprovalsCount = regularizationRequests.filter((r) => r.status === 'PENDING').length + leaveRequests.filter((l) => l.status === 'PENDING').length;
  const openTicketsCount = hrTickets.filter((t) => t.status === 'OPEN').length;
  const pendingExpensesCount = expenseClaims.filter((c) => c.status === 'PENDING').length;

  return (
    <ShellLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-[28px] leading-[36px] font-semibold tracking-[-0.02em] text-[#202522]">Executive Dashboard</h1>
            <p className="mt-1 text-[14px] leading-5 font-normal text-[#66706B]">
              {scopeLabel} • Business Date {businessDate}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/pos/new-order" className="h-11 px-4 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[14px] leading-5 rounded-[8px] shadow-brand-xs flex items-center space-x-2 transition-all">
              <Plus className="w-4 h-4" /><span>New POS Order</span>
            </Link>
            <Link href="/pos/day-close" className="h-11 px-4 bg-white border border-[#E5E2DB] hover:bg-[#F3F0E9] text-[#202522] font-semibold text-[14px] leading-5 rounded-[8px] shadow-brand-xs flex items-center space-x-2 transition-all">
              <Clock className="w-4 h-4 text-[#66706B]" /><span>Day Close</span>
            </Link>
          </div>
        </div>

        {/* LIVE KPI GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <KpiCard label="Today's Total Sales" value={inr(totalSales)} icon={IndianRupee} valueColorClass="text-[#0F5B55]" sublabel={`${todaysBills.length} bills`} />
          <KpiCard label="Cash Sales" value={inr(cashSales)} icon={Wallet} />
          <KpiCard label="UPI Sales" value={inr(upiSales)} icon={Smartphone} />
          <KpiCard label="Card Sales" value={inr(cardSales)} icon={CreditCard} />
          <KpiCard label="Swiggy Sales" value={inr(swiggyDelivery)} icon={Bike} valueColorClass="text-[#C68A28]" />
          <KpiCard label="Zomato Sales" value={inr(zomatoDelivery)} icon={Bike} valueColorClass="text-[#C94B45]" />
          <KpiCard label="Swiggy Dineout" value={inr(swiggyDineout)} icon={UtensilsCrossed} />
          <KpiCard label="Zomato Dineout" value={inr(zomatoDineout)} icon={UtensilsCrossed} />
          <KpiCard label="Cash Variance (Closed Days)" value={closedDayCloses.length ? inr(totalVariance) : '—'} icon={AlertTriangle} valueColorClass={totalVariance < 0 ? 'text-[#C94B45]' : 'text-[#23865B]'} sublabel={closedDayCloses.length ? `${closedDayCloses.length} outlet(s) closed` : 'No day close yet'} />
          <KpiCard label="Low Stock Items" value={lowStockItems.length} icon={Package} valueColorClass="text-[#C94B45]" />
          <KpiCard label="Expiring / Expired Items" value={expiringBatches.length} icon={CalendarClock} valueColorClass="text-[#C68A28]" />
          <KpiCard label="Banquet Events Today" value={banquetEventsToday.length} icon={PartyPopper} />
          <KpiCard label="Employees Present" value={presentToday} icon={Users2} sublabel={`of ${activeEmp} active`} />
        </div>

        {/* PROCURE-TO-PAY + RECONCILIATION KPI ROW — live, Phase 2 slice 1 */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#66706B] mb-1.5">Purchase, Finance &amp; Reconciliation</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <KpiCard label="Outstanding Vendor Payments" value={inr(apAging.total)} icon={Receipt} valueColorClass="text-[#C94B45]" sublabel={topVendorOutstanding && topVendorOutstanding.outstanding > 0 ? `${topVendorOutstanding.name}: ${inr(topVendorOutstanding.outstanding)}` : undefined} />
            <KpiCard label="Pending Purchase Orders" value={pendingPOCount} icon={Ticket} />
            <KpiCard label="Pending Reconciliation" value={pendingReconciliationCount} icon={GitMerge} valueColorClass={pendingReconciliationCount > 0 ? 'text-[#C68A28]' : 'text-[#23865B]'} />
          </div>
        </div>

        {/* SALES + AI INSIGHTS KPI ROW — live, Phase 2 slice 2 */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#66706B] mb-1.5">Sales &amp; Receivables</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <KpiCard label="Total Sales (5 days, in scope)" value={inr(salesTrend.reduce((s, p) => s + p.value, 0))} icon={ShoppingCart} valueColorClass="text-[#0F5B55]" />
            <KpiCard label="Customer Receivables (AR)" value={inr(arAging.total)} icon={Wallet} valueColorClass="text-[#C94B45]" sublabel={topCustomerOutstanding && topCustomerOutstanding.outstanding > 0 ? `${topCustomerOutstanding.name}: ${inr(topCustomerOutstanding.outstanding)}` : undefined} />
            <KpiCard label="Open AI Insights" value={openAIInsights.length} icon={Sparkles} valueColorClass={openAIInsights.some((i) => i.severity === 'HIGH') ? 'text-[#C94B45]' : 'text-[#23865B]'} />
          </div>
        </div>

        {/* PHASE 2 PREVIEW KPI ROW — Hotel/Banquet modules not yet built; shown honestly as upcoming, not live */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#66706B] mb-1.5">Phase 2 — Hotel &amp; Banquet (preview)</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Hotel Revenue', icon: BedDouble }, { label: "Today's Occupancy", icon: BedDouble },
              { label: 'Banquet Revenue', icon: PartyPopper },
            ].map((k) => (
              <div key={k.label} className="bg-white/60 rounded-[10px] border border-dashed border-[#E5E2DB] p-3.5">
                <div className="flex items-start justify-between">
                  <span className="text-[13px] leading-5 font-medium text-[#66706B]/70 block">{k.label}</span>
                  <k.icon className="w-4 h-4 text-[#66706B]/30" />
                </div>
                <div className="text-[22px] leading-[30px] font-bold mt-1 text-[#66706B]/40">—</div>
              </div>
            ))}
          </div>
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
            <h3 className="text-sm font-semibold text-[#202522] mb-3">Outlet Performance — {businessDate}</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={outletComparison} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E2DB" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: '#66706B' }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#202522' }} />
                <Tooltip formatter={(v: number) => inr(v)} />
                <Bar dataKey="value" fill="#0F5B55" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
            <h3 className="text-sm font-semibold text-[#202522] mb-3">Payment Mode Distribution</h3>
            {paymentModeDist.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-[13px] text-[#66706B]">No payments yet for this date.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={paymentModeDist} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {paymentModeDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => inr(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {paymentModeDist.map((d, i) => (
                <span key={d.name} className="text-[11px] flex items-center gap-1 text-[#66706B]">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />{d.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
            <h3 className="text-sm font-semibold text-[#202522] mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#0F5B55]" />Sales Trend (5 days)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E2DB" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#66706B' }} />
                <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: '#66706B' }} />
                <Tooltip formatter={(v: number) => inr(v)} />
                <Line type="monotone" dataKey="value" stroke="#0F5B55" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
            <h3 className="text-sm font-semibold text-[#202522] mb-3">Top Selling Items</h3>
            <div className="space-y-2">
              {topItems.length === 0 && <div className="text-[13px] text-[#66706B]">No sales recorded yet for this date.</div>}
              {topItems.map((it, i) => (
                <div key={it.name} className="flex items-center justify-between p-2 bg-[#F3F0E9] rounded-md text-[13px]">
                  <span className="text-[#202522] font-medium truncate">{i + 1}. {it.name}</span>
                  <span className="text-[#66706B]">{it.qty}x • {inr(it.revenue)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
            <h3 className="text-sm font-semibold text-[#202522] mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-[#C94B45]" />Stock Alerts</h3>
            <div className="space-y-2">
              {lowStockItems.length === 0 && <div className="text-[13px] text-[#66706B]">No low-stock items in scope.</div>}
              {lowStockItems.map((it) => (
                <div key={it.id} className="flex items-center justify-between p-2 bg-[#F3F0E9] rounded-md text-[13px]">
                  <span className="text-[#202522] font-medium truncate">{it.name}</span>
                  <StatusChip label={`${it.currentQty} left`} tone="danger" />
                </div>
              ))}
            </div>
            <Link href="/inventory/stock" className="text-[12px] text-[#0F5B55] font-semibold mt-3 inline-block">View full stock report →</Link>
          </div>
        </div>

        {/* RECONCILIATION (live) + AI PREVIEW (still Phase 2) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
            <div className="flex items-center gap-2 mb-3">
              <GitMerge className="w-4 h-4 text-[#3377A8]" />
              <h3 className="text-sm font-semibold text-[#202522]">Reconciliation Exceptions</h3>
            </div>
            <div className="space-y-2 text-[13px]">
              {reconciliationExceptions.length === 0 && <div className="text-[#66706B]">No exceptions — every bank line is cleanly matched.</div>}
              {reconciliationExceptions.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-2.5 bg-[#F3F0E9] rounded-md">
                  <span>{m.sourceLabel} vs Bank {txnById.get(m.bankTransactionId)?.description ?? ''}{m.varianceAmount !== 0 ? ` (Δ ${inr(Math.abs(m.varianceAmount))})` : ''}</span>
                  <StatusChip label={m.status === 'MATCHED' ? 'Matched' : m.status === 'MISMATCH' ? 'Review Required' : 'Unmatched'} tone={m.status === 'MATCHED' ? 'success' : m.status === 'MISMATCH' ? 'danger' : 'neutral'} />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C59A45]" />
                <h3 className="text-sm font-semibold text-[#202522]">AI Alerts</h3>
              </div>
              <Link href="/ai" className="text-[12px] text-[#0F5B55] font-semibold">View all →</Link>
            </div>
            <ul className="space-y-1.5 text-[13px] text-[#202522] list-disc list-inside">
              {topAIInsights.length === 0 && <li className="text-[#66706B] list-none">No open insights right now.</li>}
              {topAIInsights.map((insight) => <li key={insight.key}>{insight.description}</li>)}
            </ul>
          </div>
        </div>

        {/* HR SNAPSHOT — retained from the original HRMS dashboard */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-[18px] leading-[26px] font-semibold text-[#0F5B55]">
            <Users2 className="w-4 h-4" /><span>HR Snapshot</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs flex justify-between items-center border-l-4 border-l-[#C94B45]">
              <div>
                <div className="text-[14px] font-medium text-[#202522]">Pending Approvals</div>
                <div className="text-[28px] leading-[34px] font-bold text-[#C94B45] mt-1">{pendingApprovalsCount}</div>
                <div className="text-[12px] text-[#66706B] mt-0.5">Leaves & regularizations</div>
              </div>
            </div>
            <div className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs flex justify-between items-center border-l-4 border-l-[#C68A28]">
              <div>
                <div className="text-[14px] font-medium text-[#202522]">Open HR Tickets</div>
                <div className="text-[28px] leading-[34px] font-bold text-[#C68A28] mt-1">{openTicketsCount}</div>
                <div className="text-[12px] text-[#66706B] mt-0.5">Unresolved support requests</div>
              </div>
            </div>
            <div className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs flex justify-between items-center border-l-4 border-l-[#0F5B55]">
              <div>
                <div className="text-[14px] font-medium text-[#202522]">Pending Expenses</div>
                <div className="text-[28px] leading-[34px] font-bold text-[#0F5B55] mt-1">{pendingExpensesCount}</div>
                <div className="text-[12px] text-[#66706B] mt-0.5">Absent today: {absentToday} • On leave: {onLeaveToday}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}
