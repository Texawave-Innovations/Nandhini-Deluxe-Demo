'use client';

import React, { useMemo, useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import KpiCard from '@/components/ui/KpiCard';
import InsightCard from '@/components/ai/InsightCard';
import { Sparkles, AlertTriangle, CheckCircle2, Package, Wallet, TrendingUp, UtensilsCrossed, Users, BedDouble, PartyPopper, Compass } from 'lucide-react';
import { useAIInsights } from '@/hooks/useAIInsights';
import { AIInsightCategory } from '@/types/ai';

const CATEGORY_META: Record<AIInsightCategory, { label: string; icon: typeof Package }> = {
  INVENTORY: { label: 'Inventory', icon: Package },
  FINANCE: { label: 'Finance', icon: Wallet },
  SALES: { label: 'Sales', icon: TrendingUp },
  POS: { label: 'Front of House', icon: UtensilsCrossed },
  HR: { label: 'Workforce', icon: Users },
  HOTEL: { label: 'Hotel', icon: BedDouble },
  BANQUET: { label: 'Banquet', icon: PartyPopper },
  EXECUTIVE: { label: 'Executive', icon: Compass },
};
const CATEGORIES = Object.keys(CATEGORY_META) as AIInsightCategory[];

export default function AIInsightsPage() {
  const { insights, openInsights, highSeverityOpen, byCategory, ackByKey, acknowledgements, acknowledgeInsight } = useAIInsights();
  const openCount = openInsights.length;
  const highSeverityCount = highSeverityOpen.length;

  const firstNonEmpty = useMemo(() => CATEGORIES.find((cat) => byCategory[cat].length > 0) ?? CATEGORIES[0], [byCategory]);
  const [activeCategory, setActiveCategory] = useState<AIInsightCategory>(firstNonEmpty);

  const activeMeta = CATEGORY_META[activeCategory];
  const activeRows = byCategory[activeCategory];

  return (
    <ShellLayout>
      <div className="space-y-6">
        <SectionHeader title="AI Insights" subtitle="Deterministic, rule-based insights computed live across Inventory, Finance, Sales, Front of House, Workforce, Hotel, Banquet and Executive data — not a hosted model, same honesty convention as the Tally export." />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Open Insights" value={openCount} icon={Sparkles} />
          <KpiCard label="High Severity" value={highSeverityCount} icon={AlertTriangle} valueColorClass={highSeverityCount > 0 ? 'text-[#C94B45]' : 'text-[#23865B]'} />
          <KpiCard label="Acknowledged" value={acknowledgements.length} icon={CheckCircle2} valueColorClass="text-[#23865B]" />
          <KpiCard label="Total Computed" value={insights.length} icon={Sparkles} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {CATEGORIES.map((cat) => {
            const meta = CATEGORY_META[cat];
            const rows = byCategory[cat];
            const openInCat = rows.filter((i) => !ackByKey.has(i.key)).length;
            const highInCat = rows.filter((i) => !ackByKey.has(i.key) && i.severity === 'HIGH').length;
            const isActive = cat === activeCategory;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`relative text-left bg-white rounded-[10px] border p-3 shadow-brand-xs transition-colors ${
                  isActive ? 'border-[#0F5B55] ring-1 ring-[#0F5B55]' : 'border-[#E5E2DB] hover:border-[#0F5B55]/50'
                }`}
              >
                {highInCat > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#C94B45]" />
                )}
                <meta.icon className={`w-4 h-4 mb-2 ${isActive ? 'text-[#0F5B55]' : 'text-[#66706B]'}`} />
                <div className={`text-[12px] font-semibold leading-4 ${isActive ? 'text-[#0F5B55]' : 'text-[#202522]'}`}>{meta.label}</div>
                <div className="text-[11px] text-[#66706B] mt-0.5">{rows.length === 0 ? 'No insights' : `${openInCat} open / ${rows.length} total`}</div>
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <activeMeta.icon className="w-4 h-4 text-[#0F5B55]" />
            <h3 className="text-[15px] font-semibold text-[#202522]">{activeMeta.label}</h3>
          </div>
          {activeRows.length === 0 ? (
            <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-4 text-[13px] text-[#66706B]">No {activeMeta.label.toLowerCase()} insights right now.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {activeRows.map((insight) => (
                <InsightCard
                  key={insight.key} insight={insight} acknowledgement={ackByKey.get(insight.key)}
                  onAcknowledge={() => acknowledgeInsight(insight.key, 'Corporate Management')}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ShellLayout>
  );
}
