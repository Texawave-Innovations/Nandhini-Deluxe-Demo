'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export interface HRSubItem {
  name: string;
  href: string;
}

export interface HRCategory {
  category: string;
  items: HRSubItem[];
}

export const hrCategories: HRCategory[] = [
  {
    category: 'OVERVIEW',
    items: [
      { name: 'Dashboard', href: '/dashboard' }
    ]
  },
  {
    category: 'RECRUITMENT',
    items: [
      { name: 'ATS', href: '/hr/recruitment' }
    ]
  },
  {
    category: 'PEOPLE & ORG',
    items: [
      { name: 'Employees', href: '/employees' },
      { name: 'Units', href: '/organization/business-units' },
      { name: 'Locations', href: '/organization/locations' },
      { name: 'Departments', href: '/organization/departments' },
      { name: 'Roles', href: '/organization/roles' },
      { name: 'Org Hierarchy', href: '/hr/org-chart' }
    ]
  },
  {
    category: 'TIME & ATTENDANCE',
    items: [
      { name: 'Shift Master', href: '/shifts/master' },
      { name: 'Shift Templates', href: '/shifts/templates' },
      { name: 'Roster Grid', href: '/roster/monthly' },
      { name: 'Manpower Planning', href: '/roster/manpower-planning' },
      { name: 'Live Punch', href: '/attendance/today' },
      { name: 'Attendance Register', href: '/attendance/register' },
      { name: 'Regularization', href: '/attendance/regularization' },
      { name: 'FMP', href: '/hr/fmp' }
    ]
  },
  {
    category: 'LEAVE MANAGEMENT',
    items: [
      { name: 'Leaves & Quotas', href: '/leave' }
    ]
  },
  {
    category: 'PAYROLL & STATUTORY',
    items: [
      { name: 'PF', href: '/hr/pf' },
      { name: 'ESI', href: '/hr/esi' },
      { name: 'Loans', href: '/hr/loans' },
      { name: 'Bonus', href: '/hr/bonus' },
      { name: 'Overtime', href: '/overtime' },
      { name: 'Reports', href: '/reports' }
    ]
  },
  {
    category: 'OPERATIONS & ESS',
    items: [
      { name: 'Shift Swap', href: '/shift-swap' },
      { name: 'Banquet Events', href: '/banquet/events' },
      { name: 'HR Tickets', href: '/hr/tickets' },
      { name: 'Expense Claims', href: '/hr/expenses' },
      { name: 'Offboarding', href: '/hr/exit' },
      { name: 'Workflows', href: '/workflows' },
      { name: 'Audit Trail', href: '/audit' }
    ]
  }
];

export default function TopHRNav() {
  const pathname = usePathname();
  const router = useRouter();

  // Find active category based on current pathname
  const initialCategory = hrCategories.find(cat =>
    cat.items.some(item => item.href === pathname)
  )?.category || 'PEOPLE & ORG';

  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);

  // Sync active category when pathname changes
  useEffect(() => {
    const matchingCategory = hrCategories.find(cat =>
      cat.items.some(item => item.href === pathname)
    )?.category;
    if (matchingCategory) {
      setActiveCategory(matchingCategory);
    }
  }, [pathname]);

  const handleCategoryClick = (cat: HRCategory) => {
    setActiveCategory(cat.category);
    // Automatically navigate to the default (first) sub-tab inside the category
    if (cat.items && cat.items.length > 0) {
      const firstSubItem = cat.items[0];
      if (firstSubItem.href !== pathname) {
        router.push(firstSubItem.href);
      }
    }
  };

  const currentCategoryObj = hrCategories.find(c => c.category === activeCategory) || hrCategories[2];

  return (
    <div className="bg-white border-b border-[#E5E2DB] shadow-xs px-6 py-2.5 flex flex-col gap-2">
      {/* Line 1: Top Category Headers */}
      <div className="flex items-center gap-6 overflow-x-auto text-[13px] font-semibold tracking-[0.05em] uppercase select-none border-b border-[#E5E2DB]/60 pb-1 scrollbar-none">
        {hrCategories.map((cat) => {
          const isCatSelected = cat.category === activeCategory;
          const hasActivePath = cat.items.some(item => item.href === pathname);

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

      {/* Line 2: Sub-tabs of the active category on a separate line below Line 1 */}
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
