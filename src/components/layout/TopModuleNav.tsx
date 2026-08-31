'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { resolveActiveModule, NavCategory } from '@/constants/navigation';

// Generalized replacement for the legacy TopHRNav: renders the active module's category/sub-tab
// bar by matching the current pathname (via constants/navigation.ts). The HR categories that used
// to be hardcoded here now live in navigation.ts as the 'hrms' module's categories, unchanged.
export default function TopModuleNav() {
  const pathname = usePathname();
  const router = useRouter();
  const activeModule = resolveActiveModule(pathname);
  const categories: NavCategory[] = activeModule?.categories ?? [];

  const initialCategory = categories.find((cat) => cat.items.some((item) => item.href === pathname))?.category || categories[0]?.category;
  const [activeCategory, setActiveCategory] = useState<string | undefined>(initialCategory);

  useEffect(() => {
    const matching = categories.find((cat) => cat.items.some((item) => item.href === pathname))?.category;
    setActiveCategory(matching || categories[0]?.category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, activeModule?.id]);

  if (!activeModule || categories.length === 0) return null;

  const handleCategoryClick = (cat: NavCategory) => {
    setActiveCategory(cat.category);
    const firstSubItem = cat.items[0];
    if (firstSubItem && firstSubItem.href !== pathname) {
      router.push(firstSubItem.href);
    }
  };

  const currentCategoryObj = categories.find((c) => c.category === activeCategory) || categories[0];

  return (
    <div className="bg-white border-b border-[#E5E2DB] shadow-xs px-6 py-2.5 flex flex-col gap-2">
      <div className="flex items-center gap-6 overflow-x-auto text-[13px] font-semibold tracking-[0.05em] uppercase select-none border-b border-[#E5E2DB]/60 pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isCatSelected = cat.category === activeCategory;
          const hasActivePath = cat.items.some((item) => item.href === pathname);
          return (
            <button
              key={cat.category}
              onClick={() => handleCategoryClick(cat)}
              className={`transition-all whitespace-nowrap pb-1.5 ${
                isCatSelected || hasActivePath
                  ? 'text-[#0F5B55] border-b-2 border-[#0F5B55] font-semibold'
                  : 'text-[#66706B] hover:text-[#202522] border-b-2 border-transparent'
              }`}
            >
              {cat.category}
            </button>
          );
        })}
      </div>

      {currentCategoryObj && (
        <div className="flex items-center gap-2 overflow-x-auto select-none scrollbar-none py-0.5">
          {currentCategoryObj.items.map((sub) => {
            const isSubActive = pathname === sub.href;
            return (
              <Link
                key={sub.name}
                href={sub.href}
                className={`px-3.5 py-1 rounded-full text-[13px] leading-5 font-medium transition-all whitespace-nowrap ${
                  isSubActive
                    ? 'bg-[#0F5B55] text-white shadow-brand-xs border border-[#0F5B55]'
                    : 'bg-[#F3F0E9]/80 text-[#202522] hover:bg-[#F3F0E9] border border-[#E5E2DB]'
                }`}
              >
                {sub.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
