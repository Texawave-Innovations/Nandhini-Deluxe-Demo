// Inventory Item Master (80 items across 12 categories) + deterministic opening stock generator.
// Opening stock/batches are computed (not hand-authored) so every outlet's Main Kitchen Store has
// realistic, varied — but reproducible — starting balances, including a few intentional low-stock
// and expiring-batch items to drive the dashboard alerts.

import { InventoryCategory, InventoryItem, StockLedgerEntry, StockBatch, UOM } from '../types/inventory';
import { Location } from '../types/erp-core';

export const INITIAL_UOMS: UOM[] = [
  { id: 'uom-kg', code: 'KG', name: 'Kilogram' },
  { id: 'uom-g', code: 'G', name: 'Gram' },
  { id: 'uom-l', code: 'L', name: 'Litre' },
  { id: 'uom-ml', code: 'ML', name: 'Millilitre' },
  { id: 'uom-pc', code: 'PC', name: 'Piece' },
  { id: 'uom-dz', code: 'DZ', name: 'Dozen' },
];

export const INITIAL_INVENTORY_CATEGORIES: InventoryCategory[] = [
  { id: 'ic-1', name: 'Grains & Rice' }, { id: 'ic-2', name: 'Meat & Poultry' },
  { id: 'ic-3', name: 'Seafood' }, { id: 'ic-4', name: 'Vegetables' },
  { id: 'ic-5', name: 'Dairy' }, { id: 'ic-6', name: 'Spices & Masala' },
  { id: 'ic-7', name: 'Oils & Fats' }, { id: 'ic-8', name: 'Beverages Base' },
  { id: 'ic-9', name: 'Bakery' }, { id: 'ic-10', name: 'Liquor Stock' },
  { id: 'ic-11', name: 'Packaging & Disposables' }, { id: 'ic-12', name: 'Cleaning & Consumables' },
];

// [name, uomId, standardCost, reorderLevel, reorderQty, isPerishable]
type Row = [string, string, number, number, number, boolean];

