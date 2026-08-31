'use client';

// Shared date-range control for every /reports-analytics page — quick presets anchored to the
// selected business date, plus manual from/to override. Replaces the dashboard's old hardcoded
// 5-date window with something a viewer can actually change.

import React from 'react';

interface DateRangePickerProps {
  fromDate: string;
  toDate: string;
  anchorDate: string; // 'today' for preset math — the selected business date
  onChange: (fromDate: string, toDate: string) => void;
}

function minusDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setDate(d.getDate() - n);
  return d.toISOString().substring(0, 10);
}

function startOfMonth(date: string): string {
  return `${date.substring(0, 7)}-01`;
}

export default function DateRangePicker({ fromDate, toDate, anchorDate, onChange }: DateRangePickerProps) {
  const presets: { label: string; from: string; to: string }[] = [
    { label: 'Today', from: anchorDate, to: anchorDate },
    { label: '7D', from: minusDays(anchorDate, 6), to: anchorDate },
    { label: '30D', from: minusDays(anchorDate, 29), to: anchorDate },
    { label: 'This Month', from: startOfMonth(anchorDate), to: anchorDate },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 bg-white border border-[#E5E2DB] rounded-[10px] p-2.5 shadow-brand-xs">
      {presets.map((p) => (
        <button
          key={p.label}
          onClick={() => onChange(p.from, p.to)}
          className={`px-3 py-1.5 text-[12px] font-semibold rounded-lg ${fromDate === p.from && toDate === p.to ? 'bg-[#0F5B55] text-white' : 'bg-[#F3F0E9] text-[#66706B] hover:bg-[#E5E2DB]'}`}
        >
          {p.label}
        </button>
      ))}
      <div className="w-px h-5 bg-[#E5E2DB] mx-1" />
      <input type="date" value={fromDate} onChange={(e) => onChange(e.target.value, toDate)} className="border border-[#E5E2DB] rounded-lg px-2.5 py-1.5 text-[12px]" />
      <span className="text-[12px] text-[#66706B]">to</span>
      <input type="date" value={toDate} onChange={(e) => onChange(fromDate, e.target.value)} className="border border-[#E5E2DB] rounded-lg px-2.5 py-1.5 text-[12px]" />
    </div>
  );
}
