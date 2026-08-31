// AI Insights domain: deterministic, rule-based "AI" (same honesty convention as Tally's mock XML
// export — no external model, just aiInsightsService's heuristics over live store data). An
// AIInsight is always computed fresh, never persisted; only a viewer's acknowledgement of one is.

export type AIInsightCategory = 'INVENTORY' | 'FINANCE' | 'SALES';
export type AIInsightSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface AIInsight {
  key: string; // stable, deterministic — derived from the underlying record(s), not random
  category: AIInsightCategory;
  severity: AIInsightSeverity;
  title: string;
  description: string;
  suggestedAction?: string;
  computedAt: string;
}

export interface AIInsightAcknowledgement {
  insightKey: string;
  acknowledgedBy: string;
  acknowledgedAt: string;
  note?: string;
}
