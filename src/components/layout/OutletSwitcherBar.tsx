'use client';

import React from 'react';
import { Building2, MapPin, Calendar, ChevronDown } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';
import { useOutletStore } from '@/store/outlet-store';
import { outletService } from '@/services/outletService';
import { ROLE_OUTLET_SCOPE } from '@/permissions/roleAccess';

export default function OutletSwitcherBar() {
  const { locations, currentRole, organization } = useHRMSStore();
  const { selectedOutletId, businessDate, setSelectedOutlet, setBusinessDate } = useOutletStore();

  const allowedOutlets = outletService.listOutletsForRole(locations, currentRole);
  const canSeeAll = ROLE_OUTLET_SCOPE[currentRole] === 'ALL';
  const selectedOutlet = selectedOutletId !== 'ALL' ? outletService.getOutletById(locations, selectedOutletId) : undefined;

  return (
    <div className="bg-[#08463F] px-6 py-2 flex items-center gap-6 text-white overflow-x-auto scrollbar-none">
      <div className="flex items-center gap-2 flex-shrink-0">
        <Building2 className="w-3.5 h-3.5 text-amber-300" />
        <span className="text-[13px] font-semibold whitespace-nowrap">{organization.name.replace(' Group of Restaurants & Hotels', '')}</span>
      </div>

      <span className="text-white/30">/</span>

      <div className="flex items-center gap-1.5 flex-shrink-0 relative">
        <MapPin className="w-3.5 h-3.5 text-amber-300" />
        <select
          value={selectedOutletId}
          onChange={(e) => setSelectedOutlet(e.target.value)}
          className="bg-transparent text-[13px] font-semibold appearance-none pr-5 py-0.5 focus:outline-none cursor-pointer"
        >
          {canSeeAll && <option value="ALL" className="text-[#202522]">ALL OUTLETS</option>}
          {allowedOutlets.map((o) => (
            <option key={o.id} value={o.id} className="text-[#202522]">{o.name}</option>
          ))}
        </select>
        <ChevronDown className="w-3 h-3 text-white/50 -ml-4 pointer-events-none" />
        {selectedOutlet && (
          <span className="text-[11px] text-amber-200/80 font-medium ml-1 hidden sm:inline">({selectedOutlet.outletType})</span>
        )}
      </div>

      <span className="text-white/30">/</span>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Calendar className="w-3.5 h-3.5 text-amber-300" />
        <span className="text-[12px] text-white/70">Business Date:</span>
        <input
          type="date"
          value={businessDate}
          onChange={(e) => setBusinessDate(e.target.value)}
          className="bg-transparent text-[13px] font-semibold focus:outline-none [color-scheme:dark] cursor-pointer"
        />
      </div>
    </div>
  );
}
