'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import StatusChip, { ChipTone } from '@/components/ui/StatusChip';
import Modal from '@/components/ui/Modal';
import { Ban, CheckCircle2 } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';
import { usePOSStore } from '@/store/pos-store';
import { useOutletStore } from '@/store/outlet-store';
import { outletService } from '@/services/outletService';
import { ROLE_LABELS } from '@/permissions/roleAccess';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const STATUS_TONE: Record<string, ChipTone> = { PENDING: 'warning', APPROVED: 'danger', REJECTED: 'neutral' };

export default function VoidCancelledPage() {
  const { locations, currentRole } = useHRMSStore();
  const { bills, voidRequests, requestVoid, approveVoid } = usePOSStore();
  const { selectedOutletId } = useOutletStore();
  const outlets = outletService.listOutlets(locations);
  const scopeIds = selectedOutletId === 'ALL' ? outlets.map((o) => o.id) : [selectedOutletId];

  const [showNew, setShowNew] = useState(false);
  const [billId, setBillId] = useState('');
  const [reason, setReason] = useState('');

  const voidableBills = bills.filter((b) => scopeIds.includes(b.outletId) && b.status !== 'VOID');
  const requests = voidRequests.filter((r) => voidableBills.some((b) => b.id === r.billId) || bills.some((b) => b.id === r.billId && b.status === 'VOID'));
  const actor = ROLE_LABELS[currentRole];

  const submit = () => {
    if (!billId || !reason) return;
    requestVoid(billId, reason, actor);
    setShowNew(false); setBillId(''); setReason('');
  };

  return (
    <ShellLayout>
      <div className="space-y-5">
        <SectionHeader
          title="Void / Cancelled Bills"
          subtitle="Bills are never deleted — voiding requires a reason and manager approval, and remains in the audit trail permanently."
          actions={<button onClick={() => setShowNew(true)} className="h-10 px-4 bg-white border border-[#E5E2DB] hover:bg-[#F3F0E9] text-[#202522] font-semibold text-[13px] rounded-[8px] flex items-center gap-2"><Ban className="w-4 h-4 text-[#C94B45]" /> Request Void</button>}
        />

        <div className="space-y-2.5">
          {requests.map((r) => {
            const bill = bills.find((b) => b.id === r.billId);
            return (
              <div key={r.id} className="bg-white border border-[#E5E2DB] rounded-[10px] p-4 shadow-brand-xs flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-bold text-[#202522]">{bill?.billNumber} <span className="text-[#66706B] font-normal">— {bill && inr(bill.netAmount)}</span></div>
                  <div className="text-[12px] text-[#66706B] mt-0.5">Reason: {r.reason} • Requested by {r.requestedBy} on {new Date(r.requestedAt).toLocaleString('en-IN')}</div>
                  {r.approvedBy && <div className="text-[11px] text-[#66706B] mt-0.5">Approved by {r.approvedBy} on {r.approvedAt && new Date(r.approvedAt).toLocaleString('en-IN')}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <StatusChip label={r.status} tone={STATUS_TONE[r.status]} />
                  {r.status === 'PENDING' && (
                    <button onClick={() => approveVoid(r.id, actor)} className="px-3.5 py-1.5 bg-[#C94B45] hover:bg-[#a83a35] text-white text-[12px] font-semibold rounded-lg flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Approve Void</button>
                  )}
                </div>
              </div>
            );
          })}
          {requests.length === 0 && <div className="text-[13px] text-[#66706B] bg-white border border-[#E5E2DB] rounded-[10px] p-8 text-center">No void requests on record.</div>}
        </div>
      </div>

      <Modal
        open={showNew} onClose={() => setShowNew(false)} title="Request Void"
        footer={<>
          <button onClick={() => setShowNew(false)} className="px-4 py-2 text-[13px] font-semibold text-[#66706B]">Cancel</button>
          <button onClick={submit} className="px-4 py-2 bg-[#C94B45] text-white text-[13px] font-semibold rounded-[8px]">Submit Request</button>
        </>}
      >
        <div className="space-y-3">
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Bill</label>
            <select value={billId} onChange={(e) => setBillId(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]">
              <option value="">Select a bill</option>
              {voidableBills.slice(0, 50).map((b) => <option key={b.id} value={b.id}>{b.billNumber} — {inr(b.netAmount)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Reason</label>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Duplicate bill raised by mistake" className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
          </div>
        </div>
      </Modal>
    </ShellLayout>
  );
}
