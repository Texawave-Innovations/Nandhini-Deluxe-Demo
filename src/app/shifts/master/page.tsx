'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { Clock, Plus, Edit, Trash2 } from 'lucide-react';
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
            <h1 className="text-[30px] leading-[38px] font-semibold tracking-[-0.02em] text-[#202522] flex items-center gap-2">
              <Clock className="w-7 h-7 text-[#0F5B55]" />
              Shift Master & Configurable Rules Engine
            </h1>
            <p className="mt-1 text-[14px] leading-5 font-normal text-[#66706B]">
              Configure timing parameters, grace periods, cross-midnight flags, breaks, and attendance calculation rules.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center space-x-2 px-4 h-11 bg-[#0F5B55] hover:bg-[#08463F] text-white text-[14px] leading-5 font-semibold rounded-[8px] shadow-brand-xs transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Shift</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shifts.map((shift) => (
            <div key={shift.id} className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs space-y-4 hover:border-[#0F5B55]/40 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#0F5B55]/10 text-[#0F5B55] border border-[#0F5B55]/20">
                    CODE: {shift.code}
                  </span>
                  <h3 className="text-[17px] leading-6 font-semibold text-[#202522] mt-1.5">{shift.name}</h3>
                </div>
                <div className="flex items-center space-x-1">
                  <button onClick={() => openEditModal(shift)} className="p-1.5 text-[#66706B] hover:text-[#C68A28]" title="Edit">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(shift.id, shift.name)} className="p-1.5 text-[#66706B] hover:text-[#C94B45]" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[14px] leading-5 bg-[#F8F5EE] p-3 rounded-[8px] border border-[#E5E2DB]">
                <div>
                  <span className="text-[#66706B] text-[12px] uppercase font-semibold block">Timing</span>
                  <span className="font-mono font-semibold text-[#202522]">{shift.startTime} - {shift.endTime}</span>
                </div>
                <div>
                  <span className="text-[#66706B] text-[12px] uppercase font-semibold block">Total Shift Hrs</span>
                  <span className="font-mono font-semibold text-[#202522]">{shift.totalShiftHours} Hours</span>
                </div>
              </div>

              <div className="space-y-1.5 text-[14px] leading-5 text-[#66706B] border-t border-[#E5E2DB] pt-3">
                <div className="flex justify-between">
                  <span>Late Grace Period:</span>
                  <span className="font-semibold text-[#202522]">{shift.rules.lateArrivalGraceMins} Minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Half-Day Threshold:</span>
                  <span className="font-semibold text-[#202522]">{shift.rules.minHoursForHalfDay} Hours</span>
                </div>
                <div className="flex justify-between">
                  <span>Full-Day Threshold:</span>
                  <span className="font-semibold text-[#202522]">{shift.rules.minHoursForFullDay} Hours</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-[#202522]/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[10px] shadow-xl w-full max-w-lg overflow-hidden border border-[#E5E2DB]">
              <div className="bg-[#0F5B55] text-white px-5 py-3.5 flex justify-between items-center">
                <h3 className="text-[18px] leading-6 font-semibold">{editingShift ? 'Edit Shift Master' : 'Configure New Shift Master'}</h3>
                <button onClick={() => setShowModal(false)} className="text-sm font-bold text-white/80 hover:text-white cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">Shift Code</label>
                    <input type="text" placeholder="e.g. M2" value={code} onChange={e => setCode(e.target.value)} required className="w-full h-11 border border-[#E5E2DB] text-[15px] px-3.5 rounded-[8px] text-[#202522]" />
                  </div>
                  <div>
                    <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">Shift Name</label>
                    <input type="text" placeholder="Morning Special Shift" value={name} onChange={e => setName(e.target.value)} required className="w-full h-11 border border-[#E5E2DB] text-[15px] px-3.5 rounded-[8px] text-[#202522]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">Start Time</label>
                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required className="w-full h-11 border border-[#E5E2DB] text-[15px] px-3.5 rounded-[8px] text-[#202522]" />
                  </div>
                  <div>
                    <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">End Time</label>
                    <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required className="w-full h-11 border border-[#E5E2DB] text-[15px] px-3.5 rounded-[8px] text-[#202522]" />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="cross" checked={isCrossMidnight} onChange={e => setIsCrossMidnight(e.target.checked)} className="rounded text-[#0F5B55] focus:ring-[#0F5B55] w-4 h-4" />
                  <label htmlFor="cross" className="text-[14px] font-medium text-[#202522]">Is Cross-Midnight Shift</label>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 h-11 bg-[#F3F0E9] text-[14px] font-medium text-[#202522] rounded-[8px]">Cancel</button>
                  <button type="submit" className="px-4 h-11 bg-[#0F5B55] hover:bg-[#08463F] text-white text-[14px] font-semibold rounded-[8px] shadow-brand-xs">
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
