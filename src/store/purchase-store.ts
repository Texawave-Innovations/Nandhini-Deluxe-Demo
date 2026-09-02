// Purchase domain store: PO status pipeline + GRN posting. postGRN is the sole path that raises
// inventory-store.receiveGRNStock — components never call inventoryService/inventory-store
// directly for a receipt.

import { create } from 'zustand';
import { GRN, PurchaseOrder } from '@/types/purchase';
import { generatePurchaseSeed } from '@/mock-data/purchase.seed';
import { purchaseService } from '@/services/purchaseService';
import { firebaseDataService } from '@/services/firebaseDataService';
import { useHRMSStore } from '@/store/hrms-store';
import { useVendorStore } from '@/store/vendor-store';
import { useInventoryStore } from '@/store/inventory-store';

interface PurchaseState {
  isHydrated: boolean;
  purchaseOrders: PurchaseOrder[];
  grns: GRN[];

  initializeFromFirebase: () => Promise<void>;

  createPO: (data: { vendorId: string; outletId: string; lines: { itemId: string; orderedQty: number; rate: number }[]; requestedBy: string; expectedDeliveryDate?: string; remarks?: string }) => PurchaseOrder;
  submitPO: (id: string) => void;
  approvePO: (id: string, actor: string) => void;
  rejectPO: (id: string, actor: string) => void;
  cancelPO: (id: string) => void;

  postGRN: (params: { poId: string; lines: { itemId: string; receivedQty: number; rate?: number; batchNo?: string; expiryDate?: string }[]; receivedBy: string; invoiceRefNo?: string }) => GRN | undefined;
}

