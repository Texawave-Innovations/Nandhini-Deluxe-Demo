import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  valueColorClass?: string;
  icon?: LucideIcon;
  accentColorClass?: string; // left border accent, e.g. 'border-l-[#C94B45]'
}

export default function KpiCard({ label, value, sublabel, valueColorClass = 'text-[#202522]', icon: Icon, accentColorClass }: KpiCardProps) {
  return (
    <div className={`bg-white rounded-[10px] border border-[#E5E2DB] p-3.5 shadow-brand-xs ${accentColorClass ? `border-l-4 ${accentColorClass}` : ''}`}>
      <div className="flex items-start justify-between">
        <span className="text-[13px] leading-5 font-medium text-[#66706B] block">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-[#66706B]/70" />}
      </div>
      <div className={`text-[28px] leading-[34px] font-bold mt-1 ${valueColorClass}`}>{value}</div>
      {sublabel && <div className="text-[12px] text-[#66706B] font-normal mt-0.5">{sublabel}</div>}
    </div>
  );
}
