'use client';

import React, { useEffect } from 'react';
import TwoTierSidebar from '@/components/layout/TwoTierSidebar';
import Header from '@/components/layout/Header';
import TopHRNav from '@/components/layout/TopHRNav';
import { useHRMSStore } from '@/store/hrms-store';
import '@/app/globals.css';

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const { initializeFromFirebase } = useHRMSStore();

  useEffect(() => {
    initializeFromFirebase();
  }, [initializeFromFirebase]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8F5EE] font-sans">
      {/* Single Sidebar */}
      <TwoTierSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky Top Header */}
        <Header />

        {/* Top HR Module Category & Sub-tab Navigation */}
        <TopHRNav />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#F8F5EE]">
          {children}
        </main>
      </div>
    </div>
  );
}
