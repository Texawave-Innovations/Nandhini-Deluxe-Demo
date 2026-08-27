'use client';

import React, { useState } from 'react';
import ShellLayout from '@/components/layout/ShellLayout';
import { Briefcase, Plus, CheckCircle2, UserCheck, FileText } from 'lucide-react';
import { useHRMSStore } from '@/store/hrms-store';

export default function RecruitmentATSPage() {
  const { candidates, addCandidate, updateCandidateStage } = useHRMSStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState<any | null>(null);

  const [jobTitle, setJobTitle] = useState('Restaurant Manager');
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Applicant Tracking System (ATS) & Offer Letter Generator
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              TexaWave Recruitment Module: Job vacancy pipeline, interview scheduler & formal offer letter generation.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Candidate</span>
          </button>
        </div>

        {/* Candidate Pipeline Kanban / Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-900 text-white uppercase text-[10px] font-semibold">
              <tr>
                <th className="px-4 py-3">Candidate Name</th>
                <th className="px-4 py-3">Applied Position</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Interview Stage</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {candidates.map(c => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-900">{c.candidateName}</td>
                  <td className="px-4 py-3 font-semibold text-blue-700">{c.jobTitle}</td>
                  <td className="px-4 py-3 text-slate-600">{c.email} • {c.phone}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      {c.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => updateCandidateStage(c.id, 'TECHNICAL_PASSED')}
                      className="px-2.5 py-1 bg-emerald-600 text-white rounded font-bold text-[10px]"
                    >
                      Pass Stage
                    </button>
                    <button
                      onClick={() => setShowOfferModal(c)}
                      className="px-2.5 py-1 bg-blue-600 text-white rounded font-bold text-[10px]"
                    >
                      Generate Offer Letter ✉️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Candidate Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center">
                <h3 className="text-sm font-bold">Add Applicant Candidate</h3>
                <button onClick={() => setShowAddModal(false)} className="text-xs font-bold">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">Candidate Name</label>
                  <input type="text" value={candidateName} onChange={e => setCandidateName(e.target.value)} required className="w-full border text-xs p-2 rounded" />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Applied Position</label>
                  <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)} required className="w-full border text-xs p-2 rounded" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full border text-xs p-2 rounded" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1">Phone</label>
                    <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full border text-xs p-2 rounded" />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 bg-slate-200 text-xs font-semibold rounded">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded shadow">Save Candidate</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Offer Letter Generator Modal */}
        {showOfferModal && (
          <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center">
                <h3 className="text-sm font-bold">Offer Letter Builder - Nandhini Deluxe Group</h3>
                <button onClick={() => setShowOfferModal(null)} className="text-xs font-bold">✕</button>
              </div>

              <div className="p-5 space-y-3 font-serif text-xs text-slate-800 border-b border-slate-200 bg-amber-50/40">
                <div className="font-bold text-sm">OFFER OF EMPLOYMENT</div>
                <div>Dear <b>{showOfferModal.candidateName}</b>,</div>
                <p className="leading-relaxed">
                  We are pleased to offer you the position of <b>{showOfferModal.jobTitle}</b> at <b>Nandhini Deluxe Restaurants & Hotels</b>. Your annual CTC will be ₹4,20,000 per annum with full PF/ESI statutory benefits.
                </p>
                <div>Joining Date: 1st September 2026</div>
              </div>

              <div className="p-4 flex justify-end space-x-2 bg-slate-50">
                <button onClick={() => setShowOfferModal(null)} className="px-3 py-1.5 bg-slate-200 text-xs font-semibold rounded">Close</button>
                <button 
                  onClick={() => { alert(`Offer Letter dispatched to ${showOfferModal.email}!`); setShowOfferModal(null); }}
                  className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded shadow"
                >
                  Dispatch Offer Letter ✉️
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}

