// Organization-level Menu Master: ~100 items across 9 categories, plus a handful of outlet-level
// price/tax overrides to demonstrate outlet-specific menu configuration.

import { MenuCategory, MenuItem, OutletMenuOverride } from '../types/menu';

export const INITIAL_MENU_CATEGORIES: MenuCategory[] = [
  { id: 'cat-1', code: 'SOUTH-IND', name: 'South Indian', sortOrder: 1, status: 'ACTIVE' },
  { id: 'cat-2', code: 'ANDHRA', name: 'Andhra Specials', sortOrder: 2, status: 'ACTIVE' },
  { id: 'cat-3', code: 'NORTH-IND', name: 'North Indian', sortOrder: 3, status: 'ACTIVE' },
  { id: 'cat-4', code: 'BIRYANI', name: 'Biryani', sortOrder: 4, status: 'ACTIVE' },
  { id: 'cat-5', code: 'STARTERS', name: 'Starters', sortOrder: 5, status: 'ACTIVE' },
  { id: 'cat-6', code: 'MAINS', name: 'Main Course', sortOrder: 6, status: 'ACTIVE' },
  { id: 'cat-7', code: 'BEVERAGES', name: 'Beverages', sortOrder: 7, status: 'ACTIVE' },
  { id: 'cat-8', code: 'DESSERTS', name: 'Desserts', sortOrder: 8, status: 'ACTIVE' },
  { id: 'cat-9', code: 'LIQUOR', name: 'Liquor', sortOrder: 9, status: 'ACTIVE' },
];

type Row = [string, number, boolean, string?]; // name, basePrice, isVeg, emoji

const FOOD_TAX = 5;
const LIQUOR_TAX = 20;

const rows: Record<string, Row[]> = {
  'cat-1': [
    ['Masala Dosa', 120, true, '🥞'], ['Plain Dosa', 90, true, '🥞'], ['Rava Dosa', 140, true, '🥞'],
    ['Onion Uttapam', 110, true, '🥞'], ['Idli Vada Combo', 100, true, '🍘'], ['Mysore Bonda', 90, true, '🍩'],
    ['Kesari Bath', 80, true, '🍮'], ['Pongal', 100, true, '🍚'], ['Rava Idli', 90, true, '🍘'],
    ['Set Dosa (3pc)', 110, true, '🥞'], ['Podi Dosa', 130, true, '🥞'], ['Neer Dosa', 100, true, '🥞'],
  ],
  'cat-2': [
    ['Andhra Chicken Biryani', 320, false, '🍛'], ['Andhra Full Meals', 220, true, '🍽️'],
    ['Gongura Mutton', 380, false, '🍖'], ['Chepala Pulusu (Fish Curry)', 340, false, '🐟'],
    ['Andhra Chicken Curry', 300, false, '🍗'], ['Pesarattu', 120, true, '🥞'],
    ['Gutti Vankaya Curry', 180, true, '🍆'], ['Royyala Iguru (Prawns)', 400, false, '🦐'],
    ['Andhra Ragi Sangati', 90, true, '🍚'], ['Pappu Charu', 110, true, '🍲'],
  ],
  'cat-3': [
    ['Paneer Butter Masala', 260, true, '🧀'], ['Dal Makhani', 220, true, '🍲'], ['Butter Chicken', 340, false, '🍗'],
    ['Chole Bhature', 180, true, '🫓'], ['Shahi Paneer', 270, true, '🧀'], ['Rajma Chawal', 190, true, '🍛'],
    ['Kadai Paneer', 260, true, '🧀'], ['Malai Kofta', 250, true, '🍡'], ['Tandoori Roti', 35, true, '🫓'],
    ['Butter Naan', 45, true, '🫓'], ['Aloo Paratha', 90, true, '🫓'], ['Palak Paneer', 250, true, '🧀'],
  ],
  'cat-4': [
    ['Hyderabadi Chicken Biryani', 340, false, '🍛'], ['Mutton Biryani', 420, false, '🍛'],
    ['Veg Biryani', 220, true, '🍛'], ['Egg Biryani', 240, false, '🍛'], ['Prawns Biryani', 400, false, '🍛'],
    ['Chicken Dum Biryani', 330, false, '🍛'], ['Boneless Chicken Biryani', 360, false, '🍛'],
    ['Kaju Paneer Biryani', 280, true, '🍛'],
  ],
  'cat-5': [
    ['Chicken 65', 260, false, '🍗'], ['Gobi Manchurian', 200, true, '🥦'], ['Chilli Chicken', 280, false, '🍗'],
    ['Chicken Lollipop', 300, false, '🍗'], ['Paneer 65', 240, true, '🧀'], ['Prawns Fry', 380, false, '🦐'],
    ['Fish Fry', 340, false, '🐟'], ['Chicken Kebab', 290, false, '🍢'], ['Veg Manchurian', 190, true, '🥦'],
    ['Crispy Corn', 180, true, '🌽'], ['Mushroom 65', 220, true, '🍄'], ['Chicken Tikka', 310, false, '🍢'],
    ['Egg Roast', 140, false, '🥚'], ['Chicken Manchurian', 290, false, '🍗'],
  ],
  'cat-6': [
    ['Meals (Veg)', 180, true, '🍽️'], ['Meals (Non-Veg)', 260, false, '🍽️'], ['Curd Rice', 100, true, '🍚'],
    ['Sambar Rice', 110, true, '🍚'], ['Vegetable Kurma', 190, true, '🍲'], ['Chicken Curry', 280, false, '🍗'],
    ['Mutton Curry', 380, false, '🍖'], ['Fish Curry', 320, false, '🐟'], ['Egg Curry', 170, false, '🥚'],
    ['Mixed Veg Curry', 180, true, '🥕'],
  ],
  'cat-7': [
    ['Filter Coffee', 60, true, '☕'], ['Masala Chai', 45, true, '🍵'], ['Buttermilk', 40, true, '🥛'],
    ['Sweet Lassi', 90, true, '🥤'], ['Fresh Lime Soda', 70, true, '🥤'], ['Tender Coconut', 80, true, '🥥'],
    ['Badam Milk', 100, true, '🥛'], ['Rose Milk', 80, true, '🥛'], ['Mango Shake', 120, true, '🥤'],
    ['Cold Coffee', 130, true, '🥤'], ['Nannari Sarbath', 70, true, '🥤'], ['Ginger Tea', 45, true, '🍵'],
  ],
  'cat-8': [
    ['Gulab Jamun (2pc)', 80, true, '🍮'], ['Mysore Pak', 90, true, '🟧'], ['Rasmalai (2pc)', 110, true, '🍮'],
    ['Double Ka Meetha', 100, true, '🍮'], ['Kesari', 70, true, '🍮'], ['Payasam', 90, true, '🥣'],
    ['Ice Cream Sundae', 130, true, '🍨'], ['Carrot Halwa', 110, true, '🥕'],
  ],
  'cat-9': [
    ['Kingfisher Beer (Pint)', 220, true, '🍺'], ['Bira White (Pint)', 260, true, '🍺'],
    ['Old Monk Rum (60ml)', 180, true, '🥃'], ['Signature Whisky (60ml)', 260, true, '🥃'],
    ['Red Wine (Glass)', 350, true, '🍷'], ['White Wine (Glass)', 350, true, '🍷'],
    ['Virgin Mojito (Mocktail)', 180, true, '🍹'], ['Blue Lagoon (Mocktail)', 190, true, '🍹'],
    ['Vodka Shot (30ml)', 150, true, '🥃'], ['Gin & Tonic', 280, true, '🍸'],
  ],
};