const rows: Record<string, Row[]> = {
  'ic-1': [
    ['Basmati Rice', 'uom-kg', 95, 40, 100, false], ['Sona Masoori Rice', 'uom-kg', 60, 50, 100, false],
    ['Idli Rice', 'uom-kg', 55, 30, 80, false], ['Toor Dal', 'uom-kg', 140, 20, 50, false],
    ['Urad Dal', 'uom-kg', 130, 20, 50, false], ['Chana Dal', 'uom-kg', 110, 15, 40, false],
    ['Moong Dal', 'uom-kg', 120, 15, 40, false], ['Rava / Semolina', 'uom-kg', 50, 20, 50, false],
  ],
  'ic-2': [
    ['Chicken (Whole)', 'uom-kg', 210, 30, 80, true], ['Chicken Boneless', 'uom-kg', 280, 25, 70, true],
    ['Mutton Curry Cut', 'uom-kg', 620, 15, 40, true], ['Eggs', 'uom-dz', 78, 10, 30, true],
    ['Chicken Liver', 'uom-kg', 180, 5, 15, true], ['Chicken Wings', 'uom-kg', 240, 10, 25, true],
    ['Chicken Mince', 'uom-kg', 260, 8, 20, true], ['Chicken Drumstick', 'uom-kg', 250, 12, 30, true],
  ],
  'ic-3': [
    ['Prawns', 'uom-kg', 480, 8, 20, true], ['Fish - Rohu', 'uom-kg', 260, 8, 20, true],
    ['Fish - Vanjaram (Seer)', 'uom-kg', 720, 5, 15, true], ['Crab', 'uom-kg', 420, 4, 10, true],
    ['Squid', 'uom-kg', 380, 4, 10, true], ['Fish - Pomfret', 'uom-kg', 640, 4, 10, true],
  ],
  'ic-4': [
    ['Onion', 'uom-kg', 32, 60, 150, true], ['Tomato', 'uom-kg', 38, 50, 120, true],
    ['Potato', 'uom-kg', 28, 50, 120, true], ['Green Chilli', 'uom-kg', 60, 10, 25, true],
    ['Ginger', 'uom-kg', 90, 8, 20, true], ['Garlic', 'uom-kg', 140, 10, 25, true],
    ['Capsicum', 'uom-kg', 55, 10, 25, true], ['Cauliflower', 'uom-kg', 40, 12, 30, true],
    ['Brinjal', 'uom-kg', 35, 10, 25, true], ['Coriander Leaves', 'uom-kg', 45, 5, 15, true],
    ['Mint Leaves', 'uom-kg', 55, 3, 10, true], ['Curry Leaves', 'uom-kg', 60, 2, 8, true],
  ],
  'ic-5': [
    ['Milk', 'uom-l', 58, 30, 80, true], ['Curd', 'uom-kg', 65, 15, 40, true],
    ['Paneer', 'uom-kg', 320, 10, 25, true], ['Butter', 'uom-kg', 480, 8, 20, true],
    ['Ghee', 'uom-kg', 560, 8, 20, false], ['Fresh Cream', 'uom-l', 340, 6, 15, true],
    ['Cheese', 'uom-kg', 420, 5, 12, true], ['Buttermilk Base', 'uom-l', 40, 8, 20, true],
  ],
  'ic-6': [
    ['Turmeric Powder', 'uom-kg', 260, 5, 12, false], ['Red Chilli Powder', 'uom-kg', 320, 6, 15, false],
    ['Coriander Powder', 'uom-kg', 220, 5, 12, false], ['Garam Masala', 'uom-kg', 480, 4, 10, false],
    ['Biryani Masala', 'uom-kg', 520, 4, 10, false], ['Chicken 65 Masala', 'uom-kg', 460, 3, 8, false],
    ['Mustard Seeds', 'uom-kg', 180, 3, 8, false], ['Cumin Seeds', 'uom-kg', 340, 3, 8, false],
    ['Salt', 'uom-kg', 20, 15, 40, false], ['Black Pepper', 'uom-kg', 620, 2, 6, false],
  ],
  'ic-7': [
    ['Refined Sunflower Oil', 'uom-l', 130, 30, 80, false], ['Groundnut Oil', 'uom-l', 165, 15, 40, false],
    ['Coconut Oil', 'uom-l', 210, 8, 20, false], ['Butter Oil (Vanaspati)', 'uom-l', 145, 6, 15, false],
  ],
  'ic-8': [
    ['Coffee Decoction', 'uom-l', 220, 10, 25, true], ['Tea Powder', 'uom-kg', 380, 5, 12, false],
    ['Sugar', 'uom-kg', 44, 30, 80, false], ['Badam Mix', 'uom-kg', 480, 3, 8, false],
    ['Rose Syrup', 'uom-l', 180, 4, 10, false], ['Nannari Syrup', 'uom-l', 190, 3, 8, false],
  ],
  'ic-9': [
    ['Maida (Refined Flour)', 'uom-kg', 42, 20, 50, false], ['Bread Loaf', 'uom-pc', 45, 15, 40, true],
    ['Naan Dough Mix', 'uom-kg', 60, 10, 25, true], ['Baking Powder', 'uom-kg', 220, 2, 6, false],
  ],
  'ic-10': [
    ['Kingfisher Beer Keg', 'uom-l', 140, 20, 50, false], ['Bira White Case (24x)', 'uom-pc', 2400, 4, 10, false],
    ['Old Monk Bottle (750ml)', 'uom-pc', 480, 6, 15, false], ['Whisky Bottle (750ml)', 'uom-pc', 950, 6, 15, false],
    ['Red Wine Bottle (750ml)', 'uom-pc', 1200, 4, 10, false], ['White Wine Bottle (750ml)', 'uom-pc', 1200, 4, 10, false],
  ],
  'ic-11': [
    ['Takeaway Box 500ml', 'uom-pc', 4, 200, 500, false], ['Takeaway Box 1000ml', 'uom-pc', 6, 150, 400, false],
    ['Paper Bags', 'uom-pc', 2, 200, 500, false], ['Aluminium Foil Roll', 'uom-pc', 180, 5, 15, false],
    ['Disposable Cutlery Pack', 'uom-pc', 3, 150, 400, false], ['Napkins Pack', 'uom-pc', 45, 20, 50, false],
  ],
  'ic-12': [
    ['Dishwash Liquid', 'uom-l', 90, 10, 25, false], ['Garbage Bags Pack', 'uom-pc', 120, 10, 25, false],
  ],
};

