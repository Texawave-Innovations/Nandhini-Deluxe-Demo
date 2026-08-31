import React from 'react';
import { Bill, POSOrder, Payment } from '@/types/pos';
import StatusChip from '@/components/ui/StatusChip';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

interface BillReceiptProps {
  bill: Bill;
  order?: POSOrder;
  payments?: Payment[];
}

export default function BillReceipt({ bill, order, payments = [] }: BillReceiptProps) {
  return (
    <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs p-5 font-mono text-[12px] max-w-sm mx-auto">
      <div className="text-center mb-3">
        <div className="font-sans text-[15px] font-bold text-[#0F5B55]">Nandhini Deluxe</div>
        <div className="text-[#66706B]">{bill.billNumber}</div>
        <div className="text-[#66706B]">{bill.businessDate}</div>
      </div>
      <div className="border-t border-dashed border-[#E5E2DB] my-2" />
      {order?.items.map((it) => (
        <div key={it.id} className="flex justify-between">
          <span>{it.qty}x {it.name}</span>
          <span>{inr(it.qty * it.unitPrice)}</span>
        </div>
      ))}
      <div className="border-t border-dashed border-[#E5E2DB] my-2" />
      <div className="flex justify-between"><span>Gross Amount</span><span>{inr(bill.grossAmount)}</span></div>
      {bill.discountAmount > 0 && <div className="flex justify-between text-[#C94B45]"><span>Discount</span><span>-{inr(bill.discountAmount)}</span></div>}
      {bill.complimentaryAmount > 0 && <div className="flex justify-between text-[#C94B45]"><span>Complimentary</span><span>-{inr(bill.complimentaryAmount)}</span></div>}
      {bill.nonChargeableAmount > 0 && <div className="flex justify-between text-[#C94B45]"><span>Non-Chargeable</span><span>-{inr(bill.nonChargeableAmount)}</span></div>}
      <div className="flex justify-between"><span>Tax (GST)</span><span>{inr(bill.taxAmount)}</span></div>
      {bill.serviceChargeAmount > 0 && <div className="flex justify-between"><span>Service Charge</span><span>{inr(bill.serviceChargeAmount)}</span></div>}
      <div className="flex justify-between"><span>Round Off</span><span>{inr(bill.roundOff)}</span></div>
      <div className="border-t border-dashed border-[#E5E2DB] my-2" />
      <div className="flex justify-between font-sans font-bold text-[14px] text-[#202522]"><span>Net Amount</span><span>{inr(bill.netAmount)}</span></div>

      <div className="mt-3 flex items-center justify-between font-sans">
        <StatusChip label={bill.billType} tone={bill.billType === 'NORMAL' ? 'brand' : bill.billType === 'VOID' ? 'danger' : 'warning'} />
        <StatusChip label={bill.status} tone={bill.status === 'PAID' ? 'success' : bill.status === 'VOID' ? 'danger' : 'neutral'} />
      </div>

      {payments.length > 0 && (
        <div className="mt-3 pt-2 border-t border-dashed border-[#E5E2DB] font-sans">
          <div className="text-[11px] font-semibold text-[#66706B] mb-1">Payments</div>
          {payments.map((p) => (
            <div key={p.id} className="flex justify-between text-[12px]"><span>{p.mode}</span><span>{inr(p.amount)}</span></div>
          ))}
        </div>
      )}

      {bill.billType === 'COMPLIMENTARY' && (
        <div className="mt-3 pt-2 border-t border-dashed border-[#E5E2DB] font-sans text-[11px] text-[#66706B]">
          <div>Reason: {bill.complimentaryReason}</div>
          <div>Requested by: {bill.complimentaryRequestedBy}</div>
          <div>Approved by: {bill.complimentaryApprovedBy ?? 'Pending approval'}</div>
        </div>
      )}
    </div>
  );
}
