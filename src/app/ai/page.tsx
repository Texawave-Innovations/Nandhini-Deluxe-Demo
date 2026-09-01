'use client';

import React from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import KpiCard from '@/components/ui/KpiCard';
import InsightCard from '@/components/ai/InsightCard';
import { Sparkles, AlertTriangle, CheckCircle2, Package, Wallet, TrendingUp } from 'lucide-react';
import { useAIInsights } from '@/hooks/useAIInsights';
import { AIInsightCategory } from '@/types/ai';

const CATEGORY_META: Record<AIInsightCategory, { label: string; icon: typeof Package }> = {
  INVENTORY: { label: 'Inventory', icon: Package },
  FINANCE: { label: 'Finance', icon: Wallet },
  SALES: { label: 'Sales', icon: TrendingUp },
};

export default function AIInsightsPage() {
  const { insights, openInsights, highSeverityOpen, byCategory, ackByKey, acknowledgements, acknowledgeInsight } = useAIInsights();
  const openCount = openInsights.length;
  const highSeverityCount = highSeverityOpen.length;

  return (
    <ShellLayout>
      <div className="space-y-6">
        <SectionHeader title="AI Insights" subtitle="Deterministic, rule-based insights computed live from Inventory, Finance and Sales data — not a hosted model, same honesty convention as the Tally export." />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Open Insights" value={openCount} icon={Sparkles} />
          <KpiCard label="High Severity" value={highSeverityCount} icon={AlertTriangle} valueColorClass={highSeverityCount > 0 ? 'text-[#C94B45]' : 'text-[#23865B]'} />
          <KpiCard label="Acknowledged" value={acknowledgements.length} icon={CheckCircle2} valueColorClass="text-[#23865B]" />
          <KpiCard label="Total Computed" value={insights.length} icon={Sparkles} />
        </div>

        {(Object.keys(CATEGORY_META) as AIInsightCategory[]).map((cat) => {
          const meta = CATEGORY_META[cat];
          const rows = byCategory[cat];
          return (
            <div key={cat} className="space-y-3">
              <div className="flex items-center gap-2">
                <meta.icon className="w-4 h-4 text-[#0F5B55]" />
                <h3 className="text-[15px] font-semibold text-[#202522]">{meta.label}</h3>
              </div>
              {rows.length === 0 ? (
                <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-4 text-[13px] text-[#66706B]">No {meta.label.toLowerCase()} insights right now.</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {rows.map((insight) => (
                    <InsightCard
                      key={insight.key} insight={insight} acknowledgement={ackByKey.get(insight.key)}
                      onAcknowledge={() => acknowledgeInsight(insight.key, 'Corporate Management')}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ShellLayout>
  );
}
