'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, Building2, Clock, CalendarDays, ClipboardCheck, 
  Palmtree, Timer, RefreshCw, PartyPopper, Workflow, FileSpreadsheet, ShieldCheck, 
  ChevronDown, ChevronRight, Menu, X, DollarSign, Briefcase, Ticket, FileText, UserMinus, LogOut, CheckCircle
} from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';
import { UserRole } from '@/types/erp-core';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  children?: { name: string; href: string }[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    Organization: true,
    Shift: true,
    Roster: true,
    Attendance: true,
    Statutory: true,
    Banquet: true,
  });

  const { currentRole, setCurrentRole } = useHRMSStore();

  const toggleSubmenu = (name: string) => {
    setOpenSubmenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Employees', href: '/employees', icon: Users },
    {
      name: 'Organization',
      href: '/organization',
      icon: Building2,
      children: [
        { name: 'Business Units', href: '/organization/business-units' },
        { name: 'Locations', href: '/organization/locations' },
        { name: 'Departments', href: '/organization/departments' },
        { name: 'Roles & Designations', href: '/organization/roles' },
        { name: 'Visual Org Chart', href: '/hr/org-chart' },
      ]
    },
    {
      name: 'Shift Management',
      href: '/shifts',
      icon: Clock,
      children: [
        { name: 'Shift Master', href: '/shifts/master' },
        { name: 'Shift Rules & Breaks', href: '/shifts/rules' },
        { name: 'Shift Templates', href: '/shifts/templates' },
      ]
    },
    {
      name: 'Roster Engine',
      href: '/roster',
      icon: CalendarDays,
      children: [
        { name: 'Monthly Roster', href: '/roster/monthly' },
        { name: 'Weekly Roster', href: '/roster/weekly' },
        { name: 'Manpower Planning', href: '/roster/manpower-planning' },
      ]
    },
    {
      name: 'Attendance & Audit',
      href: '/attendance',
      icon: ClipboardCheck,
      children: [
        { name: "Today's Live Punch", href: '/attendance/today' },
        { name: 'Attendance Register', href: '/attendance/register' },
        { name: 'Regularization', href: '/attendance/regularization' },
        { name: 'Full Month Present (FMP)', href: '/hr/fmp' },
      ]
    },
    {
      name: 'Statutory & Loans',
      href: '/hr',
      icon: DollarSign,
      children: [
        { name: 'PF Compliance (12%)', href: '/hr/pf' },
        { name: 'ESI Compliance (0.75%)', href: '/hr/esi' },
        { name: 'Salary Advances & Loans', href: '/hr/loans' },
        { name: 'Annual Bonus Schemes', href: '/hr/bonus' },
      ]
    },
    { name: 'Leave & Holidays', href: '/leave', icon: Palmtree },
    { name: 'Overtime Engine', href: '/overtime', icon: Timer },
    { name: 'Shift Swap', href: '/shift-swap', icon: RefreshCw },
    {
      name: 'Recruitment & ATS',
      href: '/hr/recruitment',
      icon: Briefcase,
    },
    {
      name: 'Operations & Tickets',
      href: '/hr/tickets',
      icon: Ticket,
      children: [
        { name: 'HR Helpdesk Tickets', href: '/hr/tickets' },
        { name: 'Expense Approvals', href: '/hr/expenses' },
        { name: 'Exit & Clearance', href: '/hr/exit' },
      ]
    },
    {
      name: 'Banquet & Events',
      href: '/banquet',
      icon: PartyPopper,
      children: [
        { name: 'Event Management', href: '/banquet/events' },
        { name: 'Staff Allocation', href: '/banquet/allocation' },
      ]
    },
    { name: 'Approval Workflows', href: '/workflows', icon: Workflow },
    { name: 'Reports & Analytics', href: '/reports', icon: FileSpreadsheet },
    { name: 'ERP Audit Trail', href: '/audit', icon: ShieldCheck },
  ];

  return (
    <aside className={`bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 z-30 border-r border-slate-800 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800 bg-slate-950">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-amber-500 flex items-center justify-center text-slate-950 font-bold text-lg shadow">
              N
            </div>
            <div>
              <h1 className="font-bold text-white text-sm tracking-wide leading-none">NANDHINI DELUXE</h1>
              <span className="text-[10px] text-amber-400 font-semibold tracking-wider">ERP HRMS + ESS</span>
            </div>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </div>



      {/* Role Switcher Demo Control */}
      {!collapsed && (
        <div className="p-3 bg-slate-950/60 border-b border-slate-800/80">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Demo Persona Role
          </label>
          <select
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value as UserRole)}
            className="w-full bg-slate-800 text-xs font-medium text-amber-300 border border-slate-700 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value="SUPER_ADMIN">👑 Super Admin (Full Access)</option>
            <option value="HR_ADMIN">🏢 HR Administrator</option>
            <option value="LOCATION_HR">📍 Location HR (Indiranagar)</option>
            <option value="DEPT_MANAGER">👔 Dept Manager (Kitchen)</option>
            <option value="EMPLOYEE">👤 Employee Self-Service</option>
          </select>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const hasChildren = item.children && item.children.length > 0;
          const isOpen = openSubmenus[item.name];

          return (
            <div key={item.name}>
              {hasChildren ? (
                <div>
                  <button
                    onClick={() => toggleSubmenu(item.name)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                      isActive ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-4 h-4 text-slate-400" />
                      {!collapsed && <span>{item.name}</span>}
                    </div>
                    {!collapsed && (
                      isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {!collapsed && isOpen && (
                    <div className="ml-7 mt-1 space-y-1 border-l border-slate-800 pl-2">
                      {item.children?.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            className={`block px-2 py-1.5 text-[11px] font-medium rounded transition-colors ${
                              isSubActive 
                                ? 'text-amber-400 bg-slate-800/80 font-semibold' 
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                            }`}
                          >
                            {sub.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                    isActive 
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold' 
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center">
          <div className="text-[10px] text-slate-500 font-mono">TEXAWAVE HR CORE v2.0</div>
          <div className="text-[10px] text-amber-400 font-medium">Dual Admin & ESS Enabled</div>
        </div>
      )}
    </aside>
  );
}
