'use client';

import React from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { ShiftMasterPage } from '@/app/shifts/master/page';

export default function ShiftRulesPage() {
  return (
    <ShellLayout>
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-slate-900">Shift Rules & Break Configuration</h1>
        <p className="text-xs text-slate-500">Configured inside Shift Master for granular timing rules.</p>
      </div>
    </ShellLayout>
  );
}

