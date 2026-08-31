'use client';

// Generalizes the inline add/remove-row line-item editor already hand-rolled in
// inventory/transfer/page.tsx into one reusable component shared by PO, GRN, and Bill-from-GRN
// creation forms.

import React from 'react';
import { Trash2 } from 'lucide-react';

export interface LineItemRow {
  itemId: string;
  qty: number;
  rate?: number;
  referenceQty?: number; // e.g. the PO's ordered qty, shown read-only alongside the editable qty
}

interface ItemOption {
  id: string;
  name: string;
}

interface LineItemEditorProps {
  lines: LineItemRow[];
  itemOptions: ItemOption[];
  onChange: (lines: LineItemRow[]) => void;
  showRate?: boolean;
  showReferenceQty?: boolean;
  qtyLabel?: string;
  allowAddRemove?: boolean;
}

export default function LineItemEditor({ lines, itemOptions, onChange, showRate, showReferenceQty, qtyLabel = 'Qty', allowAddRemove = true }: LineItemEditorProps) {
  const updateLine = (i: number, patch: Partial<LineItemRow>) => {
    onChange(lines.map((l, li) => li === i ? { ...l, ...patch } : l));
  };

  return (
    <div className="space-y-2">
      {lines.map((line, i) => (
        <div key={i} className="flex items-center gap-2">
          <select
            value={line.itemId} disabled={!allowAddRemove}
            onChange={(e) => updateLine(i, { itemId: e.target.value })}
            className="flex-1 border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px] disabled:bg-[#F3F0E9]"
          >
            {itemOptions.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
          </select>
          {showReferenceQty && (
            <div className="w-24 text-[12px] text-[#66706B] text-center">Ord: {line.referenceQty ?? 0}</div>
          )}
          <input
            type="number" value={line.qty} placeholder={qtyLabel}
            onChange={(e) => updateLine(i, { qty: Number(e.target.value) })}
            className="w-24 border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]"
          />
          {showRate && (
            <input
              type="number" value={line.rate ?? 0} placeholder="Rate"
              onChange={(e) => updateLine(i, { rate: Number(e.target.value) })}
              className="w-24 border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]"
            />
          )}
          {allowAddRemove && (
            <button onClick={() => onChange(lines.filter((_, li) => li !== i))} className="p-2 text-[#C94B45] hover:bg-red-50 rounded">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
      {allowAddRemove && (
        <button
          onClick={() => onChange([...lines, { itemId: itemOptions[0]?.id ?? '', qty: 1, rate: 0 }])}
          className="text-[12px] text-[#0F5B55] font-semibold"
        >
          + Add another item
        </button>
      )}
    </div>
  );
}
