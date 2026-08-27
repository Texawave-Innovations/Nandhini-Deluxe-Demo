'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { ShieldCheck, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';
import { Role } from '@/types/erp-core';

export default function RolesPage() {
  const { roles, addRole, updateRole, deleteRole } = useHRMSStore();

  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [viewingRole, setViewingRole] = useState<Role | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'MANAGEMENT' | 'OPERATIONS' | 'SERVICE' | 'KITCHEN' | 'ADMIN' | 'SUPPORT'>('SERVICE');

  const openAddModal = () => {
    setEditingRole(null);
    setCode('');
    setName('');
    setCategory('SERVICE');
    setShowModal(true);
  };

  const openEditModal = (r: Role) => {
    setEditingRole(r);
    setCode(r.code);
    setName(r.name);
    setCategory(r.category as any);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRole) {
      updateRole(editingRole.id, { code, name, category });
    } else {
      addRole({
        code,
        name,
        category,
        status: 'ACTIVE'
      });
    }
    setShowModal(false);
  };

  const handleDelete = (id: string, roleName: string) => {
    if (confirm(`Are you sure you want to delete Role "${roleName}"?`)) {
      deleteRole(id);
    }
  };

  return (
    <ShellLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Roles & Designation Master
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Enterprise designations used for manpower planning and banquet role assignments.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Role / Designation</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roles.map(r => (
            <div key={r.id} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                  {r.code}
                </span>
                <div className="flex items-center space-x-1">
                  <button onClick={() => setViewingRole(r)} className="p-1 text-slate-500 hover:text-blue-600" title="View Details">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => openEditModal(r)} className="p-1 text-slate-500 hover:text-amber-600" title="Edit">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(r.id, r.name)} className="p-1 text-slate-500 hover:text-red-600" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-xs font-bold text-slate-900">{r.name}</h3>
              <div className="text-[10px] text-slate-500">Category: <span className="font-semibold text-slate-700">{r.category}</span></div>
            </div>
          ))}
        </div>

        {/* Add / Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center">
                <h3 className="text-sm font-bold">{editingRole ? 'Edit Role & Designation' : 'Add Role & Designation'}</h3>
                <button onClick={() => setShowModal(false)} className="text-xs font-bold">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">Role / Designation Code</label>
                  <input type="text" placeholder="e.g. BARISTA" value={code} onChange={e => setCode(e.target.value)} required className="w-full border text-xs p-2 rounded" />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Designation Title</label>
                  <input type="text" placeholder="e.g. Beverage Barista Lead" value={name} onChange={e => setName(e.target.value)} required className="w-full border text-xs p-2 rounded" />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Functional Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full border text-xs p-2 rounded">
                    <option value="MANAGEMENT">Management</option>
                    <option value="OPERATIONS">Operations</option>
                    <option value="SERVICE">Service & Dining</option>
                    <option value="KITCHEN">Culinary & Kitchen</option>
                    <option value="ADMIN">Admin & HR</option>
                    <option value="SUPPORT">Support Staff</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 bg-slate-200 text-xs font-semibold rounded">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded shadow">
                    {editingRole ? 'Update Designation' : 'Save Designation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {viewingRole && (
          <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center">
                <h3 className="text-sm font-bold">Role Profile: {viewingRole.name}</h3>
                <button onClick={() => setViewingRole(null)} className="text-xs font-bold">✕</button>
              </div>

              <div className="p-5 space-y-3 text-xs text-slate-700">
                <div className="flex justify-between"><span className="text-slate-500">Code:</span><span className="font-mono font-bold text-amber-900">{viewingRole.code}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Name:</span><span className="font-bold">{viewingRole.name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Category:</span><span className="font-semibold">{viewingRole.category}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Status:</span><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">{viewingRole.status}</span></div>
              </div>

              <div className="p-4 bg-slate-50 border-t flex justify-end">
                <button onClick={() => setViewingRole(null)} className="px-4 py-1.5 bg-slate-800 text-white font-bold text-xs rounded">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
