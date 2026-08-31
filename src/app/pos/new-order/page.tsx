'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import TableGrid from '@/components/pos/TableGrid';
import MenuBrowser from '@/components/pos/MenuBrowser';
import CartPanel from '@/components/pos/CartPanel';
import { UtensilsCrossed, ShoppingBag, Bike, BedDouble, PartyPopper, CheckCircle2 } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';
import { usePOSStore } from '@/store/pos-store';
import { useBanquetStore } from '@/store/banquet-store';
import { useOutletStore } from '@/store/outlet-store';
import { outletService } from '@/services/outletService';
import { ROLE_LABELS } from '@/permissions/roleAccess';
import { OrderType, DiningTable } from '@/types/pos';

const ORDER_TYPES: { type: OrderType; label: string; icon: any }[] = [
  { type: 'DINE_IN', label: 'Dine-In', icon: UtensilsCrossed },
  { type: 'TAKEAWAY', label: 'Takeaway', icon: ShoppingBag },
  { type: 'DELIVERY', label: 'Delivery', icon: Bike },
  { type: 'ROOM_SERVICE', label: 'Room Service', icon: BedDouble },
  { type: 'BANQUET', label: 'Banquet', icon: PartyPopper },
];

export default function NewOrderPage() {
  const router = useRouter();
  const { locations, currentRole } = useHRMSStore();
  const { floors, tables, counters, orders, createOrder, addItemToOrder, decrementItemInOrder, removeItemFromOrder, sendKOT } = usePOSStore();
  const { bookings: banquetBookings } = useBanquetStore();
  const { selectedOutletId, businessDate } = useOutletStore();
  const outlets = outletService.listOutlets(locations);
  const effectiveOutletId = selectedOutletId === 'ALL' ? (outlets[0]?.id ?? '') : selectedOutletId;

  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [selectedTable, setSelectedTable] = useState<DiningTable | null>(null);
  const [roomNumber, setRoomNumber] = useState('');
  const [banquetBookingId, setBanquetBookingId] = useState('');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [kotSent, setKotSent] = useState(false);

  const confirmedBookingsHere = banquetBookings.filter((b) => b.locationId === effectiveOutletId && b.status === 'CONFIRMED');

  const outletFloors = floors.filter((f) => f.outletId === effectiveOutletId);
  const outletTables = tables.filter((t) => t.outletId === effectiveOutletId);
  const order = orders.find((o) => o.id === orderId);
  const actor = ROLE_LABELS[currentRole];

  const startOrder = (type: OrderType, table?: DiningTable) => {
    const counter = counters.find((c) => c.outletId === effectiveOutletId && (
      type === 'ROOM_SERVICE' ? c.type === 'ROOM_SERVICE' : type === 'BANQUET' ? c.type === 'BANQUET' : c.type === 'RESTAURANT'
    )) ?? counters.find((c) => c.outletId === effectiveOutletId);
    const newOrder = createOrder({
      outletId: effectiveOutletId, counterId: counter?.id ?? '', orderType: type, channel: 'DIRECT',
      tableId: table?.id, floorId: table?.floorId, roomNumber: type === 'ROOM_SERVICE' ? roomNumber : undefined,
      banquetBookingId: type === 'BANQUET' && banquetBookingId ? banquetBookingId : undefined,
      waiterEmployeeId: actor, businessDate,
    });
    setOrderId(newOrder.id);
  };

  const handleSelectType = (type: OrderType) => {
    setOrderType(type);
    if (type !== 'DINE_IN' && type !== 'ROOM_SERVICE' && type !== 'BANQUET') startOrder(type);
  };

  const handleSendKOT = () => {
    if (!orderId) return;
    sendKOT(orderId);
    setKotSent(true);
  };

  const reset = () => {
    setOrderType(null); setSelectedTable(null); setRoomNumber(''); setBanquetBookingId(''); setOrderId(null); setKotSent(false);
  };

  if (kotSent && order) {
    return (
      <ShellLayout>
        <div className="max-w-md mx-auto text-center py-20 space-y-4">
          <CheckCircle2 className="w-16 h-16 text-[#23865B] mx-auto" />
          <h2 className="text-[20px] font-bold text-[#202522]">KOT Sent to Kitchen</h2>
          <p className="text-[13px] text-[#66706B]">Order {order.orderNumber} {selectedTable ? `— Table ${selectedTable.code}` : ''} is now in the kitchen queue.</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button onClick={() => router.push('/pos/kot')} className="px-4 py-2.5 bg-[#0F5B55] text-white text-[13px] font-semibold rounded-[8px]">View KOT Board</button>
            <button onClick={reset} className="px-4 py-2.5 bg-white border border-[#E5E2DB] text-[#202522] text-[13px] font-semibold rounded-[8px]">Start Another Order</button>
          </div>
        </div>
      </ShellLayout>
    );
  }

  return (
    <ShellLayout>
      <div className="space-y-5 h-full flex flex-col">
        <SectionHeader title="New Order" subtitle={outlets.find((o) => o.id === effectiveOutletId)?.name} />

        {!orderType && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {ORDER_TYPES.map((ot) => (
              <button key={ot.type} onClick={() => handleSelectType(ot.type)} className="bg-white border-2 border-[#E5E2DB] hover:border-[#0F5B55] rounded-2xl p-6 flex flex-col items-center gap-3 transition-all hover:shadow-lg">
                <ot.icon className="w-8 h-8 text-[#0F5B55]" />
                <span className="text-[14px] font-semibold text-[#202522]">{ot.label}</span>
              </button>
            ))}
          </div>
        )}

        {orderType === 'DINE_IN' && !selectedTable && (
          <div>
            <div className="text-[13px] font-semibold text-[#202522] mb-3">Select a table</div>
            <TableGrid floors={outletFloors} tables={outletTables} disableUnavailable onSelectTable={(t) => { setSelectedTable(t); startOrder('DINE_IN', t); }} />
          </div>
        )}

        {orderType === 'ROOM_SERVICE' && !orderId && (
          <div className="max-w-sm space-y-3">
            <label className="text-[13px] font-semibold text-[#202522] block">Room Number</label>
            <input value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="e.g. 204" className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2.5 text-[14px]" />
            <button onClick={() => startOrder('ROOM_SERVICE')} disabled={!roomNumber} className="px-4 py-2.5 bg-[#0F5B55] disabled:bg-[#E5E2DB] text-white text-[13px] font-semibold rounded-[8px]">Continue to Menu</button>
          </div>
        )}

        {orderType === 'BANQUET' && !orderId && (
          <div className="max-w-sm space-y-3">
            <label className="text-[13px] font-semibold text-[#202522] block">Banquet Booking</label>
            {confirmedBookingsHere.length === 0 ? (
              <p className="text-[13px] text-[#66706B]">No confirmed banquet bookings at this outlet. Confirm one in Banquet Management first, or continue without linking a booking.</p>
            ) : (
              <select value={banquetBookingId} onChange={(e) => setBanquetBookingId(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2.5 text-[14px]">
                <option value="">— No booking (unlinked) —</option>
                {confirmedBookingsHere.map((b) => <option key={b.id} value={b.id}>{b.bookingNumber} — {b.customerName} ({b.eventDate})</option>)}
              </select>
            )}
            <button onClick={() => startOrder('BANQUET')} className="px-4 py-2.5 bg-[#0F5B55] text-white text-[13px] font-semibold rounded-[8px]">Continue to Menu</button>
          </div>
        )}

        {order && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-5 min-h-0">
            <div className="lg:col-span-2 min-h-0">
              <MenuBrowser outletId={effectiveOutletId} onAddItem={(item) => addItemToOrder(order.id, item)} />
            </div>
            <div className="min-h-0">
              <CartPanel
                items={order.items}
                onIncrement={(it) => addItemToOrder(order.id, { menuItemId: it.menuItemId, name: it.name, qty: 1, unitPrice: it.unitPrice, taxPercent: it.taxPercent })}
                onDecrement={(it) => decrementItemInOrder(order.id, it.id)}
                onRemove={(it) => removeItemFromOrder(order.id, it.id)}
                onSendKOT={handleSendKOT}
              />
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
