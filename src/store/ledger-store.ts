// Core double-entry accounting store: LedgerAccounts (chart of accounts) and Vouchers (balanced
// debit/credit entries). Hydrates last in ShellLayout's staged sequence since it derives its
// starting vouchers from already-hydrated Vendor/Customer/Finance/Sales data. This is the single
// source of truth for every ledger/BRS/projection/dashboard screen — none of those may keep their
// own duplicate running totals.

import { create } from 'zustand';
import { LedgerAccount, LedgerEntry, Voucher, VoucherType } from '@/types/ledger';
import { ledgerService } from '@/services/ledgerService';
import { firebaseDataService } from '@/services/firebaseDataService';
import { useVendorStore } from '@/store/vendor-store';
import { useSalesStore } from '@/store/sales-store';
import { useFinanceStore } from '@/store/finance-store';

interface LedgerState {
  isHydrated: boolean;
  ledgerAccounts: LedgerAccount[];
  vouchers: Voucher[];

  initializeFromFirebase: () => Promise<void>;

  // Idempotent: derives PURCHASE_BILL/PAYMENT/SALES_INVOICE/RECEIPT vouchers from every
  // already-hydrated VendorBill/VendorPayment/SalesInvoice/CustomerPayment that doesn't already
  // have a derived voucher, posts them directly (they record already-settled history, not new
  // drafts awaiting review), and persists. Returns the vouchers now in state.
  generateVouchersFromHistoricalEvents: () => Voucher[];

  createManualVoucher: (params: { voucherType: VoucherType; voucherDate: string; narration: string; lines: LedgerEntry[]; createdBy: string }) => Voucher;
  postVoucher: (id: string, actor: string) => { ok: boolean; error?: string };
  reverseVoucher: (id: string, actor: string) => { ok: boolean; voucher?: Voucher; error?: string };
}

