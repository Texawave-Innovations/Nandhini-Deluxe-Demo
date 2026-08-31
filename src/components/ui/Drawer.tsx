'use client';

import React from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClass?: string;
}

export default function Drawer({ open, onClose, title, subtitle, children, footer, widthClass = 'max-w-md' }: DrawerProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-950/40" onClick={onClose} />
      <div className={`relative bg-white w-full ${widthClass} h-full shadow-2xl flex flex-col`}>
        <div className="bg-[#0F5B55] text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-[15px] font-semibold">{title}</h3>
            {subtitle && <p className="text-[12px] text-white/70">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="px-5 py-3.5 border-t border-[#E5E2DB] bg-[#F8F5EE] flex-shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