function buildItems(): InventoryItem[] {
  const items: InventoryItem[] = [];
  let seq = 1;
  for (const [categoryId, list] of Object.entries(rows)) {
    for (const [name, uomId, cost, reorderLevel, reorderQty, perishable] of list) {
      items.push({
        id: `inv-${seq}`,
        code: `ITM-${1000 + seq}`,
        name,
        categoryId,
        uomId,
        isPerishable: perishable,
        reorderLevel,
        reorderQty,
        standardCost: cost,
        status: 'ACTIVE',
      });
      seq++;
    }
  }
  return items;
}

export const INITIAL_INVENTORY_ITEMS: InventoryItem[] = buildItems();

// Deterministic pseudo-random in [0,1) — avoids Math.random() so seeded data is stable across
// server/client render passes (no hydration mismatches).
function seeded(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export interface OpeningStockResult {
  ledgerEntries: StockLedgerEntry[];
  batches: StockBatch[];
}

// aiInsightsService.suggestReorders sums stock ORG-WIDE across every store (not per-outlet —
// see that function's own comment), so the "~1 in 9 items pinned low" per-outlet dip below can
// never actually surface a reorder insight: with 17 inventory-carrying stores, the ~16 stores
// that roll a normal (1.5x-3x reorder level) quantity for that same item swamp the one low store.
// This set forces a handful of items low at EVERY store simultaneously — a genuine org-wide dip —
// so AI Insights -> Inventory has real, varied (HIGH/MEDIUM) reorder suggestions on day one,
// spread across categories rather than depending on per-outlet luck. Value = target org-wide
// stock as a fraction of reorderLevel (suggestReorders: <=0 or <50% of reorderLevel -> HIGH,
// otherwise MEDIUM).
const ORG_WIDE_LOW_STOCK_ITEMS: Record<string, number> = {
  'Prawns': 0,
  'Paneer': 0.1,
  'Maida (Refined Flour)': 0.2,
  'Turmeric Powder': 0.35,
  'Dishwash Liquid': 0.55,
  'Refined Sunflower Oil': 0.6,
  'Coffee Decoction': 0.75,
  'Whisky Bottle (750ml)': 0.9,
};

// aiInsightsService.detectConsumptionAnomalies needs >=5 "older" days + >=3 "recent" days of real
// CONSUMPTION history per outlet+item before it will flag anything (see that function's own
// comment) — the seed can't rely on live usage to build that up before a demo, so it's backfilled
// here for a spread of outlet+item pairs (not just one), each with a genuine recent-week spike, so
// the Inventory category of AI Insights shows multiple anomalies across different outlets.
const CONSUMPTION_ANOMALY_PINS: { outletId: string; itemName: string; openingQty: number; recentDailyBase: number; olderDailyBase: number }[] = [
  { outletId: 'loc-1', itemName: 'Chicken (Whole)', openingQty: 320, recentDailyBase: 10.5, olderDailyBase: 8 },
  { outletId: 'loc-3', itemName: 'Basmati Rice', openingQty: 260, recentDailyBase: 13, olderDailyBase: 9.5 },
  { outletId: 'loc-10', itemName: 'Onion', openingQty: 400, recentDailyBase: 22, olderDailyBase: 15 },
  { outletId: 'loc-16', itemName: 'Milk', openingQty: 300, recentDailyBase: 17, olderDailyBase: 12 },
];

// Generates opening stock for every outlet/central-kitchen store that carries inventory.
// A few items are deliberately pinned below reorder level (low stock) and a few perishable
// batches deliberately pinned near/at expiry, so Dashboard + Inventory alert screens have data.
export function generateOpeningStock(locations: Location[]): OpeningStockResult {
  const ledgerEntries: StockLedgerEntry[] = [];
  const batches: StockBatch[] = [];
  const stores = locations.filter((l) => l.features.hasInventoryStore);
  let ledgerSeq = 1;
  let batchSeq = 1;

  stores.forEach((outlet, outletIdx) => {
    INITIAL_INVENTORY_ITEMS.forEach((item, itemIdx) => {
      const idx = outletIdx * 97 + itemIdx;
      const r = seeded(idx + 1);
      // Base opening quantity around ~1.5x-3x reorder level, with ~1 in 9 items pinned low
      // per-outlet (feeds outlet-scoped low-stock views elsewhere in Inventory/Dashboard).
      const isForcedLow = idx % 9 === 0;
      const orgWideLowFraction = ORG_WIDE_LOW_STOCK_ITEMS[item.name];
      // Pinned AI-insight continuity items (see CONSUMPTION_ANOMALY_PINS + the backfilled
      // CONSUMPTION history below) need a larger opening balance — they get ~28 days of history
      // with no offsetting GRN receipts replayed into the ledger, unlike a normal item.
      const anomalyPin = CONSUMPTION_ANOMALY_PINS.find((p) => p.outletId === outlet.id && p.itemName === item.name);
      const qty = anomalyPin
        ? anomalyPin.openingQty
        : orgWideLowFraction !== undefined
        ? Math.round(item.reorderLevel * orgWideLowFraction * (0.85 + r * 0.3) / stores.length)
        : isForcedLow
        ? Math.round(item.reorderLevel * (0.35 + r * 0.4))
        : Math.round(item.reorderLevel * (1.5 + r * 2));

      ledgerEntries.push({
        id: `sl-${ledgerSeq++}`,
        outletId: outlet.id,
        storeName: 'Main Kitchen Store',
        itemId: item.id,
        entryType: 'OPENING',
        qty,
        balanceAfter: qty,
        refType: 'MANUAL',
        remarks: 'Opening balance (demo seed)',
        createdBy: 'System Seed',
        createdAt: '2026-08-01T06:00:00.000Z',
      });

      if (item.isPerishable && idx % 11 === 0) {
        const expiryOffsetDays = idx % 22 === 0 ? -1 : 2; // occasionally already expired, else expiring soon
        const expiry = new Date('2026-08-30T00:00:00.000Z');
        expiry.setDate(expiry.getDate() + expiryOffsetDays);
        batches.push({
          id: `batch-${batchSeq++}`,
          outletId: outlet.id,
          itemId: item.id,
          batchNo: `B-${outlet.code}-${item.code}`,
          mfgDate: '2026-08-20',
          expiryDate: expiry.toISOString().substring(0, 10),
          qty: Math.max(1, Math.round(qty * 0.3)),
          vendorName: 'ABC Foods Pvt Ltd',
          grnRef: `GRN-${outlet.code}-0${batchSeq}`,
        });
      }
    });
  });

  // Pinned AI-insight continuity: backfill four weeks of real CONSUMPTION history for each
  // CONSUMPTION_ANOMALY_PINS entry, with a genuine spike in the most recent 7 days — so
  // aiInsightsService.detectConsumptionAnomalies has a real trailing-average comparison to report
  // on day one, spread across multiple outlets rather than a single fictional hardcoded line.
  CONSUMPTION_ANOMALY_PINS.forEach((pin, pinIdx) => {
    const pinnedOutlet = stores.find((s) => s.id === pin.outletId);
    const pinnedItem = INITIAL_INVENTORY_ITEMS.find((it) => it.name === pin.itemName);
    if (!pinnedOutlet || !pinnedItem) return;
    const openingEntry = ledgerEntries.find((e) => e.outletId === pinnedOutlet.id && e.itemId === pinnedItem.id && e.entryType === 'OPENING');
    let balance = openingEntry?.balanceAfter ?? pin.openingQty;
    for (let daysAgoN = 28; daysAgoN >= 1; daysAgoN--) {
      const isRecentWeek = daysAgoN <= 7;
      const r = seeded(pinIdx * 131 + daysAgoN * 7 + 3);
      const base = isRecentWeek ? pin.recentDailyBase : pin.olderDailyBase;
      const dailyQty = Math.round((base + (r - 0.5) * base * 0.15) * 10) / 10;
      const entryDate = new Date('2026-08-30T20:00:00.000Z');
      entryDate.setDate(entryDate.getDate() - daysAgoN);
      balance = Math.round((balance - dailyQty) * 1000) / 1000;
      ledgerEntries.push({
        id: `sl-${ledgerSeq++}`,
        outletId: pinnedOutlet.id,
        storeName: 'Main Kitchen Store',
        itemId: pinnedItem.id,
        entryType: 'CONSUMPTION',
        qty: -dailyQty,
        balanceAfter: balance,
        refType: 'MANUAL',
        remarks: 'Historical demo consumption (recipe-driven, backfilled for trend realism)',
        createdBy: 'System Seed',
        createdAt: entryDate.toISOString(),
      });
    }
  });

  return { ledgerEntries, batches };
}
