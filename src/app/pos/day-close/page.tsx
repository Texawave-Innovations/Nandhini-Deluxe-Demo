'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import StatusChip from '@/components/ui/StatusChip';
import { AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';
import { usePOSStore } from '@/store/pos-store';
import { useOutletStore } from '@/store/outlet-store';
import { outletService } from '@/services/outletService';
import { ROLE_LABELS } from '@/permissions/roleAccess';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function DayClosePage() {
  const { locations, currentRole } = useHRMSStore();
  const { dayCloses, submitDayClose, managerApproveDayClose, closeBusinessDay } = usePOSStore();
  const { selectedOutletId, businessDate } = useOutletStore();
  const outlets = outletService.listOutlets(locations);
  const effectiveOutletId = selectedOutletId === 'ALL' ? (outlets[0]?.id ?? '') : selectedOutletId;
  const actor = ROLE_LABELS[currentRole];

  const [openingCash, setOpeningCash] = useState(25000);
  const [cashExpenses, setCashExpenses] = useState(1500);
  const [actualCash, setActualCash] = useState(0);

  const dayClose = dayCloses.find((d) => d.outletId === effectiveOutletId && d.businessDate === businessDate);

  const rows = dayClose ? [
    ['Opening Cash', dayClose.openingCash], ['Cash Sales', dayClose.cashSales], ['UPI Sales', dayClose.upiSales],
    ['Card Sales', dayClose.cardSales], ['Razorpay Sales', dayClose.razorpaySales], ['Swiggy', dayClose.swiggySales],
    ['Zomato', dayClose.zomatoSales], ['Dineout', dayClose.dineoutSales], ['Hotel', dayClose.hotelSales],
    ['Banquet', dayClose.banquetSales], ['Refunds', -dayClose.refunds], ['Cash Expenses', -dayClose.cashExpenses],
  ] as [string, number][] : [];

  return (
    <ShellLayout>
      <div className="space-y-6 max-w-3xl">
        <SectionHeader title="Day Close" subtitle={`${outlets.find((o) => o.id === effectiveOutletId)?.name} — Business Date ${businessDate}`} />

        {!dayClose && (
          <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs p-6 space-y-4">
            <h3 className="text-[14px] font-semibold text-[#202522]">Step 1 — Submit Day Close</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Opening Cash (₹)</label>
                <input type="number" value={openingCash} onChange={(e) => setOpeningCash(Number(e.target.value))} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2.5 text-[14px]" />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Cash Expenses (₹)</label>
                <input type="number" value={cashExpenses} onChange={(e) => setCashExpenses(Number(e.target.value))} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2.5 text-[14px]" />
              </div>
            </div>
            <button onClick={() => submitDayClose(effectiveOutletId, businessDate, openingCash, cashExpenses, actor)} className="w-full h-11 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[14px] rounded-[8px]">SUBMIT DAY CLOSE</button>
          </div>
        )}

        {dayClose && (
          <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs overflow-hidden">
            <div className="bg-[#0F5B55] text-white px-5 py-3.5 flex items-center justify-between">
              <span className="text-[14px] font-semibold">Day Close Summary</span>
              <StatusChip label={dayClose.status.replace('_', ' ')} tone={dayClose.status === 'CLOSED' ? 'success' : 'warning'} />
            </div>
            <div className="p-5 space-y-1.5">
              {rows.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-[#E5E2DB] text-[13px]">
                  <span className="text-[#66706B]">{label}</span>
                  <span className={`font-semibold ${value < 0 ? 'text-[#C94B45]' : 'text-[#202522]'}`}>{value < 0 ? '-' : ''}{inr(Math.abs(value))}</span>
                </div>
              ))}
              <div className="flex items-center justify-between py-2.5 text-[15px] font-bold text-[#0F5B55]">
                <span>Expected Closing Cash</span><span>{inr(dayClose.expectedClosingCash)}</span>
              </div>

              {dayClose.status === 'SUBMITTED' && (
                <div className="pt-2 space-y-3">
                  <div className="text-[12px] text-[#66706B] bg-[#F3F0E9] rounded-lg p-2.5">Awaiting manager review of the submitted totals before cash counting.</div>
                  <button onClick={() => managerApproveDayClose(dayClose.id, actor)} className="w-full h-11 bg-[#C68A28] hover:bg-[#a4711f] text-white font-semibold text-[14px] rounded-[8px]">MANAGER APPROVAL</button>
                </div>
              )}

              {dayClose.status === 'MANAGER_APPROVED' && (
                <div className="pt-3 space-y-3">
                  <div>
                    <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Actual Cash Counted (₹)</label>
                    <input type="number" value={actualCash} onChange={(e) => setActualCash(Number(e.target.value))} placeholder={String(dayClose.expectedClosingCash)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2.5 text-[14px]" />
                  </div>
                  <button onClick={() => closeBusinessDay(dayClose.id, actualCash)} className="w-full h-11 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[14px] rounded-[8px] flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" /> CLOSE BUSINESS DAY
                  </button>
                </div>
              )}

              {dayClose.status === 'CLOSED' && (
                <div className="pt-3 space-y-2">
                  <div className="flex items-center justify-between py-1.5 text-[13px]"><span className="text-[#66706B]">Actual Cash</span><span className="font-semibold">{inr(dayClose.actualClosingCash ?? 0)}</span></div>
                  <div className={`flex items-center justify-between p-3 rounded-lg font-bold text-[14px] ${dayClose.variance === 0 ? 'bg-[#23865B]/10 text-[#23865B]' : 'bg-[#C94B45]/10 text-[#C94B45]'}`}>
                    <span className="flex items-center gap-2">{dayClose.variance !== 0 && <AlertTriangle className="w-4 h-4" />} Cash Variance</span>
                    <span>{(dayClose.variance ?? 0) >= 0 ? '+' : '-'}{inr(Math.abs(dayClose.variance ?? 0))}</span>
                  </div>
                  {dayClose.variance !== 0 && <StatusChip label="Flagged as Exception" tone="danger" />}
                  <div className="flex items-center gap-2 text-[12px] text-[#66706B] pt-1"><CheckCircle2 className="w-3.5 h-3.5 text-[#23865B]" /> Business day closed by {dayClose.approvedBy} • {dayClose.approvedAt && new Date(dayClose.approvedAt).toLocaleString('en-IN')}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
