'use client';

import React, { useState } from 'react';
import { Search, Bell, User, Zap, HelpCircle, Shield, CheckCircle2, ChevronDown, Sparkles } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';
import { useUIStore } from '@/store/ui-store';
import { ROLE_LABELS } from '@/permissions/roleAccess';
import { UserRole } from '@/types/erp-core';
import AIRoadmapModal from '@/components/ai/AIRoadmapModal';

const DEMO_ROLES: UserRole[] = [
  'SUPER_ADMIN', 'CORPORATE_MANAGEMENT', 'OUTLET_MANAGER', 'RESTAURANT_MANAGER', 'CASHIER',
  'KITCHEN_STAFF', 'INVENTORY_MANAGER', 'FINANCE_MANAGER', 'HOTEL_RECEPTIONIST', 'BANQUET_MANAGER',
  'HR_ADMIN', 'AUDITOR',
];

export default function Header() {
  const { currentRole, setCurrentRole, regularizationRequests, leaveRequests, simulateBiometricPunch, employees } = useHRMSStore();
  const { openTour } = useUIStore();
  const [showPunchModal, setShowPunchModal] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('emp-1');
  const [punchType, setPunchType] = useState<'IN' | 'OUT'>('IN');
  const [punchTime, setPunchTime] = useState('07:00');
  const [punchSuccess, setPunchSuccess] = useState(false);

  const pendingApprovalsCount = regularizationRequests.filter(r => r.status === 'PENDING').length +
    leaveRequests.filter(l => l.status === 'PENDING').length;

  const handleSimulatePunch = (e: React.FormEvent) => {
    e.preventDefault();
    const timestamp = `2026-08-27T${punchTime}:00.000Z`;
    simulateBiometricPunch(selectedEmpId, timestamp, punchType);
    setPunchSuccess(true);
    setTimeout(() => {
      setPunchSuccess(false);
      setShowPunchModal(false);
    }, 1200);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      {/* Search Bar */}
      <div className="flex items-center space-x-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee by ID, name, shift, or department..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Right Controls & Quick Punch Simulator */}
      <div className="flex items-center space-x-3">
        {/* Quick Punch Simulator Button */}
        <button
          onClick={() => setShowPunchModal(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-sm transition-all"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Simulate Biometric Punch</span>
        </button>

        {/* Take a tour */}
        <button
          onClick={openTour}
          title="Take a tour"
          className="p-2 rounded-full hover:bg-slate-100 text-slate-600"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* AI Roadmap — what's live in this demo vs. what we can build next */}
        <button
          onClick={() => setShowRoadmap(true)}
          title="AI Roadmap — what's live and what's next"
          className="p-2 rounded-full hover:bg-slate-100 text-slate-600"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button className="p-2 rounded-full hover:bg-slate-100 text-slate-600 relative">
            <Bell className="w-4 h-4" />
            {pendingApprovalsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {pendingApprovalsCount}
              </span>
            )}
          </button>
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* Role Switcher — demonstrates role-based UI: switching hides/shows sidebar modules */}
        <div className="relative flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
            {ROLE_LABELS[currentRole].split(' ').map((w) => w[0]).slice(0, 2).join('')}
          </div>
          <div className="relative">
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value as UserRole)}
              className="appearance-none bg-transparent text-xs font-semibold text-slate-800 leading-tight pr-4 py-0.5 focus:outline-none cursor-pointer hidden md:block"
              title="Switch demo role — the sidebar and outlet access update to match"
            >
              {DEMO_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-0 top-1 pointer-events-none hidden md:block" />
            <div className="text-[10px] text-slate-500 font-medium hidden md:block">Nandhini Deluxe HQ</div>
          </div>
        </div>
      </div>

      {/* Punch Simulation Modal */}
      {showPunchModal && (
        <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold">Biometric Punch Terminal Simulator</h3>
              </div>
              <button 
                onClick={() => setShowPunchModal(false)} 
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {punchSuccess ? (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="font-bold text-slate-800 text-base">Punch Recorded Successfully!</h4>
                <p className="text-xs text-slate-500">Attendance engine has recalculated status live.</p>
              </div>
            ) : (
              <form onSubmit={handleSimulatePunch} className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Select Employee</label>
                  <select
                    value={selectedEmpId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-xs rounded p-2 text-slate-800"
                  >
                    {employees.filter(emp => emp.status !== 'INACTIVE').map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employeeCode} - {emp.firstName} {emp.lastName} ({emp.currentAssignment.departmentId})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Punch Type</label>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setPunchType('IN')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded border ${
                          punchType === 'IN' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        IN
                      </button>
                      <button
                        type="button"
                        onClick={() => setPunchType('OUT')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded border ${
                          punchType === 'OUT' ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        OUT
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Punch Time (HH:mm)</label>
                    <input
                      type="time"
                      value={punchTime}
                      onChange={(e) => setPunchTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 text-xs rounded p-1.5 text-slate-800"
                      required
                    />
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-2.5 rounded text-[11px] text-amber-800">
                  ⚡ Punching simulates real-time hardware biometric attendance integration and updates late/OT counts on today&apos;s register.
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPunchModal(false)}
                    className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-semibold rounded hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded hover:bg-emerald-700 shadow"
                  >
                    Trigger Biometric Punch
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <AIRoadmapModal open={showRoadmap} onClose={() => setShowRoadmap(false)} />
    </header>
  );
}

