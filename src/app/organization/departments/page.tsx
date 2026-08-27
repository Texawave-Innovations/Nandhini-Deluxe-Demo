'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { Building, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';
import { Department } from '@/types/erp-core';

export default function DepartmentsPage() {
  const { departments, addDepartment, updateDepartment, deleteDepartment } = useHRMSStore();

  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [viewingDept, setViewingDept] = useState<Department | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');

  const openAddModal = () => {
    setEditingDept(null);
    setCode('');
    setName('');
    setShowModal(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setCode(dept.code);
    setName(dept.name);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDept) {
      updateDepartment(editingDept.id, { code, name });
    } else {
      addDepartment({
        code,
        name,
        status: 'ACTIVE'
      });
    }
    setShowModal(false);
  };

  const handleDelete = (id: string, deptName: string) => {
    if (confirm(`Are you sure you want to delete Department "${deptName}"?`)) {
      deleteDepartment(id);
    }
  };

  return (
    <ShellLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              Department & Functional Divisions
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Operational department structures shared across HRMS, Payroll, and Cost Accounting.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {departments.map(dept => (
            <div key={dept.id} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                  {dept.code}
                </span>
                <div className="flex items-center space-x-1">
                  <button onClick={() => setViewingDept(dept)} className="p-1 text-slate-500 hover:text-blue-600" title="View Details">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => openEditModal(dept)} className="p-1 text-slate-500 hover:text-amber-600" title="Edit">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(dept.id, dept.name)} className="p-1 text-slate-500 hover:text-red-600" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h3 className="text-xs font-bold text-slate-900">{dept.name}</h3>
              <div className="text-[10px] text-emerald-600 font-bold uppercase">{dept.status}</div>
            </div>
          ))}
        </div>

        {/* Add / Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center">
                <h3 className="text-sm font-bold">{editingDept ? 'Edit Department' : 'Add Department'}</h3>
                <button onClick={() => setShowModal(false)} className="text-xs font-bold">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">Department Code</label>
                  <input type="text" placeholder="e.g. LOGISTICS" value={code} onChange={e => setCode(e.target.value)} required className="w-full border text-xs p-2 rounded" />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Department Name</label>
                  <input type="text" placeholder="e.g. Fleet Logistics & Supply" value={name} onChange={e => setName(e.target.value)} required className="w-full border text-xs p-2 rounded" />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 bg-slate-200 text-xs font-semibold rounded">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded shadow">
                    {editingDept ? 'Update Department' : 'Save Department'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {viewingDept && (
          <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center">
                <h3 className="text-sm font-bold">Department Profile: {viewingDept.name}</h3>
                <button onClick={() => setViewingDept(null)} className="text-xs font-bold">✕</button>
              </div>

              <div className="p-5 space-y-3 text-xs text-slate-700">
                <div className="flex justify-between"><span className="text-slate-500">Code:</span><span className="font-mono font-bold text-purple-700">{viewingDept.code}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Name:</span><span className="font-bold">{viewingDept.name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Status:</span><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">{viewingDept.status}</span></div>
              </div>

              <div className="p-4 bg-slate-50 border-t flex justify-end">
                <button onClick={() => setViewingDept(null)} className="px-4 py-1.5 bg-slate-800 text-white font-bold text-xs rounded">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
