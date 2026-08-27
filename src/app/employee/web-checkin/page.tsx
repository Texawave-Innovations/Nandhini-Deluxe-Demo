'use client';

import React, { useState } from 'react';
import EmployeePortalLayout from '@/components/layout/EmployeePortalLayout';
import { Camera, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function WebCheckinPage() {
  const { employees, simulateBiometricPunch } = useHRMSStore();
  const currentEmp = employees[0] || { id: 'emp-1', firstName: 'Ravi', lastName: 'Kumar', employeeCode: 'ND-1001' };

  const [punchSuccess, setPunchSuccess] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handleCaptureAndPunch = (type: 'IN' | 'OUT') => {
    // Generate simulated camera snapshot preview
    const fakePhoto = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`;
    setPhotoPreview(fakePhoto);

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    simulateBiometricPunch(currentEmp.id, nowStr, type, fakePhoto);

    setPunchSuccess(`Successfully recorded Camera Punch ${type} at ${nowStr.substring(11, 16)}!`);
    setTimeout(() => setPunchSuccess(null), 5000);
  };

  return (
    <EmployeePortalLayout>
      <div className="space-y-6 font-sans">
        <div>
          <h1 className="text-2xl font-bold text-[#202522] tracking-tight flex items-center gap-2">
            <Camera className="w-6 h-6 text-[#0F5B55]" />
            ESS Web Check-in (Live Facial Verification)
          </h1>
          <p className="text-xs text-[#66706B] font-medium mt-0.5">
            Capture live photo & timestamp to record shift entry or exit.
          </p>
        </div>

        {punchSuccess && (
          <div className="p-4 bg-[#23865B]/10 border border-[#23865B]/30 rounded-[10px] text-xs font-bold text-[#23865B] flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{punchSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Camera Viewfinder Simulation Card */}
          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs space-y-4 text-center">
            <div className="h-64 bg-slate-900 rounded-[8px] border-2 border-dashed border-[#0F5B55] flex flex-col items-center justify-center text-white relative overflow-hidden">
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="Captured Verification" className="w-full h-full object-cover" />
              ) : (
                <div className="space-y-2">
                  <Camera className="w-12 h-12 text-amber-400 mx-auto animate-pulse" />
                  <p className="text-xs font-semibold text-slate-300">Webcam Feed Ready</p>
                  <p className="text-[10px] text-slate-400 font-mono">Geofence & Facial Verification Active</p>
                </div>
              )}
            </div>

            {/* UNIFORM BUTTON SYSTEM: Primary Deep Teal Buttons for IN/OUT */}
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => handleCaptureAndPunch('IN')}
                className="flex-1 py-3 bg-[#0F5B55] hover:bg-[#08463F] text-white text-xs font-semibold rounded-[8px] shadow-brand-xs transition-all flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Punch IN (Work Start)</span>
              </button>

              <button
                onClick={() => handleCaptureAndPunch('OUT')}
                className="flex-1 py-3 bg-[#0F5B55] hover:bg-[#08463F] text-white text-xs font-semibold rounded-[8px] shadow-brand-xs transition-all flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Punch OUT (Work End)</span>
              </button>
            </div>
          </div>

          {/* Verification Details */}
          <div className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs space-y-4">
            <h3 className="text-sm font-semibold text-[#202522] border-b border-[#E5E2DB] pb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#0F5B55]" />
              Punch Verification Profile
            </h3>

            <div className="space-y-3 text-xs text-[#202522]">
              <div className="flex justify-between p-2 bg-[#F3F0E9] rounded-[8px]">
                <span className="text-[#66706B]">Employee Name:</span>
                <span className="font-bold">{currentEmp.firstName} {currentEmp.lastName}</span>
              </div>
              <div className="flex justify-between p-2 bg-[#F3F0E9] rounded-[8px]">
                <span className="text-[#66706B]">Employee Code:</span>
                <span className="font-bold font-mono">{currentEmp.employeeCode}</span>
              </div>
              <div className="flex justify-between p-2 bg-[#F3F0E9] rounded-[8px]">
                <span className="text-[#66706B]">Assigned Shift:</span>
                <span className="font-bold text-[#0F5B55]">Morning Shift (07:00 - 15:30)</span>
              </div>
              <div className="flex justify-between p-2 bg-[#F3F0E9] rounded-[8px]">
                <span className="text-[#66706B]">Location Geofence:</span>
                <span className="font-bold text-[#23865B]">Whitefield Restaurant (Verified)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </EmployeePortalLayout>
  );
}
