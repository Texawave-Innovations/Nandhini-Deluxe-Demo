'use client';

import React, { useMemo, useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import KpiCard from '@/components/ui/KpiCard';
import DataTable, { DataTableColumn } from '@/components/ui/DataTable';
import { ComposedChart, LineChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, Flag, Scale, Info, Store, BedDouble, Building2 } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';
import { usePOSStore } from '@/store/pos-store';
import { useHotelStore } from '@/store/hotel-store';
import { outletProjectionService } from '@/services/outletProjectionService';
import { CityTier, MonthlyOutletProjection, NewOutletType, OutletProjectionInput } from '@/types/outletProjection';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const OUTLET_TYPE_LABEL: Record<NewOutletType, string> = { RESTAURANT: 'Restaurant / Dine-in', HYBRID: 'Hybrid (Restaurant + Hotel)', HOTEL: 'Hotel' };
const OUTLET_TYPE_ICON: Record<NewOutletType, typeof Store> = { RESTAURANT: Store, HYBRID: Building2, HOTEL: BedDouble };
const CITY_TIER_LABEL: Record<CityTier, string> = { METRO_TIER1: 'Metro / Tier 1', TIER2: 'Tier 2 City', TIER3: 'Tier 3 / Emerging Town' };

const SAMPLE_PRESETS: Record<NewOutletType, OutletProjectionInput> = {
  RESTAURANT: { outletName: 'Sarjapur Outer Ring Road', city: 'Bengaluru', cityTier: 'METRO_TIER1', outletType: 'RESTAURANT', seatingCapacity: 60, roomCount: 0, targetOpeningDate: '2027-01-01', rampMonths: 6, projectionMonths: 24 },
  HYBRID: { outletName: 'Devanahalli Highway Junction', city: 'Bengaluru', cityTier: 'TIER2', outletType: 'HYBRID', seatingCapacity: 50, roomCount: 20, targetOpeningDate: '2027-04-01', rampMonths: 8, projectionMonths: 24 },
  HOTEL: { outletName: 'Devanahalli Airport Hotel', city: 'Bengaluru', cityTier: 'METRO_TIER1', outletType: 'HOTEL', seatingCapacity: 0, roomCount: 40, targetOpeningDate: '2027-03-01', rampMonths: 9, projectionMonths: 24 },
};

const inputClass = 'w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px] text-[#202522]';
const labelClass = 'text-[12px] font-semibold text-[#66706B] mb-1 block';

export default function NewOutletCostProjectionPage() {
  const { locations } = useHRMSStore();
  const { tables, bills } = usePOSStore();
  const { rooms, folios } = useHotelStore();
  const [input, setInput] = useState<OutletProjectionInput>(SAMPLE_PRESETS.RESTAURANT);

  const set = <K extends keyof OutletProjectionInput>(key: K, value: OutletProjectionInput[K]) => setInput((s) => ({ ...s, [key]: value }));

  const result = useMemo(
    () => outletProjectionService.buildProjection(input, locations, tables, rooms, bills, folios),
    [input, locations, tables, rooms, bills, folios],
  );

  const monthColumns: DataTableColumn<MonthlyOutletProjection>[] = [
    { key: 'month', header: 'Month', render: (m) => `M${m.monthIndex} · ${m.monthLabel}` },
    { key: 'ramp', header: 'Ramp', render: (m) => `${Math.round(m.rampPct * 100)}%` },
    { key: 'revenue', header: 'Revenue', render: (m) => inr(m.revenue) },
    { key: 'opex', header: 'Operating Cost', render: (m) => inr(m.opex) },
    { key: 'net', header: 'Net Cash Flow', render: (m) => <span className={m.netCashFlow >= 0 ? 'text-[#23865B] font-semibold' : 'text-[#C94B45] font-semibold'}>{inr(m.netCashFlow)}</span> },
    { key: 'cum', header: 'Cumulative (vs Setup Cost)', render: (m) => <span className={m.cumulativeCashFlow >= 0 ? 'text-[#23865B] font-semibold' : 'text-[#C94B45]'}>{inr(m.cumulativeCashFlow)}</span> },
  ];

  const chartData = result.months.map((m) => ({ label: `M${m.monthIndex}`, revenue: m.revenue, opex: m.opex }));
  const cumData = result.months.map((m) => ({ label: `M${m.monthIndex}`, cumulative: m.cumulativeCashFlow }));

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader
          title="New Outlet Cost Projection"
          subtitle="Feasibility calculator for opening a new outlet — one-time setup cost, monthly operating cost once ramped, and a month-by-month cash flow to setup-cost payback. Revenue is benchmarked from this chain's own comparable outlets, not a generic assumption. Purely a planning tool — nothing here creates a Location, PO, or ledger entry."
        />

        {/* Sample scenario presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[12px] font-semibold text-[#66706B]">Sample scenarios:</span>
          {(Object.keys(SAMPLE_PRESETS) as NewOutletType[]).map((t) => {
            const Icon = OUTLET_TYPE_ICON[t];
            const isActive = input.outletType === t && input.outletName === SAMPLE_PRESETS[t].outletName;
            return (
              <button
                key={t}
                onClick={() => setInput(SAMPLE_PRESETS[t])}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors ${
                  isActive ? 'bg-[#0F5B55] text-white border-[#0F5B55]' : 'bg-white text-[#202522] border-[#E5E2DB] hover:border-[#0F5B55]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {OUTLET_TYPE_LABEL[t]}
              </button>
            );
          })}
        </div>

        {/* Input form */}
        <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
          <h3 className="text-[14px] font-semibold text-[#202522] mb-3">Outlet Parameters</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Outlet Name</label>
              <input className={inputClass} value={input.outletName} onChange={(e) => set('outletName', e.target.value)} placeholder="e.g. Sarjapur Outer Ring Road" />
            </div>
            <div>
              <label className={labelClass}>City</label>
              <input className={inputClass} value={input.city} onChange={(e) => set('city', e.target.value)} placeholder="e.g. Bengaluru" />
            </div>
            <div>
              <label className={labelClass}>City Tier</label>
              <select className={inputClass} value={input.cityTier} onChange={(e) => set('cityTier', e.target.value as CityTier)}>
                {(Object.keys(CITY_TIER_LABEL) as CityTier[]).map((t) => <option key={t} value={t}>{CITY_TIER_LABEL[t]}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Outlet Type</label>
              <select className={inputClass} value={input.outletType} onChange={(e) => set('outletType', e.target.value as NewOutletType)}>
                {(Object.keys(OUTLET_TYPE_LABEL) as NewOutletType[]).map((t) => <option key={t} value={t}>{OUTLET_TYPE_LABEL[t]}</option>)}
              </select>
            </div>
            {input.outletType !== 'HOTEL' && (
              <div>
                <label className={labelClass}>Seating Capacity (covers)</label>
                <input type="number" min={0} className={inputClass} value={input.seatingCapacity} onChange={(e) => set('seatingCapacity', Math.max(0, Number(e.target.value)))} />
              </div>
            )}
            {input.outletType !== 'RESTAURANT' && (
              <div>
                <label className={labelClass}>Room Count</label>
                <input type="number" min={0} className={inputClass} value={input.roomCount} onChange={(e) => set('roomCount', Math.max(0, Number(e.target.value)))} />
              </div>
            )}
            <div>
              <label className={labelClass}>Target Opening Date</label>
              <input type="date" className={inputClass} value={input.targetOpeningDate} onChange={(e) => set('targetOpeningDate', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Ramp-up Period (months to full run-rate)</label>
              <input type="number" min={1} max={12} className={inputClass} value={input.rampMonths} onChange={(e) => set('rampMonths', Math.max(1, Number(e.target.value)))} />
            </div>
          </div>
        </div>

        {/* Benchmark note */}
        <div className="flex items-start gap-2 bg-[#0F5B55]/5 border border-[#0F5B55]/20 rounded-lg px-3.5 py-2.5 text-[12px] text-[#202522]">
          <Info className="w-4 h-4 text-[#0F5B55] flex-shrink-0 mt-0.5" />
          <div>
            Revenue benchmark derived live from this chain&apos;s own outlets: <strong>{inr(result.benchmark.revenuePerSeatPerMonth)}</strong> per seat/month
            (across {result.benchmark.sampleRestaurantOutlets} existing restaurant/dine-in outlets) and <strong>{inr(result.benchmark.revenuePerRoomPerMonth)}</strong> per room/month
            (across {result.benchmark.sampleHotelOutlets} existing hotel outlets) — not a generic industry assumption.
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KpiCard label="Total Setup Cost (Capex)" value={inr(result.totalCapex)} icon={Wallet} />
          <KpiCard label="Monthly Opex (Steady State)" value={inr(result.monthlyOpexAtSteadyState)} icon={TrendingDown} valueColorClass="text-[#C68A28]" />
          <KpiCard label="Steady-State Monthly Revenue" value={inr(result.steadyStateMonthlyRevenue)} icon={TrendingUp} valueColorClass="text-[#23865B]" />
          <KpiCard
            label="Break-even Month"
            value={result.breakEvenMonthIndex ? `Month ${result.breakEvenMonthIndex}` : `Beyond ${input.projectionMonths} mo`}
            icon={Flag}
            valueColorClass={result.breakEvenMonthIndex ? 'text-[#23865B]' : 'text-[#C94B45]'}
          />
          <KpiCard label="Year 1 Net Cash Flow" value={inr(result.year1NetCashFlow)} icon={Scale} valueColorClass={result.year1NetCashFlow >= 0 ? 'text-[#23865B]' : 'text-[#C94B45]'} />
        </div>

        {/* Capex / Opex breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="text-[14px] font-semibold text-[#202522]">Setup Cost (Capex) Breakdown</h3>
            <DataTable
              columns={[
                { key: 'label', header: 'Line Item', render: (l) => l.label },
                { key: 'amount', header: 'Amount', render: (l) => inr(l.amount) },
              ]}
              rows={result.capexLines}
              keyField={(l) => l.label}
              emptyMessage="No capex lines."
            />
          </div>
          <div className="space-y-2">
            <h3 className="text-[14px] font-semibold text-[#202522]">Monthly Operating Cost (Steady State)</h3>
            <DataTable
              columns={[
                { key: 'label', header: 'Line Item', render: (l) => l.label },
                { key: 'amount', header: 'Monthly Amount', render: (l) => inr(l.amount) },
              ]}
              rows={result.opexLines}
              keyField={(l) => l.label}
              emptyMessage="No opex lines."
            />
          </div>
        </div>

        {/* Charts */}
        <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
          <h3 className="text-sm font-semibold text-[#202522] mb-3">Monthly Revenue vs Operating Cost (ramp-up modeled)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E2DB" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#66706B' }} />
              <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: '#66706B' }} />
              <Tooltip formatter={(v: number) => inr(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="revenue" name="Revenue" fill="#23865B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="opex" name="Operating Cost" fill="#C94B45" radius={[4, 4, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
          <h3 className="text-sm font-semibold text-[#202522] mb-3">Cumulative Cash Flow — Payback on Setup Cost</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={cumData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E2DB" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#66706B' }} />
              <YAxis tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} tick={{ fontSize: 11, fill: '#66706B' }} />
              <Tooltip formatter={(v: number) => inr(v)} />
              <ReferenceLine y={0} stroke="#66706B" strokeDasharray="4 4" label={{ value: 'Break-even', position: 'insideTopLeft', fontSize: 11, fill: '#66706B' }} />
              <Line type="monotone" dataKey="cumulative" name="Cumulative Cash Flow" stroke="#0F5B55" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly detail table */}
        <div className="space-y-2">
          <h3 className="text-[14px] font-semibold text-[#202522]">Month-by-Month Projection</h3>
          <DataTable columns={monthColumns} rows={result.months} keyField={(m) => String(m.monthIndex)} emptyMessage="No projection months." />
        </div>
      </div>
    </ShellLayout>
  );
}
