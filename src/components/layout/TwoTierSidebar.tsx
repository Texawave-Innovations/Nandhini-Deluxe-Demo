'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingCart, ShoppingBag, DollarSign, Users, Briefcase, 
  FolderKanban, ListFilter, Settings, LogOut, ChevronLeft, ChevronRight,
  MapPin, Network, ClipboardList, Clock, CalendarDays, Award,
  Palmtree, Calendar, CreditCard, ShieldCheck, Ticket, Receipt, UserMinus, PartyPopper, Workflow, FileSpreadsheet
} from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';
import { UserRole } from '@/types/erp-core';

export default function TwoTierSidebar() {
  const pathname = usePathname();

  // Both Main ERP Left Bar & HR Submenu can be independently collapsed to icons-only
  const [mainNavCollapsed, setMainNavCollapsed] = useState(false);
  const [hrSubmenuCollapsed, setHrSubmenuCollapsed] = useState(false);

  const { currentRole, setCurrentRole } = useHRMSStore();

  // Tier 1: Main ERP Left Navigation Bar
  const mainErpNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Sales', href: '#', icon: ShoppingCart, disabled: true },
    { name: 'Purchases', href: '#', icon: ShoppingBag, disabled: true },
    { name: 'Finance', href: '#', icon: DollarSign, disabled: true },
    { name: 'HR', href: '/dashboard', icon: Users, active: true },
    { name: 'Projects', href: '#', icon: FolderKanban, disabled: true },
    { name: 'Master Lists', href: '/organization/business-units', icon: ListFilter },
    { name: 'Settings', href: '/audit', icon: Settings },
  ];

  // Tier 2: Grouped Submenu Categories under HR Module
  const hrGroupedSubmenus = [
    {
      category: 'OVERVIEW',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }
      ]
    },
    {
      category: 'RECRUITMENT',
      items: [
        { name: 'Recruitment (ATS)', href: '/hr/recruitment', icon: Briefcase }
      ]
    },
    {
      category: 'PEOPLE & ORG',
      items: [
        { name: 'Employees', href: '/employees', icon: Users },
        { name: 'Business Units', href: '/organization/business-units', icon: ListFilter },
        { name: 'Locations & Geofence', href: '/organization/locations', icon: MapPin },
        { name: 'Departments', href: '/organization/departments', icon: ListFilter },
        { name: 'Roles & Designations', href: '/organization/roles', icon: ShieldCheck },
        { name: 'Org Hierarchy Tree', href: '/hr/org-chart', icon: Network },
      ]
    },
    {
      category: 'TIME & ATTENDANCE',
      items: [
        { name: 'Shift Master', href: '/shifts/master', icon: Clock },
        { name: 'Shift Templates', href: '/shifts/templates', icon: ListFilter },
        { name: 'Monthly Roster Grid', href: '/roster/monthly', icon: CalendarDays },
        { name: 'Manpower Planning', href: '/roster/manpower-planning', icon: Users },
        { name: "Today's Live Punch", href: '/attendance/today', icon: Clock },
        { name: 'Attendance Register', href: '/attendance/register', icon: ClipboardList },
        { name: 'Regularization', href: '/attendance/regularization', icon: Clock },
        { name: 'Full Month Present (FMP)', href: '/hr/fmp', icon: Award },
      ]
    },
    {
      category: 'LEAVE MANAGEMENT',
      items: [
        { name: 'Leaves & Quotas', href: '/leave', icon: Palmtree },
        { name: 'Holidays Calendar', href: '/leave', icon: Calendar },
      ]
    },
    {
      category: 'PAYROLL & STATUTORY',
      items: [
        { name: 'PF Compliance (12%)', href: '/hr/pf', icon: ShieldCheck },
        { name: 'ESI Compliance (0.75%)', href: '/hr/esi', icon: ShieldCheck },
        { name: 'Salary Loans & EMI', href: '/hr/loans', icon: CreditCard },
        { name: 'Bonus Schemes', href: '/hr/bonus', icon: DollarSign },
        { name: 'Overtime Engine', href: '/overtime', icon: Clock },
        { name: 'Reports & Register', href: '/reports', icon: FileSpreadsheet },
      ]
    },
    {
      category: 'OPERATIONS & ESS',
      items: [
        { name: 'Peer Shift Swap', href: '/shift-swap', icon: Clock },
        { name: 'Banquet Events', href: '/banquet/events', icon: PartyPopper },
        { name: 'HR Tickets', href: '/hr/tickets', icon: Ticket },
        { name: 'Expense Claims', href: '/hr/expenses', icon: Receipt },
        { name: 'Offboarding Clearance', href: '/hr/exit', icon: UserMinus },
        { name: 'Workflows Inbox', href: '/workflows', icon: Workflow },
        { name: 'System Audit Trail', href: '/audit', icon: ShieldCheck },
      ]
    }
  ];

  return (
    <aside className="flex h-full select-none z-30 font-sans">
      {/* TIER 1 SIDEBAR: Main ERP Vertical Nav (Nandhini Brand Styling) */}
      <div 
        style={{ backgroundColor: '#0F5B55' }}
        className={`border-r border-[#08463F] flex flex-col justify-between p-3 transition-all duration-300 relative shadow-md ${
          mainNavCollapsed ? 'w-16' : 'w-52'
        }`}
      >
        {/* Toggle Collapse Button for Main ERP Nav */}
        <button 
          onClick={() => setMainNavCollapsed(!mainNavCollapsed)}
          className="p-1 rounded-full hover:bg-[#08463F] text-amber-300 absolute -right-3 top-4 bg-[#0F5B55] border border-[#C59A45]/40 shadow z-30"
          title={mainNavCollapsed ? "Expand Main Sidebar" : "Collapse to Icons Only"}
        >
          {mainNavCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        <div className="space-y-4">
          {/* Admin User Header Pill */}
          <div className={`flex items-center space-x-2.5 p-2 bg-[#08463F]/70 border border-[#C59A45]/30 rounded-xl ${mainNavCollapsed ? 'justify-center p-1.5' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-[#C59A45] text-[#08463F] font-serif font-bold flex items-center justify-center text-xs shadow-sm flex-shrink-0">
              AU
            </div>
            {!mainNavCollapsed && (
              <div className="text-left overflow-hidden">
                <div className="text-sm font-bold text-white leading-tight truncate">Admin User</div>
                <div className="text-xs text-amber-300 font-semibold uppercase">Admin</div>
              </div>
            )}
          </div>

          {/* Persona Role Switcher */}
          {!mainNavCollapsed ? (
            <div className="px-1">
              <label className="text-xs font-bold text-amber-200/70 uppercase tracking-wider block mb-1">
                Persona Role
              </label>
              <select
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as UserRole)}
                className="w-full bg-[#08463F] text-xs font-semibold text-white border border-[#C59A45]/40 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#C59A45] cursor-pointer shadow-sm"
              >
                <option value="SUPER_ADMIN">👑 Super Admin</option>
                <option value="HR_ADMIN">🏢 HR Admin</option>
                <option value="LOCATION_HR">📍 Location HR</option>
                <option value="DEPT_MANAGER">👔 Manager</option>
                <option value="EMPLOYEE">👤 Employee</option>
              </select>
            </div>
          ) : (
            <div className="flex justify-center" title={`Current Persona: ${currentRole}`}>
              <div className="w-8 h-8 rounded-lg bg-[#08463F] text-amber-300 flex items-center justify-center font-bold text-xs border border-[#C59A45]/40">
                📍
              </div>
            </div>
          )}

          {/* ERP Core Navigation Items */}
          <div className="space-y-1">
            {mainErpNav.map((item) => {
              const isHrActive = item.name === 'HR';
              return (
                <Link
                  key={item.name}
                  href={item.disabled ? '#' : item.href}
                  title={mainNavCollapsed ? item.name : undefined}
                  className={`flex items-center justify-between p-2.5 rounded-lg text-sm font-semibold transition-all ${
                    isHrActive 
                      ? 'bg-white/15 text-white font-bold border-l-2 border-[#C59A45] shadow-xs' 
                      : item.disabled ? 'text-white/40 cursor-not-allowed' : 'text-white/80 hover:bg-white/10 hover:text-white'
                  } ${mainNavCollapsed ? 'justify-center' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className={`w-4 h-4 ${isHrActive ? 'text-amber-300' : 'text-white/70'}`} />
                    {!mainNavCollapsed && <span>{item.name}</span>}
                  </div>
                  {!mainNavCollapsed && isHrActive && <div className="w-1.5 h-4 bg-[#C59A45] rounded-full" />}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer ESS Switch & Logout */}
        <div className="space-y-2 pt-2 border-t border-[#08463F]">
          <Link
            href="/employee"
            title={mainNavCollapsed ? "Switch to ESS Portal" : undefined}
            className={`w-full flex items-center justify-center py-2 bg-[#C59A45] hover:bg-[#b08739] text-[#08463F] text-sm font-bold rounded-lg shadow transition-all ${
              mainNavCollapsed ? 'px-1 text-xs' : 'space-x-1.5 px-3'
            }`}
          >
            <span>{mainNavCollapsed ? 'ESS ➔' : 'Switch to ESS Portal ➔'}</span>
          </Link>

          <button 
            title={mainNavCollapsed ? "Logout" : undefined}
            className={`w-full flex items-center text-sm font-bold text-red-300 hover:bg-red-950/40 rounded-lg transition-colors p-2 ${
              mainNavCollapsed ? 'justify-center' : 'space-x-2 px-3 py-2'
            }`}
          >
            <LogOut className="w-4 h-4 text-red-300" />
            {!mainNavCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* TIER 2 SIDEBAR: HR Module Expandable Submenu Column */}
      <div className={`bg-white border-r border-[#E5E2DB] flex flex-col transition-all duration-300 relative ${hrSubmenuCollapsed ? 'w-12' : 'w-56'}`}>
        {/* Module Header */}
        <div className="h-14 px-4 border-b border-[#E5E2DB] flex items-center justify-between bg-[#F3F0E9]/50">
          {!hrSubmenuCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-[#0F5B55]/10 text-[#0F5B55] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#202522] leading-tight">HR Module</h2>
                <p className="text-xs text-[#66706B]">People & Payroll</p>
              </div>
            </div>
          )}

          <button 
            onClick={() => setHrSubmenuCollapsed(!hrSubmenuCollapsed)}
            className="p-1 rounded-full hover:bg-slate-200 text-slate-500 absolute -right-3 top-4 bg-white border shadow-sm z-20"
            title={hrSubmenuCollapsed ? "Expand HR Submenu" : "Collapse Submenu"}
          >
            {hrSubmenuCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Grouped Accordion List */}
        {!hrSubmenuCollapsed ? (
          <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
            {hrGroupedSubmenus.map((group) => (
              <div key={group.category} className="space-y-1">
                <div className="text-xs font-extrabold text-[#66706B] uppercase tracking-wider px-2">
                  {group.category}
                </div>

                <div className="space-y-0.5">
                  {group.items.map((sub) => {
                    const isSubActive = pathname === sub.href;
                    return (
                      <Link
                        key={sub.name}
                        href={sub.href}
                        className={`flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                          isSubActive 
                            ? 'bg-[#0F5B55]/10 text-[#0F5B55] font-bold shadow-xs' 
                            : 'text-[#202522] hover:bg-[#F3F0E9] font-medium'
                        }`}
                      >
                        <sub.icon className={`w-3.5 h-3.5 ${isSubActive ? 'text-[#0F5B55]' : 'text-[#66706B]'}`} />
                        <span className="truncate">{sub.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Icons only view for collapsed HR submenu */
          <div className="flex-1 overflow-y-auto py-3 px-1 space-y-3">
            {hrGroupedSubmenus.flatMap(g => g.items).map((sub) => {
              const isSubActive = pathname === sub.href;
              return (
                <Link
                  key={sub.name}
                  href={sub.href}
                  title={sub.name}
                  className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
                    isSubActive ? 'bg-[#0F5B55]/10 text-[#0F5B55] font-bold' : 'text-[#66706B] hover:bg-[#F3F0E9]'
                  }`}
                >
                  <sub.icon className="w-4 h-4" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
