// POS domain store: floors/tables/counters, menu (+ outlet overrides), discounts, the full order
// -> KOT -> bill -> payment lifecycle, channel order import/settlement, and Day Close.

import { create } from 'zustand';
import {
  Bill, BillType, ChannelOrderSettlement, DayClose, Discount, DiningFloor, DiningTable, KOT,
  KOTStatus, OrderChannel, OrderType, POSCounter, POSOrder, Payment, PaymentMode, VoidRequest,
} from '@/types/pos';
import { MenuCategory, MenuItem, OutletMenuOverride } from '@/types/menu';
import { INITIAL_MENU_CATEGORIES, INITIAL_MENU_ITEMS, INITIAL_OUTLET_MENU_OVERRIDES } from '@/mock-data/menu.seed';
import { INITIAL_DISCOUNTS, generateFloorsAndTables, generatePOSCounters, generateHistoricalPOSData } from '@/mock-data/pos.seed';
import { posService } from '@/services/posService';
import { firebaseDataService } from '@/services/firebaseDataService';
import { useHRMSStore } from '@/store/hrms-store';
import { useInventoryStore } from '@/store/inventory-store';

interface POSState {
  isHydrated: boolean;
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  menuOverrides: OutletMenuOverride[];
  discounts: Discount[];
  floors: DiningFloor[];
  tables: DiningTable[];
  counters: POSCounter[];
  orders: POSOrder[];
  kots: KOT[];
  bills: Bill[];
  payments: Payment[];
  channelSettlements: ChannelOrderSettlement[];
  dayCloses: DayClose[];
  voidRequests: VoidRequest[];

  initializeFromFirebase: () => Promise<void>;

  createOrder: (params: { outletId: string; counterId: string; orderType: OrderType; channel: OrderChannel; tableId?: string; floorId?: string; roomNumber?: string; banquetBookingId?: string; guestCount?: number; waiterEmployeeId?: string; businessDate: string; externalOrderRef?: string }) => POSOrder;
  addItemToOrder: (orderId: string, item: { menuItemId: string; name: string; qty: number; unitPrice: number; taxPercent: number; instructions?: string }) => void;
  decrementItemInOrder: (orderId: string, lineItemId: string) => void;
  removeItemFromOrder: (orderId: string, lineItemId: string) => void;
  sendKOT: (orderId: string) => void;
  advanceKOT: (kotId: string) => void;

  generateBill: (orderId: string, params: { billType: BillType; discountId?: string; serviceChargePercent?: number; createdBy: string; complimentaryReason?: string; complimentaryRequestedBy?: string }) => Bill;
  approveComplimentaryBill: (billId: string, approvedBy: string) => void;
  recordPayment: (billId: string, entries: { mode: PaymentMode; amount: number; referenceNo?: string }[]) => void;

  requestVoid: (billId: string, reason: string, requestedBy: string) => void;
  approveVoid: (requestId: string, approvedBy: string) => void;

  importChannelOrder: (outletId: string, channel: OrderChannel) => POSOrder;

  addDiscount: (d: Omit<Discount, 'id'>) => void;
  updateDiscount: (id: string, d: Partial<Discount>) => void;

  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, item: Partial<MenuItem>) => void;
  upsertMenuOverride: (outletId: string, menuItemId: string, data: Partial<Omit<OutletMenuOverride, 'id' | 'outletId' | 'menuItemId'>>) => void;

  submitDayClose: (outletId: string, businessDate: string, openingCash: number, cashExpenses: number, submittedBy: string) => DayClose;
  managerApproveDayClose: (dayCloseId: string, approvedBy: string) => void;
  closeBusinessDay: (dayCloseId: string, actualClosingCash: number) => void;
}

function closeOrderAndFreeTable(state: { orders: POSOrder[]; tables: DiningTable[] }, orderId: string) {
  const order = state.orders.find((o) => o.id === orderId);
  const tables = order?.tableId ? state.tables.map((t) => t.id === order.tableId ? { ...t, status: 'AVAILABLE' as const, currentOrderId: undefined } : t) : state.tables;
  return tables;
}

