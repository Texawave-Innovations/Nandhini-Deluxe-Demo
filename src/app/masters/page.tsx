'use client';

import React from 'react';
import Link from 'next/link';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import {
  Building2, MapPin, ListFilter, ShieldCheck, UtensilsCrossed, ChefHat, Package, Table2, ArrowRight,
} from 'lucide-react';

const MASTER_GROUPS = [
  {
    title: 'Organization',
    items: [
      { name: 'Business Units', href: '/organization/business-units', icon: ListFilter, desc: 'Restaurants, Hotels & Banquets, Central Kitchen, Corporate' },
      { name: 'Departments', href: '/organization/departments', icon: ListFilter, desc: 'F&B, Kitchen, Front Office, Housekeeping, Finance...' },
      { name: 'Roles & Designations', href: '/organization/roles', icon: ShieldCheck, desc: '19 roles across management, operations, kitchen & support' },
    ],
  },
  {
    title: 'Outlet & POS',
    items: [
      { name: 'Outlet Master', href: '/masters/outlets', icon: MapPin, desc: '16 Bangalore outlets — Restaurant, Hotel, Banquet, Hybrid' },
      { name: 'POS Counters & Tables', href: '/masters/pos-counters', icon: Table2, desc: 'Counters, dining floors and table layout per outlet' },
    ],
  },
  {
    title: 'Menu & Recipe',
    items: [
      { name: 'Menu Master', href: '/masters/menu', icon: UtensilsCrossed, desc: '96 items across 9 categories, with outlet price/tax overrides' },
      { name: 'Recipe / BOM', href: '/masters/recipe', icon: ChefHat, desc: 'Ingredient bill-of-materials driving automatic stock consumption' },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { name: 'Inventory Items & UOM', href: '/masters/inventory-items', icon: Package, desc: '80 items across 12 categories with reorder levels' },
    ],
  },
];

export default function MastersHubPage() {
  return (
    <ShellLayout>
      <div className="space-y-6">
        <SectionHeader title="Masters" subtitle="Centralized configuration shared across every outlet — edit once, apply organization-wide (with outlet-level overrides where relevant)." />
        {MASTER_GROUPS.map((group) => (
          <div key={group.title} className="space-y-2.5">
            <div className="text-[12px] font-semibold uppercase tracking-wide text-[#66706B]">{group.title}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.items.map((item) => (
                <Link key={item.href} href={item.href} className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs hover:border-[#0F5B55] hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-lg bg-[#0F5B55]/10 text-[#0F5B55] flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4.5 h-4.5" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#66706B]/40 group-hover:text-[#0F5B55] group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="text-[14px] font-semibold text-[#202522] mt-2.5">{item.name}</div>
                  <div className="text-[12px] text-[#66706B] mt-0.5 leading-snug">{item.desc}</div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ShellLayout>
  );
}
