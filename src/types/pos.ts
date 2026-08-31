// POS Domain: floors/tables, order lifecycle, KOT, billing, payments (incl. gateway/EDC/channel
// mocks), discounts, void/complimentary audit trail, and Day Close.

import { Status } from './erp-core';

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'ROOM_SERVICE' | 'BANQUET';
export type OrderChannel = 'DIRECT' | 'SWIGGY_DELIVERY' | 'SWIGGY_DINEOUT' | 'ZOMATO_DELIVERY' | 'ZOMATO_DINEOUT';
export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'BILLING';
export type OrderStatus = 'OPEN' | 'KOT_SENT' | 'PREPARING' | 'READY' | 'SERVED' | 'BILLED' | 'CLOSED' | 'CANCELLED';
export type KOTStatus = 'NEW' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'SERVED';
export type BillType = 'NORMAL' | 'COMPLIMENTARY' | 'NON_CHARGEABLE' | 'VOID';
export type BillStatus = 'OPEN' | 'PAID' | 'VOID';
export type PaymentMode = 'CASH' | 'CARD' | 'UPI' | 'RAZORPAY' | 'SWIGGY' | 'ZOMATO' | 'BANK_TRANSFER' | 'OTHER';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface POSCounter {
  id: string;
  outletId: string;
  code: string;
  name: string;
  type: 'RESTAURANT' | 'TAKEAWAY' | 'BAR' | 'ROOM_SERVICE' | 'BANQUET';
  status: Status;
}

export interface DiningFloor {
  id: string;
  outletId: string;
  name: string;
  sortOrder: number;
}

export interface DiningTable {
  id: string;
  outletId: string;
  floorId: string;
  code: string;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
}

export interface OrderLineItem {
  id: string;
  menuItemId: string;
  name: string;
  qty: number;
  unitPrice: number;
  taxPercent: number;
  modifiers?: string[];
  instructions?: string;
  kotStatus: KOTStatus;
}

export interface POSOrder {
  id: string;
  orderNumber: string;
  outletId: string;
  counterId: string;
  orderType: OrderType;
  channel: OrderChannel;
  tableId?: string;
  floorId?: string;
  roomNumber?: string;
  banquetBookingId?: string;
  guestCount?: number;
  items: OrderLineItem[];
  status: OrderStatus;
  waiterEmployeeId?: string;
  businessDate: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
  externalOrderRef?: string; // e.g. SWG-928321
  billId?: string;
}

export interface KOTItem {
  menuItemId: string;
  name: string;
  qty: number;
  instructions?: string;
}

export interface KOT {
  id: string;
  kotNumber: string;
  orderId: string;
  outletId: string;
  tableCode?: string;
  items: KOTItem[];
  status: KOTStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Bill {
  id: string;
  billNumber: string;
  orderId: string;
  outletId: string;
  businessDate: string;
  grossAmount: number;
  discountAmount: number;
  complimentaryAmount: number;
  nonChargeableAmount: number;
  taxAmount: number;
  serviceChargeAmount: number;
  roundOff: number;
  netAmount: number;
  billType: BillType;
  discountId?: string;
  complimentaryReason?: string;
  complimentaryRequestedBy?: string;
  complimentaryApprovedBy?: string;
  status: BillStatus;
  createdBy: string;
  createdAt: string;
  paidAt?: string;
}

export interface Payment {
  id: string;
  billId: string;
  mode: PaymentMode;
  amount: number;
  referenceNo?: string;
  status: PaymentStatus;
  createdAt: string;
}

export type GatewaySessionStatus = 'WAITING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';

export interface RazorpayQRSession {
  id: string;
  billId: string;
  amount: number;
  transactionId: string;
  status: GatewaySessionStatus;
  createdAt: string;
}

export type EDCSessionStatus = 'SENDING' | 'WAITING_CUSTOMER' | 'SUCCESS' | 'FAILED';

export interface EDCSession {
  id: string;
  billId: string;
  amount: number;
  provider: string; // configurable, actual provider TBD
  status: EDCSessionStatus;
  createdAt: string;
}

export interface VoidRequest {
  id: string;
  billId: string;
  reason: string;
  requestedBy: string;
  approvedBy?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  approvedAt?: string;
}

export interface Discount {
  id: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  maxAmount?: number;
  applicableOutletIds: string[] | 'ALL';
  applicableCategoryIds?: string[];
  applicableItemIds?: string[];
  validFrom: string;
  validTo: string;
  approvalRequired: boolean;
  status: Status;
}

export interface ChannelOrderSettlement {
  id: string;
  orderId: string;
  externalOrderRef: string;
  platform: 'SWIGGY' | 'ZOMATO';
  orderAmount: number;
  commission: number;
  taxesCharges: number;
  netSettlement: number;
  settlementDate?: string;
  bankReference?: string;
  status: 'PENDING' | 'SETTLED';
}

export interface DayClose {
  id: string;
  outletId: string;
  businessDate: string;
  openingCash: number;
  cashSales: number;
  upiSales: number;
  cardSales: number;
  razorpaySales: number;
  swiggySales: number;
  zomatoSales: number;
  dineoutSales: number;
  hotelSales: number;
  banquetSales: number;
  refunds: number;
  cashExpenses: number;
  expectedClosingCash: number;
  actualClosingCash?: number;
  variance?: number;
  status: 'DRAFT' | 'SUBMITTED' | 'MANAGER_APPROVED' | 'CLOSED';
  submittedBy?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
}
