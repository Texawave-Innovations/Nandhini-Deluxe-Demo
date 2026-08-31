'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string;
}

export default function Modal({ open, onClose, title, subtitle, children, footer, maxWidthClass = 'max-w-lg' }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-[10px] shadow-xl w-full ${maxWidthClass} border border-[#E5E2DB] overflow-hidden max-h-[90vh] flex flex-col`}>
        <div className="bg-[#0F5B55] text-white px-5 py-3.5 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-[15px] font-semibold">{title}</h3>
            {subtitle && <p className="text-[12px] text-white/70">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3.5 border-t border-[#E5E2DB] bg-[#F8F5EE] flex justify-end gap-2 flex-shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
