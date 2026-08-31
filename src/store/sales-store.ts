// Sales / Accounts Receivable domain store: Customer Master, Sales Order pipeline (Draft ->
// Confirm -> Fulfill -> Invoice), and Customer Payments allocated across outstanding invoices.
// fulfillSalesOrder is the sole path that raises inventory-store.consumeForSalesOrder — components
// never call recipeService/inventory-store directly for a Sales Order's stock consumption.

import { create } from 'zustand';
import { Customer, CustomerPayment, CustomerPaymentMode, SalesInvoice, SalesOrder, SalesOrderLineItem } from '@/types/sales';
import { generateSalesSeed } from '@/mock-data/sales.seed';
import { salesService } from '@/services/salesService';
import { firebaseDataService } from '@/services/firebaseDataService';
import { useHRMSStore } from '@/store/hrms-store';
import { useInventoryStore } from '@/store/inventory-store';
import { INITIAL_MENU_ITEMS } from '@/mock-data/menu.seed';

interface SalesState {
  isHydrated: boolean;
  customers: Customer[];
  salesOrders: SalesOrder[];
  invoices: SalesInvoice[];
  customerPayments: CustomerPayment[];

  initializeFromFirebase: () => Promise<void>;

  addCustomer: (data: Omit<Customer, 'id' | 'code' | 'status' | 'createdAt'>) => void;
  updateCustomer: (id: string, data: Partial<Customer>) => void;

  createSalesOrder: (data: { customerId: string; outletId: string; lines: SalesOrderLineItem[]; deliveryDate: string; requestedBy: string; remarks?: string }) => SalesOrder;
  confirmSalesOrder: (id: string, actor: string) => void;
  fulfillSalesOrder: (id: string, actor: string) => void;
  cancelSalesOrder: (id: string) => void;

  generateInvoice: (params: { soId: string; invoiceDate: string; taxPercent: number; createdBy: string }) => SalesInvoice | undefined;
  recordCustomerPayment: (params: { customerId: string; amount: number; mode: CustomerPaymentMode; referenceNo?: string; receivedBy: string; invoiceIds?: string[] }) => CustomerPayment;
}

