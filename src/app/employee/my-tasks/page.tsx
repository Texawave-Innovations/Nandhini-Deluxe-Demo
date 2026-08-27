'use client';

import React from 'react';
import EmployeePortalLayout from '@/components/layout/EmployeePortalLayout';
import { ClipboardCheck, CheckCircle2, Clock } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function ESSMyTasksPage() {
  const { employeeTasks } = useHRMSStore();

  return (
    <EmployeePortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-blue-600" />
            My Daily Assigned Tasks & Work Log
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Track work items assigned by HR & Department Managers.</p>
        </div>

        <div className="space-y-3">
          {employeeTasks.map(task => (
            <div key={task.id} className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm flex justify-between items-center text-xs">
              <div className="space-y-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${task.priority === 'HIGH' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                  {task.priority} PRIORITY
                </span>
                <h3 className="font-bold text-slate-900 text-sm">{task.taskTitle}</h3>
                <p className="text-slate-500">Due Date: {task.dueDate}</p>
              </div>

              <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow">
                Mark Completed ✓
              </button>
            </div>
          ))}
        </div>
      </div>
    </EmployeePortalLayout>
  );
}

