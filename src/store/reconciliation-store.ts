// Bank reconciliation domain store. Auto-match pulls POS payments/settlements, Vendor Payments,
// and Customer Payments via getState() at run time (same cross-store convention inventory-store
// already uses for useHRMSStore) — components never call reconciliationService directly.

import { create } from 'zustand';
import { BankTransaction, MatchSourceType, ReconciliationMatch } from '@/types/reconciliation';
import { generateReconciliationSeed } from '@/mock-data/reconciliation.seed';
import { reconciliationService } from '@/services/reconciliationService';
import { firebaseDataService } from '@/services/firebaseDataService';
import { usePOSStore } from '@/store/pos-store';
import { useFinanceStore } from '@/store/finance-store';
import { useSalesStore } from '@/store/sales-store';

interface SplitAllocation {
  sourceType: MatchSourceType;
  sourceId: string;
  sourceLabel: string;
  amount: number;
}

interface ManualBankLineInput {
  transactionDate: string;
  description: string;
  referenceNo: string;
  type: BankTransaction['type'];
  amount: number;
  narrationSource: BankTransaction['narrationSource'];
}

interface ReconciliationState {
  isHydrated: boolean;
  bankTransactions: BankTransaction[];
  matches: ReconciliationMatch[];

  initializeFromFirebase: () => Promise<void>;
  runAutoMatch: () => void;
  manuallyMatch: (bankTransactionId: string, sourceType: MatchSourceType, sourceId: string, sourceLabel: string, sourceAmount: number, actor: string) => void;
  // Split one bank line's amount across multiple source records (e.g. one NEFT batch credit
  // covering several customer payments) — replaces any existing match(es) for that bank line.
  splitMatch: (bankTransactionId: string, allocations: SplitAllocation[], actor: string) => void;
  // Accountant accepts the auto-match engine's SUGGESTED pick as-is.
  confirmSuggestedMatch: (matchId: string, actor: string) => void;
  markReviewed: (matchId: string, actor: string) => void;
  addManualBankTransaction: (input: ManualBankLineInput) => BankTransaction;
  importBankStatement: (rows: ManualBankLineInput[]) => BankTransaction[];
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
    const { customerPayments } = useSalesStore.getState();
    const matches = reconciliationService.autoMatchBankTransactions({
      bankTxns: get().bankTransactions, posPayments: payments, channelSettlements, vendorPayments, customerPayments,
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

  splitMatch: (bankTransactionId, allocations, actor) => {
    const txn = get().bankTransactions.find((t) => t.id === bankTransactionId);
    if (!txn || allocations.length === 0) return;
    const totalAllocated = Math.round(allocations.reduce((s, a) => s + a.amount, 0) * 100) / 100;
    const variance = Math.round((txn.amount - totalAllocated) * 100) / 100;
    const splitGroupId = `split-${bankTransactionId}-${Date.now()}`;
    const now = new Date().toISOString();

    const newMatches: ReconciliationMatch[] = allocations.map((a, i) => ({
      id: `rec-${bankTransactionId}-${i}`, bankTransactionId, sourceType: a.sourceType, sourceId: a.sourceId, sourceLabel: a.sourceLabel,
      bankAmount: txn.amount, sourceAmount: a.amount, varianceAmount: variance,
      status: 'MATCHED', matchMethod: 'MANUAL', splitGroupId, reviewedBy: actor, reviewedAt: now, createdAt: now,
    }));

    set((state) => {
      const updated = [...state.matches.filter((m) => m.bankTransactionId !== bankTransactionId), ...newMatches];
      firebaseDataService.saveRecord('erp/reconciliation/matches', updated);
      return { matches: updated };
    });
  },

  confirmSuggestedMatch: (matchId, actor) => {
    set((state) => {
      const updated = state.matches.map((m) => m.id === matchId && m.status === 'SUGGESTED'
        ? { ...m, status: 'MATCHED' as const, reviewedBy: actor, reviewedAt: new Date().toISOString() }
        : m);
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

  addManualBankTransaction: (input) => {
    const txn: BankTransaction = { id: `bktxn-manual-${Date.now()}`, ...input };
    set((state) => {
      const updated = [txn, ...state.bankTransactions];
      firebaseDataService.saveRecord('erp/reconciliation/bankTransactions', updated);
      return { bankTransactions: updated };
    });
    return txn;
  },

  // Appends a batch of parsed-and-mapped statement rows (from the CSV import flow) as new
  // BankTransactions, then re-runs auto-match so the new lines are matched immediately.
  importBankStatement: (rows) => {
    const now = Date.now();
    const newTxns: BankTransaction[] = rows.map((r, i) => ({ id: `bktxn-import-${now}-${i}`, ...r }));
    set((state) => {
      const updated = [...newTxns, ...state.bankTransactions];
      firebaseDataService.saveRecord('erp/reconciliation/bankTransactions', updated);
      return { bankTransactions: updated };
    });
    get().runAutoMatch();
    return newTxns;
  },
}));
