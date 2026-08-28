'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { Briefcase, Plus } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function RecruitmentPage() {
  const { candidates, addCandidate, updateCandidateStage } = useHRMSStore();
  const [showAddModal, setShowAddModal] = useState(false);

  const [jobTitle, setJobTitle] = useState('Senior Sous Chef');
  const [candidateName, setCandidateName] = useState('Kishore Kumar');
  const [email, setEmail] = useState('kishore.k@gmail.com');
  const [phone, setPhone] = useState('9845012345');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCandidate({ jobTitle, candidateName, email, phone });
    setShowAddModal(false);
  };

  return (
    <ShellLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[30px] leading-[38px] font-semibold tracking-[-0.02em] text-[#202522] flex items-center gap-2">
              <Briefcase className="w-7 h-7 text-[#0F5B55]" />
              Applicant Tracking System (ATS) & Offer Letter Generator
            </h1>
            <p className="mt-1 text-[14px] leading-5 font-normal text-[#66706B]">
              Job vacancy pipeline, interview scheduler & formal offer letter generation.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 h-11 bg-[#0F5B55] hover:bg-[#08463F] text-white text-[14px] leading-5 font-semibold rounded-[8px] shadow-brand-xs transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Candidate</span>
          </button>
        </div>

        <div className="bg-white rounded-[10px] border border-[#E5E2DB] shadow-brand-xs overflow-hidden">
          <table className="w-full text-left text-[#202522]">
            <thead className="bg-[#F3F0E9]/60 border-b border-[#E5E2DB]">
              <tr>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Candidate Name</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Target Position</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Contact Info</th>
                <th className="px-4 py-3 text-[13px] leading-5 font-semibold text-[#66706B]">Pipeline Stage</th>
                <th className="px-4 py-3 text-right text-[13px] leading-5 font-semibold text-[#66706B]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E2DB]">
              {candidates.map(c => (
                <tr key={c.id} className="hover:bg-[#F3F0E9]/50">
                  <td className="px-4 py-3.5 text-[15px] leading-5 font-medium text-[#202522]">{c.candidateName}</td>
                  <td className="px-4 py-3.5 text-[15px] leading-5 font-medium text-[#0F5B55]">{c.jobTitle}</td>
                  <td className="px-4 py-3.5 text-[14px] text-[#66706B]">
                    <div>{c.email}</div>
                    <div className="font-mono text-[12px]">{c.phone}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2.5 py-1 rounded-full text-[12px] leading-4 font-semibold bg-[#0F5B55]/10 text-[#0F5B55] border border-[#0F5B55]/20 uppercase">
                      {c.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right space-x-2">
                    {c.stage !== 'OFFERED' && (
                      <button
                        onClick={() => updateCandidateStage(c.id, 'OFFERED')}
                        className="px-3 h-9 bg-[#C59A45] hover:bg-[#b08739] text-[#08463F] font-semibold text-[13px] rounded-[6px] shadow-brand-xs cursor-pointer"
                      >
                        Generate Offer
                      </button>
                    )}
                    <select
                      value={c.stage}
                      onChange={(e) => updateCandidateStage(c.id, e.target.value as any)}
                      className="border border-[#E5E2DB] text-[13px] rounded-[6px] px-2 py-1 bg-[#F3F0E9] font-medium text-[#202522]"
                    >
                      <option value="APPLIED">Applied</option>
                      <option value="SCREENING">Screening</option>
                      <option value="INTERVIEW_SCHEDULED">Interview</option>
                      <option value="OFFERED">Offered</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-[#202522]/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[10px] shadow-xl w-full max-w-md overflow-hidden border border-[#E5E2DB]">
              <div className="bg-[#0F5B55] text-white px-5 py-3.5 flex justify-between items-center">
                <h3 className="text-[18px] leading-6 font-semibold">Add Candidate to Pipeline</h3>
                <button onClick={() => setShowAddModal(false)} className="text-sm font-bold text-white/80 hover:text-white cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">Position Applied</label>
                  <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)} required className="w-full h-11 border border-[#E5E2DB] text-[15px] px-3.5 rounded-[8px] text-[#202522]" />
                </div>
                <div>
                  <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">Candidate Full Name</label>
                  <input type="text" value={candidateName} onChange={e => setCandidateName(e.target.value)} required className="w-full h-11 border border-[#E5E2DB] text-[15px] px-3.5 rounded-[8px] text-[#202522]" />
                </div>
                <div>
                  <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full h-11 border border-[#E5E2DB] text-[15px] px-3.5 rounded-[8px] text-[#202522]" />
                </div>
                <div>
                  <label className="text-[14px] leading-5 font-medium text-[#202522] block mb-1">Phone Number</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full h-11 border border-[#E5E2DB] text-[15px] px-3.5 rounded-[8px] text-[#202522]" />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 h-11 bg-[#F3F0E9] text-[14px] font-medium text-[#202522] rounded-[8px]">Cancel</button>
                  <button type="submit" className="px-4 h-11 bg-[#0F5B55] hover:bg-[#08463F] text-white text-[14px] font-semibold rounded-[8px] shadow-brand-xs">Save Candidate</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
