// Recipe / BOM Master — links a sellable Menu Item to the Inventory Items it consumes.
// POS never touches inventory directly: a served/billed sale raises a ConsumptionEvent that is
// computed from the active Recipe and posted to the Stock Ledger by recipeService.consumeForSale.

import { Status } from './erp-core';

export interface RecipeIngredient {
  itemId: string;
  qty: number; // per 1 serving (yieldQty), in the item's base UOM
}

export interface Recipe {
  id: string;
  menuItemId: string;
  name: string;
  version: number;
  yieldQty: number; // servings produced by the ingredient quantities below
  wastagePercent: number;
  ingredients: RecipeIngredient[];
  outletId?: string; // set for an outlet-specific override, undefined = organization default
  effectiveFrom: string;
  status: Status;
}

export interface ConsumptionEvent {
  id: string;
  billId: string;
  orderId: string;
  outletId: string;
  menuItemId: string;
  menuItemName: string;
  qtySold: number;
  recipeId: string;
  ingredientsConsumed: { itemId: string; itemName: string; qty: number; uomCode: string }[];
  createdAt: string;
}
