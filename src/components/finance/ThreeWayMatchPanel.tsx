// Read-only PO / GRN / Bill comparison grid with a per-line status chip — used in the Vendor
// Bill detail Drawer. Three qty/rate columns per conceptual row don't fit DataTable's
// single-row-per-record model, so this is a bespoke (but visually consistent) grid.

import React from 'react';
import StatusChip from '@/components/ui/StatusChip';
import { ThreeWayMatchResult } from '@/types/finance';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

interface ThreeWayMatchPanelProps {
  matchResult: ThreeWayMatchResult;
  itemName: (itemId: string) => string;
}

export default function ThreeWayMatchPanel({ matchResult, itemName }: ThreeWayMatchPanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-[#202522]">3-Way Match Result</span>
        <StatusChip label={matchResult.status} tone={matchResult.status === 'MATCHED' ? 'success' : 'danger'} />
      </div>
      <div className="bg-white rounded-[10px] border border-[#E5E2DB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-[#F3F0E9] border-b border-[#E5E2DB]">
                <th className="text-left px-3 py-2 font-semibold text-[#66706B] uppercase text-[10px]">Item</th>
                <th className="text-right px-3 py-2 font-semibold text-[#66706B] uppercase text-[10px]">PO Qty</th>
                <th className="text-right px-3 py-2 font-semibold text-[#66706B] uppercase text-[10px]">GRN Qty</th>
                <th className="text-right px-3 py-2 font-semibold text-[#66706B] uppercase text-[10px]">Bill Qty</th>
                <th className="text-right px-3 py-2 font-semibold text-[#66706B] uppercase text-[10px]">PO Rate</th>
                <th className="text-right px-3 py-2 font-semibold text-[#66706B] uppercase text-[10px]">Bill Rate</th>
                <th className="text-right px-3 py-2 font-semibold text-[#66706B] uppercase text-[10px]">Variance</th>
                <th className="text-center px-3 py-2 font-semibold text-[#66706B] uppercase text-[10px]">Status</th>
              </tr>
            </thead>
            <tbody>
              {matchResult.lineResults.map((l) => (
                <tr key={l.itemId} className="border-b border-[#E5E2DB] last:border-0">
                  <td className="px-3 py-2 text-[#202522] font-medium">{itemName(l.itemId)}</td>
                  <td className="px-3 py-2 text-right">{l.poQty}</td>
                  <td className="px-3 py-2 text-right">{l.grnQty}</td>
                  <td className="px-3 py-2 text-right">{l.billQty}</td>
                  <td className="px-3 py-2 text-right">{inr(l.poRate)}</td>
                  <td className="px-3 py-2 text-right">{inr(l.billRate)}</td>
                  <td className="px-3 py-2 text-right">{l.rateVarianceAmount > 0 ? `${inr(l.rateVarianceAmount)} (${l.rateVariancePercent}%)` : '—'}</td>
                  <td className="px-3 py-2 text-center"><StatusChip label={l.lineStatus} tone={l.lineStatus === 'MATCHED' ? 'success' : 'danger'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="text-[12px] text-[#66706B]">Total variance: <span className="font-semibold text-[#202522]">{inr(matchResult.totalVarianceAmount)}</span></div>
    </div>
  );
}
