// Inventory + Recipe domain store. All stock movement goes through postLedgerEntry (or the
// consumeForOrderItems event handler below) — components never mutate stock balances directly.

import { create } from 'zustand';
import { InventoryItem, StockBatch, StockLedgerEntry, StockLedgerEntryType, StockTransfer } from '@/types/inventory';
import { Recipe, ConsumptionEvent } from '@/types/recipe';
import { INITIAL_UOMS, INITIAL_INVENTORY_CATEGORIES, INITIAL_INVENTORY_ITEMS, generateOpeningStock } from '@/mock-data/inventory.seed';
import { INITIAL_RECIPES } from '@/mock-data/recipe.seed';
import { inventoryService } from '@/services/inventoryService';
import { recipeService } from '@/services/recipeService';
import { firebaseDataService } from '@/services/firebaseDataService';
import { useHRMSStore } from '@/store/hrms-store';

interface InventoryState {
  isHydrated: boolean;
  uoms: typeof INITIAL_UOMS;
  categories: typeof INITIAL_INVENTORY_CATEGORIES;
  items: InventoryItem[];
  ledgerEntries: StockLedgerEntry[];
  batches: StockBatch[];
  transfers: StockTransfer[];
  recipes: Recipe[];
  consumptionEvents: ConsumptionEvent[];

  initializeFromFirebase: () => Promise<void>;
  uomLabel: (uomId: string) => string;

  postLedgerEntry: (params: { outletId: string; storeName: string; itemId: string; entryType: StockLedgerEntryType; qty: number; refType?: StockLedgerEntry['refType']; refId?: string; batchNo?: string; remarks?: string; createdBy: string }) => void;

  // The single entry point from POS -> Inventory: given a closed order's items, resolves each
  // item's Recipe and posts CONSUMPTION ledger entries + a ConsumptionEvent per line.
  consumeForOrderItems: (params: { billId: string; orderId: string; outletId: string; items: { menuItemId: string; name: string; qty: number }[] }) => void;

  // The single entry point from Sales -> Inventory: the third mirror of the same event-driven
  // pattern (after consumeForOrderItems for POS and receiveGRNStock for Purchase). Fulfilling a
  // Sales Order resolves the same Recipe/BOM engine and posts CONSUMPTION entries with
  // refType 'SALES_ORDER' — sales-store never touches the ledger directly.
  consumeForSalesOrder: (params: { salesOrderId: string; salesOrderNumber: string; outletId: string; createdBy: string; items: { menuItemId: string; name: string; qty: number }[] }) => void;

  // The single entry point from Purchase -> Inventory: given a posted GRN's receipt lines, posts
  // PURCHASE ledger entries (refType 'GRN') and StockBatch rows. Mirrors consumeForOrderItems's
  // batched-write pattern — purchase-store never touches the ledger directly.
  receiveGRNStock: (params: {
    grnId: string; grnNumber: string; outletId: string; storeName?: string; createdBy: string;
    lines: { itemId: string; qty: number; batchNo?: string; expiryDate?: string; vendorId: string; vendorName: string }[];
  }) => void;

  recordWastage: (outletId: string, itemId: string, qty: number, remarks: string, createdBy: string) => void;
  recordAdjustment: (outletId: string, itemId: string, qty: number, remarks: string, createdBy: string) => void;

  requestTransfer: (sourceOutletId: string, destinationOutletId: string, items: { itemId: string; qty: number }[], requestedBy: string) => void;
  advanceTransfer: (transferId: string, actor: string) => void;

  addRecipe: (recipe: Omit<Recipe, 'id'>) => void;
  updateRecipe: (id: string, data: Partial<Recipe>) => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  isHydrated: false,
  uoms: INITIAL_UOMS,
  categories: INITIAL_INVENTORY_CATEGORIES,
  items: INITIAL_INVENTORY_ITEMS,
  ledgerEntries: [],
  batches: [],
  transfers: [],
  recipes: INITIAL_RECIPES,
  consumptionEvents: [],

  uomLabel: (uomId) => get().uoms.find((u) => u.id === uomId)?.code ?? '',

  initializeFromFirebase: async () => {
    if (get().isHydrated) return;
    try {
      const locations = useHRMSStore.getState().locations;
      const seeded = generateOpeningStock(locations);

      const fbLedger = await firebaseDataService.fetchRecord('erp/inventory/ledgerEntries');
      const fbBatches = await firebaseDataService.fetchRecord('erp/inventory/batches');
      const fbTransfers = await firebaseDataService.fetchRecord('erp/inventory/transfers');
      const fbConsumption = await firebaseDataService.fetchRecord('erp/inventory/consumptionEvents');

      set({
        ledgerEntries: fbLedger && fbLedger.length > 0 ? fbLedger : seeded.ledgerEntries,
        batches: fbBatches && fbBatches.length > 0 ? fbBatches : seeded.batches,
        transfers: fbTransfers || [],
        consumptionEvents: fbConsumption || [],
        isHydrated: true,
      });

      if (!fbLedger || fbLedger.length === 0) {
        firebaseDataService.saveRecord('erp/inventory/ledgerEntries', seeded.ledgerEntries);
        firebaseDataService.saveRecord('erp/inventory/batches', seeded.batches);
      }
    } catch (e) {
      console.warn('Inventory hydration warning, using local seed:', e);
      const seeded = generateOpeningStock(useHRMSStore.getState().locations);
      set({ ledgerEntries: seeded.ledgerEntries, batches: seeded.batches, isHydrated: true });
    }
  },

