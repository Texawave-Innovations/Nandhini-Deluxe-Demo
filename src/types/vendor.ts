// Vendor domain: the counterparty for every PO/GRN/Bill/Payment in the procure-to-pay chain.
// StockBatch.vendorId (types/inventory.ts) is the FK back-reference from a received batch.

import { Status } from './erp-core';

export type VendorCategory =
  | 'GROCERY' | 'MEAT_POULTRY' | 'SEAFOOD' | 'VEGETABLES' | 'DAIRY' | 'SPICES'
  | 'OILS_FATS' | 'BEVERAGES' | 'BAKERY' | 'LIQUOR' | 'PACKAGING' | 'CLEANING';

export interface VendorBankDetail {
  accountName: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
}

export interface Vendor {
  id: string;
  code: string; // VND-xxxx
  name: string;
  category: VendorCategory;
  gstin?: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  paymentTermsDays: number; // e.g. 15, 30, 45
  bankDetail?: VendorBankDetail;
  status: Status;
  createdAt: string;
}
