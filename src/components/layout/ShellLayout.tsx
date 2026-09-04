'use client';

import React, { useEffect } from 'react';
import TwoTierSidebar from '@/components/layout/TwoTierSidebar';
import Header from '@/components/layout/Header';
import OutletSwitcherBar from '@/components/layout/OutletSwitcherBar';
import TopModuleNav from '@/components/layout/TopModuleNav';
import WalkthroughTour from '@/components/layout/WalkthroughTour';
import AIAssistantWidget from '@/components/ai/AIAssistantWidget';
import { useHRMSStore } from '@/store/hrms-store';
import { usePOSStore } from '@/store/pos-store';
import { useInventoryStore } from '@/store/inventory-store';
import { useVendorStore } from '@/store/vendor-store';
import { usePurchaseStore } from '@/store/purchase-store';
import { useFinanceStore } from '@/store/finance-store';
import { useReconciliationStore } from '@/store/reconciliation-store';
import { useSalesStore } from '@/store/sales-store';
import { useLedgerStore } from '@/store/ledger-store';
import { useAIStore } from '@/store/ai-store';
import { useHotelStore } from '@/store/hotel-store';
import { useBanquetStore } from '@/store/banquet-store';
import '@/app/globals.css';

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const { initializeFromFirebase } = useHRMSStore();
  const initPOS = usePOSStore((s) => s.initializeFromFirebase);
  const initInventory = useInventoryStore((s) => s.initializeFromFirebase);
  const initVendor = useVendorStore((s) => s.initializeFromFirebase);
  const initPurchase = usePurchaseStore((s) => s.initializeFromFirebase);
  const initFinance = useFinanceStore((s) => s.initializeFromFirebase);
  const initReconciliation = useReconciliationStore((s) => s.initializeFromFirebase);
  const initSales = useSalesStore((s) => s.initializeFromFirebase);
  const initLedger = useLedgerStore((s) => s.initializeFromFirebase);
  const initAI = useAIStore((s) => s.initializeFromFirebase);
  const initHotel = useHotelStore((s) => s.initializeFromFirebase);
  const initBanquet = useBanquetStore((s) => s.initializeFromFirebase);

  useEffect(() => {
    // HRMS/POS/Inventory/Vendor/Sales/AI/Hotel/Banquet have no cross-store data dependency on each
    // other at hydration time (Sales/Hotel/Banquet seed off static mock-data + locations, not
    // another store's hydrated state; AI has no seed at all — their later reads of POS orders/bills
    // for folio/final-bill generation happen on demand, well after this initial hydration), so they
    // hydrate in parallel. Purchase, Finance, Reconciliation and Ledger do have a real dependency
    // chain (each reads a prior domain's *already-hydrated* historical records via getState()),
    // so those stages stay sequential — 4 stages deep, not 8. (The old Tally domain, which used to
    // sit here too, was retired — /tally/* now reads directly off the Ledger domain's Vouchers.)
    (async () => {
      await Promise.all([initializeFromFirebase(), initPOS(), initInventory(), initVendor(), initSales(), initAI(), initHotel(), initBanquet()]);
      await initPurchase(); // needs Vendor + Inventory's item/vendor masters (already hydrated above)
      await initFinance(); // needs Purchase's hydrated GRNs/POs
      await initReconciliation(); // needs Finance + POS (already hydrated above)
      await initLedger(); // needs Finance (AP) + Sales (AR) + Vendor + Customer, all hydrated above
    })();
  }, [initializeFromFirebase, initPOS, initInventory, initVendor, initPurchase, initFinance, initReconciliation, initSales, initAI, initHotel, initBanquet, initLedger]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8F5EE] font-sans">
      {/* Single Sidebar */}
      <TwoTierSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky Top Header */}
        <Header />

        {/* Organization / Outlet / Business Date Switcher */}
        <OutletSwitcherBar />

        {/* Top Module Category & Sub-tab Navigation */}
        <TopModuleNav />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#F8F5EE]">
          {children}
        </main>
      </div>

      {/* First-visit onboarding + always-on assistant, available from every module */}
      <WalkthroughTour />
      <AIAssistantWidget />
    </div>
  );
}
