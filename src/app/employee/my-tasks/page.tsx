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
          <h1 className="text-[30px] leading-[38px] font-semibold tracking-[-0.02em] text-[#202522] flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-[#0F5B55]" />
            My Daily Assigned Tasks & Work Log
          </h1>
          <p className="mt-1 text-[14px] leading-5 font-normal text-[#66706B]">Track work items assigned by HR & Department Managers.</p>
        </div>

        <div className="space-y-3">
          {employeeTasks.map(task => (
            <div key={task.id} className="p-4 bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs flex justify-between items-center text-[14px]">
              <div className="space-y-1">
                <span className={`px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${task.priority === 'HIGH' ? 'bg-[#C94B45]/10 text-[#C94B45] border border-[#C94B45]/20' : 'bg-[#C68A28]/10 text-[#C68A28] border border-[#C68A28]/20'}`}>
                  {task.priority} PRIORITY
                </span>
                <h3 className="font-semibold text-[#202522] text-[17px] leading-6 mt-1">{task.taskTitle}</h3>
                <p className="text-[#66706B] font-medium text-[14px]">Due Date: {task.dueDate}</p>
              </div>

              <button className="h-11 px-4 bg-[#23865B] hover:bg-[#1b6b48] text-white font-semibold text-[14px] leading-5 rounded-[8px] shadow-brand-xs cursor-pointer">
                Mark Completed ✓
              </button>
            </div>
          ))}
        </div>
      </div>
    </EmployeePortalLayout>
  );
}

