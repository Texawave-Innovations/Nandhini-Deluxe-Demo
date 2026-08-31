// Sales (B2B corporate/institutional) historical seed: Customers + a spread of Sales Order /
// Invoice / Customer Payment statuses over the last ~5 weeks, built through the real salesService
// (buildInvoiceFromSalesOrder + allocatePaymentToInvoices) so seeded data is exactly as consistent
// as data the live UI would produce — same convention as purchase.seed.ts / finance.seed.ts.

import { Location } from '../types/erp-core';
import { MenuItem } from '../types/menu';
import { Customer, CustomerPayment, CustomerPaymentMode, SalesInvoice, SalesOrder, SalesOrderLineItem, SalesOrderStatus } from '../types/sales';
import { salesService } from '../services/salesService';

function seeded(n: number): number {
  const x = Math.sin(n * 19.331) * 27512.912;
  return x - Math.floor(x);
}

const BASE_DATE = '2026-08-30';

function daysAgo(n: number): string {
  const d = new Date(`${BASE_DATE}T10:00:00.000Z`);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'cust-1', code: 'CUST-1001', name: 'Meridian Business Solutions', type: 'CORPORATE', gstin: '29AABCM1122N1Z8', contactPerson: 'Ananya Krishnan', phone: '9900112233', email: 'facilities@meridianbiz.in', billingAddress: 'Meridian Tech Park, Outer Ring Road, Bengaluru', creditLimit: 500000, paymentTermsDays: 30, status: 'ACTIVE', createdAt: '2025-03-01T06:00:00.000Z' },
  { id: 'cust-2', code: 'CUST-1002', name: 'Novatech Systems Pvt Ltd', type: 'CORPORATE', gstin: '29AABCN2233O1Z9', contactPerson: 'Rahul Shetty', phone: '9900223344', email: 'admin@novatechsys.in', billingAddress: 'Novatech Campus, Whitefield, Bengaluru', creditLimit: 350000, paymentTermsDays: 15, status: 'ACTIVE', createdAt: '2025-03-08T06:00:00.000Z' },
  { id: 'cust-3', code: 'CUST-1003', name: 'Silverline Software Services', type: 'CORPORATE', gstin: '29AABCS3344P1Z1', contactPerson: 'Divya Menon', phone: '9900334455', email: 'ops@silverlinesoft.in', billingAddress: 'Silverline Towers, Marathahalli, Bengaluru', creditLimit: 300000, paymentTermsDays: 15, status: 'ACTIVE', createdAt: '2025-03-15T06:00:00.000Z' },
  { id: 'cust-4', code: 'CUST-1004', name: 'Cauvery Convention Centre', type: 'INSTITUTIONAL', gstin: '29AABCC4455Q1Z2', contactPerson: 'Mohan Das', phone: '9900445566', email: 'events@cauveryconvention.in', billingAddress: 'Cauvery Convention Centre, Rajajinagar, Bengaluru', creditLimit: 400000, paymentTermsDays: 30, status: 'ACTIVE', createdAt: '2025-04-02T06:00:00.000Z' },
  { id: 'cust-5', code: 'CUST-1005', name: 'Bellandur Corporate Towers', type: 'CORPORATE', gstin: '29AABCB5566R1Z3', contactPerson: 'Sneha Pillai', phone: '9900556677', email: 'facilities@bellandurtowers.in', billingAddress: 'Bellandur Corporate Towers, Bellandur, Bengaluru', creditLimit: 250000, paymentTermsDays: 15, status: 'ACTIVE', createdAt: '2025-04-20T06:00:00.000Z' },
  { id: 'cust-6', code: 'CUST-1006', name: 'Zenith Business Park', type: 'CORPORATE', gstin: '29AABCZ6677S1Z4', contactPerson: 'Karthik Iyer', phone: '9900667788', email: 'admin@zenithpark.in', billingAddress: 'Zenith Business Park, Electronic City, Bengaluru', creditLimit: 300000, paymentTermsDays: 15, status: 'ACTIVE', createdAt: '2025-05-05T06:00:00.000Z' },
  { id: 'cust-7', code: 'CUST-1007', name: 'St. Xavier College Catering Desk', type: 'INSTITUTIONAL', contactPerson: 'Fr. Thomas George', phone: '9900778899', email: 'hostel@stxaviercollege.in', billingAddress: 'St. Xavier College Campus, Jayanagar, Bengaluru', creditLimit: 150000, paymentTermsDays: 30, status: 'ACTIVE', createdAt: '2025-05-18T06:00:00.000Z' },
];

interface StatusGroup {
  status: SalesOrderStatus;
  count: number;
  minDays: number;
  maxDays: number;
}

