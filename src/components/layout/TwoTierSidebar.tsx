'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';
import { MODULE_NAV, resolveActiveModule } from '@/constants/navigation';
import { isModuleAllowed, ROLE_LABELS } from '@/permissions/roleAccess';

export default function TwoTierSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { currentRole } = useHRMSStore();

  const activeModule = resolveActiveModule(pathname);

  return (
    <aside className="flex h-full select-none z-30 font-sans">
      <div
        style={{ backgroundColor: '#0F5B55' }}
        className={`border-r border-[#08463F] flex flex-col justify-between p-3 transition-all duration-300 relative shadow-md ${collapsed ? 'w-16' : 'w-60'}`}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-full hover:bg-[#08463F] text-amber-300 absolute -right-3 top-4 bg-[#0F5B55] border border-[#C59A45]/40 shadow z-30"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        <div className="space-y-4 flex-1 min-h-0 overflow-y-auto scrollbar-none">
          <div className={`flex items-center space-x-2.5 p-2 bg-[#08463F]/70 border border-[#C59A45]/30 rounded-xl ${collapsed ? 'justify-center p-1.5' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-[#C59A45] text-[#08463F] font-sans font-bold flex items-center justify-center text-[13px] shadow-sm flex-shrink-0">
              ND
            </div>
            {!collapsed && (
              <div className="text-left overflow-hidden">
                <div className="text-[13px] font-semibold text-white leading-tight truncate">Nandhini Deluxe</div>
                <div className="text-[11px] text-amber-300 font-semibold tracking-[0.06em] uppercase truncate">{ROLE_LABELS[currentRole]}</div>
              </div>
            )}
          </div>

          <div className="space-y-0.5">
            {MODULE_NAV.map((mod) => {
              const allowed = isModuleAllowed(currentRole, mod.id);
              const isLive = mod.status === 'live';
              const isActive = activeModule?.id === mod.id;
              const isClickable = isLive && allowed;

              const content = (
                <>
                  <div className="flex items-center space-x-3 min-w-0">
                    <mod.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-amber-300' : isClickable ? 'text-white/70' : 'text-white/30'}`} />
                    {!collapsed && <span className="truncate">{mod.name}</span>}
                  </div>
                  {!collapsed && isActive && <div className="w-1.5 h-4 bg-[#C59A45] rounded-full flex-shrink-0" />}
                  {!collapsed && !isLive && (
                    <span className="text-[9px] font-bold uppercase tracking-wide text-white/40 border border-white/20 rounded px-1 py-0.5 flex-shrink-0">Phase 2</span>
                  )}
                  {!collapsed && isLive && !allowed && <Lock className="w-3 h-3 text-white/30 flex-shrink-0" />}
                </>
              );

              const className = `flex items-center justify-between p-2.5 rounded-lg text-[14px] leading-5 font-medium transition-all ${collapsed ? 'justify-center' : ''} ${
                isActive
                  ? 'bg-white/15 text-white font-semibold border-l-2 border-[#C59A45] shadow-xs'
                  : isClickable
                    ? 'text-white/80 hover:bg-white/10 hover:text-white'
                    : 'text-white/35 cursor-not-allowed'
              }`;

              return isClickable ? (
                <Link key={mod.id} href={mod.href} title={collapsed ? mod.name : undefined} className={className}>
                  {content}
                </Link>
              ) : (
                <div key={mod.id} title={collapsed ? mod.name : !isLive ? `${mod.name} — coming in a later phase` : `${mod.name} — not permitted for ${ROLE_LABELS[currentRole]}`} className={className}>
                  {content}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-[#08463F] flex-shrink-0">
          <button
            title={collapsed ? 'Logout' : undefined}
            className={`w-full flex items-center text-[14px] leading-5 font-semibold text-red-300 hover:bg-red-950/40 rounded-lg transition-colors p-2 ${collapsed ? 'justify-center' : 'space-x-2 px-3 py-2'}`}
          >
            <LogOut className="w-4 h-4 text-red-300" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
