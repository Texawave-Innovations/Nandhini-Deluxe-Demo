'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { 
  Users, UserPlus, Search, History, Edit, Trash2 
} from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';
import { Employee } from '@/types/employee';

export default function EmployeesPage() {
  const { employees, locations, departments, roles, addEmployee, updateEmployee, deleteEmployee, updateEmployeeAssignment } = useHRMSStore();
  const [search, setSearch] = useState('');
  const [selectedLoc, setSelectedLoc] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [locId, setLocId] = useState('loc-1');
  const [deptId, setDeptId] = useState('dept-1');
  const [roleId, setRoleId] = useState('role-6');

  // Transfer Form State
  const [transferLocId, setTransferLocId] = useState('loc-2');
  const [transferDeptId, setTransferDeptId] = useState('dept-1');
  const [transferRoleId, setTransferRoleId] = useState('role-5');
  const [transferReason, setTransferReason] = useState('Promotional Transfer & Unit Requirement');

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = `${emp.firstName} ${emp.lastName} ${emp.employeeCode}`.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = selectedLoc === 'ALL' || emp.currentAssignment.locationId === selectedLoc;
    const matchesDept = selectedDept === 'ALL' || emp.currentAssignment.departmentId === selectedDept;
    return matchesSearch && matchesLoc && matchesDept;
  });

  const openAddModal = () => {
    setEditingEmp(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setStatus('ACTIVE');
    setShowAddModal(true);
  };

  const openEditModal = (emp: Employee, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEmp(emp);
    setFirstName(emp.firstName);
    setLastName(emp.lastName);
    setEmail(emp.email);
    setPhone(emp.phone);
    setStatus(emp.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE');
    setShowAddModal(true);
  };

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete Employee "${name}"?`)) {
      deleteEmployee(id);
      if (selectedEmp?.id === id) {
        setSelectedEmp(null);
        setShowDetailModal(false);
      }
    }
  };

  const handleAddOrUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmp) {
      updateEmployee(editingEmp.id, { firstName, lastName, email, phone, status });
    } else {
      addEmployee({
        firstName,
        lastName,
        email,
        phone,
        gender,
        status,
        currentAssignment: {
          id: '',
          employeeId: '',
          businessUnitId: 'bu-1',
          locationId: locId,
          departmentId: deptId,
          roleId: roleId,
          effectiveFrom: new Date().toISOString().substring(0, 10),
          isCurrent: true
        }
      });
    }
    setShowAddModal(false);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;

    updateEmployeeAssignment(selectedEmp.id, {
      businessUnitId: 'bu-1',
      locationId: transferLocId,
      departmentId: transferDeptId,
      roleId: transferRoleId,
      effectiveFrom: new Date().toISOString().substring(0, 10),
      reasonForChange: transferReason
    });

    setShowTransferModal(false);
  };

  return (
    <ShellLayout>
      <div className="space-y-5 font-sans">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#202522] tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-[#0F5B55]" />
              Employee Directory
            </h1>
            <p className="text-xs text-[#66706B] font-medium mt-0.5">
              Comprehensive employee database with effective-dated assignment transfer history.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#0F5B55] hover:bg-[#08463F] text-white text-xs font-semibold rounded-[8px] shadow-brand-xs transition-all self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-3.5 rounded-[10px] border border-[#E5E2DB] shadow-brand-xs flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#66706B]" />
            <input
              type="text"
              placeholder="Search by code, name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#F3F0E9] border border-[#E5E2DB] rounded-[8px] text-xs text-[#202522] focus:outline-none focus:ring-1 focus:ring-[#0F5B55]"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <select
              value={selectedLoc}
              onChange={(e) => setSelectedLoc(e.target.value)}
              className="bg-[#F3F0E9] border border-[#E5E2DB] text-xs rounded-[8px] px-3 py-2 text-[#202522] font-medium"
            >
              <option value="ALL">All Locations</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-[#F3F0E9] border border-[#E5E2DB] text-xs rounded-[8px] px-3 py-2 text-[#202522] font-medium"
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        {/* Table & Selected Profile Popup */}
        <div className="w-full">
          {/* Enterprise Table Component */}
          <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs overflow-hidden">
            <div className="p-3 bg-[#F3F0E9] border-b border-[#E5E2DB] text-xs font-semibold text-[#66706B] flex justify-between">
              <span>Showing {filteredEmployees.length} Employees</span>
              <span>Click row to view profile & history</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-[#202522]">
                <thead className="bg-[#F3F0E9]/60 text-[#66706B] font-semibold uppercase text-[11px] border-b border-[#E5E2DB]">
                  <tr>
                    <th className="px-4 py-3">Code & Name</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2DB]">
                  {filteredEmployees.map((emp) => {
                    const loc = locations.find(l => l.id === emp.currentAssignment.locationId);
                    const dept = departments.find(d => d.id === emp.currentAssignment.departmentId);
                    const role = roles.find(r => r.id === emp.currentAssignment.roleId);
                    const isSelected = selectedEmp?.id === emp.id && showDetailModal;

                    return (
                      <tr 
                        key={emp.id} 
                        onClick={() => {
                          setSelectedEmp(emp);
                          setShowDetailModal(true);
                        }}
                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-[#0F5B55]/10 font-semibold' : 'hover:bg-[#F3F0E9]/50'}`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-bold text-[#202522]">{emp.firstName} {emp.lastName}</div>
                          <div className="text-[10px] text-[#66706B] font-mono">{emp.employeeCode}</div>
                        </td>
                        <td className="px-4 py-3">{loc?.name || emp.currentAssignment.locationId}</td>
                        <td className="px-4 py-3">{dept?.name || emp.currentAssignment.departmentId}</td>
                        <td className="px-4 py-3">{role?.name || emp.currentAssignment.roleId}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            emp.status === 'ACTIVE'
                              ? 'bg-[#23865B]/10 text-[#23865B] border-[#23865B]/20'
                              : 'bg-[#C94B45]/10 text-[#C94B45] border-[#C94B45]/20'
                          }`}>
                            {emp.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1">
                          <button onClick={(e) => openEditModal(emp, e)} className="p-1 text-[#66706B] hover:text-[#0F5B55]" title="Edit">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={(e) => handleDelete(emp.id, `${emp.firstName} ${emp.lastName}`, e)} className="p-1 text-[#66706B] hover:text-[#C94B45]" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Employee Details Popup Modal */}
        {showDetailModal && selectedEmp && (
          <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[10px] shadow-xl w-full max-w-lg overflow-hidden border border-[#E5E2DB] max-h-[90vh] flex flex-col">
              <div className="bg-[#0F5B55] text-white px-5 py-3 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-white/20 text-white px-2 py-0.5 rounded">
                    {selectedEmp.employeeCode}
                  </span>
                  <h3 className="text-sm font-semibold">
                    {selectedEmp.firstName} {selectedEmp.lastName}
                  </h3>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="text-xs font-bold hover:opacity-80">✕</button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto">
                <div className="flex justify-between items-start pb-3 border-b border-[#E5E2DB]">
                  <div>
                    <h2 className="text-base font-bold text-[#202522]">
                      {selectedEmp.firstName} {selectedEmp.lastName}
                    </h2>
                    <p className="text-xs text-[#66706B]">{selectedEmp.email}</p>
                    <div className="mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        selectedEmp.status === 'ACTIVE'
                          ? 'bg-[#23865B]/10 text-[#23865B] border-[#23865B]/20'
                          : 'bg-[#C94B45]/10 text-[#C94B45] border-[#C94B45]/20'
                      }`}>
                        {selectedEmp.status}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTransferModal(true)}
                    className="px-3 py-1.5 bg-[#C59A45] hover:bg-[#b08739] text-[#08463F] font-bold text-xs rounded-[8px] shadow-brand-xs"
                  >
                    Transfer Employee
                  </button>
                </div>

                <div className="space-y-2 text-xs text-[#202522]">
                  <div className="flex justify-between">
                    <span className="text-[#66706B]">Phone:</span>
                    <span className="font-semibold">{selectedEmp.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#66706B]">Joining Date:</span>
                    <span className="font-semibold">{selectedEmp.joiningDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#66706B]">Employment Type:</span>
                    <span className="font-semibold">{selectedEmp.employmentTypeId}</span>
                  </div>
                </div>

                {/* Assignment History Timeline */}
                <div className="pt-3 border-t border-[#E5E2DB]">
                  <h3 className="text-xs font-semibold text-[#202522] flex items-center gap-1 mb-3">
                    <History className="w-3.5 h-3.5 text-[#0F5B55]" />
                    Effective-Dated Assignment History
                  </h3>

                  <div className="space-y-3 pl-2 border-l-2 border-[#E5E2DB]">
                    {selectedEmp.assignmentHistory.map((asgn) => {
                      const l = locations.find(loc => loc.id === asgn.locationId)?.name;
                      const d = departments.find(dep => dep.id === asgn.departmentId)?.name;

                      return (
                        <div key={asgn.id} className="relative pl-3">
                          <div className={`w-2.5 h-2.5 rounded-full absolute -left-[18px] top-1 ${asgn.isCurrent ? 'bg-[#0F5B55] ring-2 ring-[#0F5B55]/30' : 'bg-[#66706B]'}`} />
                          <div className="text-xs font-semibold text-[#202522]">
                            {l} • {d}
                          </div>
                          <div className="text-[10px] text-[#66706B] font-medium">
                            Effective: {asgn.effectiveFrom} {asgn.effectiveTo ? `to ${asgn.effectiveTo}` : '(Current Active)'}
                          </div>
                          {asgn.reasonForChange && (
                            <div className="text-[10px] text-[#C68A28] italic mt-0.5">
                              Reason: &quot;{asgn.reasonForChange}&quot;
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-[#F3F0E9] px-5 py-2.5 flex justify-end border-t border-[#E5E2DB] shrink-0">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-1.5 bg-[#0F5B55] text-white text-xs font-semibold rounded-[8px]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add / Edit Employee Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[10px] shadow-xl w-full max-w-lg overflow-hidden border border-[#E5E2DB]">
              <div className="bg-[#0F5B55] text-white px-5 py-3 flex justify-between items-center">
                <h3 className="text-sm font-semibold">{editingEmp ? 'Edit Employee Details' : 'Add New Nandhini Employee'}</h3>
                <button onClick={() => setShowAddModal(false)} className="text-xs font-bold">✕</button>
              </div>

              <form onSubmit={handleAddOrUpdateSubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#202522] block mb-1">First Name</label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required className="w-full border border-[#E5E2DB] bg-[#F8F5EE] text-xs p-2 rounded-[8px]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#202522] block mb-1">Last Name</label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required className="w-full border border-[#E5E2DB] bg-[#F8F5EE] text-xs p-2 rounded-[8px]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#202522] block mb-1">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full border border-[#E5E2DB] bg-[#F8F5EE] text-xs p-2 rounded-[8px]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#202522] block mb-1">Phone</label>
                    <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full border border-[#E5E2DB] bg-[#F8F5EE] text-xs p-2 rounded-[8px]" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#202522] block mb-1">Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')} className="w-full border border-[#E5E2DB] bg-[#F8F5EE] text-xs p-2 rounded-[8px]">
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                {!editingEmp && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#202522] block mb-1">Location</label>
                      <select value={locId} onChange={e => setLocId(e.target.value)} className="w-full border border-[#E5E2DB] bg-[#F8F5EE] text-xs p-2 rounded-[8px]">
                        {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#202522] block mb-1">Department</label>
                      <select value={deptId} onChange={e => setDeptId(e.target.value)} className="w-full border border-[#E5E2DB] bg-[#F8F5EE] text-xs p-2 rounded-[8px]">
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#202522] block mb-1">Role</label>
                      <select value={roleId} onChange={e => setRoleId(e.target.value)} className="w-full border border-[#E5E2DB] bg-[#F8F5EE] text-xs p-2 rounded-[8px]">
                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 bg-[#F3F0E9] text-xs font-semibold rounded-[8px]">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-[#0F5B55] text-white text-xs font-semibold rounded-[8px] shadow-brand-xs">
                    {editingEmp ? 'Update Employee' : 'Save Employee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Transfer Modal */}
        {showTransferModal && selectedEmp && (
          <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[10px] shadow-xl w-full max-w-md overflow-hidden border border-[#E5E2DB]">
              <div className="bg-[#0F5B55] text-white px-5 py-3 flex justify-between items-center">
                <h3 className="text-sm font-semibold">Transfer Employee: {selectedEmp.firstName} {selectedEmp.lastName}</h3>
                <button onClick={() => setShowTransferModal(false)} className="text-xs font-bold">✕</button>
              </div>

              <form onSubmit={handleTransferSubmit} className="p-5 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-[#202522] block mb-1">New Location</label>
                  <select value={transferLocId} onChange={e => setTransferLocId(e.target.value)} className="w-full border border-[#E5E2DB] bg-[#F8F5EE] text-xs p-2 rounded-[8px]">
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#202522] block mb-1">New Department</label>
                  <select value={transferDeptId} onChange={e => setTransferDeptId(e.target.value)} className="w-full border border-[#E5E2DB] bg-[#F8F5EE] text-xs p-2 rounded-[8px]">
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#202522] block mb-1">Reason for Transfer</label>
                  <input type="text" value={transferReason} onChange={e => setTransferReason(e.target.value)} required className="w-full border border-[#E5E2DB] bg-[#F8F5EE] text-xs p-2 rounded-[8px]" />
                </div>

                <div className="flex justify-end space-x-2 pt-3">
                  <button type="button" onClick={() => setShowTransferModal(false)} className="px-3 py-1.5 bg-[#F3F0E9] text-xs font-semibold rounded-[8px]">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-[#0F5B55] text-white text-xs font-semibold rounded-[8px] shadow-brand-xs">Execute Transfer</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
