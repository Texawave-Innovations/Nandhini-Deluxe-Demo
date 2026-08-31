// AI Insights store: insights themselves are always computed fresh from live data (see
// aiInsightsService) — the only thing persisted here is which insight keys a viewer has
// acknowledged, keyed by the insight's stable, deterministic `key`.

import { create } from 'zustand';
import { AIInsightAcknowledgement } from '@/types/ai';
import { firebaseDataService } from '@/services/firebaseDataService';

interface AIState {
  isHydrated: boolean;
  acknowledgements: AIInsightAcknowledgement[];

  initializeFromFirebase: () => Promise<void>;
  acknowledgeInsight: (insightKey: string, actor: string, note?: string) => void;
}

export const useAIStore = create<AIState>((set, get) => ({
  isHydrated: false,
  acknowledgements: [],

  initializeFromFirebase: async () => {
    if (get().isHydrated) return;
    try {
      const fbAcks = await firebaseDataService.fetchRecord('erp/ai/acknowledgements');
      set({ acknowledgements: fbAcks || [], isHydrated: true });
    } catch (e) {
      console.warn('AI Insights hydration warning:', e);
      set({ acknowledgements: [], isHydrated: true });
    }
  },

  acknowledgeInsight: (insightKey, actor, note) => {
    set((state) => {
      if (state.acknowledgements.some((a) => a.insightKey === insightKey)) return state;
      const ack: AIInsightAcknowledgement = {
        insightKey, acknowledgedBy: actor, acknowledgedAt: new Date().toISOString(),
        // Omit (never assign undefined to) note when blank — Firebase's set() rejects any object
        // containing a literal `undefined` value.
        ...(note ? { note } : {}),
      };
      const updated = [...state.acknowledgements, ack];
      firebaseDataService.saveRecord('erp/ai/acknowledgements', updated);
      return { acknowledgements: updated };
    });
  },
}));
