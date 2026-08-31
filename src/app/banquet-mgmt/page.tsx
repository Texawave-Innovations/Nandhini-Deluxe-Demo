'use client';

import React from 'react';
import Link from 'next/link';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import KpiCard from '@/components/ui/KpiCard';
import StatusChip from '@/components/ui/StatusChip';
import { PartyPopper, IndianRupee, CalendarClock, MessageSquareText } from 'lucide-react';
import { useBanquetStore } from '@/store/banquet-store';
import { useHRMSStore } from '@/store/hrms-store';
import { useOutletStore } from '@/store/outlet-store';
import { banquetMgmtService } from '@/services/banquetMgmtService';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function BanquetDashboardPage() {
  const { halls, bookings, finalBills } = useBanquetStore();
  const { locations } = useHRMSStore();
  const { businessDate } = useOutletStore();

  const locationName = (id: string) => locations.find((l) => l.id === id)?.name ?? id;
  const hallName = (id: string) => halls.find((h) => h.id === id)?.name ?? id;

  const revenue = banquetMgmtService.computeBanquetRevenue(finalBills);
  const upcoming = banquetMgmtService.computeUpcomingBookings(bookings, businessDate);
  const enquiries = bookings.filter((b) => b.status === 'ENQUIRY');

  return (
    <ShellLayout>
      <div className="space-y-6">
        <SectionHeader
          title="Banquet Management"
          subtitle="Hall master, bookings and event billing — Enquiry → Confirm (advance) → Event day catering (via POS) → Final Bill → Balance settlement."
          actions={<Link href="/banquet-mgmt/bookings" className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] text-white font-semibold text-[13px] rounded-[8px] flex items-center gap-2"><PartyPopper className="w-4 h-4" /> Bookings</Link>}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Banquet Revenue (settled)" value={inr(revenue)} icon={IndianRupee} valueColorClass="text-[#0F5B55]" />
          <KpiCard label="Upcoming Confirmed Bookings" value={upcoming.length} icon={CalendarClock} />
          <KpiCard label="Open Enquiries" value={enquiries.length} icon={MessageSquareText} valueColorClass={enquiries.length > 0 ? 'text-[#C68A28]' : undefined} />
          <KpiCard label="Halls" value={halls.length} icon={PartyPopper} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
            <h3 className="text-sm font-semibold text-[#202522] mb-3 flex items-center gap-2"><CalendarClock className="w-4 h-4 text-[#0F5B55]" />Upcoming Confirmed Bookings</h3>
            <div className="space-y-2">
              {upcoming.length === 0 && <div className="text-[13px] text-[#66706B]">No confirmed bookings ahead.</div>}
              {upcoming.map((b) => (
                <Link key={b.id} href={`/banquet-mgmt/bookings/${b.id}`} className="flex items-center justify-between p-2.5 bg-[#F3F0E9] rounded-md text-[13px] hover:bg-[#EFEAE0]">
                  <span className="font-medium text-[#202522]">{b.customerName} — {hallName(b.hallId)}</span>
                  <span className="text-[#66706B]">{b.eventDate} • {locationName(b.locationId)}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
            <h3 className="text-sm font-semibold text-[#202522] mb-3 flex items-center gap-2"><MessageSquareText className="w-4 h-4 text-[#C68A28]" />Open Enquiries</h3>
            <div className="space-y-2">
              {enquiries.length === 0 && <div className="text-[13px] text-[#66706B]">No open enquiries.</div>}
              {enquiries.map((b) => (
                <Link key={b.id} href={`/banquet-mgmt/bookings/${b.id}`} className="flex items-center justify-between p-2.5 bg-[#F3F0E9] rounded-md text-[13px] hover:bg-[#EFEAE0]">
                  <span className="font-medium text-[#202522]">{b.customerName} — {hallName(b.hallId)}</span>
                  <span className="text-[#66706B]">{b.eventDate}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs">
          <h3 className="text-sm font-semibold text-[#202522] mb-3">Halls</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {halls.map((h) => (
              <div key={h.id} className="p-3.5 bg-[#F3F0E9] rounded-lg border border-[#E5E2DB]">
                <div className="text-[13px] font-semibold text-[#202522]">{h.name}</div>
                <div className="text-[12px] text-[#66706B] mt-0.5">{locationName(h.locationId)}</div>
                <div className="flex items-center justify-between mt-2 text-[12px]">
                  <span className="text-[#66706B]">Capacity {h.capacity}</span>
                  <StatusChip label={inr(h.ratePerEvent)} tone="brand" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}
