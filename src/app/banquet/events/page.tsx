'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { PartyPopper, Plus, Users, Calendar, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function BanquetPage() {
  const { banquetEvents, eventRequirements, eventAssignments, employees, assignStaffToEvent, rosterAssignments } = useHRMSStore();
  const [selectedEventId, setSelectedEventId] = useState('evt-1');
  const [selectedEmpId, setSelectedEmpId] = useState('emp-1');
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  const selectedEvent = banquetEvents.find(e => e.id === selectedEventId);
  const requirements = eventRequirements.filter(r => r.eventId === selectedEventId);
  const currentAssignments = eventAssignments.filter(a => a.eventId === selectedEventId);

  const handleAssign = (requirementId: string) => {
    // Check Roster Collision Detection Requirement #16 & #35
    const empRoster = rosterAssignments.find(ra => ra.employeeId === selectedEmpId && ra.date === selectedEvent?.eventDate);

    if (empRoster && empRoster.shiftId === 'LEAVE') {
      setConflictWarning(`⚠️ Roster Conflict: Employee is marked ON LEAVE on ${selectedEvent?.eventDate}`);
      return;
    }

    assignStaffToEvent(selectedEventId, requirementId, selectedEmpId);
    setConflictWarning(null);
  };

  return (
    <ShellLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-[30px] leading-[38px] font-semibold tracking-[-0.02em] text-[#202522] flex items-center gap-2">
            <PartyPopper className="w-7 h-7 text-[#0F5B55]" />
            Banquet & Hospitality Event Staffing Engine
          </h1>
          <p className="mt-1 text-[14px] leading-5 font-normal text-[#66706B]">
            On-demand manpower allocation for banquet functions with roster double-booking conflict detection.
          </p>
        </div>

        {/* Events Cards Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banquetEvents.map(evt => (
            <div 
              key={evt.id} 
              onClick={() => setSelectedEventId(evt.id)}
              className={`p-5 rounded-[10px] border cursor-pointer transition-all shadow-brand-xs ${
                selectedEventId === evt.id ? 'bg-[#C59A45]/10 border-[#C59A45] ring-2 ring-[#C59A45]/20' : 'bg-white border-[#E5E2DB] hover:border-[#0F5B55]'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[12px] font-mono font-semibold bg-[#C59A45]/20 text-[#08463F] px-2.5 py-0.5 rounded-[6px]">
                    {evt.code}
                  </span>
                  <h3 className="text-[17px] leading-6 font-semibold text-[#202522] mt-2">{evt.name}</h3>
                </div>
                <span className="text-[12px] bg-[#23865B]/10 text-[#23865B] border border-[#23865B]/20 font-semibold px-2.5 py-0.5 rounded-full">
                  {evt.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[14px] bg-[#F8F5EE] p-3.5 rounded-[8px] border border-[#E5E2DB] mt-3.5">
                <div>
                  <span className="text-[12px] text-[#66706B] block font-semibold">Date</span>
                  <span className="font-mono font-medium text-[#202522]">{evt.eventDate}</span>
                </div>
                <div>
                  <span className="text-[12px] text-[#66706B] block font-semibold">Timing</span>
                  <span className="font-mono font-medium text-[#202522]">{evt.startTime} - {evt.endTime}</span>
                </div>
                <div>
                  <span className="text-[12px] text-[#66706B] block font-semibold">Expected Guests</span>
                  <span className="font-semibold text-[#C59A45]">{evt.expectedGuests} Pax</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Staff Allocation Wizard for Selected Event Requirement #16 */}
        {selectedEvent && (
          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-[#E5E2DB]">
              <div>
                <h2 className="text-[20px] leading-[28px] font-semibold text-[#0F5B55]">Manpower Requirements & Allocation: {selectedEvent.name}</h2>
                <p className="text-[14px] text-[#66706B] mt-0.5">{selectedEvent.notes}</p>
              </div>
            </div>

            {conflictWarning && (
              <div className="p-3.5 bg-[#C94B45]/10 border border-[#C94B45]/30 rounded-[8px] text-[14px] font-semibold text-[#C94B45] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                {conflictWarning}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Allocation Control */}
              <div className="space-y-4">
                <h3 className="text-[15px] font-semibold text-[#202522]">Allocate Staff to Role</h3>

                <div className="space-y-3 bg-[#F8F5EE] p-4 rounded-[8px] border border-[#E5E2DB]">
                  <div>
                    <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">Select Employee to Assign</label>
                    <select 
                      value={selectedEmpId} 
                      onChange={e => setSelectedEmpId(e.target.value)}
                      className="w-full h-11 bg-white border border-[#E5E2DB] text-[15px] leading-5 rounded-[8px] px-3.5 text-[#202522] font-medium cursor-pointer"
                    >
                      {employees.filter(e => e.status !== 'INACTIVE').map(e => (
                        <option key={e.id} value={e.id}>
                          {e.firstName} {e.lastName} ({e.employeeCode}) - {e.currentAssignment.departmentId}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 pt-2">
                    {requirements.map(req => {
                      const shortage = req.requiredCount - req.assignedCount;

                      return (
                        <div key={req.id} className="p-3.5 bg-white rounded-[8px] border border-[#E5E2DB] flex justify-between items-center">
                          <div>
                            <span className="text-[15px] font-semibold text-[#202522]">Waiter / Steward Staff</span>
                            <div className="text-[12px] text-[#66706B] font-semibold mt-0.5">Required: {req.requiredCount} | Allocated: {req.assignedCount}</div>
                          </div>

                          <button
                            onClick={() => handleAssign(req.id)}
                            className="px-4 h-11 bg-[#C59A45] hover:bg-[#b08739] text-[#08463F] font-semibold text-[14px] leading-5 rounded-[8px] shadow-brand-xs cursor-pointer"
                          >
                            Assign Selected
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Current Allocated Roster List */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-semibold text-[#202522]">
                  Currently Allocated Event Staff ({currentAssignments.length})
                </h3>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {currentAssignments.map(asgn => {
                    const emp = employees.find(e => e.id === asgn.employeeId);
                    return (
                      <div key={asgn.id} className="p-3 bg-[#F8F5EE] rounded-[8px] border border-[#E5E2DB] flex justify-between items-center text-[14px]">
                        <div className="flex items-center space-x-2.5">
                          <CheckCircle2 className="w-4 h-4 text-[#23865B]" />
                          <div>
                            <div className="font-semibold text-[#202522]">{emp?.firstName} {emp?.lastName}</div>
                            <div className="text-[12px] text-[#66706B] font-mono mt-0.5">{emp?.employeeCode}</div>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 bg-[#23865B]/10 text-[#23865B] border border-[#23865B]/20 text-[12px] font-semibold rounded-full">
                          CONFIRMED
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}

