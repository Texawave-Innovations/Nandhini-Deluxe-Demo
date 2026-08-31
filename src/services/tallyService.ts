// Tally / accounting export domain service: builds mock accounting vouchers from posted GRNs
// and settled Vendor Payments, and renders a cosmetic mock-XML preview for an export batch. No
// live Tally connector — this is a mockup of the export, not a real integration.

import { GRN } from '@/types/purchase';
import { VendorPayment } from '@/types/finance';
import { Vendor } from '@/types/vendor';
import { TallyExportBatch, TallyVoucher } from '@/types/tally';

export const tallyService = {
  generateBatchNumber(existing: TallyExportBatch[]): string {
    return `TXP-${String(100000 + existing.length + 1).slice(-6)}`;
  },

  buildPurchaseVoucherFromGRN(grn: GRN, vendor: Vendor): Omit<TallyVoucher, 'id' | 'status' | 'exportBatchId'> {
    return {
      voucherType: 'PURCHASE',
      voucherNumber: `PV-${grn.grnNumber}`,
      voucherDate: grn.receivedAt.substring(0, 10),
      refType: 'GRN',
      refId: grn.id,
      ledgerName: vendor.name,
      narration: `Purchase against ${grn.grnNumber} from ${vendor.name}`,
      debitLedger: 'Purchases',
      creditLedger: vendor.name,
      amount: grn.totalAmount,
      createdAt: new Date().toISOString(),
    };
  },

  buildPaymentVoucherFromVendorPayment(payment: VendorPayment, vendor: Vendor): Omit<TallyVoucher, 'id' | 'status' | 'exportBatchId'> {
    return {
      voucherType: 'PAYMENT',
      voucherNumber: `PMV-${payment.paymentNumber}`,
      voucherDate: payment.paidAt.substring(0, 10),
      refType: 'VENDOR_PAYMENT',
      refId: payment.id,
      ledgerName: vendor.name,
      narration: `Payment to ${vendor.name} via ${payment.mode}${payment.referenceNo ? ` (Ref: ${payment.referenceNo})` : ''}`,
      debitLedger: vendor.name,
      creditLedger: 'Bank Account',
      amount: payment.amount,
      createdAt: new Date().toISOString(),
    };
  },

  // Cosmetic mock Tally-style XML — for the export-history preview only, not schema-validated.
  toTallyXML(vouchers: TallyVoucher[]): string {
    const body = vouchers
      .map((v) => `    <VOUCHER VCHTYPE="${v.voucherType === 'PURCHASE' ? 'Purchase' : 'Payment'}" ACTION="Create">
      <DATE>${v.voucherDate.replace(/-/g, '')}</DATE>
      <VOUCHERNUMBER>${v.voucherNumber}</VOUCHERNUMBER>
      <NARRATION>${v.narration}</NARRATION>
      <LEDGERENTRIES.LIST>
        <LEDGERNAME>${v.debitLedger}</LEDGERNAME>
        <AMOUNT>-${v.amount.toFixed(2)}</AMOUNT>
      </LEDGERENTRIES.LIST>
      <LEDGERENTRIES.LIST>
        <LEDGERNAME>${v.creditLedger}</LEDGERNAME>
        <AMOUNT>${v.amount.toFixed(2)}</AMOUNT>
      </LEDGERENTRIES.LIST>
    </VOUCHER>`)
      .join('\n');

    return `<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC>
      <REQUESTDATA>
${body}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
  },
};