export const usePOSStore = create<POSState>((set, get) => ({
  isHydrated: false,
  menuCategories: INITIAL_MENU_CATEGORIES,
  menuItems: INITIAL_MENU_ITEMS,
  menuOverrides: INITIAL_OUTLET_MENU_OVERRIDES,
  discounts: INITIAL_DISCOUNTS,
  floors: [],
  tables: [],
  counters: [],
  orders: [],
  kots: [],
  bills: [],
  payments: [],
  channelSettlements: [],
  dayCloses: [],
  voidRequests: [],

  initializeFromFirebase: async () => {
    if (get().isHydrated) return;
    try {
      const locations = useHRMSStore.getState().locations;
      const { floors, tables } = generateFloorsAndTables(locations);
      const counters = generatePOSCounters(locations);
      const historical = generateHistoricalPOSData(locations, INITIAL_MENU_ITEMS, counters);

      const fbOrders = await firebaseDataService.fetchRecord('erp/pos/orders');
      const fbBills = await firebaseDataService.fetchRecord('erp/pos/bills');
      const fbPayments = await firebaseDataService.fetchRecord('erp/pos/payments');
      const fbTables = await firebaseDataService.fetchRecord('erp/pos/tables');
      const fbDayCloses = await firebaseDataService.fetchRecord('erp/pos/dayCloses');
      const fbSettlements = await firebaseDataService.fetchRecord('erp/pos/channelSettlements');

      set({
        floors, counters,
        tables: fbTables && fbTables.length > 0 ? fbTables : tables,
        orders: fbOrders && fbOrders.length > 0 ? fbOrders : historical.orders,
        bills: fbBills && fbBills.length > 0 ? fbBills : historical.bills,
        payments: fbPayments && fbPayments.length > 0 ? fbPayments : historical.payments,
        channelSettlements: fbSettlements && fbSettlements.length > 0 ? fbSettlements : historical.channelSettlements,
        dayCloses: fbDayCloses || [],
        isHydrated: true,
      });

      if (!fbOrders || fbOrders.length === 0) {
        firebaseDataService.saveRecord('erp/pos/orders', historical.orders);
        firebaseDataService.saveRecord('erp/pos/bills', historical.bills);
        firebaseDataService.saveRecord('erp/pos/payments', historical.payments);
        firebaseDataService.saveRecord('erp/pos/channelSettlements', historical.channelSettlements);
      }
    } catch (e) {
      console.warn('POS hydration warning, using local seed:', e);
      const locations = useHRMSStore.getState().locations;
      const { floors, tables } = generateFloorsAndTables(locations);
      const counters = generatePOSCounters(locations);
      const historical = generateHistoricalPOSData(locations, INITIAL_MENU_ITEMS, counters);
      set({ floors, tables, counters, orders: historical.orders, bills: historical.bills, payments: historical.payments, channelSettlements: historical.channelSettlements, isHydrated: true });
    }
  },

  createOrder: (params) => {
    const outlet = useHRMSStore.getState().locations.find((l) => l.id === params.outletId);
    const order: POSOrder = {
      id: `pord-${Date.now()}`,
      orderNumber: posService.generateOrderNumber(outlet?.code ?? 'OUT'),
      outletId: params.outletId, counterId: params.counterId, orderType: params.orderType, channel: params.channel,
      tableId: params.tableId, floorId: params.floorId, roomNumber: params.roomNumber, banquetBookingId: params.banquetBookingId, guestCount: params.guestCount,
      items: [], status: 'OPEN', waiterEmployeeId: params.waiterEmployeeId, businessDate: params.businessDate,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), externalOrderRef: params.externalOrderRef,
    };
    set((state) => {
      const updatedOrders = [order, ...state.orders];
      const updatedTables = params.tableId
        ? state.tables.map((t) => t.id === params.tableId ? { ...t, status: 'OCCUPIED' as const, currentOrderId: order.id } : t)
        : state.tables;
      firebaseDataService.saveRecord('erp/pos/orders', updatedOrders);
      firebaseDataService.saveRecord('erp/pos/tables', updatedTables);
      return { orders: updatedOrders, tables: updatedTables };
    });
    return order;
  },

  addItemToOrder: (orderId, item) => {
    set((state) => {
      const updated = state.orders.map((o) => {
        if (o.id !== orderId) return o;
        // Merge into an existing un-sent (NEW) line for the same item when no distinguishing
        // instructions are given, so repeated taps on a menu tile increment qty instead of
        // creating duplicate lines.
        const mergeTarget = !item.instructions ? o.items.find((it) => it.menuItemId === item.menuItemId && it.kotStatus === 'NEW' && !it.instructions) : undefined;
        const items = mergeTarget
          ? o.items.map((it) => it.id === mergeTarget.id ? { ...it, qty: it.qty + item.qty } : it)
          : [...o.items, { id: `oli-${Date.now()}-${Math.floor(Math.random() * 1000)}`, kotStatus: 'NEW' as KOTStatus, ...item }];
        return { ...o, items, updatedAt: new Date().toISOString() };
      });
      firebaseDataService.saveRecord('erp/pos/orders', updated);
      return { orders: updated };
    });
  },

  decrementItemInOrder: (orderId, lineItemId) => {
    set((state) => {
      const updated = state.orders.map((o) => o.id !== orderId ? o : {
        ...o,
        items: o.items.flatMap((it) => it.id !== lineItemId ? [it] : it.qty > 1 ? [{ ...it, qty: it.qty - 1 }] : []),
      });
      firebaseDataService.saveRecord('erp/pos/orders', updated);
      return { orders: updated };
    });
  },

  removeItemFromOrder: (orderId, lineItemId) => {
    set((state) => {
      const updated = state.orders.map((o) => o.id === orderId ? { ...o, items: o.items.filter((it) => it.id !== lineItemId) } : o);
      firebaseDataService.saveRecord('erp/pos/orders', updated);
      return { orders: updated };
    });
  },

  sendKOT: (orderId) => {
    const order = get().orders.find((o) => o.id === orderId);
    if (!order || order.items.length === 0) return;
    const table = order.tableId ? get().tables.find((t) => t.id === order.tableId) : undefined;
    const kot: KOT = { id: `kot-${Date.now()}`, ...posService.buildKOTFromOrder(order, table?.code) };
    set((state) => {
      const updatedKots = [kot, ...state.kots];
      const updatedOrders = state.orders.map((o) => o.id === orderId ? { ...o, status: 'KOT_SENT' as const, updatedAt: new Date().toISOString() } : o);
      firebaseDataService.saveRecord('erp/pos/kots', updatedKots);
      firebaseDataService.saveRecord('erp/pos/orders', updatedOrders);
      return { kots: updatedKots, orders: updatedOrders };
    });
  },

  advanceKOT: (kotId) => {
    const pipeline: KOTStatus[] = ['NEW', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED'];
    const kot = get().kots.find((k) => k.id === kotId);
    if (!kot) return;
    const idx = pipeline.indexOf(kot.status);
    if (idx === -1 || idx === pipeline.length - 1) return;
    const next = pipeline[idx + 1];

    set((state) => {
      const updatedKots = state.kots.map((k) => k.id === kotId ? { ...k, status: next, updatedAt: new Date().toISOString() } : k);
      const orderStatusMap: Record<KOTStatus, POSOrder['status']> = { NEW: 'KOT_SENT', ACCEPTED: 'KOT_SENT', PREPARING: 'PREPARING', READY: 'READY', SERVED: 'SERVED' };
      const updatedOrders = state.orders.map((o) => o.id === kot.orderId ? {
        ...o, status: orderStatusMap[next], updatedAt: new Date().toISOString(),
        items: o.items.map((it) => ({ ...it, kotStatus: next })),
      } : o);
      firebaseDataService.saveRecord('erp/pos/kots', updatedKots);
      firebaseDataService.saveRecord('erp/pos/orders', updatedOrders);
      return { kots: updatedKots, orders: updatedOrders };
    });
  },

  generateBill: (orderId, params) => {
    const order = get().orders.find((o) => o.id === orderId)!;
    const discount = params.discountId ? get().discounts.find((d) => d.id === params.discountId) : undefined;
    const discountAmount = discount ? posService.applyDiscount(discount, order.items.reduce((s, it) => s + it.qty * it.unitPrice, 0)) : 0;
    const totals = posService.computeBillTotals(order.items, discountAmount, params.billType, params.serviceChargePercent ?? 0);
    const outlet = useHRMSStore.getState().locations.find((l) => l.id === order.outletId);

    const bill: Bill = {
      id: `bill-${Date.now()}`, billNumber: posService.generateBillNumber(outlet?.code ?? 'OUT'), orderId,
      outletId: order.outletId, businessDate: order.businessDate, ...totals, billType: params.billType,
      discountId: params.discountId, complimentaryReason: params.complimentaryReason, complimentaryRequestedBy: params.complimentaryRequestedBy,
      status: params.billType === 'COMPLIMENTARY' ? 'OPEN' : 'OPEN', createdBy: params.createdBy, createdAt: new Date().toISOString(),
    };

    set((state) => {
      const updatedBills = [bill, ...state.bills];
      const updatedOrders = state.orders.map((o) => o.id === orderId ? { ...o, status: 'BILLED' as const, billId: bill.id, updatedAt: new Date().toISOString() } : o);
      const updatedTables = order.tableId ? state.tables.map((t) => t.id === order.tableId ? { ...t, status: 'BILLING' as const } : t) : state.tables;
      firebaseDataService.saveRecord('erp/pos/bills', updatedBills);
      firebaseDataService.saveRecord('erp/pos/orders', updatedOrders);
      firebaseDataService.saveRecord('erp/pos/tables', updatedTables);
      return { bills: updatedBills, orders: updatedOrders, tables: updatedTables };
    });

    if (params.billType !== 'VOID') {
      useInventoryStore.getState().consumeForOrderItems({
        billId: bill.id, orderId, outletId: order.outletId,
        items: order.items.map((it) => ({ menuItemId: it.menuItemId, name: it.name, qty: it.qty })),
      });
    }

    return bill;
  },

  approveComplimentaryBill: (billId, approvedBy) => {
    set((state) => {
      const bill = state.bills.find((b) => b.id === billId);
      const updatedBills = state.bills.map((b) => b.id === billId ? { ...b, complimentaryApprovedBy: approvedBy, status: 'PAID' as const, paidAt: new Date().toISOString() } : b);
      const updatedOrders = bill ? state.orders.map((o) => o.id === bill.orderId ? { ...o, status: 'CLOSED' as const } : o) : state.orders;
      const updatedTables = bill ? closeOrderAndFreeTable({ orders: state.orders, tables: state.tables }, bill.orderId) : state.tables;
      firebaseDataService.saveRecord('erp/pos/bills', updatedBills);
      firebaseDataService.saveRecord('erp/pos/orders', updatedOrders);
      firebaseDataService.saveRecord('erp/pos/tables', updatedTables);
      return { bills: updatedBills, orders: updatedOrders, tables: updatedTables };
    });
  },

  recordPayment: (billId, entries) => {
    const newPayments: Payment[] = entries.map((e) => ({
      id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`, billId, mode: e.mode, amount: e.amount,
      referenceNo: e.referenceNo, status: 'SUCCESS', createdAt: new Date().toISOString(),
    }));

    set((state) => {
      const updatedPayments = [...state.payments, ...newPayments];
      const bill = state.bills.find((b) => b.id === billId);
      const fullyPaid = bill ? posService.isBillFullyPaid(bill, updatedPayments.filter((p) => p.billId === billId)) : false;
      const updatedBills = state.bills.map((b) => b.id === billId && fullyPaid ? { ...b, status: 'PAID' as const, paidAt: new Date().toISOString() } : b);
      const updatedOrders = bill && fullyPaid ? state.orders.map((o) => o.id === bill.orderId ? { ...o, status: 'CLOSED' as const } : o) : state.orders;
      const updatedTables = bill && fullyPaid ? closeOrderAndFreeTable({ orders: state.orders, tables: state.tables }, bill.orderId) : state.tables;

      firebaseDataService.saveRecord('erp/pos/payments', updatedPayments);
      firebaseDataService.saveRecord('erp/pos/bills', updatedBills);
      firebaseDataService.saveRecord('erp/pos/orders', updatedOrders);
      firebaseDataService.saveRecord('erp/pos/tables', updatedTables);
      return { payments: updatedPayments, bills: updatedBills, orders: updatedOrders, tables: updatedTables };
    });
  },

  requestVoid: (billId, reason, requestedBy) => {
    const req: VoidRequest = { id: `void-${Date.now()}`, billId, reason, requestedBy, status: 'PENDING', requestedAt: new Date().toISOString() };
    set((state) => {
      const updated = [req, ...state.voidRequests];
      firebaseDataService.saveRecord('erp/pos/voidRequests', updated);
      return { voidRequests: updated };
    });
  },

  approveVoid: (requestId, approvedBy) => {
    const req = get().voidRequests.find((r) => r.id === requestId);
    if (!req) return;
    set((state) => {
      const updatedReqs = state.voidRequests.map((r) => r.id === requestId ? { ...r, status: 'APPROVED' as const, approvedBy, approvedAt: new Date().toISOString() } : r);
      const bill = state.bills.find((b) => b.id === req.billId);
      const updatedBills = state.bills.map((b) => b.id === req.billId ? { ...b, status: 'VOID' as const, billType: 'VOID' as const } : b);
      const updatedOrders = bill ? state.orders.map((o) => o.id === bill.orderId ? { ...o, status: 'CANCELLED' as const } : o) : state.orders;
      const updatedTables = bill ? closeOrderAndFreeTable({ orders: state.orders, tables: state.tables }, bill.orderId) : state.tables;
      firebaseDataService.saveRecord('erp/pos/voidRequests', updatedReqs);
      firebaseDataService.saveRecord('erp/pos/bills', updatedBills);
      firebaseDataService.saveRecord('erp/pos/orders', updatedOrders);
      firebaseDataService.saveRecord('erp/pos/tables', updatedTables);
      return { voidRequests: updatedReqs, bills: updatedBills, orders: updatedOrders, tables: updatedTables };
    });
  },

  importChannelOrder: (outletId, channel) => {
    const counter = get().counters.find((c) => c.outletId === outletId && c.type === 'RESTAURANT');
    const pool = get().menuItems.slice(0, 40);
    const itemCount = 1 + Math.floor(Math.random() * 3);
    const items = Array.from({ length: itemCount }).map((_, i) => {
      const mi = pool[Math.floor(Math.random() * pool.length)];
      const qty = 1 + Math.floor(Math.random() * 2);
      return { id: `oli-imp-${Date.now()}-${i}`, menuItemId: mi.id, name: mi.name, qty, unitPrice: mi.basePrice, taxPercent: mi.taxPercent, kotStatus: 'NEW' as KOTStatus };
    });
    const platformPrefix = channel.startsWith('SWIGGY') ? 'SWG' : 'ZMT';
    const order = get().createOrder({
      outletId, counterId: counter?.id ?? '', orderType: channel.includes('DINEOUT') ? 'DINE_IN' : 'DELIVERY', channel,
      businessDate: new Date().toISOString().substring(0, 10), externalOrderRef: `${platformPrefix}-${Math.floor(100000 + Math.random() * 899999)}`,
    });
    items.forEach((it) => get().addItemToOrder(order.id, it));
    return order;
  },

  addDiscount: (d) => {
    const newDiscount: Discount = { ...d, id: `disc-${Date.now()}` };
    set((state) => {
      const updated = [...state.discounts, newDiscount];
      firebaseDataService.saveRecord('erp/pos/discounts', updated);
      return { discounts: updated };
    });
  },
  updateDiscount: (id, d) => {
    set((state) => {
      const updated = state.discounts.map((disc) => disc.id === id ? { ...disc, ...d } : disc);
      firebaseDataService.saveRecord('erp/pos/discounts', updated);
      return { discounts: updated };
    });
  },

  addMenuItem: (item) => {
    const newItem: MenuItem = { ...item, id: `mi-custom-${Date.now()}` };
    set((state) => {
      const updated = [...state.menuItems, newItem];
      firebaseDataService.saveRecord('erp/pos/menuItems', updated);
      return { menuItems: updated };
    });
  },
  updateMenuItem: (id, item) => {
    set((state) => {
      const updated = state.menuItems.map((m) => m.id === id ? { ...m, ...item } : m);
      firebaseDataService.saveRecord('erp/pos/menuItems', updated);
      return { menuItems: updated };
    });
  },
  upsertMenuOverride: (outletId, menuItemId, data) => {
    set((state) => {
      const existing = state.menuOverrides.find((o) => o.outletId === outletId && o.menuItemId === menuItemId);
      const updated = existing
        ? state.menuOverrides.map((o) => o === existing ? { ...o, ...data } : o)
        : [...state.menuOverrides, { id: `ovr-${Date.now()}`, outletId, menuItemId, isEnabled: true, ...data }];
      firebaseDataService.saveRecord('erp/pos/menuOverrides', updated);
      return { menuOverrides: updated };
    });
  },

  submitDayClose: (outletId, businessDate, openingCash, cashExpenses, submittedBy) => {
    const bills = get().bills.filter((b) => b.outletId === outletId && b.businessDate === businessDate && b.status !== 'VOID');
    const billIds = new Set(bills.map((b) => b.id));
    const dayPayments = get().payments.filter((p) => billIds.has(p.billId) && p.status === 'SUCCESS');
    const sumBy = (mode: PaymentMode) => dayPayments.filter((p) => p.mode === mode).reduce((s, p) => s + p.amount, 0);
    const cashSales = sumBy('CASH');
    const upiSales = sumBy('UPI');
    const cardSales = sumBy('CARD');
    const razorpaySales = sumBy('RAZORPAY');
    const swiggySales = sumBy('SWIGGY');
    const zomatoSales = sumBy('ZOMATO');
    // Hotel/Banquet sales are just bills whose order carries that orderType — no separate ledger,
    // Room Service and Banquet orders already flow through the same POS bill pipeline as dine-in.
    const ordersById = new Map(get().orders.map((o) => [o.id, o]));
    const sumByOrderType = (type: 'ROOM_SERVICE' | 'BANQUET') => bills.filter((b) => ordersById.get(b.orderId)?.orderType === type).reduce((s, b) => s + b.netAmount, 0);
    const hotelSales = sumByOrderType('ROOM_SERVICE');
    const banquetSales = sumByOrderType('BANQUET');
    const expectedClosingCash = posService.computeExpectedClosingCash(openingCash, cashSales, cashExpenses, 0);

    const dayClose: DayClose = {
      id: `dc-${Date.now()}`, outletId, businessDate, openingCash, cashSales, upiSales, cardSales, razorpaySales,
      swiggySales, zomatoSales, dineoutSales: 0, hotelSales, banquetSales, refunds: 0, cashExpenses,
      expectedClosingCash, status: 'SUBMITTED', submittedBy, submittedAt: new Date().toISOString(),
    };
    set((state) => {
      const updated = [dayClose, ...state.dayCloses.filter((d) => !(d.outletId === outletId && d.businessDate === businessDate))];
      firebaseDataService.saveRecord('erp/pos/dayCloses', updated);
      return { dayCloses: updated };
    });
    return dayClose;
  },

  managerApproveDayClose: (dayCloseId, approvedBy) => {
    set((state) => {
      const updated = state.dayCloses.map((d) => d.id === dayCloseId ? { ...d, status: 'MANAGER_APPROVED' as const, approvedBy, approvedAt: new Date().toISOString() } : d);
      firebaseDataService.saveRecord('erp/pos/dayCloses', updated);
      return { dayCloses: updated };
    });
  },

  closeBusinessDay: (dayCloseId, actualClosingCash) => {
    set((state) => {
      const updated = state.dayCloses.map((d) => d.id === dayCloseId ? {
        ...d, actualClosingCash, variance: posService.computeVariance(d.expectedClosingCash, actualClosingCash), status: 'CLOSED' as const,
      } : d);
      firebaseDataService.saveRecord('erp/pos/dayCloses', updated);
      return { dayCloses: updated };
    });
  },
}));
