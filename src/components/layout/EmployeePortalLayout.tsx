'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Camera, ClipboardCheck, Palmtree, FileText, DollarSign, Ticket, 
  UserMinus, User, ArrowLeft
} from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function EmployeePortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { employees, initializeFromFirebase } = useHRMSStore();
  
  useEffect(() => {
    initializeFromFirebase();
  }, [initializeFromFirebase]);

  const currentUser = employees[0] || { firstName: 'Employee', lastName: 'Self-Service', employeeCode: 'ND-1001' };

  const navItems = [
    { name: 'Web Check-in (Photo)', href: '/employee/web-checkin', icon: Camera },
    { name: 'My Payslips & Salary', href: '/employee/my-payslips', icon: FileText },
    { name: 'Reimbursement Claims', href: '/employee/my-expenses', icon: DollarSign },
    { name: 'Daily Tasks & Logs', href: '/employee/my-tasks', icon: ClipboardCheck },
    { name: 'Raise HR Ticket', href: '/employee/raise-ticket', icon: Ticket },
    { name: 'Resignation & Exit', href: '/employee/exit-request', icon: UserMinus },
    { name: 'Self-Onboarding', href: '/employee/self-onboarding', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#F8F5EE] flex flex-col font-sans">
      {/* Top Header styled in Nandhini Deep Teal */}
      <header style={{ backgroundColor: '#0F5B55' }} className="text-white h-16 px-6 flex items-center justify-between shadow sticky top-0 z-30 border-b border-[#08463F]">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[#C59A45] text-[#08463F] font-serif font-bold text-lg flex items-center justify-center shadow">
            N
          </div>
          <div>
            <h1 className="font-bold text-sm leading-none tracking-wide text-white">EMPLOYEE SELF-SERVICE (ESS)</h1>
            <p className="text-[10px] text-amber-300 font-semibold tracking-wider uppercase mt-0.5">Nandhini Deluxe Staff Portal</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Uniform Standard Secondary Button */}
          <Link
            href="/dashboard"
            className="flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-[#F3F0E9] text-[#202522] border border-[#E5E2DB] text-xs font-semibold rounded-[8px] shadow-brand-xs transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#66706B]" />
            <span className="hidden sm:inline">Back to HR Admin Workspace</span>
          </Link>

          <div className="flex items-center space-x-2 border-l border-[#08463F] pl-4">
            <div className="w-8 h-8 rounded-full bg-[#C59A45] text-[#08463F] font-bold flex items-center justify-center text-xs shadow-sm">
              {currentUser.firstName[0]}
            </div>
            <div className="hidden md:block text-left text-xs">
              <div className="font-bold text-white">{currentUser.firstName} {currentUser.lastName}</div>
              <div className="text-[10px] text-amber-200/80 font-mono">{currentUser.employeeCode}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Sub Navigation Bar */}
      <div className="bg-[#08463F] text-slate-200 border-b border-[#0F5B55] px-6 py-2 overflow-x-auto flex space-x-2">
        {navItems.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive ? 'bg-[#C59A45] text-[#08463F] font-bold shadow' : 'hover:bg-white/10 text-white/80'
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Page Body */}
      <main className="flex-1 p-6 max-w-6xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