export const useSalesStore = create<SalesState>((set, get) => ({
  isHydrated: false,
  customers: [],
  salesOrders: [],
  invoices: [],
  customerPayments: [],

  initializeFromFirebase: async () => {
    if (get().isHydrated) return;
    try {
      const locations = useHRMSStore.getState().locations;
      const seeded = generateSalesSeed(locations, INITIAL_MENU_ITEMS);

      const fbCustomers = await firebaseDataService.fetchRecord('erp/sales/customers');
      const fbSOs = await firebaseDataService.fetchRecord('erp/sales/salesOrders');
      const fbInvoices = await firebaseDataService.fetchRecord('erp/sales/invoices');
      const fbPayments = await firebaseDataService.fetchRecord('erp/sales/payments');

      set({
        customers: fbCustomers && fbCustomers.length > 0 ? fbCustomers : seeded.customers,
        salesOrders: fbSOs && fbSOs.length > 0 ? fbSOs : seeded.salesOrders,
        invoices: fbInvoices && fbInvoices.length > 0 ? fbInvoices : seeded.invoices,
        customerPayments: fbPayments && fbPayments.length > 0 ? fbPayments : seeded.customerPayments,
        isHydrated: true,
      });

      if (!fbCustomers || fbCustomers.length === 0) {
        firebaseDataService.saveRecord('erp/sales/customers', seeded.customers);
        firebaseDataService.saveRecord('erp/sales/salesOrders', seeded.salesOrders);
        firebaseDataService.saveRecord('erp/sales/invoices', seeded.invoices);
        firebaseDataService.saveRecord('erp/sales/payments', seeded.customerPayments);
      }
    } catch (e) {
      console.warn('Sales hydration warning, using local seed:', e);
      const seeded = generateSalesSeed(useHRMSStore.getState().locations, INITIAL_MENU_ITEMS);
      set({ customers: seeded.customers, salesOrders: seeded.salesOrders, invoices: seeded.invoices, customerPayments: seeded.customerPayments, isHydrated: true });
    }
  },

  addCustomer: (data) => {
    const customer: Customer = { ...data, id: `cust-${Date.now()}`, code: salesService.generateCustomerCode(get().customers), status: 'ACTIVE', createdAt: new Date().toISOString() };
    set((state) => {
      const updated = [...state.customers, customer];
      firebaseDataService.saveRecord('erp/sales/customers', updated);
      return { customers: updated };
    });
  },

  updateCustomer: (id, data) => {
    set((state) => {
      const updated = state.customers.map((c) => c.id === id ? { ...c, ...data } : c);
      firebaseDataService.saveRecord('erp/sales/customers', updated);
      return { customers: updated };
    });
  },

  createSalesOrder: (data) => {
    const so: SalesOrder = {
      id: `so-${Date.now()}`, soNumber: salesService.generateSONumber(get().salesOrders),
      customerId: data.customerId, outletId: data.outletId, lines: data.lines,
      totalAmount: Math.round(data.lines.reduce((s, l) => s + l.qty * l.rate, 0) * 100) / 100,
      status: 'DRAFT', deliveryDate: data.deliveryDate, requestedBy: data.requestedBy, requestedAt: new Date().toISOString(),
      // Omit (never assign undefined to) optional fields — Firebase's set() rejects any object
      // containing a literal `undefined` value.
      ...(data.remarks ? { remarks: data.remarks } : {}),
    };
    set((state) => {
      const updated = [so, ...state.salesOrders];
      firebaseDataService.saveRecord('erp/sales/salesOrders', updated);
      return { salesOrders: updated };
    });
    return so;
  },

  confirmSalesOrder: (id, actor) => {
    set((state) => {
      const updated = state.salesOrders.map((so) => so.id === id && so.status === 'DRAFT'
        ? { ...so, status: 'CONFIRMED' as const, confirmedBy: actor, confirmedAt: new Date().toISOString() } : so);
      firebaseDataService.saveRecord('erp/sales/salesOrders', updated);
      return { salesOrders: updated };
    });
  },

  fulfillSalesOrder: (id, actor) => {
    const so = get().salesOrders.find((s) => s.id === id);
    if (!so || so.status !== 'CONFIRMED') return;

    // Never write inventory directly — post consumption through inventory-store, mirroring how
    // pos-store.generateBill and purchase-store.postGRN wire into the same event-driven ledger.
    useInventoryStore.getState().consumeForSalesOrder({
      salesOrderId: so.id, salesOrderNumber: so.soNumber, outletId: so.outletId, createdBy: actor,
      items: so.lines.map((l) => ({ menuItemId: l.menuItemId, name: l.name, qty: l.qty })),
    });

    set((state) => {
      const updated = state.salesOrders.map((s) => s.id === id ? { ...s, status: 'FULFILLED' as const, fulfilledAt: new Date().toISOString() } : s);
      firebaseDataService.saveRecord('erp/sales/salesOrders', updated);
      return { salesOrders: updated };
    });
  },

  cancelSalesOrder: (id) => {
    set((state) => {
      const updated = state.salesOrders.map((so) => so.id === id ? { ...so, status: 'CANCELLED' as const } : so);
      firebaseDataService.saveRecord('erp/sales/salesOrders', updated);
      return { salesOrders: updated };
    });
  },

  generateInvoice: (params) => {
    const so = get().salesOrders.find((s) => s.id === params.soId);
    if (!so || so.status !== 'FULFILLED') return undefined;

    const built = salesService.buildInvoiceFromSalesOrder({
      so, invoiceDate: params.invoiceDate, taxPercent: params.taxPercent,
      dueInDays: 15, createdBy: params.createdBy,
    });
    const invoice: SalesInvoice = {
      id: `sinv-${Date.now()}`, invoiceNumber: salesService.generateInvoiceNumber(get().invoices), ...built,
      amountReceived: 0, status: 'UNPAID',
    };

    set((state) => {
      const updatedInvoices = [invoice, ...state.invoices];
      const updatedSOs = state.salesOrders.map((s) => s.id === so.id ? { ...s, status: 'INVOICED' as const } : s);
      firebaseDataService.saveRecord('erp/sales/invoices', updatedInvoices);
      firebaseDataService.saveRecord('erp/sales/salesOrders', updatedSOs);
      return { invoices: updatedInvoices, salesOrders: updatedSOs };
    });
    return invoice;
  },

  recordCustomerPayment: (params) => {
    const allocations = params.invoiceIds && params.invoiceIds.length > 0
      ? params.invoiceIds.map((invoiceId) => {
          const invoice = get().invoices.find((i) => i.id === invoiceId);
          const due = invoice ? invoice.totalAmount - invoice.amountReceived : 0;
          return { invoiceId, amount: Math.min(due, params.amount / params.invoiceIds!.length) };
        })
      : salesService.allocatePaymentToInvoices(get().invoices, params.customerId, params.amount);

    const payment: CustomerPayment = {
      id: `cpay-${Date.now()}`, paymentNumber: salesService.generatePaymentNumber(get().customerPayments),
      customerId: params.customerId, mode: params.mode, amount: params.amount,
      // Omit (never assign undefined to) referenceNo when blank — Firebase's set() rejects any
      // object containing a literal `undefined` value.
      ...(params.referenceNo ? { referenceNo: params.referenceNo } : {}),
      allocations, status: 'SUCCESS', receivedBy: params.receivedBy, receivedAt: new Date().toISOString(),
    };

    set((state) => {
      const updatedPayments = [payment, ...state.customerPayments];
      const updatedInvoices = state.invoices.map((inv) => {
        const alloc = allocations.find((a) => a.invoiceId === inv.id);
        if (!alloc) return inv;
        const newAmountReceived = Math.round((inv.amountReceived + alloc.amount) * 100) / 100;
        return { ...inv, amountReceived: newAmountReceived, status: salesService.computeInvoiceStatusAfterPayment(inv, newAmountReceived) };
      });
      firebaseDataService.saveRecord('erp/sales/payments', updatedPayments);
      firebaseDataService.saveRecord('erp/sales/invoices', updatedInvoices);
      return { customerPayments: updatedPayments, invoices: updatedInvoices };
    });

    return payment;
  },
}));
