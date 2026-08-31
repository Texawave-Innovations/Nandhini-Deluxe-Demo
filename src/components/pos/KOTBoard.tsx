'use client';

import React from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { KOT, KOTStatus } from '@/types/pos';

const COLUMNS: { status: KOTStatus; label: string; accent: string }[] = [
  { status: 'NEW', label: 'New', accent: 'border-t-[#C94B45]' },
  { status: 'ACCEPTED', label: 'Accepted', accent: 'border-t-[#C68A28]' },
  { status: 'PREPARING', label: 'Preparing', accent: 'border-t-[#3377A8]' },
  { status: 'READY', label: 'Ready', accent: 'border-t-[#23865B]' },
  { status: 'SERVED', label: 'Served', accent: 'border-t-[#66706B]' },
];

const NEXT_LABEL: Partial<Record<KOTStatus, string>> = {
  NEW: 'Accept', ACCEPTED: 'Start Preparing', PREPARING: 'Mark Ready', READY: 'Mark Served',
};

interface KOTBoardProps {
  kots: KOT[];
  onAdvance: (kot: KOT) => void;
}

export default function KOTBoard({ kots, onAdvance }: KOTBoardProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {COLUMNS.map((col) => {
        const colKots = kots.filter((k) => k.status === col.status).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
        return (
          <div key={col.status} className="space-y-2.5">
            <div className={`bg-white rounded-t-lg border-t-4 ${col.accent} border-x border-b border-[#E5E2DB] px-3 py-2 flex items-center justify-between`}>
              <span className="text-[12px] font-bold uppercase tracking-wide text-[#202522]">{col.label}</span>
              <span className="text-[11px] font-semibold text-[#66706B] bg-[#F3F0E9] rounded-full px-1.5">{colKots.length}</span>
            </div>
            <div className="space-y-2.5 min-h-[100px]">
              {colKots.map((k) => (
                <div key={k.id} className="bg-white rounded-lg border border-[#E5E2DB] p-3 shadow-brand-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-[#0F5B55]">{k.kotNumber}</span>
                    {k.tableCode && <span className="text-[11px] font-semibold bg-[#F3F0E9] rounded px-1.5 py-0.5">{k.tableCode}</span>}
                  </div>
                  <ul className="mt-1.5 space-y-0.5">
                    {k.items.map((it, i) => (
                      <li key={i} className="text-[12px] text-[#202522]">{it.qty}× {it.name}</li>
                    ))}
                  </ul>
                  {k.items.some((it) => it.instructions) && (
                    <div className="text-[10px] text-[#C68A28] mt-1 italic">
                      {k.items.filter((it) => it.instructions).map((it) => it.instructions).join('; ')}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2 text-[10px] text-[#66706B]">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(k.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {NEXT_LABEL[k.status] && (
                    <button onClick={() => onAdvance(k)} className="w-full mt-2 py-1.5 bg-[#0F5B55] hover:bg-[#08463F] text-white text-[11px] font-semibold rounded-md flex items-center justify-center gap-1">
                      {NEXT_LABEL[k.status]} <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
