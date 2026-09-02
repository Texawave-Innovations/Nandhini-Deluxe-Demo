// Vendor Bill + Vendor Payment historical seed: one bill per posted GRN, computed through the
// real financeService (buildVendorBillFromGRN + performThreeWayMatch) so seeded data is exactly
// as consistent as data the live UI would produce. A spread of PAID/PARTIALLY_PAID/MISMATCH/
// overdue bills gives the AP aging + Tally export-history pages something to show day one.

import { GRN, PurchaseOrder } from '../types/purchase';
import { Vendor } from '../types/vendor';
import { VendorBill, VendorBillLineItem, VendorPayment, VendorPaymentMode } from '../types/finance';
import { financeService } from '../services/financeService';

function seeded(n: number): number {
  const x = Math.sin(n * 33.719) * 58291.741;
  return x - Math.floor(x);
}

const PAYMENT_MODES: VendorPaymentMode[] = ['NEFT', 'RTGS', 'UPI'];

export interface FinanceSeedResult {
  vendorBills: VendorBill[];
  vendorPayments: VendorPayment[];
}

export function generateFinanceSeed(purchaseOrders: PurchaseOrder[], grns: GRN[], vendors: Vendor[]): FinanceSeedResult {
  const vendorBills: VendorBill[] = [];
  const vendorPayments: VendorPayment[] = [];
  let billSeq = 1;
  let paySeq = 1;

  const postedGRNs = grns.filter((g) => g.status === 'POSTED');

  postedGRNs.forEach((grn, idx) => {
    const po = purchaseOrders.find((p) => p.id === grn.poId);
    const vendor = vendors.find((v) => v.id === grn.vendorId);
    if (!po || !vendor) return;

    const isPinned = grn.id === 'grn-abc-pin';
    const isMismatch = !isPinned && idx % 6 === 3;
    const taxPercent = isPinned ? 0 : 5;
    const dueInDays = isPinned ? 20 : vendor.paymentTermsDays;

    const built = financeService.buildVendorBillFromGRN({
      grn, vendorInvoiceNumber: grn.invoiceRefNo ?? `INV-${vendor.code}-${1000 + idx}`,
      invoiceDate: grn.receivedAt.substring(0, 10), taxPercent, dueInDays, createdBy: 'Finance Executive',
    });

    let lines: VendorBillLineItem[] = built.lines;
    if (isMismatch && lines.length > 0) {
      const bumped = { ...lines[0], rate: Math.round(lines[0].rate * 1.04 * 100) / 100 };
      bumped.lineTotal = Math.round(bumped.billedQty * bumped.rate * 100) / 100;
      lines = [bumped, ...lines.slice(1)];
    }
    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    const taxAmount = Math.round(subtotal * (taxPercent / 100) * 100) / 100;
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    const billScaffold: VendorBill = {
      id: `apb-${billSeq}`, billNumber: `APB-${1000 + billSeq}`, ...built, lines, taxAmount, totalAmount,
      amountPaid: 0, status: 'MATCHED', createdAt: grn.receivedAt,
    };
    const matchResult = financeService.performThreeWayMatch(po, grn, billScaffold);
    billScaffold.matchResult = matchResult;
    billScaffold.status = matchResult.status;

    const r = seeded(idx + 1);
    if (isPinned) {
      // Deliberately unpaid — this is the ₹2.5L "due within two days" continuity figure.
      vendorBills.push(billScaffold);
    } else if (matchResult.status === 'MISMATCH') {
      // Sitting unresolved pending finance review — matches the "Bills Mismatched" KPI.
      vendorBills.push(billScaffold);
    } else if (idx % 5 === 4) {
      // Unpaid / overdue.
      vendorBills.push(billScaffold);
    } else if (idx % 5 === 3) {
      // Partially paid.
      const payAmount = Math.round(totalAmount * (0.5 + r * 0.2) * 100) / 100;
      const mode = PAYMENT_MODES[idx % PAYMENT_MODES.length];
      const payment: VendorPayment = {
        id: `vpay-${paySeq}`, paymentNumber: `PAY-${1000 + paySeq}`, vendorId: vendor.id, mode, amount: payAmount,
        referenceNo: `${mode}-${400000 + paySeq}`, allocations: [{ billId: billScaffold.id, amount: payAmount }],
        status: 'SUCCESS', paidBy: 'Finance Executive', paidAt: grn.receivedAt,
      };
      vendorPayments.push(payment);
      paySeq++;
      vendorBills.push({ ...billScaffold, amountPaid: payAmount, status: financeService.computeBillStatusAfterPayment(billScaffold, payAmount) });
    } else {
      // Paid in full.
      const mode = PAYMENT_MODES[idx % PAYMENT_MODES.length];
      const payment: VendorPayment = {
        id: `vpay-${paySeq}`, paymentNumber: `PAY-${1000 + paySeq}`, vendorId: vendor.id, mode, amount: totalAmount,
        referenceNo: `${mode}-${400000 + paySeq}`, allocations: [{ billId: billScaffold.id, amount: totalAmount }],
        status: 'SUCCESS', paidBy: 'Finance Executive', paidAt: grn.receivedAt,
      };
      vendorPayments.push(payment);
      paySeq++;
      vendorBills.push({ ...billScaffold, amountPaid: totalAmount, status: 'PAID' });
    }
    billSeq++;
  });

  // Pinned AI-insight continuity below: two checks in aiInsightsService.detectVendorBillAnomalies
  // and one in projectCashFlowGap need a scenario the GRN-driven generation above never happens to
  // produce on its own — so AI Insights -> Finance shows a real flag for each on day one.

  // (a) Duplicate vendor invoice number: two distinct bills for the same vendor, same invoice
  // number — the kind of double-entry a manual glance at the bill list would miss.
  const dupCandidates = vendorBills.filter((b) => b.status !== 'CANCELLED');
  const dupVendorId = dupCandidates[0]?.vendorId;
  const dupPair = dupVendorId ? dupCandidates.filter((b) => b.vendorId === dupVendorId) : [];
  if (dupPair.length >= 2) {
    dupPair[1].vendorInvoiceNumber = dupPair[0].vendorInvoiceNumber;
  }

  // (b) A small near-term bill outside the GRN cycle, so payables due soon genuinely outpace
  // receivables due soon (the AP/AR totals from the generated bills alone fall just short).
  const gapFillerVendor = vendors[0];
  if (gapFillerVendor) {
    vendorBills.push({
      id: 'apb-gap-filler', billNumber: 'APB-9099', vendorInvoiceNumber: `INV-${gapFillerVendor.code}-9099`,
      vendorId: gapFillerVendor.id, grnId: 'grn-gap-filler', poId: 'po-gap-filler', outletId: 'loc-1',
      invoiceDate: '2026-08-28', dueDate: '2026-09-02',
      lines: [{ itemId: 'inv-1', billedQty: 1, rate: 35000, lineTotal: 35000 }],
      taxAmount: 0, totalAmount: 35000, amountPaid: 0, status: 'APPROVED', createdBy: 'Finance Executive', createdAt: '2026-08-28T10:00:00.000Z',
    });
  }

  return { vendorBills, vendorPayments };
}