function buildItems(): MenuItem[] {
  const items: MenuItem[] = [];
  let seq = 1;
  for (const [categoryId, list] of Object.entries(rows)) {
    for (const [name, price, isVeg, emoji] of list) {
      const isLiquor = categoryId === 'cat-9';
      items.push({
        id: `mi-${seq}`,
        code: `MI-${1000 + seq}`,
        name,
        categoryId,
        basePrice: price,
        taxPercent: isLiquor ? LIQUOR_TAX : FOOD_TAX,
        isVeg,
        isLiquor,
        imageEmoji: emoji,
        status: 'ACTIVE',
      });
      seq++;
    }
  }
  return items;
}

export const INITIAL_MENU_ITEMS: MenuItem[] = buildItems();

// A few outlet-specific overrides to demonstrate price/tax configuration per the brief's
// "Masala Dosa: Base ₹120 / Indiranagar ₹125 / Jayanagar ₹120 / Whitefield ₹130" example.
const masalaDosa = INITIAL_MENU_ITEMS.find((m) => m.name === 'Masala Dosa')!;
const chickenBiryani = INITIAL_MENU_ITEMS.find((m) => m.name === 'Andhra Chicken Biryani')!;

export const INITIAL_OUTLET_MENU_OVERRIDES: OutletMenuOverride[] = [
  { id: 'ovr-1', outletId: 'loc-1', menuItemId: masalaDosa.id, isEnabled: true, priceOverride: 125 },
  { id: 'ovr-2', outletId: 'loc-10', menuItemId: masalaDosa.id, isEnabled: true, priceOverride: 130 },
  { id: 'ovr-3', outletId: 'loc-16', menuItemId: chickenBiryani.id, isEnabled: true, priceOverride: 340 },
  { id: 'ovr-4', outletId: 'loc-13', menuItemId: INITIAL_MENU_ITEMS.find((m) => m.isLiquor)!.id, isEnabled: false },
];
