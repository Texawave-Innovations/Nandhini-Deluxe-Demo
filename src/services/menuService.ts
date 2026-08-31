// Menu domain service: resolves the organization-level Menu Master against an outlet's
// OutletMenuOverride records to produce the effective, sellable menu for that outlet.

import { MenuCategory, MenuItem, OutletMenuOverride } from '@/types/menu';

export interface EffectiveMenuItem extends MenuItem {
  effectivePrice: number;
  effectiveTaxPercent: number;
  isEnabledAtOutlet: boolean;
}

export const menuService = {
  getEffectiveMenu(items: MenuItem[], overrides: OutletMenuOverride[], outletId: string): EffectiveMenuItem[] {
    const overrideByItem = new Map(overrides.filter((o) => o.outletId === outletId).map((o) => [o.menuItemId, o]));
    return items
      .filter((item) => item.status === 'ACTIVE')
      .map((item) => {
        const ovr = overrideByItem.get(item.id);
        return {
          ...item,
          effectivePrice: ovr?.priceOverride ?? item.basePrice,
          effectiveTaxPercent: ovr?.taxPercentOverride ?? item.taxPercent,
          isEnabledAtOutlet: ovr ? ovr.isEnabled : true,
        };
      })
      .filter((item) => item.isEnabledAtOutlet);
  },

  groupByCategory(items: EffectiveMenuItem[], categories: MenuCategory[]) {
    return categories
      .filter((c) => c.status === 'ACTIVE')
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((cat) => ({ category: cat, items: items.filter((i) => i.categoryId === cat.id) }))
      .filter((g) => g.items.length > 0);
  },
};