  postLedgerEntry: (params) => {
    const priorBalance = inventoryService.getBalanceForItem(get().ledgerEntries, params.outletId, params.itemId);
    const entry = inventoryService.buildLedgerEntry({ ...params, priorBalance });
    set((state) => {
      const updated = [...state.ledgerEntries, { ...entry, id: `sl-${Date.now()}-${Math.floor(Math.random() * 1000)}` }];
      firebaseDataService.saveRecord('erp/inventory/ledgerEntries', updated);
      return { ledgerEntries: updated };
    });
  },

  consumeForOrderItems: (params) => {
    const { recipes, items: invItems, uomLabel } = get();
    const events: ConsumptionEvent[] = [];
    const newLedgerEntries: StockLedgerEntry[] = [];

    params.items.forEach((line) => {
      const event = recipeService.consumeForSale({
        billId: params.billId, orderId: params.orderId, outletId: params.outletId,
        menuItemId: line.menuItemId, menuItemName: line.name, qtySold: line.qty,
        recipes, inventoryItems: invItems, uomLabel,
      });
      if (!event) return;
      events.push(event);
      event.ingredientsConsumed.forEach((ing) => {
        const priorBalance = inventoryService.getBalanceForItem([...get().ledgerEntries, ...newLedgerEntries], params.outletId, ing.itemId);
        const entry = inventoryService.buildLedgerEntry({
          outletId: params.outletId, storeName: 'Main Kitchen Store', itemId: ing.itemId, entryType: 'CONSUMPTION',
          qty: -ing.qty, priorBalance, refType: 'BILL', refId: params.billId,
          remarks: `Auto-consumed for ${line.qty}x ${line.name}`, createdBy: 'System (Recipe Engine)',
        });
        newLedgerEntries.push({ ...entry, id: `sl-${Date.now()}-${Math.floor(Math.random() * 10000)}` });
      });
    });

    if (events.length === 0 && newLedgerEntries.length === 0) return;
    set((state) => {
      const updatedLedger = [...state.ledgerEntries, ...newLedgerEntries];
      const updatedEvents = [...state.consumptionEvents, ...events];
      firebaseDataService.saveRecord('erp/inventory/ledgerEntries', updatedLedger);
      firebaseDataService.saveRecord('erp/inventory/consumptionEvents', updatedEvents);
      return { ledgerEntries: updatedLedger, consumptionEvents: updatedEvents };
    });
  },

  consumeForSalesOrder: (params) => {
    const { recipes, items: invItems, uomLabel } = get();
    const events: ConsumptionEvent[] = [];
    const newLedgerEntries: StockLedgerEntry[] = [];

    params.items.forEach((line) => {
      const event = recipeService.consumeForSale({
        billId: params.salesOrderId, orderId: params.salesOrderId, outletId: params.outletId,
        menuItemId: line.menuItemId, menuItemName: line.name, qtySold: line.qty,
        recipes, inventoryItems: invItems, uomLabel,
      });
      if (!event) return;
      events.push(event);
      event.ingredientsConsumed.forEach((ing) => {
        const priorBalance = inventoryService.getBalanceForItem([...get().ledgerEntries, ...newLedgerEntries], params.outletId, ing.itemId);
        const entry = inventoryService.buildLedgerEntry({
          outletId: params.outletId, storeName: 'Main Kitchen Store', itemId: ing.itemId, entryType: 'CONSUMPTION',
          qty: -ing.qty, priorBalance, refType: 'SALES_ORDER', refId: params.salesOrderId,
          remarks: `Auto-consumed for ${line.qty}x ${line.name} (${params.salesOrderNumber})`, createdBy: params.createdBy,
        });
        newLedgerEntries.push({ ...entry, id: `sl-${Date.now()}-${Math.floor(Math.random() * 10000)}` });
      });
    });

    if (events.length === 0 && newLedgerEntries.length === 0) return;
    set((state) => {
      const updatedLedger = [...state.ledgerEntries, ...newLedgerEntries];
      const updatedEvents = [...state.consumptionEvents, ...events];
      firebaseDataService.saveRecord('erp/inventory/ledgerEntries', updatedLedger);
      firebaseDataService.saveRecord('erp/inventory/consumptionEvents', updatedEvents);
      return { ledgerEntries: updatedLedger, consumptionEvents: updatedEvents };
    });
  },

