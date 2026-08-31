// Lightweight UI-selection store for the global Outlet Switcher (Organization / Outlet / Business
// Date). The Outlet (Location) master itself lives in hrms-store as the single source of truth —
// this store only tracks *which* outlet/date the rest of the app is currently viewing.

import { create } from 'zustand';

interface OutletContextState {
  selectedOutletId: string; // a Location id, or 'ALL' for the org-wide view
  businessDate: string; // YYYY-MM-DD
  setSelectedOutlet: (outletId: string) => void;
  setBusinessDate: (date: string) => void;
}

export const useOutletStore = create<OutletContextState>((set) => ({
  selectedOutletId: 'ALL',
  businessDate: '2026-08-30',
  setSelectedOutlet: (outletId) => set({ selectedOutletId: outletId }),
  setBusinessDate: (date) => set({ businessDate: date }),
}));
