'use client';

import React from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import KpiCard from '@/components/ui/KpiCard';
import StatusChip from '@/components/ui/StatusChip';
import { Gift, CheckCircle2 } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';
import { usePOSStore } from '@/store/pos-store';
import { useOutletStore } from '@/store/outlet-store';
import { outletService } from '@/services/outletService';
import { ROLE_LABELS } from '@/permissions/roleAccess';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function ComplimentaryBillsPage() {
  const { locations, currentRole } = useHRMSStore();
  const { bills, approveComplimentaryBill } = usePOSStore();
  const { selectedOutletId } = useOutletStore();
  const outlets = outletService.listOutlets(locations);
  const scopeIds = selectedOutletId === 'ALL' ? outlets.map((o) => o.id) : [selectedOutletId];

  const compBills = bills.filter((b) => scopeIds.includes(b.outletId) && b.billType === 'COMPLIMENTARY').sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const pending = compBills.filter((b) => !b.complimentaryApprovedBy);
  const approved = compBills.filter((b) => b.complimentaryApprovedBy);
  const totalGross = compBills.reduce((s, b) => s + b.grossAmount, 0);

  return (
    <ShellLayout>
      <div className="space-y-6">
        <SectionHeader title="Complimentary Bills" subtitle="Gross sale value is preserved — only the charged amount becomes ₹0, with a full approval trail." />

        <div className="grid grid-cols-3 gap-3">
          <KpiCard label="Gross Sale Value (Comp.)" value={inr(totalGross)} icon={Gift} />
          <KpiCard label="Pending Approval" value={pending.length} valueColorClass="text-[#C94B45]" />
          <KpiCard label="Approved" value={approved.length} valueColorClass="text-[#23865B]" />
        </div>

        <div>
          <h3 className="text-[13px] font-semibold text-[#202522] mb-2.5">Pending Manager Approval</h3>
          <div className="space-y-2.5">
            {pending.map((b) => (
              <div key={b.id} className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-bold text-[#202522]">{b.billNumber} <span className="text-[#66706B] font-normal">— {inr(b.grossAmount)} gross</span></div>
                  <div className="text-[12px] text-[#66706B] mt-0.5">Reason: {b.complimentaryReason} • Requested by {b.complimentaryRequestedBy}</div>
                </div>
                <button onClick={() => approveComplimentaryBill(b.id, ROLE_LABELS[currentRole])} className="px-4 py-2 bg-[#C68A28] hover:bg-[#a4711f] text-white text-[12px] font-semibold rounded-lg flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                </button>
              </div>
            ))}
            {pending.length === 0 && <div className="text-[13px] text-[#66706B] bg-white border border-[#E5E2DB] rounded-[10px] p-6 text-center">No complimentary bills pending approval.</div>}
          </div>
        </div>

        <div>
          <h3 className="text-[13px] font-semibold text-[#202522] mb-2.5">Approved / Report</h3>
          <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs overflow-hidden">
            <table className="w-full text-[13px]">
              <thead><tr className="bg-[#F3F0E9] border-b border-[#E5E2DB]">
                <th className="text-left px-4 py-2.5 font-semibold text-[#66706B] uppercase text-[11px]">Bill</th>
                <th className="text-left px-4 py-2.5 font-semibold text-[#66706B] uppercase text-[11px]">Gross Sale</th>
                <th className="text-left px-4 py-2.5 font-semibold text-[#66706B] uppercase text-[11px]">Final Charged</th>
                <th className="text-left px-4 py-2.5 font-semibold text-[#66706B] uppercase text-[11px]">Requested By</th>
                <th className="text-left px-4 py-2.5 font-semibold text-[#66706B] uppercase text-[11px]">Approved By</th>
              </tr></thead>
              <tbody>
                {approved.map((b) => (
                  <tr key={b.id} className="border-b border-[#E5E2DB] last:border-0">
                    <td className="px-4 py-2 font-medium text-[#202522]">{b.billNumber}</td>
                    <td className="px-4 py-2">{inr(b.grossAmount)}</td>
                    <td className="px-4 py-2"><StatusChip label={inr(b.netAmount)} tone="success" /></td>
                    <td className="px-4 py-2 text-[#66706B]">{b.complimentaryRequestedBy}</td>
                    <td className="px-4 py-2 text-[#66706B]">{b.complimentaryApprovedBy}</td>
                  </tr>
                ))}
                {approved.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-[#66706B]">No approved complimentary bills yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}
