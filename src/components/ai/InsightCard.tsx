'use client';

// One AI Insight, reused across the /ai hub's Inventory/Finance/Sales sections. Acknowledged
// insights render de-emphasized with who/when instead of the Acknowledge button.

import React from 'react';
import StatusChip, { ChipTone } from '@/components/ui/StatusChip';
import { AIInsight, AIInsightAcknowledgement, AIInsightSeverity } from '@/types/ai';

const SEVERITY_TONE: Record<AIInsightSeverity, ChipTone> = { HIGH: 'danger', MEDIUM: 'warning', LOW: 'info' };

interface InsightCardProps {
  insight: AIInsight;
  acknowledgement?: AIInsightAcknowledgement;
  onAcknowledge?: () => void;
}

export default function InsightCard({ insight, acknowledgement, onAcknowledge }: InsightCardProps) {
  return (
    <div className={`bg-white rounded-[10px] border border-[#E5E2DB] p-4 shadow-brand-xs ${acknowledgement ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusChip label={insight.severity} tone={SEVERITY_TONE[insight.severity]} />
            <h4 className="text-[13px] font-semibold text-[#202522] truncate">{insight.title}</h4>
          </div>
          <p className="text-[13px] text-[#66706B] leading-5">{insight.description}</p>
          {insight.suggestedAction && <p className="text-[12px] text-[#0F5B55] font-medium mt-1.5">→ {insight.suggestedAction}</p>}
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-[#E5E2DB] flex items-center justify-between">
        {acknowledgement ? (
          <span className="text-[11px] text-[#66706B]">Acknowledged by {acknowledgement.acknowledgedBy} on {acknowledgement.acknowledgedAt.substring(0, 10)}</span>
        ) : (
          <span className="text-[11px] text-[#66706B]">Computed {insight.computedAt.substring(0, 10)}</span>
        )}
        {!acknowledgement && onAcknowledge && (
          <button onClick={onAcknowledge} className="px-3 py-1.5 bg-[#0F5B55] hover:bg-[#08463F] text-white text-[11px] font-semibold rounded-lg">
            Acknowledge
          </button>
        )}
      </div>
    </div>
  );
}
