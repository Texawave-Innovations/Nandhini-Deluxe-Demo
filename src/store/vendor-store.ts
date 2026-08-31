// Vendor Master store. Components call these actions only — never vendorService directly.

import { create } from 'zustand';
import { Vendor } from '@/types/vendor';
import { INITIAL_VENDORS } from '@/mock-data/vendor.seed';
import { vendorService } from '@/services/vendorService';
import { firebaseDataService } from '@/services/firebaseDataService';

interface VendorState {
  isHydrated: boolean;
  vendors: Vendor[];

  initializeFromFirebase: () => Promise<void>;
  addVendor: (data: Omit<Vendor, 'id' | 'code' | 'status' | 'createdAt'>) => void;
  updateVendor: (id: string, data: Partial<Vendor>) => void;
  deactivateVendor: (id: string) => void;
}

export const useVendorStore = create<VendorState>((set, get) => ({
  isHydrated: false,
  vendors: INITIAL_VENDORS,

  initializeFromFirebase: async () => {
    if (get().isHydrated) return;
    try {
      const fbVendors = await firebaseDataService.fetchRecord('erp/vendors/vendors');
      set({ vendors: fbVendors && fbVendors.length > 0 ? fbVendors : INITIAL_VENDORS, isHydrated: true });
      if (!fbVendors || fbVendors.length === 0) {
        firebaseDataService.saveRecord('erp/vendors/vendors', INITIAL_VENDORS);
      }
    } catch (e) {
      console.warn('Vendor hydration warning, using local seed:', e);
      set({ vendors: INITIAL_VENDORS, isHydrated: true });
    }
  },

  addVendor: (data) => {
    const vendor: Vendor = { ...data, id: `vnd-${Date.now()}`, code: vendorService.generateVendorCode(get().vendors), status: 'ACTIVE', createdAt: new Date().toISOString() };
    set((state) => {
      const updated = [...state.vendors, vendor];
      firebaseDataService.saveRecord('erp/vendors/vendors', updated);
      return { vendors: updated };
    });
  },

  updateVendor: (id, data) => {
    set((state) => {
      const updated = state.vendors.map((v) => v.id === id ? { ...v, ...data } : v);
      firebaseDataService.saveRecord('erp/vendors/vendors', updated);
      return { vendors: updated };
    });
  },

  deactivateVendor: (id) => {
    get().updateVendor(id, { status: 'INACTIVE' });
  },
}));
