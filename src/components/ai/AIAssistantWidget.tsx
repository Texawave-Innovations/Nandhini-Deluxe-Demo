'use client';

// Bottom-right AI Assistant: surfaces the app's live alerts (open AI Insights + pending HR
// approvals) in one place, and answers typed questions about them. Deliberately plain-chat-icon,
// no star/sparkle/bot iconography (the rest of the app already uses Sparkles for "AI Insights" —
// this widget intentionally does not, per product ask). Like aiInsightsService, replies are
// deterministic keyword matching over live store data, not a hosted model — same honesty
// convention as the rest of this app's "AI" surfaces (see useAIInsights.ts).

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, X, Send, Compass, ArrowRight } from 'lucide-react';
import { useAIInsights } from '@/hooks/useAIInsights';
import { useHRMSStore } from '@/store/hrms-store';
import { useUIStore } from '@/store/ui-store';
import StatusChip, { ChipTone } from '@/components/ui/StatusChip';
import { AIInsightSeverity } from '@/types/ai';

const SEVERITY_TONE: Record<AIInsightSeverity, ChipTone> = { HIGH: 'danger', MEDIUM: 'warning', LOW: 'info' };

interface ChatMessage {
  role: 'bot' | 'user';
  text: string;
}

const GREETING = "Hi, I'm your Nandhini Assistant. Ask me about open alerts, pending approvals, or say \"tour\" to relaunch the walkthrough.";

export default function AIAssistantWidget() {
  const router = useRouter();
  const { openTour } = useUIStore();
  const { openInsights, highSeverityOpen, byCategory } = useAIInsights();
  const { regularizationRequests, leaveRequests } = useHRMSStore();

  const pendingApprovals = regularizationRequests.filter((r) => r.status === 'PENDING').length
    + leaveRequests.filter((l) => l.status === 'PENDING').length;
  const alertCount = openInsights.length + pendingApprovals;

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'bot', text: GREETING }]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  const answer = (raw: string): string => {
    const q = raw.toLowerCase();

    if (/\btour\b|walkthrough|get(ting)? started|guide me/.test(q)) {
      openTour();
      return 'Reopening the walkthrough tour for you.';
    }
    if (/\b(hi|hello|hey)\b/.test(q)) return GREETING;
    if (/what can you do|who are you|help$/.test(q)) {
      return 'I can summarise open AI Insights (Inventory, Finance, Sales) and pending HR approvals, and point you to the right module. Try "high severity", "pending approvals", "inventory alerts", or "revenue forecast".';
    }
    if (/pending|approval|leave|regulari/.test(q)) {
      return pendingApprovals > 0
        ? `There ${pendingApprovals === 1 ? 'is' : 'are'} ${pendingApprovals} pending approval${pendingApprovals === 1 ? '' : 's'} (leave + attendance regularization) — check the bell icon in the header.`
        : 'No pending leave or regularization approvals right now.';
    }
    if (/high|severe|severity|urgent|critical/.test(q)) {
      return highSeverityOpen.length > 0
        ? `${highSeverityOpen.length} high-severity insight${highSeverityOpen.length === 1 ? '' : 's'} open: ${highSeverityOpen.slice(0, 3).map((i) => i.title).join('; ')}${highSeverityOpen.length > 3 ? ', …' : ''}. Open AI Insights for the full list.`
        : 'No high-severity insights open right now — you\'re clear.';
    }
    if (/inventory|reorder|stock|consumption/.test(q)) {
      return byCategory.INVENTORY.length > 0
        ? `${byCategory.INVENTORY.length} inventory insight(s) — reorder suggestions and consumption anomalies. See AI Insights → Inventory.`
        : 'No open inventory insights right now.';
    }
    if (/finance|vendor|bill|settlement|reconcil/.test(q)) {
      return byCategory.FINANCE.length > 0
        ? `${byCategory.FINANCE.length} finance insight(s) — vendor risk and settlement mismatches. See AI Insights → Finance.`
        : 'No open finance insights right now.';
    }
    if (/sales|customer|revenue|forecast/.test(q)) {
      return byCategory.SALES.length > 0
        ? `${byCategory.SALES.length} sales insight(s) — customer risk and next-week revenue forecast. See AI Insights → Sales.`
        : 'No open sales insights right now.';
    }
    if (/alert|insight|open/.test(q)) {
      return alertCount > 0
        ? `${openInsights.length} open AI Insight${openInsights.length === 1 ? '' : 's'} and ${pendingApprovals} pending approval${pendingApprovals === 1 ? '' : 's'} — see the list above, or open AI Insights for detail.`
        : 'All clear — no open insights or pending approvals.';
    }
    return "I didn't quite catch that. Try \"alerts\", \"high severity\", \"pending approvals\", or \"tour\".";
  };

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const reply = answer(text);
    setMessages((m) => [...m, { role: 'user', text }, { role: 'bot', text: reply }]);
    setInput('');
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 w-[360px] max-h-[70vh] bg-white rounded-[10px] shadow-xl border border-[#E5E2DB] flex flex-col z-50 overflow-hidden">
          <div className="bg-[#0F5B55] text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="text-[13px] font-semibold">Nandhini Assistant</h3>
              <p className="text-[11px] text-white/70">Alerts &amp; live-data Q&amp;A</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white p-1 rounded hover:bg-white/10">
              <X className="w-4 h-4" />
            </button>
          </div>

          {alertCount > 0 && (
            <div className="px-4 py-2.5 border-b border-[#E5E2DB] bg-[#F8F5EE] flex-shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#66706B]">Open Alerts</span>
                <button onClick={() => router.push('/ai')} className="text-[11px] font-semibold text-[#0F5B55] hover:text-[#08463F] flex items-center gap-0.5">
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {highSeverityOpen.length > 0 && <StatusChip label={`${highSeverityOpen.length} HIGH`} tone={SEVERITY_TONE.HIGH} />}
                {openInsights.length > 0 && <StatusChip label={`${openInsights.length} insight${openInsights.length === 1 ? '' : 's'}`} tone="brand" />}
                {pendingApprovals > 0 && <StatusChip label={`${pendingApprovals} approval${pendingApprovals === 1 ? '' : 's'}`} tone="warning" />}
              </div>
            </div>
          )}

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 min-h-[160px]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-[12px] leading-5 ${
                    m.role === 'user' ? 'bg-[#0F5B55] text-white' : 'bg-[#F3F0E9] text-[#202522]'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="px-3 py-2.5 border-t border-[#E5E2DB] flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => { openTour(); setOpen(false); }}
              title="Relaunch walkthrough tour"
              className="p-1.5 rounded-lg text-[#66706B] hover:bg-[#F3F0E9] hover:text-[#0F5B55] flex-shrink-0"
            >
              <Compass className="w-4 h-4" />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              placeholder="Ask about alerts, approvals…"
              className="flex-1 min-w-0 bg-[#F8F5EE] border border-[#E5E2DB] rounded-lg px-2.5 py-1.5 text-[12px] text-[#202522] placeholder-[#66706B] focus:outline-none focus:ring-2 focus:ring-[#0F5B55]/30"
            />
            <button
              onClick={send}
              disabled={!input.trim()}
              className="p-1.5 rounded-lg bg-[#0F5B55] text-white hover:bg-[#08463F] disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        title="Nandhini Assistant"
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-[#0F5B55] hover:bg-[#08463F] text-white shadow-xl flex items-center justify-center z-50 transition-transform hover:scale-105"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        {!open && alertCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#C94B45] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#F8F5EE]">
            {alertCount > 99 ? '99+' : alertCount}
          </span>
        )}
      </button>
    </>
  );
}
