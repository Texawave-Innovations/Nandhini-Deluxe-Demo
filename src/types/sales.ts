// Sales / Accounts Receivable domain: B2B corporate & institutional catering accounts — distinct
// from POS (which covers walk-in dine-in/takeaway/delivery). Customer -> Sales Order -> Invoice ->
// Customer Payment -> AR aging mirrors the procure-to-pay chain's Vendor -> PO -> Bill -> Payment ->
// AP aging (financeService/vendorService), but stays self-contained here rather than touching the
// vendor-only finance.ts.

import { Status } from './erp-core';

export type CustomerType = 'CORPORATE' | 'INSTITUTIONAL';

export interface Customer {
  id: string;
  code: string; // CUST-xxxx
  name: string;
  type: CustomerType;
  gstin?: string;
  contactPerson: string;
  phone: string;
  email?: string;
  billingAddress: string;
  creditLimit: number;
  paymentTermsDays: number;
  status: Status;
  createdAt: string;
}

export type SalesOrderStatus = 'DRAFT' | 'CONFIRMED' | 'FULFILLED' | 'INVOICED' | 'CANCELLED';

export interface SalesOrderLineItem {
  menuItemId: string;
  name: string;
  qty: number;
  rate: number;
  taxPercent: number;
}

export interface SalesOrder {
  id: string;
  soNumber: string;
  customerId: string;
  outletId: string; // fulfilling outlet — also the recipe-consumption/inventory scope
  lines: SalesOrderLineItem[];
  totalAmount: number;
  status: SalesOrderStatus;
  deliveryDate: string;
  requestedBy: string;
  requestedAt: string;
  confirmedBy?: string;
  confirmedAt?: string;
  fulfilledAt?: string;
  remarks?: string;
}

export type SalesInvoiceStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';

export interface SalesInvoiceLineItem {
  menuItemId: string;
  name: string;
  qty: number;
  rate: number;
  lineTotal: number;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  soId: string;
  customerId: string;
  outletId: string;
  invoiceDate: string;
  dueDate: string;
  lines: SalesInvoiceLineItem[];
  taxAmount: number;
  totalAmount: number;
  amountReceived: number;
  status: SalesInvoiceStatus;
  createdBy: string;
  createdAt: string;
}

export type CustomerPaymentMode = 'NEFT' | 'RTGS' | 'UPI' | 'CHEQUE' | 'CASH';
export type CustomerPaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface CustomerPaymentAllocation {
  invoiceId: string;
  amount: number;
}

export interface CustomerPayment {
  id: string;
  paymentNumber: string; // RCPT-xxxx
  customerId: string;
  mode: CustomerPaymentMode;
  amount: number;
  referenceNo?: string; // bank UTR/reference — the reconciliation match key
  allocations: CustomerPaymentAllocation[];
  status: CustomerPaymentStatus;
  receivedBy: string;
  receivedAt: string;
}
