// Organization-level Menu Master + Outlet-level configuration overrides.
// Base menu (MenuCategory/MenuItem) is defined once at the org level; individual outlets can
// enable/disable an item, override its price/tax, or restrict its availability window.

import { Status } from './erp-core';

export interface MenuCategory {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  status: Status;
}

export interface MenuItem {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  description?: string;
  basePrice: number;
  taxPercent: number; // GST-style flat rate applied unless outlet-overridden
  isVeg: boolean;
  isLiquor?: boolean;
  imageEmoji?: string; // lightweight visual cue for the POS tile grid
  tags?: string[];
  status: Status;
}

export interface OutletMenuOverride {
  id: string;
  outletId: string;
  menuItemId: string;
  isEnabled: boolean;
  priceOverride?: number;
  taxPercentOverride?: number;
  availableFrom?: string; // HH:mm
  availableTo?: string; // HH:mm
}