export const usePurchaseStore = create<PurchaseState>((set, get) => ({
  isHydrated: false,
  purchaseOrders: [],
  grns: [],

  initializeFromFirebase: async () => {
    if (get().isHydrated) return;
    try {
      const locations = useHRMSStore.getState().locations;
      const vendors = useVendorStore.getState().vendors;
      const items = useInventoryStore.getState().items;
      const seeded = generatePurchaseSeed(locations, vendors, items);

      const fbPOs = await firebaseDataService.fetchRecord('erp/purchase/purchaseOrders');
      const fbGRNs = await firebaseDataService.fetchRecord('erp/purchase/grns');

      set({
        purchaseOrders: fbPOs && fbPOs.length > 0 ? fbPOs : seeded.purchaseOrders,
        grns: fbGRNs && fbGRNs.length > 0 ? fbGRNs : seeded.grns,
        isHydrated: true,
      });

      if (!fbPOs || fbPOs.length === 0) {
        firebaseDataService.saveRecord('erp/purchase/purchaseOrders', seeded.purchaseOrders);
        firebaseDataService.saveRecord('erp/purchase/grns', seeded.grns);
      }
    } catch (e) {
      console.warn('Purchase hydration warning, using local seed:', e);
      const seeded = generatePurchaseSeed(useHRMSStore.getState().locations, useVendorStore.getState().vendors, useInventoryStore.getState().items);
      set({ purchaseOrders: seeded.purchaseOrders, grns: seeded.grns, isHydrated: true });
    }
  },

  createPO: (data) => {
    const po: PurchaseOrder = {
      id: `po-${Date.now()}`, poNumber: purchaseService.generatePONumber(get().purchaseOrders),
      vendorId: data.vendorId, outletId: data.outletId,
      lines: data.lines.map((l) => ({ ...l, receivedQty: 0 })),
      totalAmount: Math.round(data.lines.reduce((s, l) => s + l.orderedQty * l.rate, 0) * 100) / 100,
      status: 'DRAFT', requestedBy: data.requestedBy, requestedAt: new Date().toISOString(),
      // Omit (never assign undefined to) optional fields the caller didn't provide — Firebase's
      // set() rejects any object containing a literal `undefined` value.
      ...(data.expectedDeliveryDate ? { expectedDeliveryDate: data.expectedDeliveryDate } : {}),
      ...(data.remarks ? { remarks: data.remarks } : {}),
    };
    set((state) => {
      const updated = [po, ...state.purchaseOrders];
      firebaseDataService.saveRecord('erp/purchase/purchaseOrders', updated);
      return { purchaseOrders: updated };
    });
    return po;
  },

  submitPO: (id) => {
    set((state) => {
      const updated = state.purchaseOrders.map((po) => po.id === id && po.status === 'DRAFT' ? { ...po, status: 'SUBMITTED' as const } : po);
      firebaseDataService.saveRecord('erp/purchase/purchaseOrders', updated);
      return { purchaseOrders: updated };
    });
  },

  approvePO: (id, actor) => {
    set((state) => {
      const updated = state.purchaseOrders.map((po) => po.id === id && po.status === 'SUBMITTED'
        ? { ...po, status: 'APPROVED' as const, approvedBy: actor, approvedAt: new Date().toISOString() } : po);
      firebaseDataService.saveRecord('erp/purchase/purchaseOrders', updated);
      return { purchaseOrders: updated };
    });
  },

  rejectPO: (id, actor) => {
    set((state) => {
      const updated = state.purchaseOrders.map((po) => po.id === id && po.status === 'SUBMITTED'
        ? { ...po, status: 'REJECTED' as const, approvedBy: actor, approvedAt: new Date().toISOString() } : po);
      firebaseDataService.saveRecord('erp/purchase/purchaseOrders', updated);
      return { purchaseOrders: updated };
    });
  },

  cancelPO: (id) => {
    set((state) => {
      const updated = state.purchaseOrders.map((po) => po.id === id ? { ...po, status: 'CANCELLED' as const } : po);
      firebaseDataService.saveRecord('erp/purchase/purchaseOrders', updated);
      return { purchaseOrders: updated };
    });
  },

  postGRN: (params) => {
    const po = get().purchaseOrders.find((p) => p.id === params.poId);
    if (!po) return undefined;
    const vendor = useVendorStore.getState().vendors.find((v) => v.id === po.vendorId);
    if (!vendor) return undefined;

    const built = purchaseService.buildGRNReceiptLines({ po, lines: params.lines });
    const grn: GRN = {
      id: `grn-${Date.now()}`, grnNumber: purchaseService.generateGRNNumber(get().grns), poId: po.id, vendorId: po.vendorId,
      outletId: po.outletId, lines: built.grnLines, totalAmount: built.totalAmount, status: 'POSTED',
      receivedBy: params.receivedBy, receivedAt: new Date().toISOString(),
      // Omit (never assign undefined to) invoiceRefNo when blank — Firebase's set() rejects any
      // object containing a literal `undefined` value.
      ...(params.invoiceRefNo ? { invoiceRefNo: params.invoiceRefNo } : {}),
    };

    // Never write inventory directly — post the receipt through inventory-store, mirroring how
    // pos-store.generateBill calls inventory-store.consumeForOrderItems.
    useInventoryStore.getState().receiveGRNStock({
      grnId: grn.id, grnNumber: grn.grnNumber, outletId: po.outletId, createdBy: params.receivedBy,
      lines: built.postings.map((p) => ({ ...p, vendorId: vendor.id, vendorName: vendor.name })),
    });

    const updatedLines = po.lines.map((l) => {
      const receipt = built.postings.find((p) => p.itemId === l.itemId);
      return receipt ? { ...l, receivedQty: l.receivedQty + receipt.qty } : l;
    });
    const newStatus = purchaseService.computePOStatusAfterReceipt(updatedLines);

    set((state) => {
      const updatedGRNs = [grn, ...state.grns];
      const updatedPOs = state.purchaseOrders.map((p) => p.id === po.id ? { ...p, lines: updatedLines, status: newStatus } : p);
      firebaseDataService.saveRecord('erp/purchase/grns', updatedGRNs);
      firebaseDataService.saveRecord('erp/purchase/purchaseOrders', updatedPOs);
      return { grns: updatedGRNs, purchaseOrders: updatedPOs };
    });

    return grn;
  },
}));
