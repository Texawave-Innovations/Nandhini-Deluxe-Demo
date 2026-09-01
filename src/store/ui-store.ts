// Client-only UI chrome state — not domain data, so (unlike every other store in this app) it is
// never hydrated from or persisted to Firebase. Currently just whether the onboarding Walkthrough
// Tour overlay is open, shared between WalkthroughTour (which owns the first-visit auto-open) and
// any other affordance that should be able to relaunch it (Header's "Take a tour" button, the AI
// Assistant widget's "Take the tour" quick action).

import { create } from 'zustand';

interface UIState {
  tourOpen: boolean;
  openTour: () => void;
  closeTour: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  tourOpen: false,
  openTour: () => set({ tourOpen: true }),
  closeTour: () => set({ tourOpen: false }),
}));