const GROUPS: StatusGroup[] = [
  { status: 'DRAFT', count: 3, minDays: 1, maxDays: 4 },
  { status: 'CONFIRMED', count: 3, minDays: 3, maxDays: 7 },
  { status: 'FULFILLED', count: 3, minDays: 6, maxDays: 12 },
  { status: 'INVOICED', count: 8, minDays: 10, maxDays: 35 },
  { status: 'CANCELLED', count: 1, minDays: 5, maxDays: 15 },
];

const PAYMENT_MODES: CustomerPaymentMode[] = ['NEFT', 'RTGS', 'UPI'];

export interface SalesSeedResult {
  customers: Customer[];
  salesOrders: SalesOrder[];
  invoices: SalesInvoice[];
  customerPayments: CustomerPayment[];
}

export function generateSalesSeed(locations: Location[], menuItems: MenuItem[]): SalesSeedResult {
  const stores = locations.filter((l) => l.features.hasInventoryStore);
  const cateringItems = menuItems.filter((m) => !m.isLiquor && m.status === 'ACTIVE');
  const salesOrders: SalesOrder[] = [];
  const invoices: SalesInvoice[] = [];
  const customerPayments: CustomerPayment[] = [];
  let soSeq = 1;
  let invSeq = 1;
  let paySeq = 1;
  let globalIdx = 0;

  const buildLines = (idx: number): SalesOrderLineItem[] => {
    const lineCount = 2 + (idx % 3);
    return Array.from({ length: lineCount }).map((_, li) => {
      const item = cateringItems[(idx * 5 + li * 3) % cateringItems.length];
      const qty = 20 + ((idx * 7 + li * 11) % 60); // bulk/catering quantities
      return { menuItemId: item.id, name: item.name, qty, rate: item.basePrice, taxPercent: item.taxPercent };
    });
  };

  GROUPS.forEach((group) => {
    for (let g = 0; g < group.count; g++) {
      const idx = globalIdx++;
      const r = seeded(idx + 1);
      const outlet = stores[idx % stores.length];
      const customer = INITIAL_CUSTOMERS[idx % INITIAL_CUSTOMERS.length];
      const lines = buildLines(idx);
      const totalAmount = Math.round(lines.reduce((s, l) => s + l.qty * l.rate, 0) * 100) / 100;

      const daysAgoForRequest = Math.round(group.minDays + r * (group.maxDays - group.minDays));
      const requestedAt = daysAgo(daysAgoForRequest);
      const isDraft = group.status === 'DRAFT';

      const so: SalesOrder = {
        id: `so-${soSeq}`, soNumber: `SO-${1000 + soSeq}`, customerId: customer.id, outletId: outlet.id,
        lines, totalAmount, status: group.status,
        deliveryDate: daysAgo(Math.max(0, daysAgoForRequest - 2)).substring(0, 10),
        requestedBy: 'Sales Executive', requestedAt,
        // Firebase's set() rejects a literal `undefined` value, so confirmedBy/confirmedAt/
        // fulfilledAt must be OMITTED (not set to undefined) when not yet reached.
        ...(isDraft ? {} : { confirmedBy: 'Outlet Manager', confirmedAt: daysAgo(Math.max(0, daysAgoForRequest - 1)) }),
        ...(group.status === 'FULFILLED' || group.status === 'INVOICED' ? { fulfilledAt: daysAgo(Math.max(0, daysAgoForRequest - 3)) } : {}),
      };
      soSeq++;
      salesOrders.push(so);

      if (group.status === 'INVOICED') {
        const built = salesService.buildInvoiceFromSalesOrder({
          so, invoiceDate: (so.fulfilledAt ?? so.requestedAt).substring(0, 10),
          taxPercent: lines[0]?.taxPercent ?? 5, dueInDays: customer.paymentTermsDays, createdBy: 'Sales Executive',
        });
        const invoice: SalesInvoice = {
          id: `sinv-${invSeq}`, invoiceNumber: `SINV-${1000 + invSeq}`, ...built, amountReceived: 0, status: 'UNPAID',
        };
        invSeq++;

        // Spread PAID / PARTIALLY_PAID / unpaid-overdue across the INVOICED group.
        if (idx % 4 === 3) {
          invoices.push(invoice); // unpaid / overdue
        } else if (idx % 4 === 2) {
          const payAmount = Math.round(invoice.totalAmount * (0.4 + r * 0.2) * 100) / 100;
          const mode = PAYMENT_MODES[idx % PAYMENT_MODES.length];
          const payment: CustomerPayment = {
            id: `cpay-${paySeq}`, paymentNumber: `RCPT-${1000 + paySeq}`, customerId: customer.id, mode, amount: payAmount,
            referenceNo: `${mode}-${700000 + paySeq}`, allocations: [{ invoiceId: invoice.id, amount: payAmount }],
            status: 'SUCCESS', receivedBy: 'Sales Executive', receivedAt: invoice.invoiceDate,
          };
          customerPayments.push(payment);
          paySeq++;
          invoices.push({ ...invoice, amountReceived: payAmount, status: salesService.computeInvoiceStatusAfterPayment(invoice, payAmount) });
        } else {
          const mode = PAYMENT_MODES[idx % PAYMENT_MODES.length];
          const payment: CustomerPayment = {
            id: `cpay-${paySeq}`, paymentNumber: `RCPT-${1000 + paySeq}`, customerId: customer.id, mode, amount: invoice.totalAmount,
            referenceNo: `${mode}-${700000 + paySeq}`, allocations: [{ invoiceId: invoice.id, amount: invoice.totalAmount }],
            status: 'SUCCESS', receivedBy: 'Sales Executive', receivedAt: invoice.invoiceDate,
          };
          customerPayments.push(payment);
          paySeq++;
          invoices.push({ ...invoice, amountReceived: invoice.totalAmount, status: 'PAID' });
        }
      }
    }
  });

  // Pin Meridian Business Solutions with exactly ~₹1,85,000 overdue across two invoices — the
  // continuity figure customer-risk AI insights and the dashboard's AR tile point to, mirroring
  // the ABC Foods Pvt Ltd pin on the payables side (purchase.seed.ts).
  const pinnedCustomer = INITIAL_CUSTOMERS[0];
  const pinnedOutlet = stores[0];
  const pinnedItem = cateringItems[0];
  const pinnedSO1: SalesOrder = {
    id: 'so-meridian-pin-1', soNumber: 'SO-9001', customerId: pinnedCustomer.id, outletId: pinnedOutlet.id,
    lines: [{ menuItemId: pinnedItem.id, name: pinnedItem.name, qty: 400, rate: 250, taxPercent: 5 }],
    totalAmount: 100000, status: 'INVOICED', deliveryDate: daysAgo(45).substring(0, 10),
    requestedBy: 'Sales Executive', requestedAt: daysAgo(46), confirmedBy: 'Outlet Manager', confirmedAt: daysAgo(45), fulfilledAt: daysAgo(44),
  };
  const pinnedSO2: SalesOrder = {
    id: 'so-meridian-pin-2', soNumber: 'SO-9002', customerId: pinnedCustomer.id, outletId: pinnedOutlet.id,
    lines: [{ menuItemId: pinnedItem.id, name: pinnedItem.name, qty: 340, rate: 250, taxPercent: 5 }],
    totalAmount: 85000, status: 'INVOICED', deliveryDate: daysAgo(38).substring(0, 10),
    requestedBy: 'Sales Executive', requestedAt: daysAgo(39), confirmedBy: 'Outlet Manager', confirmedAt: daysAgo(38), fulfilledAt: daysAgo(37),
  };
  salesOrders.push(pinnedSO1, pinnedSO2);

  const pinnedInvoice1: SalesInvoice = {
    id: 'sinv-meridian-pin-1', invoiceNumber: 'SINV-9001', soId: pinnedSO1.id, customerId: pinnedCustomer.id, outletId: pinnedOutlet.id,
    invoiceDate: daysAgo(44).substring(0, 10), dueDate: daysAgo(14).substring(0, 10),
    lines: [{ menuItemId: pinnedItem.id, name: pinnedItem.name, qty: 400, rate: 250, lineTotal: 100000 }],
    taxAmount: 0, totalAmount: 100000, amountReceived: 0, status: 'UNPAID', createdBy: 'Sales Executive', createdAt: daysAgo(44),
  };
  const pinnedInvoice2: SalesInvoice = {
    id: 'sinv-meridian-pin-2', invoiceNumber: 'SINV-9002', soId: pinnedSO2.id, customerId: pinnedCustomer.id, outletId: pinnedOutlet.id,
    invoiceDate: daysAgo(37).substring(0, 10), dueDate: daysAgo(7).substring(0, 10),
    lines: [{ menuItemId: pinnedItem.id, name: pinnedItem.name, qty: 340, rate: 250, lineTotal: 85000 }],
    taxAmount: 0, totalAmount: 85000, amountReceived: 0, status: 'UNPAID', createdBy: 'Sales Executive', createdAt: daysAgo(37),
  };
  invoices.push(pinnedInvoice1, pinnedInvoice2);

  return { customers: INITIAL_CUSTOMERS, salesOrders, invoices, customerPayments };
}
