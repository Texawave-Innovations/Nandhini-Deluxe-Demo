'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { Building2, Plus, Edit, Trash2, Eye, MapPin } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';
import { BusinessUnit } from '@/types/erp-core';

export default function BusinessUnitsPage() {
  const { businessUnits, locations, addBusinessUnit, updateBusinessUnit, deleteBusinessUnit } = useHRMSStore();

  const [showModal, setShowModal] = useState(false);
  const [editingBu, setEditingBu] = useState<BusinessUnit | null>(null);
  const [viewingBu, setViewingBu] = useState<BusinessUnit | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<'RESTAURANT' | 'HOTEL' | 'CENTRAL_KITCHEN' | 'CORPORATE'>('RESTAURANT');
  const [description, setDescription] = useState('');

  const openAddModal = () => {
    setEditingBu(null);
    setCode('');
    setName('');
    setType('RESTAURANT');
    setDescription('');
    setShowModal(true);
  };

  const openEditModal = (bu: BusinessUnit) => {
    setEditingBu(bu);
    setCode(bu.code);
    setName(bu.name);
    setType(bu.type);
    setDescription(bu.description || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBu) {
      updateBusinessUnit(editingBu.id, { code, name, type, description });
    } else {
      addBusinessUnit({
        orgId: 'org-1',
        code,
        name,
        type,
        description,
        status: 'ACTIVE'
      });
    }
    setShowModal(false);
  };

  const handleDelete = (id: string, buName: string) => {
    if (confirm(`Are you sure you want to delete Business Unit "${buName}"?`)) {
      deleteBusinessUnit(id);
    }
  };

  return (
    <ShellLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Shared ERP Core: Business Units & Structure
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Enterprise multi-entity hierarchy decoupled from HRMS for future ERP module consumption.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Business Unit</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {businessUnits.map(bu => (
            <div key={bu.id} className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    {bu.code}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{bu.name}</h3>
                </div>
                <div className="flex items-center space-x-1">
                  <button onClick={() => setViewingBu(bu)} className="p-1 text-slate-500 hover:text-blue-600" title="View Details">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => openEditModal(bu)} className="p-1 text-slate-500 hover:text-amber-600" title="Edit">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(bu.id, bu.name)} className="p-1 text-slate-500 hover:text-red-600" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {bu.description && <p className="text-xs text-slate-600">{bu.description}</p>}
              <p className="text-xs text-slate-500">ERP Entity Category: <span className="font-semibold text-slate-700">{bu.type}</span></p>

              <div className="pt-2 border-t border-slate-100 text-xs text-slate-600">
                <span className="font-bold">Attached Locations: </span>
                {locations.filter(l => l.businessUnitId === bu.id).map(l => l.name).join(', ') || 'Global Headquarters'}
              </div>
            </div>
          ))}
        </div>

        {/* Add / Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center">
                <h3 className="text-sm font-bold">{editingBu ? 'Edit Business Unit' : 'Add Business Unit'}</h3>
                <button onClick={() => setShowModal(false)} className="text-xs font-bold">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1">BU Code</label>
                    <input type="text" placeholder="e.g. ND-SWEETS" value={code} onChange={e => setCode(e.target.value)} required className="w-full border text-xs p-2 rounded" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1">Category Type</label>
                    <select value={type} onChange={e => setType(e.target.value as any)} className="w-full border text-xs p-2 rounded">
                      <option value="RESTAURANT">Restaurant</option>
                      <option value="HOTEL">Hotel & Banquets</option>
                      <option value="CENTRAL_KITCHEN">Central Kitchen</option>
                      <option value="CORPORATE">Corporate Office</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Business Unit Name</label>
                  <input type="text" placeholder="e.g. Nandhini Sweets & Confectionery" value={name} onChange={e => setName(e.target.value)} required className="w-full border text-xs p-2 rounded" />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Description / ERP Notes</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border text-xs p-2 rounded h-20" />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 bg-slate-200 text-xs font-semibold rounded">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded shadow">
                    {editingBu ? 'Update Business Unit' : 'Save Business Unit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Details Drawer / Modal */}
        {viewingBu && (
          <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center">
                <h3 className="text-sm font-bold">Business Unit Profile: {viewingBu.name}</h3>
                <button onClick={() => setViewingBu(null)} className="text-xs font-bold">✕</button>
              </div>

              <div className="p-5 space-y-3 text-xs text-slate-700">
                <div className="flex justify-between"><span className="text-slate-500">Code:</span><span className="font-mono font-bold text-blue-700">{viewingBu.code}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Name:</span><span className="font-bold">{viewingBu.name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Type:</span><span className="font-semibold">{viewingBu.type}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Status:</span><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">{viewingBu.status}</span></div>
                <div><span className="text-slate-500 block mb-1">Description:</span><p className="bg-slate-50 p-2 rounded border text-slate-800">{viewingBu.description || 'No description provided.'}</p></div>
              </div>

              <div className="p-4 bg-slate-50 border-t flex justify-end">
                <button onClick={() => setViewingBu(null)} className="px-4 py-1.5 bg-slate-800 text-white font-bold text-xs rounded">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
