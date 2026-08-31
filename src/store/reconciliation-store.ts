// Bank reconciliation domain store. Auto-match pulls POS payments/settlements and Vendor Payments
// via getState() at run time (same cross-store convention inventory-store already uses for
// useHRMSStore) — components never call reconciliationService directly.

import { create } from 'zustand';
import { BankTransaction, MatchSourceType, ReconciliationMatch } from '@/types/reconciliation';
import { generateReconciliationSeed } from '@/mock-data/reconciliation.seed';
import { reconciliationService } from '@/services/reconciliationService';
import { firebaseDataService } from '@/services/firebaseDataService';
import { usePOSStore } from '@/store/pos-store';
import { useFinanceStore } from '@/store/finance-store';

interface ReconciliationState {
  isHydrated: boolean;
  bankTransactions: BankTransaction[];
  matches: ReconciliationMatch[];

  initializeFromFirebase: () => Promise<void>;
  runAutoMatch: () => void;
  manuallyMatch: (bankTransactionId: string, sourceType: MatchSourceType, sourceId: string, sourceLabel: string, sourceAmount: number, actor: string) => void;
  markReviewed: (matchId: string, actor: string) => void;
}

export const useReconciliationStore = create<ReconciliationState>((set, get) => ({
  isHydrated: false,
  bankTransactions: [],
  matches: [],

  initializeFromFirebase: async () => {
    if (get().isHydrated) return;
    try {
      const { payments, channelSettlements } = usePOSStore.getState();
      const { vendorPayments } = useFinanceStore.getState();
      const seededTxns = generateReconciliationSeed(payments, channelSettlements, vendorPayments);

      const fbTxns = await firebaseDataService.fetchRecord('erp/reconciliation/bankTransactions');
      const fbMatches = await firebaseDataService.fetchRecord('erp/reconciliation/matches');

      const bankTransactions = fbTxns && fbTxns.length > 0 ? fbTxns : seededTxns;
      set({ bankTransactions, matches: fbMatches || [], isHydrated: true });

      if (!fbTxns || fbTxns.length === 0) {
        firebaseDataService.saveRecord('erp/reconciliation/bankTransactions', seededTxns);
      }
      if (!fbMatches || fbMatches.length === 0) {
        get().runAutoMatch();
      }
    } catch (e) {
      console.warn('Reconciliation hydration warning, using local seed:', e);
      const { payments, channelSettlements } = usePOSStore.getState();
      const { vendorPayments } = useFinanceStore.getState();
      const bankTransactions = generateReconciliationSeed(payments, channelSettlements, vendorPayments);
      set({ bankTransactions, isHydrated: true });
      get().runAutoMatch();
    }
  },

  runAutoMatch: () => {
    const { payments, channelSettlements } = usePOSStore.getState();
    const { vendorPayments } = useFinanceStore.getState();
    const matches = reconciliationService.autoMatchBankTransactions({
      bankTxns: get().bankTransactions, posPayments: payments, channelSettlements, vendorPayments,
    });
    set({ matches });
    firebaseDataService.saveRecord('erp/reconciliation/matches', matches);
  },

  manuallyMatch: (bankTransactionId, sourceType, sourceId, sourceLabel, sourceAmount, actor) => {
    const txn = get().bankTransactions.find((t) => t.id === bankTransactionId);
    if (!txn) return;
    const match: ReconciliationMatch = {
      id: `rec-${bankTransactionId}`, bankTransactionId, sourceType, sourceId, sourceLabel,
      bankAmount: txn.amount, sourceAmount, varianceAmount: Math.round((txn.amount - sourceAmount) * 100) / 100,
      status: 'MATCHED', matchMethod: 'MANUAL', reviewedBy: actor, reviewedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
    };
    set((state) => {
      const updated = [...state.matches.filter((m) => m.bankTransactionId !== bankTransactionId), match];
      firebaseDataService.saveRecord('erp/reconciliation/matches', updated);
      return { matches: updated };
    });
  },

  markReviewed: (matchId, actor) => {
    set((state) => {
      const updated = state.matches.map((m) => m.id === matchId ? { ...m, reviewedBy: actor, reviewedAt: new Date().toISOString() } : m);
      firebaseDataService.saveRecord('erp/reconciliation/matches', updated);
      return { matches: updated };
    });
  },
}));
