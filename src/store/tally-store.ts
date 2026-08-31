// Tally / accounting export store: builds mock vouchers from posted GRNs and settled Vendor
// Payments, and groups selected vouchers into an export batch with a mock XML preview.

import { create } from 'zustand';
import { TallyExportBatch, TallyVoucher } from '@/types/tally';
import { tallyService } from '@/services/tallyService';
import { firebaseDataService } from '@/services/firebaseDataService';
import { usePurchaseStore } from '@/store/purchase-store';
import { useFinanceStore } from '@/store/finance-store';
import { useVendorStore } from '@/store/vendor-store';

interface TallyState {
  isHydrated: boolean;
  vouchers: TallyVoucher[];
  exportBatches: TallyExportBatch[];

  initializeFromFirebase: () => Promise<void>;
  generateVouchersForPeriod: (fromDate: string, toDate: string) => TallyVoucher[];
  exportBatch: (voucherIds: string[], exportedBy: string) => TallyExportBatch;
}

export const useTallyStore = create<TallyState>((set, get) => ({
  isHydrated: false,
  vouchers: [],
  exportBatches: [],

  initializeFromFirebase: async () => {
    if (get().isHydrated) return;
    try {
      const fbVouchers = await firebaseDataService.fetchRecord('erp/tally/vouchers');
      const fbBatches = await firebaseDataService.fetchRecord('erp/tally/exportBatches');
      set({ vouchers: fbVouchers || [], exportBatches: fbBatches || [], isHydrated: true });

      // Bootstrap 2 historical export batches (older GRNs/payments only) so export-history isn't
      // empty on first load; anything from the last ~2 weeks stays PENDING_EXPORT for the demo.
      if ((!fbBatches || fbBatches.length === 0) && (!fbVouchers || fbVouchers.length === 0)) {
        const older = get().generateVouchersForPeriod('2026-07-01', '2026-08-10');
        const purchaseVouchers = older.filter((v) => v.voucherType === 'PURCHASE').map((v) => v.id);
        const paymentVouchers = older.filter((v) => v.voucherType === 'PAYMENT').map((v) => v.id);
        if (purchaseVouchers.length > 0) get().exportBatch(purchaseVouchers, 'Finance Executive');
        if (paymentVouchers.length > 0) get().exportBatch(paymentVouchers, 'Finance Executive');
      }
    } catch (e) {
      console.warn('Tally hydration warning:', e);
      set({ vouchers: [], exportBatches: [], isHydrated: true });
    }
  },

  generateVouchersForPeriod: (fromDate, toDate) => {
    const { grns } = usePurchaseStore.getState();
    const { vendorPayments } = useFinanceStore.getState();
    const vendors = useVendorStore.getState().vendors;
    const existingRefIds = new Set(get().vouchers.map((v) => v.refId));
    const inRange = (dateStr: string) => dateStr.substring(0, 10) >= fromDate && dateStr.substring(0, 10) <= toDate;

    const newVouchers: TallyVoucher[] = [];
    grns.filter((g) => g.status === 'POSTED' && inRange(g.receivedAt) && !existingRefIds.has(g.id)).forEach((g) => {
      const vendor = vendors.find((v) => v.id === g.vendorId);
      if (!vendor) return;
      newVouchers.push({ ...tallyService.buildPurchaseVoucherFromGRN(g, vendor), id: `tv-${Date.now()}-${Math.floor(Math.random() * 10000)}`, status: 'PENDING_EXPORT' });
    });
    vendorPayments.filter((p) => p.status === 'SUCCESS' && inRange(p.paidAt) && !existingRefIds.has(p.id)).forEach((p) => {
      const vendor = vendors.find((v) => v.id === p.vendorId);
      if (!vendor) return;
      newVouchers.push({ ...tallyService.buildPaymentVoucherFromVendorPayment(p, vendor), id: `tv-${Date.now()}-${Math.floor(Math.random() * 10000)}`, status: 'PENDING_EXPORT' });
    });

    if (newVouchers.length === 0) return [];
    set((state) => {
      const updated = [...state.vouchers, ...newVouchers];
      firebaseDataService.saveRecord('erp/tally/vouchers', updated);
      return { vouchers: updated };
    });
    return newVouchers;
  },

  exportBatch: (voucherIds, exportedBy) => {
    const selected = get().vouchers.filter((v) => voucherIds.includes(v.id));
    const batch: TallyExportBatch = {
      id: `txb-${Date.now()}`, batchNumber: tallyService.generateBatchNumber(get().exportBatches),
      voucherIds, voucherCount: selected.length, totalValue: Math.round(selected.reduce((s, v) => s + v.amount, 0) * 100) / 100,
      xmlPreview: tallyService.toTallyXML(selected), exportedBy, exportedAt: new Date().toISOString(),
    };
    set((state) => {
      const updatedBatches = [batch, ...state.exportBatches];
      const updatedVouchers = state.vouchers.map((v) => voucherIds.includes(v.id) ? { ...v, status: 'EXPORTED' as const, exportBatchId: batch.id } : v);
      firebaseDataService.saveRecord('erp/tally/exportBatches', updatedBatches);
      firebaseDataService.saveRecord('erp/tally/vouchers', updatedVouchers);
      return { exportBatches: updatedBatches, vouchers: updatedVouchers };
    });
    return batch;
  },
}));
