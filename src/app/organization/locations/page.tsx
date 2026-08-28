'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function LocationsPage() {
  const { locations, addLocation, deleteLocation } = useHRMSStore();
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addLocation({
      businessUnitId: 'bu-1',
      code,
      name,
      city: 'Bengaluru',
      address: 'Bangalore, Karnataka',
      status: 'ACTIVE'
    });
    setShowModal(false);
    setCode('');
    setName('');
  };

  return (
    <ShellLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[30px] leading-[38px] font-semibold tracking-[-0.02em] text-[#202522] flex items-center gap-2">
              <MapPin className="w-7 h-7 text-[#0F5B55]" />
              Branch & Location Master
            </h1>
            <p className="mt-1 text-[14px] leading-5 font-normal text-[#66706B]">
              Manage restaurant branches, cloud kitchens, regional offices & geo-fencing premises.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 h-11 bg-[#0F5B55] hover:bg-[#08463F] text-white text-[14px] leading-5 font-semibold rounded-[8px] shadow-brand-xs transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Location</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map(loc => (
            <div key={loc.id} className="bg-white rounded-[10px] border border-[#E5E2DB] p-5 shadow-brand-xs space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[12px] font-mono font-semibold bg-[#0F5B55]/10 text-[#0F5B55] px-2.5 py-0.5 rounded-full border border-[#0F5B55]/20">
                    {loc.code}
                  </span>
                  <h3 className="text-[17px] leading-6 font-semibold text-[#202522] mt-2">{loc.name}</h3>
                </div>
                <button onClick={() => deleteLocation(loc.id)} className="text-[#66706B] hover:text-[#C94B45] p-1" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[14px] leading-5 text-[#66706B]">{loc.city}, {loc.address}</p>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-[#202522]/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[10px] shadow-xl w-full max-w-md overflow-hidden border border-[#E5E2DB]">
              <div className="bg-[#0F5B55] text-white px-5 py-3.5 flex justify-between items-center">
                <h3 className="text-[18px] leading-6 font-semibold">Create Branch Location</h3>
                <button onClick={() => setShowModal(false)} className="text-sm font-bold text-white/80 hover:text-white cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">Branch Code</label>
                  <input type="text" placeholder="e.g. BLR-MGR" value={code} onChange={e => setCode(e.target.value)} required className="w-full h-11 border border-[#E5E2DB] text-[15px] px-3.5 rounded-[8px] text-[#202522]" />
                </div>
                <div>
                  <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">Branch Name</label>
                  <input type="text" placeholder="e.g. Magrath Road Branch" value={name} onChange={e => setName(e.target.value)} required className="w-full h-11 border border-[#E5E2DB] text-[15px] px-3.5 rounded-[8px] text-[#202522]" />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 h-11 bg-[#F3F0E9] text-[14px] font-medium text-[#202522] rounded-[8px]">Cancel</button>
                  <button type="submit" className="px-4 h-11 bg-[#0F5B55] hover:bg-[#08463F] text-white text-[14px] font-semibold rounded-[8px] shadow-brand-xs">Save Location</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
