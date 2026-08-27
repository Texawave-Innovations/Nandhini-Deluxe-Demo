'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { MapPin, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';
import { Location } from '@/types/erp-core';

export default function LocationsPage() {
  const { locations, businessUnits, addLocation, updateLocation, deleteLocation } = useHRMSStore();

  const [showModal, setShowModal] = useState(false);
  const [editingLoc, setEditingLoc] = useState<Location | null>(null);
  const [viewingLoc, setViewingLoc] = useState<Location | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [address, setAddress] = useState('');
  const [buId, setBuId] = useState(businessUnits[0]?.id || 'bu-1');

  const openAddModal = () => {
    setEditingLoc(null);
    setCode('');
    setName('');
    setCity('Bengaluru');
    setAddress('');
    setBuId(businessUnits[0]?.id || 'bu-1');
    setShowModal(true);
  };

  const openEditModal = (loc: Location) => {
    setEditingLoc(loc);
    setCode(loc.code);
    setName(loc.name);
    setCity(loc.city);
    setAddress(loc.address);
    setBuId(loc.businessUnitId);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLoc) {
      updateLocation(editingLoc.id, { businessUnitId: buId, code, name, city, address });
    } else {
      addLocation({
        businessUnitId: buId,
        code,
        name,
        city,
        address,
        status: 'ACTIVE'
      });
    }
    setShowModal(false);
  };

  const handleDelete = (id: string, locName: string) => {
    if (confirm(`Are you sure you want to delete Location "${locName}"?`)) {
      deleteLocation(id);
    }
  };

  return (
    <ShellLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Location & Branch Master
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Operating units, restaurants, hotels, central kitchen hubs, and geofence locations.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Location</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {locations.map(loc => {
            const bu = businessUnits.find(b => b.id === loc.businessUnitId);
            return (
              <div key={loc.id} className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                      {loc.code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{loc.name}</h3>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button onClick={() => setViewingLoc(loc)} className="p-1 text-slate-500 hover:text-blue-600" title="View Details">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => openEditModal(loc)} className="p-1 text-slate-500 hover:text-amber-600" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(loc.id, loc.name)} className="p-1 text-slate-500 hover:text-red-600" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div><span className="text-slate-400">City:</span> {loc.city}</div>
                  <div><span className="text-slate-400">Address:</span> {loc.address}</div>
                  <div><span className="text-slate-400">Business Unit:</span> {bu?.name || loc.businessUnitId}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add / Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center">
                <h3 className="text-sm font-bold">{editingLoc ? 'Edit Operating Location' : 'Add Operating Location'}</h3>
                <button onClick={() => setShowModal(false)} className="text-xs font-bold">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">Parent Business Unit</label>
                  <select value={buId} onChange={e => setBuId(e.target.value)} className="w-full border text-xs p-2 rounded">
                    {businessUnits.map(b => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1">Location Code</label>
                    <input type="text" placeholder="e.g. WFD-REST" value={code} onChange={e => setCode(e.target.value)} required className="w-full border text-xs p-2 rounded" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1">City</label>
                    <input type="text" value={city} onChange={e => setCity(e.target.value)} required className="w-full border text-xs p-2 rounded" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Location Name</label>
                  <input type="text" placeholder="e.g. Whitefield Main Restaurant" value={name} onChange={e => setName(e.target.value)} required className="w-full border text-xs p-2 rounded" />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Full Address</label>
                  <textarea value={address} onChange={e => setAddress(e.target.value)} required className="w-full border text-xs p-2 rounded h-20" />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 bg-slate-200 text-xs font-semibold rounded">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded shadow">
                    {editingLoc ? 'Update Location' : 'Save Location'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Details Drawer */}
        {viewingLoc && (
          <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center">
                <h3 className="text-sm font-bold">Location Details: {viewingLoc.name}</h3>
                <button onClick={() => setViewingLoc(null)} className="text-xs font-bold">✕</button>
              </div>

              <div className="p-5 space-y-3 text-xs text-slate-700">
                <div className="flex justify-between"><span className="text-slate-500">Code:</span><span className="font-mono font-bold text-blue-700">{viewingLoc.code}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Name:</span><span className="font-bold">{viewingLoc.name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">City:</span><span className="font-semibold">{viewingLoc.city}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Status:</span><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">{viewingLoc.status}</span></div>
                <div><span className="text-slate-500 block mb-1">Full Address:</span><p className="bg-slate-50 p-2 rounded border text-slate-800">{viewingLoc.address}</p></div>
              </div>

              <div className="p-4 bg-slate-50 border-t flex justify-end">
                <button onClick={() => setViewingLoc(null)} className="px-4 py-1.5 bg-slate-800 text-white font-bold text-xs rounded">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
