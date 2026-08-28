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
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <PartyPopper className="w-5 h-5 text-amber-600" />
            Banquet & Hospitality Event Staffing Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            On-demand manpower allocation for banquet functions with roster double-booking conflict detection.
          </p>
        </div>

        {/* Events Cards Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banquetEvents.map(evt => (
            <div 
              key={evt.id} 
              onClick={() => setSelectedEventId(evt.id)}
              className={`p-5 rounded-lg border cursor-pointer transition-all ${
                selectedEventId === evt.id ? 'bg-amber-50/60 border-amber-500 ring-2 ring-amber-200' : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                    {evt.code}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1.5">{evt.name}</h3>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                  {evt.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs bg-white p-3 rounded border border-slate-200 mt-3">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Date</span>
                  <span className="font-mono font-bold text-slate-800">{evt.eventDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Timing</span>
                  <span className="font-mono font-bold text-slate-800">{evt.startTime} - {evt.endTime}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Expected Guests</span>
                  <span className="font-bold text-amber-700">{evt.expectedGuests} Pax</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Staff Allocation Wizard for Selected Event Requirement #16 */}
        {selectedEvent && (
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-base font-bold text-slate-900">Manpower Requirements & Allocation: {selectedEvent.name}</h2>
                <p className="text-xs text-slate-500">{selectedEvent.notes}</p>
              </div>
            </div>

            {conflictWarning && (
              <div className="p-3 bg-red-100 border border-red-300 rounded text-xs font-bold text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {conflictWarning}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Allocation Control */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Allocate Staff to Role</h3>

                <div className="space-y-3 bg-slate-50 p-4 rounded border border-slate-200">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Select Employee to Assign</label>
                    <select 
                      value={selectedEmpId} 
                      onChange={e => setSelectedEmpId(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-xs rounded p-2 text-slate-800 font-medium"
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
                        <div key={req.id} className="p-3 bg-white rounded border border-slate-200 flex justify-between items-center">
                          <div>
                            <span className="text-xs font-bold text-slate-900">Waiter / Steward Staff</span>
                            <div className="text-[10px] text-slate-500">Required: {req.requiredCount} | Allocated: {req.assignedCount}</div>
                          </div>

                          <button
                            onClick={() => handleAssign(req.id)}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded shadow-sm"
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
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Currently Allocated Event Staff ({currentAssignments.length})
                </h3>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {currentAssignments.map(asgn => {
                    const emp = employees.find(e => e.id === asgn.employeeId);
                    return (
                      <div key={asgn.id} className="p-2.5 bg-slate-50 rounded border border-slate-200 flex justify-between items-center text-xs">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <div>
                            <div className="font-bold text-slate-900">{emp?.firstName} {emp?.lastName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{emp?.employeeCode}</div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
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

