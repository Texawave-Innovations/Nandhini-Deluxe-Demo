// Recipe / consumption domain service — the concrete link behind "POS Sale -> Recipe -> Stock
// Ledger". POS never edits inventory; consumeForSale is the only path that produces consumption
// stock-ledger entries, and it is always driven by a served/billed line item.

import { InventoryItem } from '@/types/inventory';
import { Recipe, ConsumptionEvent } from '@/types/recipe';

export const recipeService = {
  // Outlet-specific recipe override wins over the organization default for the same menu item.
  resolveRecipe(recipes: Recipe[], menuItemId: string, outletId: string): Recipe | undefined {
    return (
      recipes.find((r) => r.menuItemId === menuItemId && r.outletId === outletId && r.status === 'ACTIVE') ||
      recipes.find((r) => r.menuItemId === menuItemId && !r.outletId && r.status === 'ACTIVE')
    );
  },

  consumeForSale(params: {
    billId: string; orderId: string; outletId: string; menuItemId: string; menuItemName: string; qtySold: number;
    recipes: Recipe[]; inventoryItems: InventoryItem[]; uomLabel: (uomId: string) => string;
  }): ConsumptionEvent | null {
    const recipe = recipeService.resolveRecipe(params.recipes, params.menuItemId, params.outletId);
    if (!recipe) return null;

    const servingsFactor = params.qtySold / recipe.yieldQty;
    const wastageFactor = 1 + recipe.wastagePercent / 100;

    const ingredientsConsumed = recipe.ingredients.map((ing) => {
      const item = params.inventoryItems.find((i) => i.id === ing.itemId);
      const qty = Math.round(ing.qty * servingsFactor * wastageFactor * 1000) / 1000;
      return { itemId: ing.itemId, itemName: item?.name ?? ing.itemId, qty, uomCode: item ? params.uomLabel(item.uomId) : '' };
    });

    return {
      id: `cev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      billId: params.billId,
      orderId: params.orderId,
      outletId: params.outletId,
      menuItemId: params.menuItemId,
      menuItemName: params.menuItemName,
      qtySold: params.qtySold,
      recipeId: recipe.id,
      ingredientsConsumed,
      createdAt: new Date().toISOString(),
    };
  },
};
