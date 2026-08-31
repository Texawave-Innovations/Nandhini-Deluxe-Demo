'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import DateRangePicker from '@/components/reports/DateRangePicker';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { usePOSStore } from '@/store/pos-store';
import { useHRMSStore } from '@/store/hrms-store';
import { useOutletStore } from '@/store/outlet-store';
import { outletService } from '@/services/outletService';
import { reportsService, TopItemRow, ChannelCommissionRow } from '@/services/reportsService';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const PIE_COLORS = ['#0F5B55', '#C59A45', '#3377A8', '#C68A28', '#C94B45', '#23865B'];

export default function SalesReportsPage() {
  const { bills, orders, payments, channelSettlements } = usePOSStore();
  const { locations } = useHRMSStore();
  const { businessDate } = useOutletStore();
  const outlets = outletService.listOutlets(locations);

  const [fromDate, setFromDate] = useState(businessDate);
  const [toDate, setToDate] = useState(businessDate);

  const salesTrend = reportsService.computeSalesTrend(bills, fromDate, toDate);
  const outletComparison = reportsService.computeOutletComparison(bills, outlets, fromDate, toDate).slice(0, 10);
  const topItems = reportsService.computeTopItems(bills, orders, fromDate, toDate);
  const channelCommission = reportsService.computeChannelCommissionReport(channelSettlements, fromDate, toDate);

  const scopedBillIds = new Set(bills.filter((b) => b.status !== 'VOID' && b.businessDate >= fromDate && b.businessDate <= toDate).map((b) => b.id));
  const scopedPayments = payments.filter((p) => scopedBillIds.has(p.billId) && p.status === 'SUCCESS');
  const paymentModeDist = ['CASH', 'UPI', 'CARD', 'SWIGGY', 'ZOMATO']
    .map((m) => ({ name: m, value: scopedPayments.filter((p) => p.mode === m).reduce((s, p) => s + p.amount, 0) }))
    .filter((d) => d.value > 0);

  const topItemColumns: DataTableColumn<TopItemRow>[] = [
    { key: 'name', header: 'Item', render: (r) => r.name },
    { key: 'qty', header: 'Qty Sold', render: (r) => r.qty },
    { key: 'revenue', header: 'Revenue', render: (r) => inr(r.revenue) },
  ];
  const channelColumns: DataTableColumn<ChannelCommissionRow>[] = [
    { key: 'platform', header: 'Platform', render: (r) => r.platform },
    { key: 'orders', header: 'Orders', render: (r) => r.orderCount },
    { key: 'orderAmount', header: 'Order Amount', render: (r) => inr(r.orderAmount) },
    { key: 'commission', header: 'Commission', render: (r) => inr(r.commission) },
    { key: 'net', header: 'Net Settlement', render: (r) => inr(r.netSettlement) },
  ];

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader title="Sales Reports" subtitle="Trend, outlet comparison, item performance and delivery-channel commission for the selected range." />
        <DateRangePicker fromDate={fromDate} toDate={toDate} anchorDate={businessDate} onChange={(f, t) => { setFromDate(f); setToDate(t); }} />

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
          <h3 className="text-sm font-semibold text-[#202522] mb-3">Sales Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={salesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E2DB" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#66706B' }} />
              <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: '#66706B' }} />
              <Tooltip formatter={(v: number) => inr(v)} />
              <Line type="monotone" dataKey="value" stroke="#0F5B55" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
            <h3 className="text-sm font-semibold text-[#202522] mb-3">Outlet Comparison</h3>
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
              <div className="h-[220px] flex items-center justify-center text-[13px] text-[#66706B]">No payments in this range.</div>
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
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="text-[14px] font-semibold text-[#202522]">Top Selling Items</h3>
            <DataTable columns={topItemColumns} rows={topItems} keyField={(r) => r.menuItemId} emptyMessage="No sales in this range." />
          </div>
          <div className="space-y-2">
            <h3 className="text-[14px] font-semibold text-[#202522]">Channel Commission (Swiggy/Zomato)</h3>
            <DataTable columns={channelColumns} rows={channelCommission} keyField={(r) => r.platform} emptyMessage="No settled channel orders in this range." />
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}
