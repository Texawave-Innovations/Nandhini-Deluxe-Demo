'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, MapPin, Network, Clock, CalendarDays, ClipboardList, 
  Palmtree, Calendar, CreditCard, ShieldCheck, Ticket, Receipt, UserMinus, 
  PartyPopper, Workflow, FileSpreadsheet, Briefcase, ChevronLeft, ChevronRight, LogOut, Award
} from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';
import { UserRole } from '@/types/erp-core';

export default function DeepTealSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { currentRole, setCurrentRole } = useHRMSStore();

  const navGroups = [
    {
      category: 'DASHBOARD',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }
      ]
    },
    {
      category: 'PEOPLE',
      items: [
        { name: 'Employees', href: '/employees', icon: Users },
        { name: 'Organization', href: '/organization/business-units', icon: MapPin },
        { name: 'Org Hierarchy', href: '/hr/org-chart', icon: Network },
        { name: 'Recruitment (ATS)', href: '/hr/recruitment', icon: Briefcase },
      ]
    },
    {
      category: 'WORKFORCE',
      items: [
        { name: 'Shift Management', href: '/shifts/master', icon: Clock },
        { name: 'Roster', href: '/roster/monthly', icon: CalendarDays },
        { name: 'Manpower Planning', href: '/roster/manpower-planning', icon: Users },
        { name: 'Attendance', href: '/attendance/register', icon: ClipboardList },
        { name: 'Leave', href: '/leave', icon: Palmtree },
        { name: 'Overtime', href: '/overtime', icon: Clock },
        { name: 'Shift Swap', href: '/shift-swap', icon: Clock },
      ]
    },
    {
      category: 'OPERATIONS',
      items: [
        { name: 'Banquet / Events', href: '/banquet/events', icon: PartyPopper },
        { name: 'Salary Loans & EMI', href: '/hr/loans', icon: CreditCard },
        { name: 'HR Tickets', href: '/hr/tickets', icon: Ticket },
        { name: 'Expense Claims', href: '/hr/expenses', icon: Receipt },
        { name: 'Offboarding Clearance', href: '/hr/exit', icon: UserMinus },
      ]
    },
    {
      category: 'INSIGHTS',
      items: [
        { name: 'Reports', href: '/reports', icon: FileSpreadsheet },
        { name: 'PF & ESI Statutory', href: '/hr/pf', icon: ShieldCheck },
        { name: 'Full Month Present', href: '/hr/fmp', icon: Award },
      ]
    },
    {
      category: 'ADMIN',
      items: [
        { name: 'Settings', href: '/audit', icon: ShieldCheck },
        { name: 'Workflow Inbox', href: '/workflows', icon: Workflow },
        { name: 'Audit Logs', href: '/audit', icon: ShieldCheck },
      ]
    }
  ];

  return (
    <aside 
      style={{ backgroundColor: '#0F5B55' }}
      className={`h-full select-none z-30 flex flex-col justify-between transition-all duration-300 relative border-r border-[#08463F] shadow-lg ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="p-1 rounded-full hover:bg-[#08463F] text-amber-300 absolute -right-3 top-5 bg-[#0F5B55] border border-[#C59A45]/40 shadow z-40 transition-transform"
        title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Brand Header */}
      <div className="p-4 border-b border-[#08463F] flex items-center justify-between">
        {!collapsed ? (
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#C59A45] text-[#08463F] font-serif font-bold text-xl flex items-center justify-center shadow-md">
              N
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg text-white leading-none tracking-wide">NANDHINI</h1>
              <p className="text-[10px] text-amber-300 font-sans tracking-widest font-semibold uppercase mt-0.5">HRMS ENTERPRISE</p>
            </div>
          </div>
        ) : (
          <div className="w-9 h-9 rounded-lg bg-[#C59A45] text-[#08463F] font-serif font-bold text-xl flex items-center justify-center mx-auto shadow-md">
            N
          </div>
        )}
      </div>

      {/* Persona Role Switcher */}
      {!collapsed ? (
        <div className="px-4 py-3 bg-[#08463F]/50 border-b border-[#08463F]">
          <label className="text-[10px] font-bold text-amber-200/70 uppercase tracking-widest block mb-1">
            PERSONA ROLE
          </label>
          <select
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value as UserRole)}
            className="w-full bg-[#08463F] text-xs font-semibold text-white border border-[#C59A45]/40 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#C59A45] cursor-pointer"
          >
            <option value="SUPER_ADMIN">👑 Super Admin</option>
            <option value="HR_ADMIN">🏢 HR Admin</option>
            <option value="LOCATION_HR">📍 Location HR</option>
            <option value="DEPT_MANAGER">👔 Dept Manager</option>
            <option value="EMPLOYEE">👤 Employee</option>
          </select>
        </div>
      ) : (
        <div className="py-2 text-center" title={`Current Persona: ${currentRole}`}>
          <span className="text-amber-300 text-xs font-bold">📍</span>
        </div>
      )}

      {/* Navigation Group Accordions */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
        {navGroups.map((group) => (
          <div key={group.category} className="space-y-1">
            {!collapsed && (
              <div className="text-[10px] font-extrabold text-amber-200/60 uppercase tracking-widest px-2 pt-1">
                {group.category}
              </div>
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={collapsed ? item.name : undefined}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                      isActive 
                        ? 'bg-white/10 text-white font-bold border-l-2 border-[#C59A45] shadow-xs' 
                        : 'text-white/75 hover:bg-white/5 hover:text-white'
                    } ${collapsed ? 'justify-center px-0' : ''}`}
                  >
                    <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-amber-300' : 'text-white/70'}`} />
                    {!collapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer ESS Switch & Logout */}
      <div className="p-3 border-t border-[#08463F] space-y-2">
        <Link
          href="/employee"
          title={collapsed ? "Switch to ESS Portal" : undefined}
          className={`w-full flex items-center justify-center py-2 bg-[#C59A45] hover:bg-[#b08739] text-[#08463F] font-bold text-xs rounded-md shadow transition-all ${
            collapsed ? 'px-1 text-[10px]' : 'space-x-1 px-3'
          }`}
        >
          <span>{collapsed ? 'ESS ➔' : 'Switch to ESS Portal ➔'}</span>
        </Link>

        <button 
          title={collapsed ? "Logout" : undefined}
          className={`w-full flex items-center text-xs font-bold text-red-300 hover:bg-red-950/40 rounded-md transition-colors p-2 ${
            collapsed ? 'justify-center' : 'space-x-2 px-3 py-1.5'
          }`}
        >
          <LogOut className="w-4 h-4 text-red-300" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

