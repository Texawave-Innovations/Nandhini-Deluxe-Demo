'use client';

import React, { useState } from 'react';
import { Leaf, Beef, Wine, Plus } from 'lucide-react';
import { usePOSStore } from '@/store/pos-store';
import { menuService } from '@/services/menuService';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

interface MenuBrowserProps {
  outletId: string;
  onAddItem: (item: { menuItemId: string; name: string; qty: number; unitPrice: number; taxPercent: number }) => void;
}

export default function MenuBrowser({ outletId, onAddItem }: MenuBrowserProps) {
  const { menuCategories, menuItems, menuOverrides } = usePOSStore();
  const effectiveItems = menuService.getEffectiveMenu(menuItems, menuOverrides, outletId);
  const grouped = menuService.groupByCategory(effectiveItems, menuCategories);

  const [activeCat, setActiveCat] = useState(grouped[0]?.category.id ?? '');
  const activeGroup = grouped.find((g) => g.category.id === activeCat) ?? grouped[0];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 flex-shrink-0">
        {grouped.map((g) => (
          <button
            key={g.category.id}
            onClick={() => setActiveCat(g.category.id)}
            className={`px-4 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-all ${
              activeCat === g.category.id ? 'bg-[#0F5B55] text-white shadow-md' : 'bg-white border border-[#E5E2DB] text-[#202522]'
            }`}
          >
            {g.category.name}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto mt-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {activeGroup?.items.map((item) => (
            <button
              key={item.id}
              onClick={() => onAddItem({ menuItemId: item.id, name: item.name, qty: 1, unitPrice: item.effectivePrice, taxPercent: item.effectiveTaxPercent })}
              className="bg-white border border-[#E5E2DB] rounded-xl p-3.5 text-left hover:border-[#0F5B55] hover:shadow-md transition-all group relative"
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl">{item.imageEmoji}</span>
                {item.isLiquor ? <Wine className="w-3.5 h-3.5 text-[#8b5cf6]" /> : item.isVeg ? <Leaf className="w-3.5 h-3.5 text-[#23865B]" /> : <Beef className="w-3.5 h-3.5 text-[#C94B45]" />}
              </div>
              <div className="text-[13px] font-semibold text-[#202522] mt-2 leading-snug line-clamp-2">{item.name}</div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[14px] font-bold text-[#0F5B55]">{inr(item.effectivePrice)}</span>
                <span className="w-6 h-6 rounded-full bg-[#0F5B55] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
