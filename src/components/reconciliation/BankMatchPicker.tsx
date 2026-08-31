'use client';

// Modal body listing candidate POS/channel/vendor payments for manual bank-line matching.

import React, { useState } from 'react';
import { MatchSourceType } from '@/types/reconciliation';

export interface MatchCandidate {
  type: MatchSourceType;
  id: string;
  label: string;
  amount: number;
  date: string;
}

interface BankMatchPickerProps {
  candidates: MatchCandidate[];
  onConfirm: (candidate: MatchCandidate) => void;
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function BankMatchPicker({ candidates, onConfirm }: BankMatchPickerProps) {
  const [selectedId, setSelectedId] = useState<string | undefined>(candidates[0]?.id);

  if (candidates.length === 0) {
    return <div className="text-[13px] text-[#66706B] text-center py-6">No candidate payments found within ±7 days. Try adjusting the date range or match manually offline.</div>;
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {candidates.map((c) => (
          <label key={c.id} className={`flex items-center justify-between gap-3 p-3 rounded-lg border cursor-pointer ${selectedId === c.id ? 'border-[#0F5B55] bg-[#0F5B55]/5' : 'border-[#E5E2DB]'}`}>
            <div className="flex items-center gap-3">
              <input type="radio" name="match-candidate" checked={selectedId === c.id} onChange={() => setSelectedId(c.id)} />
              <div>
                <div className="text-[13px] font-medium text-[#202522]">{c.label}</div>
                <div className="text-[11px] text-[#66706B]">{c.date} • {c.type.replace('_', ' ')}</div>
              </div>
            </div>
            <div className="text-[13px] font-semibold text-[#202522]">{inr(c.amount)}</div>
          </label>
        ))}
      </div>
      <button
        onClick={() => { const chosen = candidates.find((c) => c.id === selectedId); if (chosen) onConfirm(chosen); }}
        className="w-full px-4 py-2 bg-[#0F5B55] hover:bg-[#08463F] text-white text-[13px] font-semibold rounded-[8px]"
      >
        Confirm Match
      </button>
    </div>
  );
}