function newVoucherId(): string {
  return `vch-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export const useLedgerStore = create<LedgerState>((set, get) => ({
  isHydrated: false,
  ledgerAccounts: [],
  vouchers: [],

  initializeFromFirebase: async () => {
    if (get().isHydrated) return;
    try {
      const vendors = useVendorStore.getState().vendors;
      const customers = useSalesStore.getState().customers;
      const seededAccounts = ledgerService.buildLedgerAccountsSeed(vendors, customers);

      const fbAccounts = await firebaseDataService.fetchRecord('erp/ledger/accounts');
      const fbVouchers = await firebaseDataService.fetchRecord('erp/ledger/vouchers');

      set({
        ledgerAccounts: fbAccounts && fbAccounts.length > 0 ? fbAccounts : seededAccounts,
        vouchers: fbVouchers || [],
        isHydrated: true,
      });

      if (!fbAccounts || fbAccounts.length === 0) {
        firebaseDataService.saveRecord('erp/ledger/accounts', seededAccounts);
      }
      if (!fbVouchers || fbVouchers.length === 0) {
        get().generateVouchersFromHistoricalEvents();
      }
    } catch (e) {
      console.warn('Ledger hydration warning, using local seed:', e);
      const seededAccounts = ledgerService.buildLedgerAccountsSeed(
        useVendorStore.getState().vendors,
        useSalesStore.getState().customers,
      );
      set({ ledgerAccounts: seededAccounts, vouchers: [], isHydrated: true });
      get().generateVouchersFromHistoricalEvents();
    }
  },

  generateVouchersFromHistoricalEvents: () => {
    const accounts = get().ledgerAccounts;
    const existing = get().vouchers;
    const now = new Date().toISOString();

    const findAccount = (predicate: (a: LedgerAccount) => boolean) => accounts.find(predicate);
    const purchasesAccount = findAccount((a) => a.code === 'LAC-EXP-PURCHASE');
    const salesAccount = findAccount((a) => a.code === 'LAC-INC-SALES');
    const bankAccount = findAccount((a) => a.code === 'LAC-BANK-01');
    const cashAccount = findAccount((a) => a.code === 'LAC-CASH-01');
    if (!purchasesAccount || !salesAccount || !bankAccount || !cashAccount) return existing;

    const existingKeys = new Set(
      existing.filter((v) => v.refType && v.refId).map((v) => `${v.refType}:${v.refId}`),
    );

    const newVouchers: Voucher[] = [];
    const nextNumber = (voucherType: VoucherType) =>
      ledgerService.generateVoucherNumber(voucherType, [...existing, ...newVouchers]);

    const { vendorBills, vendorPayments } = useFinanceStore.getState();
    const { invoices, customerPayments } = useSalesStore.getState();

    for (const bill of vendorBills) {
      if (bill.status === 'CANCELLED' || bill.status === 'MISMATCH') continue;
      const key = `VENDOR_BILL:${bill.id}`;
      if (existingKeys.has(key)) continue;
      const vendorAccount = findAccount((a) => a.vendorId === bill.vendorId);
      if (!vendorAccount) continue;
      const built = ledgerService.buildPurchaseBillVoucher(bill, vendorAccount, purchasesAccount);
      if (!ledgerService.isBalanced(built.lines)) continue;
      newVouchers.push({
        id: newVoucherId(),
        voucherNumber: nextNumber('PURCHASE_BILL'),
        ...built,
        status: 'POSTED',
        createdBy: 'system',
        createdAt: now,
        postedBy: 'system',
        postedAt: now,
      });
    }

    for (const payment of vendorPayments) {
      if (payment.status !== 'SUCCESS') continue;
      const key = `VENDOR_PAYMENT:${payment.id}`;
      if (existingKeys.has(key)) continue;
      const vendorAccount = findAccount((a) => a.vendorId === payment.vendorId);
      if (!vendorAccount) continue;
      const contraAccount = payment.mode === 'CASH' ? cashAccount : bankAccount;
      const built = ledgerService.buildPaymentVoucher(payment, vendorAccount, contraAccount);
      if (!ledgerService.isBalanced(built.lines)) continue;
      newVouchers.push({
        id: newVoucherId(),
        voucherNumber: nextNumber('PAYMENT'),
        ...built,
        status: 'POSTED',
        createdBy: 'system',
        createdAt: now,
        postedBy: 'system',
        postedAt: now,
      });
    }

    for (const invoice of invoices) {
      if (invoice.status === 'CANCELLED') continue;
      const key = `SALES_INVOICE:${invoice.id}`;
      if (existingKeys.has(key)) continue;
      const customerAccount = findAccount((a) => a.customerId === invoice.customerId);
      if (!customerAccount) continue;
      const built = ledgerService.buildSalesInvoiceVoucher(invoice, customerAccount, salesAccount);
      if (!ledgerService.isBalanced(built.lines)) continue;
      newVouchers.push({
        id: newVoucherId(),
        voucherNumber: nextNumber('SALES_INVOICE'),
        ...built,
        status: 'POSTED',
        createdBy: 'system',
        createdAt: now,
        postedBy: 'system',
        postedAt: now,
      });
    }

    for (const payment of customerPayments) {
      if (payment.status !== 'SUCCESS') continue;
      const key = `CUSTOMER_PAYMENT:${payment.id}`;
      if (existingKeys.has(key)) continue;
      const customerAccount = findAccount((a) => a.customerId === payment.customerId);
      if (!customerAccount) continue;
      const contraAccount = payment.mode === 'CASH' ? cashAccount : bankAccount;
      const built = ledgerService.buildReceiptVoucher(payment, customerAccount, contraAccount);
      if (!ledgerService.isBalanced(built.lines)) continue;
      newVouchers.push({
        id: newVoucherId(),
        voucherNumber: nextNumber('RECEIPT'),
        ...built,
        status: 'POSTED',
        createdBy: 'system',
        createdAt: now,
        postedBy: 'system',
        postedAt: now,
      });
    }

    if (newVouchers.length === 0) return existing;

    const updated = [...existing, ...newVouchers];
    set({ vouchers: updated });
    firebaseDataService.saveRecord('erp/ledger/vouchers', updated);
    return updated;
  },

  createManualVoucher: (params) => {
    const voucher: Voucher = {
      id: newVoucherId(),
      voucherNumber: ledgerService.generateVoucherNumber(params.voucherType, get().vouchers),
      voucherType: params.voucherType,
      voucherDate: params.voucherDate,
      narration: params.narration,
      lines: params.lines,
      status: 'DRAFT',
      refType: 'MANUAL',
      createdBy: params.createdBy,
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const updated = [voucher, ...state.vouchers];
      firebaseDataService.saveRecord('erp/ledger/vouchers', updated);
      return { vouchers: updated };
    });
    return voucher;
  },

  postVoucher: (id, actor) => {
    const voucher = get().vouchers.find((v) => v.id === id);
    if (!voucher) return { ok: false, error: 'Voucher not found.' };
    if (voucher.status !== 'DRAFT') return { ok: false, error: 'Only a DRAFT voucher can be posted.' };

    const knownAccountIds = new Set(get().ledgerAccounts.map((a) => a.id));
    const validation = ledgerService.validateVoucher(voucher, knownAccountIds);
    if (!validation.valid) return { ok: false, error: validation.error };

    set((state) => {
      const updated = state.vouchers.map((v) =>
        v.id === id ? { ...v, status: 'POSTED' as const, postedBy: actor, postedAt: new Date().toISOString() } : v,
      );
      firebaseDataService.saveRecord('erp/ledger/vouchers', updated);
      return { vouchers: updated };
    });
    return { ok: true };
  },

  reverseVoucher: (id, actor) => {
    const original = get().vouchers.find((v) => v.id === id);
    if (!original) return { ok: false, error: 'Voucher not found.' };
    if (original.status !== 'POSTED') return { ok: false, error: 'Only a POSTED voucher can be reversed.' };

    const built = ledgerService.buildReversalVoucher(original, actor);
    const reversal: Voucher = {
      id: newVoucherId(),
      voucherNumber: ledgerService.generateVoucherNumber(built.voucherType, get().vouchers),
      ...built,
      status: 'POSTED',
      postedBy: actor,
      postedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    set((state) => {
      const updated = state.vouchers.map((v) =>
        v.id === original.id ? { ...v, status: 'REVERSED' as const, reversedByVoucherId: reversal.id } : v,
      ).concat(reversal);
      firebaseDataService.saveRecord('erp/ledger/vouchers', updated);
      return { vouchers: updated };
    });
    return { ok: true, voucher: reversal };
  },
}));