  receiveGRNStock: (params) => {
    const newLedgerEntries: StockLedgerEntry[] = [];
    const newBatches: StockBatch[] = [];
    const storeName = params.storeName ?? 'Main Kitchen Store';

    params.lines.forEach((line) => {
      const priorBalance = inventoryService.getBalanceForItem([...get().ledgerEntries, ...newLedgerEntries], params.outletId, line.itemId);
      const entry = inventoryService.buildLedgerEntry({
        outletId: params.outletId, storeName, itemId: line.itemId, entryType: 'PURCHASE', qty: line.qty,
        priorBalance, refType: 'GRN', refId: params.grnId, batchNo: line.batchNo,
        remarks: `Received via ${params.grnNumber} from ${line.vendorName}`, createdBy: params.createdBy,
      });
      newLedgerEntries.push({ ...entry, id: `sl-${Date.now()}-${Math.floor(Math.random() * 10000)}` });

      if (line.batchNo) {
        newBatches.push({
          id: `batch-${Date.now()}-${Math.floor(Math.random() * 10000)}`, outletId: params.outletId, itemId: line.itemId,
          batchNo: line.batchNo, expiryDate: line.expiryDate, qty: line.qty, vendorId: line.vendorId,
          vendorName: line.vendorName, grnRef: params.grnNumber,
        });
      }
    });

    if (newLedgerEntries.length === 0) return;
    set((state) => {
      const updatedLedger = [...state.ledgerEntries, ...newLedgerEntries];
      const updatedBatches = [...state.batches, ...newBatches];
      firebaseDataService.saveRecord('erp/inventory/ledgerEntries', updatedLedger);
      firebaseDataService.saveRecord('erp/inventory/batches', updatedBatches);
      return { ledgerEntries: updatedLedger, batches: updatedBatches };
    });
  },

  recordWastage: (outletId, itemId, qty, remarks, createdBy) => {
    get().postLedgerEntry({ outletId, storeName: 'Main Kitchen Store', itemId, entryType: 'WASTAGE', qty: -Math.abs(qty), refType: 'MANUAL', remarks, createdBy });
  },
  recordAdjustment: (outletId, itemId, qty, remarks, createdBy) => {
    get().postLedgerEntry({ outletId, storeName: 'Main Kitchen Store', itemId, entryType: 'ADJUSTMENT', qty, refType: 'MANUAL', remarks, createdBy });
  },

  requestTransfer: (sourceOutletId, destinationOutletId, items, requestedBy) => {
    const transfer: StockTransfer = {
      id: `trf-${Date.now()}`, transferNumber: inventoryService.generateTransferNumber(),
      sourceOutletId, destinationOutletId, items, status: 'REQUESTED', requestedBy, requestedAt: new Date().toISOString(),
    };
    set((state) => {
      const updated = [transfer, ...state.transfers];
      firebaseDataService.saveRecord('erp/inventory/transfers', updated);
      return { transfers: updated };
    });
  },

  advanceTransfer: (transferId, actor) => {
    const transfer = get().transfers.find((t) => t.id === transferId);
    if (!transfer) return;
    const next = inventoryService.nextTransferStatus(transfer.status);
    if (!next) return;

    if (next === 'DISPATCHED') {
      transfer.items.forEach((line) => {
        get().postLedgerEntry({ outletId: transfer.sourceOutletId, storeName: 'Main Kitchen Store', itemId: line.itemId, entryType: 'TRANSFER_OUT', qty: -line.qty, refType: 'TRANSFER', refId: transfer.id, remarks: `Dispatched to ${transfer.destinationOutletId}`, createdBy: actor });
      });
    }
    if (next === 'RECEIVED') {
      transfer.items.forEach((line) => {
        get().postLedgerEntry({ outletId: transfer.destinationOutletId, storeName: 'Main Kitchen Store', itemId: line.itemId, entryType: 'TRANSFER_IN', qty: line.qty, refType: 'TRANSFER', refId: transfer.id, remarks: `Received from ${transfer.sourceOutletId}`, createdBy: actor });
      });
    }

    set((state) => {
      const updated = state.transfers.map((t) => t.id === transferId ? {
        ...t, status: next,
        approvedBy: next === 'APPROVED' ? actor : t.approvedBy,
        approvedAt: next === 'APPROVED' ? new Date().toISOString() : t.approvedAt,
        dispatchedAt: next === 'DISPATCHED' ? new Date().toISOString() : t.dispatchedAt,
        receivedAt: next === 'RECEIVED' ? new Date().toISOString() : t.receivedAt,
      } : t);
      firebaseDataService.saveRecord('erp/inventory/transfers', updated);
      return { transfers: updated };
    });
  },

  addRecipe: (recipe) => {
    const newRecipe: Recipe = { ...recipe, id: `rcp-${Date.now()}` };
    set((state) => {
      const updated = [...state.recipes, newRecipe];
      firebaseDataService.saveRecord('erp/inventory/recipes', updated);
      return { recipes: updated };
    });
  },
  updateRecipe: (id, data) => {
    set((state) => {
      const updated = state.recipes.map((r) => r.id === id ? { ...r, ...data } : r);
      firebaseDataService.saveRecord('erp/inventory/recipes', updated);
      return { recipes: updated };
    });
  },
}));
