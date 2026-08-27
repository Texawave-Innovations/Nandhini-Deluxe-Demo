'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { Clock, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';
import { ShiftMaster } from '@/types/shift-roster';

export default function ShiftMasterPage() {
  const { shifts, addShift, updateShift, deleteShift } = useHRMSStore();
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftMaster | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('15:30');
  const [isCrossMidnight, setIsCrossMidnight] = useState(false);
  const [lateGrace, setLateGrace] = useState(15);
  const [minHoursHalfDay, setMinHoursHalfDay] = useState(4);
  const [minHoursFullDay, setMinHoursFullDay] = useState(8);

  const openAddModal = () => {
    setEditingShift(null);
    setCode('');
    setName('');
    setStartTime('07:00');
    setEndTime('15:30');
    setIsCrossMidnight(false);
    setShowModal(true);
  };

  const openEditModal = (s: ShiftMaster) => {
    setEditingShift(s);
    setCode(s.code);
    setName(s.name);
    setStartTime(s.startTime);
    setEndTime(s.endTime);
    setIsCrossMidnight(s.isCrossMidnight);
    setLateGrace(s.rules.lateArrivalGraceMins);
    setMinHoursHalfDay(s.rules.minHoursForHalfDay);
    setMinHoursFullDay(s.rules.minHoursForFullDay);
    setShowModal(true);
  };

  const handleDelete = (id: string, shiftName: string) => {
    if (confirm(`Are you sure you want to delete Shift "${shiftName}"?`)) {
      deleteShift(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingShift) {
      updateShift(editingShift.id, {
        code,
        name,
        startTime,
        endTime,
        isCrossMidnight,
        rules: { ...editingShift.rules, lateArrivalGraceMins: lateGrace, minHoursForHalfDay: minHoursHalfDay, minHoursForFullDay: minHoursFullDay }
      });
    } else {
      addShift({
        code,
        name,
        startTime,
        endTime,
        isCrossMidnight,
        totalShiftHours: 8.5,
        colorCode: 'bg-teal-50 text-teal-700 border-teal-300',
        breaks: [{ id: `b-${Date.now()}`, name: 'Meal Break', startTime: '12:00', endTime: '12:30', durationMins: 30, isPaid: true }],
        rules: {
          lateArrivalGraceMins: lateGrace,
          earlyExitGraceMins: 10,
          maxLateOccurrencesPerMonth: 3,
          minHoursForHalfDay: minHoursHalfDay,
          minHoursForFullDay: minHoursFullDay,
          otEligibility: true,
          minOtDurationMins: 60,
          maxOtHoursPerDay: 4,
          roundingMins: 15,
          missingPunchHandling: 'AUTO_REGULARIZATION_REQUIRED'
        },
        status: 'ACTIVE'
      });
    }
    setShowModal(false);
  };

  return (
    <ShellLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Shift Master & Configurable Rules Engine
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure timing parameters, grace periods, cross-midnight flags, breaks, and attendance calculation rules.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Shift</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shifts.map((shift) => (
            <div key={shift.id} className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-4 hover:border-slate-300 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${shift.colorCode}`}>
                    CODE: {shift.code}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1.5">{shift.name}</h3>
                </div>
                <div className="flex items-center space-x-1">
                  <button onClick={() => openEditModal(shift)} className="p-1 text-slate-500 hover:text-amber-600" title="Edit">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(shift.id, shift.name)} className="p-1 text-slate-500 hover:text-red-600" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded border border-slate-200/80">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block">Timing</span>
                  <span className="font-mono font-bold text-slate-800">{shift.startTime} - {shift.endTime}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block">Total Shift Hrs</span>
                  <span className="font-mono font-bold text-slate-800">{shift.totalShiftHours} Hours</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Late Grace Period:</span>
                  <span className="font-semibold text-slate-800">{shift.rules.lateArrivalGraceMins} Minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Half-Day Threshold:</span>
                  <span className="font-semibold text-slate-800">{shift.rules.minHoursForHalfDay} Hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Full-Day Threshold:</span>
                  <span className="font-semibold text-slate-800">{shift.rules.minHoursForFullDay} Hours</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center">
                <h3 className="text-sm font-bold">{editingShift ? 'Edit Shift Master' : 'Configure New Shift Master'}</h3>
                <button onClick={() => setShowModal(false)} className="text-xs font-bold">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1">Shift Code</label>
                    <input type="text" placeholder="e.g. M2" value={code} onChange={e => setCode(e.target.value)} required className="w-full border text-xs p-2 rounded" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1">Shift Name</label>
                    <input type="text" placeholder="Morning Special Shift" value={name} onChange={e => setName(e.target.value)} required className="w-full border text-xs p-2 rounded" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1">Start Time</label>
                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required className="w-full border text-xs p-2 rounded" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1">End Time</label>
                    <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required className="w-full border text-xs p-2 rounded" />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="cross" checked={isCrossMidnight} onChange={e => setIsCrossMidnight(e.target.checked)} className="rounded" />
                  <label htmlFor="cross" className="text-xs font-medium text-slate-700">Is Cross-Midnight Shift</label>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 bg-slate-200 text-xs font-semibold rounded">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded shadow">
                    {editingShift ? 'Update Shift' : 'Save Shift'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
