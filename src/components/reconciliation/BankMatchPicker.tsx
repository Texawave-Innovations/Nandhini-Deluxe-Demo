'use client';

// Modal body listing candidate POS/channel/vendor/customer payments for manual bank-line
// matching. Two modes: single-select (pick exactly one candidate, the common case) and split
// (allocate the bank line's amount across several candidates — e.g. one NEFT batch credit
// covering multiple customer payments).

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
  bankAmount: number;
  onConfirm: (candidate: MatchCandidate) => void;
  onConfirmSplit: (allocations: { candidate: MatchCandidate; amount: number }[]) => void;
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function BankMatchPicker({ candidates, bankAmount, onConfirm, onConfirmSplit }: BankMatchPickerProps) {
  const [splitMode, setSplitMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>(candidates[0]?.id);
  const [splitSelected, setSplitSelected] = useState<Record<string, string>>({}); // candidateId -> amount string

  if (candidates.length === 0) {
    return <div className="text-[13px] text-[#66706B] text-center py-6">No candidate payments found within ±7 days. Try adjusting the date range or match manually offline.</div>;
  }

  const toggleSplit = (c: MatchCandidate) => {
    setSplitSelected((s) => {
      const next = { ...s };
      if (c.id in next) delete next[c.id];
      else next[c.id] = String(Math.min(c.amount, bankAmount));
      return next;
    });
  };
  const totalAllocated = Object.values(splitSelected).reduce((s, v) => s + (parseFloat(v) || 0), 0);

  return (
    <div className="space-y-3">
      <button onClick={() => setSplitMode((s) => !s)} className="text-[11px] font-semibold text-[#0F5B55]">
        {splitMode ? '← Back to single match' : 'Split across multiple sources instead →'}
      </button>

      {!splitMode ? (
        <>
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
        </>
      ) : (
        <>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {candidates.map((c) => {
              const checked = c.id in splitSelected;
              return (
                <div key={c.id} className={`flex items-center gap-3 p-3 rounded-lg border ${checked ? 'border-[#0F5B55] bg-[#0F5B55]/5' : 'border-[#E5E2DB]'}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggleSplit(c)} />
                  <div className="flex-1">
                    <div className="text-[13px] font-medium text-[#202522]">{c.label}</div>
                    <div className="text-[11px] text-[#66706B]">{c.date} • {c.type.replace('_', ' ')} • full amount {inr(c.amount)}</div>
                  </div>
                  {checked && (
                    <input
                      type="number" min="0" step="0.01" value={splitSelected[c.id]}
                      onChange={(e) => setSplitSelected((s) => ({ ...s, [c.id]: e.target.value }))}
                      className="w-28 border border-[#E5E2DB] rounded-lg px-2 py-1.5 text-[13px] text-right"
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-[12px] px-1">
            <span className="text-[#66706B]">Bank line amount: {inr(bankAmount)}</span>
            <span className={Math.abs(totalAllocated - bankAmount) < 0.01 ? 'text-[#23865B] font-semibold' : 'text-[#C68A28] font-semibold'}>Allocated: {inr(totalAllocated)}</span>
          </div>
          <button
            disabled={Object.keys(splitSelected).length < 2}
            onClick={() => onConfirmSplit(Object.entries(splitSelected).map(([id, amt]) => ({ candidate: candidates.find((c) => c.id === id)!, amount: parseFloat(amt) || 0 })))}
            className="w-full px-4 py-2 bg-[#0F5B55] hover:bg-[#08463F] disabled:opacity-40 text-white text-[13px] font-semibold rounded-[8px]"
          >
            Confirm Split Match ({Object.keys(splitSelected).length})
          </button>
        </>
      )}
    </div>
  );
}
