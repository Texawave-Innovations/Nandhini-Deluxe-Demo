'use client';

// First-visit onboarding walkthrough — a centered step-by-step overlay (not a DOM-anchored
// spotlight, deliberately: this app has no persistent shared layout — every page wraps itself in
// <ShellLayout> independently, so the shell fully remounts on each client navigation — anchoring
// to live element positions would be fragile across that). Auto-opens once per browser via a
// localStorage flag; relaunchable anytime from Header's "Take a tour" button or the AI Assistant
// widget's quick action, both of which just call useUIStore's openTour().

import React, { useEffect } from 'react';
import {
  Compass, LayoutDashboard, UtensilsCrossed, DollarSign, Users, FileBarChart2,
  MessageCircle, X, type LucideIcon,
} from 'lucide-react';
import { useUIStore } from '@/store/ui-store';

const SEEN_KEY = 'nd_walkthrough_tour_v1_seen';

interface TourStep {
  icon: LucideIcon;
  title: string;
  body: string;
}

const STEPS: TourStep[] = [
  {
    icon: Compass,
    title: 'Welcome to Nandhini Deluxe ERP',
    body: 'A quick tour of where everything lives — the sidebar, the alerts you’ll want to act on, and the assistant that can answer questions about your live data. Takes under a minute.',
  },
  {
    icon: LayoutDashboard,
    title: 'Sidebar & Modules',
    body: 'The left rail is every module — POS, Sales, Inventory, Purchase, Vendors, Finance, Reconciliation, Tally, Hotel Operations, Banquet Management, HRMS, Reports & Analytics, AI Insights, Masters and Administration. Click the chevron at its top edge to collapse it. What you can open depends on the demo role selected in the header.',
  },
  {
    icon: UtensilsCrossed,
    title: 'Outlet & Business Date',
    body: 'The bar just under the header lets you switch outlets and roll the working business date forward — most modules (POS day-close, Inventory, Reservations) key off whichever outlet and date are selected there.',
  },
  {
    icon: DollarSign,
    title: 'Header: Role, Punch & Notifications',
    body: 'Switch the demo role from the header to see the sidebar and permissions change live. The bell shows pending approvals (leave & attendance regularization), and the biometric punch button simulates a real attendance terminal.',
  },
  {
    icon: FileBarChart2,
    title: 'Reports, Analytics & AI Insights',
    body: 'Reports & Analytics rolls up Sales, Finance and Inventory into one view. AI Insights (left rail) computes reorder alerts, vendor/customer risk, settlement mismatches and a revenue forecast live from that same data — deterministic, rule-based logic, not a hosted model.',
  },
  {
    icon: MessageCircle,
    title: 'The Assistant, bottom-right',
    body: 'Open it anytime from the chat icon in the bottom-right corner. It surfaces your open alerts in one place and answers typed questions about them — pending approvals, high-severity insights, reorder counts and more.',
  },
];

export default function WalkthroughTour() {
  const { tourOpen, openTour, closeTour } = useUIStore();
  const [step, setStep] = React.useState(0);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(SEEN_KEY)) openTour();
    } catch {
      // localStorage unavailable (private mode / SSR edge case) — just skip the auto-open.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    try { window.localStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ }
    setStep(0);
    closeTour();
  };

  if (!tourOpen) return null;

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-[10px] shadow-xl w-full max-w-md border border-[#E5E2DB] overflow-hidden">
        <div className="bg-[#0F5B55] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <current.icon className="w-4 h-4 text-[#C59A45]" />
            <h3 className="text-[15px] font-semibold">{current.title}</h3>
          </div>
          <button onClick={dismiss} className="text-white/70 hover:text-white p-1 rounded hover:bg-white/10" title="Skip tour">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-[13px] text-[#66706B] leading-5">{current.body}</p>
        </div>

        <div className="px-5 pb-4 flex items-center justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-[#0F5B55]' : 'w-1.5 bg-[#E5E2DB]'}`} />
          ))}
        </div>

        <div className="px-5 py-3.5 border-t border-[#E5E2DB] bg-[#F8F5EE] flex items-center justify-between">
          <button onClick={dismiss} className="text-[12px] font-semibold text-[#66706B] hover:text-[#202522]">
            Skip tour
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="px-3.5 py-1.5 bg-white border border-[#E5E2DB] text-[#202522] text-[12px] font-semibold rounded-lg hover:bg-[#F3F0E9]"
              >
                Back
              </button>
            )}
            <button
              onClick={() => (isLast ? dismiss() : setStep((s) => s + 1))}
              className="px-3.5 py-1.5 bg-[#0F5B55] hover:bg-[#08463F] text-white text-[12px] font-semibold rounded-lg"
            >
              {isLast ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
