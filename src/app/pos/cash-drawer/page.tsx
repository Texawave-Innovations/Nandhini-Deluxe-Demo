'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import KpiCard from '@/components/ui/KpiCard';
import { Wallet } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';
import { usePOSStore } from '@/store/pos-store';
import { useOutletStore } from '@/store/outlet-store';
import { outletService } from '@/services/outletService';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function CashDrawerPage() {
  const { locations } = useHRMSStore();
  const { bills, payments } = usePOSStore();
  const { selectedOutletId, businessDate } = useOutletStore();
  const outlets = outletService.listOutlets(locations);
  const effectiveOutletId = selectedOutletId === 'ALL' ? outlets[0]?.id : selectedOutletId;
  const [openingCash, setOpeningCash] = useState(25000);

  const todaysBillIds = new Set(bills.filter((b) => b.outletId === effectiveOutletId && b.businessDate === businessDate && b.status !== 'VOID').map((b) => b.id));
  const cashPayments = payments.filter((p) => todaysBillIds.has(p.billId) && p.mode === 'CASH' && p.status === 'SUCCESS').sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const cashSales = cashPayments.reduce((s, p) => s + p.amount, 0);
  const expected = openingCash + cashSales;

  return (
    <ShellLayout>
      <div className="space-y-6">
        <SectionHeader title="Cash Drawer" subtitle={outlets.find((o) => o.id === effectiveOutletId)?.name} />

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-3.5 shadow-brand-xs">
            <span className="text-[13px] font-medium text-[#66706B] block">Opening Cash</span>
            <input type="number" value={openingCash} onChange={(e) => setOpeningCash(Number(e.target.value))} className="text-[24px] font-bold text-[#202522] mt-1 w-full border-0 p-0 focus:outline-none focus:ring-0" />
          </div>
          <KpiCard label="Cash Sales So Far" value={inr(cashSales)} icon={Wallet} valueColorClass="text-[#23865B]" sublabel={`${cashPayments.length} transactions`} />
          <KpiCard label="Expected Drawer Total" value={inr(expected)} icon={Wallet} valueColorClass="text-[#0F5B55]" />
        </div>

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs p-5">
          <h3 className="text-sm font-semibold text-[#202522] mb-3">Cash Transactions Today</h3>
          <div className="space-y-2">
            {cashPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2.5 bg-[#F3F0E9] rounded-md text-[13px]">
                <span className="text-[#202522]">{bills.find((b) => b.id === p.billId)?.billNumber}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[#66706B]">{new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="font-semibold text-[#23865B]">+{inr(p.amount)}</span>
                </div>
              </div>
            ))}
            {cashPayments.length === 0 && <div className="text-[13px] text-[#66706B]">No cash transactions recorded yet today.</div>}
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}
