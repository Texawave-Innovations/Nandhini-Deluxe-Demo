// Purchase Order + GRN historical seed: a spread of statuses across outlets/vendors over the
// last ~6 weeks so /purchase looks like a live pipeline day one. These historical GRNs are
// self-contained Purchase-domain records (for PO/GRN/Bill/Payment/Tally realism); they are not
// replayed into the Inventory stock ledger — that live wiring is exercised by a freshly-posted
// GRN going through purchase-store.postGRN -> inventory-store.receiveGRNStock during the demo.

import { Location } from '../types/erp-core';
import { InventoryItem } from '../types/inventory';
import { Vendor } from '../types/vendor';
import { GRN, GRNLineItem, POLineItem, POStatus, PurchaseOrder } from '../types/purchase';

function seeded(n: number): number {
  const x = Math.sin(n * 45.164) * 71892.113;
  return x - Math.floor(x);
}

const VENDOR_CATEGORY_TO_INV_CATEGORY: Record<string, string> = {
  GROCERY: 'ic-1', MEAT_POULTRY: 'ic-2', SEAFOOD: 'ic-3', VEGETABLES: 'ic-4', DAIRY: 'ic-5',
  SPICES: 'ic-6', OILS_FATS: 'ic-7', BEVERAGES: 'ic-8', BAKERY: 'ic-9', LIQUOR: 'ic-10',
  PACKAGING: 'ic-11', CLEANING: 'ic-12',
};

const BASE_DATE = '2026-08-30';

