// Finance / Accounts Payable domain store: Vendor Bills (3-way matched against PO+GRN at
// creation) and Vendor Payments allocated across outstanding bills.

import { create } from 'zustand';
import { VendorBill, VendorPayment, VendorPaymentMode } from '@/types/finance';
import { generateFinanceSeed } from '@/mock-data/finance.seed';
import { financeService } from '@/services/financeService';
import { firebaseDataService } from '@/services/firebaseDataService';
import { usePurchaseStore } from '@/store/purchase-store';
import { useVendorStore } from '@/store/vendor-store';

interface FinanceState {
  isHydrated: boolean;
  vendorBills: VendorBill[];
  vendorPayments: VendorPayment[];

  initializeFromFirebase: () => Promise<void>;

  createBillFromGRN: (params: { grnId: string; vendorInvoiceNumber: string; invoiceDate: string; taxPercent: number; createdBy: string }) => VendorBill | undefined;
  approveBill: (id: string, actor: string, overrideRemarks?: string) => void;
  recordVendorPayment: (params: { vendorId: string; amount: number; mode: VendorPaymentMode; referenceNo?: string; paidBy: string; billIds?: string[] }) => VendorPayment;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  isHydrated: false,
  vendorBills: [],
  vendorPayments: [],

  initializeFromFirebase: async () => {
    if (get().isHydrated) return;
    try {
      const { purchaseOrders, grns } = usePurchaseStore.getState();
      const vendors = useVendorStore.getState().vendors;
      const seeded = generateFinanceSeed(purchaseOrders, grns, vendors);

      const fbBills = await firebaseDataService.fetchRecord('erp/finance/vendorBills');
      const fbPayments = await firebaseDataService.fetchRecord('erp/finance/vendorPayments');

      set({
        vendorBills: fbBills && fbBills.length > 0 ? fbBills : seeded.vendorBills,
        vendorPayments: fbPayments && fbPayments.length > 0 ? fbPayments : seeded.vendorPayments,
        isHydrated: true,
      });

      if (!fbBills || fbBills.length === 0) {
        firebaseDataService.saveRecord('erp/finance/vendorBills', seeded.vendorBills);
        firebaseDataService.saveRecord('erp/finance/vendorPayments', seeded.vendorPayments);
      }
    } catch (e) {
      console.warn('Finance hydration warning, using local seed:', e);
      const { purchaseOrders, grns } = usePurchaseStore.getState();
      const seeded = generateFinanceSeed(purchaseOrders, grns, useVendorStore.getState().vendors);
      set({ vendorBills: seeded.vendorBills, vendorPayments: seeded.vendorPayments, isHydrated: true });
    }
  },

  createBillFromGRN: (params) => {
    const grn = usePurchaseStore.getState().grns.find((g) => g.id === params.grnId);
    const po = grn ? usePurchaseStore.getState().purchaseOrders.find((p) => p.id === grn.poId) : undefined;
    const vendor = grn ? useVendorStore.getState().vendors.find((v) => v.id === grn.vendorId) : undefined;
    if (!grn || !po || !vendor) return undefined;

    const built = financeService.buildVendorBillFromGRN({
      grn, vendorInvoiceNumber: params.vendorInvoiceNumber, invoiceDate: params.invoiceDate,
      taxPercent: params.taxPercent, dueInDays: vendor.paymentTermsDays, createdBy: params.createdBy,
    });

    const bill: VendorBill = {
      id: `apb-${Date.now()}`, billNumber: financeService.generateBillNumber(get().vendorBills), ...built,
      amountPaid: 0, status: 'MATCHED',
    };
    bill.matchResult = financeService.performThreeWayMatch(po, grn, bill);
    bill.status = bill.matchResult.status;

    set((state) => {
      const updated = [bill, ...state.vendorBills];
      firebaseDataService.saveRecord('erp/finance/vendorBills', updated);
      return { vendorBills: updated };
    });
    return bill;
  },

  approveBill: (id, actor, overrideRemarks) => {
    set((state) => {
      const updated = state.vendorBills.map((b) => {
        if (b.id !== id) return b;
        if (b.status === 'MISMATCH' && !overrideRemarks) return b; // requires an explicit override
        return { ...b, status: 'APPROVED' as const, approvedBy: actor, approvedAt: new Date().toISOString() };
      });
      firebaseDataService.saveRecord('erp/finance/vendorBills', updated);
      return { vendorBills: updated };
    });
  },

  recordVendorPayment: (params) => {
    const allocations = params.billIds && params.billIds.length > 0
      ? params.billIds.map((billId) => {
          const bill = get().vendorBills.find((b) => b.id === billId);
          const due = bill ? bill.totalAmount - bill.amountPaid : 0;
          return { billId, amount: Math.min(due, params.amount / params.billIds!.length) };
        })
      : financeService.allocatePaymentToBills(get().vendorBills, params.vendorId, params.amount);

    const payment: VendorPayment = {
      id: `vpay-${Date.now()}`, paymentNumber: financeService.generatePaymentNumber(get().vendorPayments),
      vendorId: params.vendorId, mode: params.mode, amount: params.amount,
      // Omit (never assign undefined to) referenceNo when blank — Firebase's set() rejects any
      // object containing a literal `undefined` value.
      ...(params.referenceNo ? { referenceNo: params.referenceNo } : {}),
      allocations, status: 'SUCCESS', paidBy: params.paidBy, paidAt: new Date().toISOString(),
    };

    set((state) => {
      const updatedPayments = [payment, ...state.vendorPayments];
      const updatedBills = state.vendorBills.map((b) => {
        const alloc = allocations.find((a) => a.billId === b.id);
        if (!alloc) return b;
        const newAmountPaid = Math.round((b.amountPaid + alloc.amount) * 100) / 100;
        return { ...b, amountPaid: newAmountPaid, status: financeService.computeBillStatusAfterPayment(b, newAmountPaid) };
      });
      firebaseDataService.saveRecord('erp/finance/vendorPayments', updatedPayments);
      firebaseDataService.saveRecord('erp/finance/vendorBills', updatedBills);
      return { vendorPayments: updatedPayments, vendorBills: updatedBills };
    });

    return payment;
  },
}));
