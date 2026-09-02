'use client';

// Client-facing "what AI can do here" browser — reads the static AI_ROADMAP_ITEMS catalogue
// (constants/aiRoadmap.ts) and groups it by operating area, same way /ai groups live insights by
// category. Triggered from a small icon button in Header.tsx. Includes a "Download PDF" link to
// the static asset at public/nandhini-ai-roadmap.pdf (generated once, not rendered at runtime).

import React from 'react';
import Modal from '@/components/ui/Modal';
import StatusChip, { ChipTone } from '@/components/ui/StatusChip';
import { Download, Sparkles } from 'lucide-react';
import { AI_ROADMAP_ITEMS, AIRoadmapStatus } from '@/constants/aiRoadmap';

interface AIRoadmapModalProps {
  open: boolean;
  onClose: () => void;
}

const STATUS_META: Record<AIRoadmapStatus, { label: string; tone: ChipTone }> = {
  LIVE: { label: 'Live in this demo', tone: 'success' },
  NEXT: { label: 'Ready to build next', tone: 'info' },
  ROADMAP: { label: 'On the roadmap', tone: 'neutral' },
};

export default function AIRoadmapModal({ open, onClose }: AIRoadmapModalProps) {
  const areas = Array.from(new Set(AI_ROADMAP_ITEMS.map((i) => i.area)));
  const liveCount = AI_ROADMAP_ITEMS.filter((i) => i.status === 'LIVE').length;

  return (
    <Modal
      open={open} onClose={onClose} title="AI Roadmap"
      subtitle={`${liveCount} of ${AI_ROADMAP_ITEMS.length} ideas are live in this demo right now — the rest is exactly what we can build next.`}
      maxWidthClass="max-w-3xl"
      footer={
        <a
          href="/nandhini-ai-roadmap.pdf" download
          className="flex items-center gap-2 px-4 py-2 bg-[#0F5B55] hover:bg-[#08463F] text-white text-[13px] font-semibold rounded-[8px]"
        >
          <Download className="w-4 h-4" /> Download PDF
        </a>
      }
    >
      <div className="space-y-6">
        {areas.map((area) => (
          <div key={area} className="space-y-2.5">
            <h4 className="text-[13px] font-semibold text-[#202522] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#0F5B55]" /> {area}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AI_ROADMAP_ITEMS.filter((i) => i.area === area).map((item) => (
                <div key={item.id} className="border border-[#E5E2DB] rounded-[10px] p-3 space-y-1.5 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[12.5px] font-semibold text-[#202522] leading-tight">{item.title}</div>
                    <StatusChip label={STATUS_META[item.status].label} tone={STATUS_META[item.status].tone} className="flex-shrink-0" />
                  </div>
                  <p className="text-[11.5px] text-[#66706B] leading-snug">{item.what}</p>
                  <p className="text-[11px] text-[#66706B] leading-snug"><span className="font-semibold text-[#202522]">Value: </span>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