function daysAgo(n: number): string {
  const d = new Date(`${BASE_DATE}T09:00:00.000Z`);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export interface PurchaseSeedResult {
  purchaseOrders: PurchaseOrder[];
  grns: GRN[];
}

interface StatusGroup {
  status: POStatus;
  count: number;
  minDays: number;
  maxDays: number;
  receivePortion: 'NONE' | 'PARTIAL' | 'FULL';
}

const GROUPS: StatusGroup[] = [
  { status: 'DRAFT', count: 4, minDays: 1, maxDays: 4, receivePortion: 'NONE' },
  { status: 'SUBMITTED', count: 4, minDays: 3, maxDays: 6, receivePortion: 'NONE' },
  { status: 'APPROVED', count: 4, minDays: 5, maxDays: 9, receivePortion: 'NONE' },
  { status: 'PARTIALLY_RECEIVED', count: 6, minDays: 10, maxDays: 20, receivePortion: 'PARTIAL' },
  { status: 'RECEIVED', count: 6, minDays: 15, maxDays: 30, receivePortion: 'FULL' },
  { status: 'CLOSED', count: 4, minDays: 25, maxDays: 40, receivePortion: 'FULL' },
  { status: 'CANCELLED', count: 2, minDays: 5, maxDays: 15, receivePortion: 'NONE' },
];

export function generatePurchaseSeed(locations: Location[], vendors: Vendor[], items: InventoryItem[]): PurchaseSeedResult {
  const stores = locations.filter((l) => l.features.hasInventoryStore);
  const purchaseOrders: PurchaseOrder[] = [];
  const grns: GRN[] = [];
  let poSeq = 1;
  let grnSeq = 1;
  let globalIdx = 0;

  GROUPS.forEach((group) => {
    for (let g = 0; g < group.count; g++) {
      const idx = globalIdx++;
      const r = seeded(idx + 1);
      const outlet = stores[idx % stores.length];
      const vendor = vendors[idx % vendors.length];
      const catId = VENDOR_CATEGORY_TO_INV_CATEGORY[vendor.category];
      const catItems = items.filter((it) => it.categoryId === catId);
      const lineCount = catItems.length >= 3 ? 2 + (idx % 2) : 1;
      const chosenItems = Array.from({ length: lineCount }).map((_, li) => catItems[(idx * 3 + li) % catItems.length]).filter(Boolean);

      const daysAgoForRequest = Math.round(group.minDays + r * (group.maxDays - group.minDays));
      const requestedAt = daysAgo(daysAgoForRequest);
      const approvedAt = daysAgo(Math.max(0, daysAgoForRequest - 1));

      const lines: POLineItem[] = chosenItems.map((item) => ({
        itemId: item.id, orderedQty: item.reorderQty, rate: item.standardCost, receivedQty: 0,
      }));
      const totalAmount = Math.round(lines.reduce((s, l) => s + l.orderedQty * l.rate, 0) * 100) / 100;

      const isDraftOrSubmitted = group.status === 'DRAFT' || group.status === 'SUBMITTED';
      const po: PurchaseOrder = {
        id: `po-${poSeq}`, poNumber: `PO-${1000 + poSeq}`, vendorId: vendor.id, outletId: outlet.id,
        lines, totalAmount, status: group.status,
        requestedBy: 'Purchase Manager', requestedAt,
        // Firebase's set() rejects any object containing a literal `undefined` value, so
        // approvedBy/approvedAt must be OMITTED (not set to undefined) when not yet approved.
        ...(isDraftOrSubmitted ? {} : { approvedBy: 'Outlet Manager', approvedAt }),
      };
      poSeq++;

      if (group.receivePortion !== 'NONE') {
        const receiveFraction = group.receivePortion === 'PARTIAL' ? 0.5 : 1;
        const grnLines: GRNLineItem[] = lines.map((l) => {
          const receivedQty = Math.max(1, Math.round(l.orderedQty * receiveFraction));
          return {
            itemId: l.itemId, orderedQty: l.orderedQty, receivedQty, rate: l.rate,
            batchNo: `B-${outlet.code}-${l.itemId}-${grnSeq}`, lineTotal: Math.round(receivedQty * l.rate * 100) / 100,
          };
        });
        po.lines = po.lines.map((l, li) => ({ ...l, receivedQty: grnLines[li].receivedQty }));

        const grn: GRN = {
          id: `grn-${grnSeq}`, grnNumber: `GRN-${1000 + grnSeq}`, poId: po.id, vendorId: vendor.id, outletId: outlet.id,
          lines: grnLines, totalAmount: Math.round(grnLines.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100,
          status: 'POSTED', receivedBy: 'Outlet Manager', receivedAt: daysAgo(Math.max(0, daysAgoForRequest - 3)),
          invoiceRefNo: `INV-${vendor.code}-${grnSeq}`,
        };
        grns.push(grn);
        grnSeq++;
      }

      purchaseOrders.push(po);
    }
  });

  // Pin one fully-received bulk grocery order for ABC Foods Pvt Ltd at the Central Kitchen, sized
  // so its (deliberately unpaid) bill lands at exactly the outstanding figure the dashboard's
  // pre-existing AI-alert copy already names ("ABC Foods Pvt Ltd has ₹2.5L outstanding due within
  // two days") — mirrors the pos.seed.ts precedent of pinning one fixed worked example.
  const centralKitchen = locations.find((l) => l.id === 'loc-5') ?? stores[0];
  const pinnedItem = items.find((it) => it.id === 'inv-1') ?? items[0];
  const pinnedPO: PurchaseOrder = {
    id: 'po-abc-pin', poNumber: 'PO-9001', vendorId: 'vnd-1', outletId: centralKitchen.id,
    lines: [{ itemId: pinnedItem.id, orderedQty: 2500, rate: 100, receivedQty: 2500 }],
    totalAmount: 250000, status: 'RECEIVED',
    requestedBy: 'Purchase Manager', requestedAt: daysAgo(20), approvedBy: 'Outlet Manager', approvedAt: daysAgo(19),
  };
  const pinnedGRN: GRN = {
    id: 'grn-abc-pin', grnNumber: 'GRN-9001', poId: pinnedPO.id, vendorId: 'vnd-1', outletId: centralKitchen.id,
    lines: [{ itemId: pinnedItem.id, orderedQty: 2500, receivedQty: 2500, rate: 100, batchNo: 'B-PEEN-CK-PIN', lineTotal: 250000 }],
    totalAmount: 250000, status: 'POSTED', receivedBy: 'Outlet Manager', receivedAt: daysAgo(18), invoiceRefNo: 'INV-VND-1001-PIN',
  };
  purchaseOrders.push(pinnedPO);
  grns.push(pinnedGRN);

  return { purchaseOrders, grns };
}
