// Recipe / BOM Master for the signature POS demo items. Menu items without a recipe here simply
// don't trigger inventory consumption yet (a real rollout would define recipes for the full menu).

import { Recipe } from '../types/recipe';

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'rcp-1', menuItemId: 'mi-13', name: 'Andhra Chicken Biryani', version: 1, yieldQty: 1, wastagePercent: 3,
    ingredients: [
      { itemId: 'inv-1', qty: 0.25 }, { itemId: 'inv-9', qty: 0.3 }, { itemId: 'inv-53', qty: 0.03 },
      { itemId: 'inv-23', qty: 0.05 }, { itemId: 'inv-47', qty: 0.02 }, { itemId: 'inv-36', qty: 0.04 },
    ],
    effectiveFrom: '2026-01-01', status: 'ACTIVE',
  },
  {
    id: 'rcp-2', menuItemId: 'mi-1', name: 'Masala Dosa', version: 1, yieldQty: 1, wastagePercent: 4,
    ingredients: [
      { itemId: 'inv-3', qty: 0.15 }, { itemId: 'inv-5', qty: 0.05 }, { itemId: 'inv-25', qty: 0.12 },
      { itemId: 'inv-53', qty: 0.02 }, { itemId: 'inv-23', qty: 0.02 },
    ],
    effectiveFrom: '2026-01-01', status: 'ACTIVE',
  },
  {
    id: 'rcp-3', menuItemId: 'mi-43', name: 'Chicken 65', version: 1, yieldQty: 1, wastagePercent: 3,
    ingredients: [
      { itemId: 'inv-10', qty: 0.25 }, { itemId: 'inv-48', qty: 0.02 }, { itemId: 'inv-53', qty: 0.05 }, { itemId: 'inv-36', qty: 0.03 },
    ],
    effectiveFrom: '2026-01-01', status: 'ACTIVE',
  },
  {
    id: 'rcp-4', menuItemId: 'mi-23', name: 'Paneer Butter Masala', version: 1, yieldQty: 1, wastagePercent: 2,
    ingredients: [
      { itemId: 'inv-37', qty: 0.2 }, { itemId: 'inv-38', qty: 0.03 }, { itemId: 'inv-24', qty: 0.15 },
      { itemId: 'inv-40', qty: 0.03 }, { itemId: 'inv-46', qty: 0.01 },
    ],
    effectiveFrom: '2026-01-01', status: 'ACTIVE',
  },
  {
    id: 'rcp-5', menuItemId: 'mi-67', name: 'Filter Coffee', version: 1, yieldQty: 1, wastagePercent: 1,
    ingredients: [{ itemId: 'inv-57', qty: 0.03 }, { itemId: 'inv-35', qty: 0.15 }, { itemId: 'inv-59', qty: 0.02 }],
    effectiveFrom: '2026-01-01', status: 'ACTIVE',
  },
  {
    id: 'rcp-6', menuItemId: 'mi-35', name: 'Hyderabadi Chicken Biryani', version: 1, yieldQty: 1, wastagePercent: 3,
    ingredients: [
      { itemId: 'inv-1', qty: 0.25 }, { itemId: 'inv-10', qty: 0.28 }, { itemId: 'inv-53', qty: 0.03 },
      { itemId: 'inv-23', qty: 0.06 }, { itemId: 'inv-47', qty: 0.02 }, { itemId: 'inv-36', qty: 0.05 },
    ],
    effectiveFrom: '2026-01-01', status: 'ACTIVE',
  },
  {
    id: 'rcp-7', menuItemId: 'mi-32', name: 'Butter Naan', version: 1, yieldQty: 1, wastagePercent: 2,
    ingredients: [{ itemId: 'inv-63', qty: 0.08 }, { itemId: 'inv-38', qty: 0.015 }],
    effectiveFrom: '2026-01-01', status: 'ACTIVE',
  },
  {
    id: 'rcp-8', menuItemId: 'mi-59', name: 'Curd Rice', version: 1, yieldQty: 1, wastagePercent: 2,
    ingredients: [{ itemId: 'inv-2', qty: 0.15 }, { itemId: 'inv-36', qty: 0.1 }],
    effectiveFrom: '2026-01-01', status: 'ACTIVE',
  },
  {
    id: 'rcp-9', menuItemId: 'mi-79', name: 'Gulab Jamun (2pc)', version: 1, yieldQty: 1, wastagePercent: 2,
    ingredients: [{ itemId: 'inv-63', qty: 0.05 }, { itemId: 'inv-59', qty: 0.06 }, { itemId: 'inv-39', qty: 0.02 }],
    effectiveFrom: '2026-01-01', status: 'ACTIVE',
  },
  {
    id: 'rcp-10', menuItemId: 'mi-45', name: 'Chilli Chicken', version: 1, yieldQty: 1, wastagePercent: 3,
    ingredients: [
      { itemId: 'inv-10', qty: 0.25 }, { itemId: 'inv-29', qty: 0.05 }, { itemId: 'inv-23', qty: 0.03 }, { itemId: 'inv-53', qty: 0.04 },
    ],
    effectiveFrom: '2026-01-01', status: 'ACTIVE',
  },
  {
    id: 'rcp-11', menuItemId: 'mi-25', name: 'Butter Chicken', version: 1, yieldQty: 1, wastagePercent: 3,
    ingredients: [
      { itemId: 'inv-10', qty: 0.28 }, { itemId: 'inv-38', qty: 0.04 }, { itemId: 'inv-24', qty: 0.15 },
      { itemId: 'inv-40', qty: 0.03 }, { itemId: 'inv-46', qty: 0.01 },
    ],
    effectiveFrom: '2026-01-01', status: 'ACTIVE',
  },
  {
    id: 'rcp-12', menuItemId: 'mi-36', name: 'Mutton Biryani', version: 1, yieldQty: 1, wastagePercent: 4,
    ingredients: [
      { itemId: 'inv-1', qty: 0.25 }, { itemId: 'inv-11', qty: 0.32 }, { itemId: 'inv-53', qty: 0.03 },
      { itemId: 'inv-23', qty: 0.06 }, { itemId: 'inv-47', qty: 0.02 }, { itemId: 'inv-36', qty: 0.05 },
    ],
    effectiveFrom: '2026-01-01', status: 'ACTIVE',
  },
];
