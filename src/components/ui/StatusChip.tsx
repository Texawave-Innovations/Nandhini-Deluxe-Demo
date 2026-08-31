import React from 'react';

export type ChipTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';

const TONE_CLASSES: Record<ChipTone, string> = {
  success: 'bg-[#23865B]/10 text-[#23865B] border-[#23865B]/20',
  warning: 'bg-[#C68A28]/10 text-[#C68A28] border-[#C68A28]/20',
  danger: 'bg-[#C94B45]/10 text-[#C94B45] border-[#C94B45]/20',
  info: 'bg-[#3377A8]/10 text-[#3377A8] border-[#3377A8]/20',
  neutral: 'bg-[#F3F0E9] text-[#66706B] border-[#E5E2DB]',
  brand: 'bg-[#0F5B55]/10 text-[#0F5B55] border-[#0F5B55]/20',
};

interface StatusChipProps {
  label: string;
  tone: ChipTone;
  className?: string;
}

export default function StatusChip({ label, tone, className = '' }: StatusChipProps) {
  return (
    <span className={`px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide rounded-full border whitespace-nowrap ${TONE_CLASSES[tone]} ${className}`}>
      {label}
    </span>
  );
}
