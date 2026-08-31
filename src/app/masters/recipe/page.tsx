'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import StatusChip from '@/components/ui/StatusChip';
import { ChefHat, ChevronDown, ChevronUp } from 'lucide-react';
import { useInventoryStore } from '@/store/inventory-store';
import { usePOSStore } from '@/store/pos-store';

export default function RecipeMasterPage() {
  const { recipes, items, uomLabel } = useInventoryStore();
  const { menuItems } = usePOSStore();
  const [expanded, setExpanded] = useState<string | null>(recipes[0]?.id ?? null);

  const menuItemName = (id: string) => menuItems.find((m) => m.id === id)?.name ?? id;
  const itemName = (id: string) => items.find((i) => i.id === id)?.name ?? id;

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader
          title="Recipe / BOM Master"
          subtitle={`${recipes.length} recipes defined. These drive automatic inventory consumption when a POS bill for the linked menu item is generated — the UI never edits stock directly.`}
        />

        <div className="space-y-2.5">
          {recipes.map((r) => {
            const isOpen = expanded === r.id;
            return (
              <div key={r.id} className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs overflow-hidden">
                <button onClick={() => setExpanded(isOpen ? null : r.id)} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#F8F5EE]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0F5B55]/10 text-[#0F5B55] flex items-center justify-center flex-shrink-0"><ChefHat className="w-4 h-4" /></div>
                    <div className="text-left">
                      <div className="text-[14px] font-semibold text-[#202522]">{menuItemName(r.menuItemId)}</div>
                      <div className="text-[11px] text-[#66706B]">Yields {r.yieldQty} serving • v{r.version} • {r.wastagePercent}% wastage buffer</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusChip label={r.status} tone={r.status === 'ACTIVE' ? 'success' : 'neutral'} />
                    {isOpen ? <ChevronUp className="w-4 h-4 text-[#66706B]" /> : <ChevronDown className="w-4 h-4 text-[#66706B]" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-[#E5E2DB] px-4 py-3 bg-[#F8F5EE]">
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr className="text-[11px] uppercase text-[#66706B]">
                          <th className="text-left py-1.5 font-semibold">Ingredient</th>
                          <th className="text-left py-1.5 font-semibold">Qty per Serving</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.ingredients.map((ing, i) => {
                          const item = items.find((it) => it.id === ing.itemId);
                          return (
                            <tr key={i} className="border-t border-[#E5E2DB]">
                              <td className="py-1.5 text-[#202522]">{itemName(ing.itemId)}</td>
                              <td className="py-1.5 text-[#66706B]">{ing.qty} {item ? uomLabel(item.uomId) : ''}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ShellLayout>
  );
}
