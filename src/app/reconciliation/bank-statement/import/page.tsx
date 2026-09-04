'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import { ArrowLeft, Upload, AlertCircle } from 'lucide-react';
import { useReconciliationStore } from '@/store/reconciliation-store';
import { reconciliationService } from '@/services/reconciliationService';
import { BankTransaction } from '@/types/reconciliation';

type FieldKey = 'date' | 'description' | 'referenceNo' | 'debit' | 'credit';
const FIELDS: { key: FieldKey; label: string; required: boolean }[] = [
  { key: 'date', label: 'Date', required: true },
  { key: 'description', label: 'Description / Narration', required: true },
  { key: 'referenceNo', label: 'Reference No / UTR', required: false },
  { key: 'debit', label: 'Debit Amount', required: false },
  { key: 'credit', label: 'Credit Amount', required: false },
];

function guessColumn(headers: string[], patterns: string[]): string {
  const lower = headers.map((h) => h.toLowerCase());
  for (const p of patterns) {
    const idx = lower.findIndex((h) => h.includes(p));
    if (idx >= 0) return headers[idx];
  }
  return '';
}

export default function ImportBankStatementPage() {
  const router = useRouter();
  const importBankStatement = useReconciliationStore((s) => s.importBankStatement);

  const [rows, setRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<FieldKey, string>>({ date: '', description: '', referenceNo: '', debit: '', credit: '' });
  const [error, setError] = useState<string | undefined>(undefined);
  const [fileName, setFileName] = useState<string | undefined>(undefined);

  const handleFile = async (file: File) => {
    setError(undefined);
    const text = await file.text();
    const parsed = reconciliationService.parseCSV(text);
    if (parsed.length < 2) { setError('Could not find any data rows in this file.'); return; }
    const [head, ...body] = parsed;
    setHeaders(head);
    setRows(body);
    setFileName(file.name);
    setMapping({
      date: guessColumn(head, ['date']),
      description: guessColumn(head, ['desc', 'narration', 'particular']),
      referenceNo: guessColumn(head, ['ref', 'utr', 'cheque']),
      debit: guessColumn(head, ['debit', 'withdrawal']),
      credit: guessColumn(head, ['credit', 'deposit']),
    });
  };

  const colIndex = (colName: string) => headers.indexOf(colName);

  const mappedRows = useMemo(() => {
    if (!mapping.date || !mapping.description || (!mapping.debit && !mapping.credit)) return [];
    const dateIdx = colIndex(mapping.date);
    const descIdx = colIndex(mapping.description);
    const refIdx = mapping.referenceNo ? colIndex(mapping.referenceNo) : -1;
    const debitIdx = mapping.debit ? colIndex(mapping.debit) : -1;
    const creditIdx = mapping.credit ? colIndex(mapping.credit) : -1;

    return rows
      .map((r): Omit<BankTransaction, 'id'> | undefined => {
        const debit = debitIdx >= 0 ? parseFloat((r[debitIdx] || '').replace(/[,₹]/g, '')) : NaN;
        const credit = creditIdx >= 0 ? parseFloat((r[creditIdx] || '').replace(/[,₹]/g, '')) : NaN;
        const type: BankTransaction['type'] = credit > 0 ? 'CREDIT' : 'DEBIT';
        const amount = credit > 0 ? credit : debit;
        if (!(amount > 0) || !r[dateIdx]) return undefined;
        return {
          transactionDate: reconciliationService.normalizeDateGuess(r[dateIdx]),
          description: r[descIdx] || '(no description)',
          referenceNo: refIdx >= 0 ? (r[refIdx] || '') : '',
          type, amount, narrationSource: 'OTHER',
        };
      })
      .filter((r): r is Omit<BankTransaction, 'id'> => !!r);
  }, [rows, headers, mapping]);

  const handleImport = () => {
    if (mappedRows.length === 0) { setError('No valid rows to import — check the column mapping.'); return; }
    importBankStatement(mappedRows);
    router.push('/reconciliation/bank-statement');
  };

  return (
    <ShellLayout>
      <div className="space-y-5 max-w-4xl">
        <button onClick={() => router.push('/reconciliation/bank-statement')} className="flex items-center gap-1.5 text-[13px] text-[#66706B] hover:text-[#202522]"><ArrowLeft className="w-4 h-4" /> Back to Bank Statement</button>
        <SectionHeader title="Import Bank Statement" subtitle="CSV only in this pass — map your file's columns below, preview the result, then import. Auto-match runs automatically on the new lines." />

        {error && <div className="flex items-center gap-2 text-[13px] text-[#C94B45] bg-[#C94B45]/5 border border-[#C94B45]/30 rounded-lg px-3 py-2"><AlertCircle className="w-4 h-4 shrink-0" /> {error}</div>}

        <div className="bg-white border border-[#E5E2DB] rounded-[10px] p-5 shadow-brand-xs space-y-3">
          <label className="text-[12px] font-semibold text-[#66706B] block">Bank Statement File (.csv)</label>
          <input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="text-[12px] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-[#E5E2DB] file:bg-white file:text-[12px] file:font-semibold" />
          {fileName && <div className="text-[12px] text-[#66706B]">{fileName} — {rows.length} data row(s) detected.</div>}
        </div>

        {headers.length > 0 && (
          <div className="bg-white border border-[#E5E2DB] rounded-[10px] p-5 shadow-brand-xs space-y-3">
            <h3 className="text-[13px] font-semibold text-[#202522]">Column Mapping</h3>
            <p className="text-[12px] text-[#66706B]">Map Debit and/or Credit to the matching amount column — a row is a Credit line if the Credit column has a value, otherwise Debit.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="text-[12px] font-semibold text-[#66706B] block mb-1">{f.label}{f.required && ' *'}</label>
                  <select value={mapping[f.key]} onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value }))} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]">
                    <option value="">— not mapped —</option>
                    {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {mappedRows.length > 0 && (
          <div className="bg-white border border-[#E5E2DB] rounded-[10px] p-5 shadow-brand-xs space-y-3">
            <h3 className="text-[13px] font-semibold text-[#202522]">Preview ({mappedRows.length} row(s) will be imported)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead className="bg-[#F3F0E9] text-[#66706B]"><tr><th className="text-left px-3 py-2">Date</th><th className="text-left px-3 py-2">Description</th><th className="text-left px-3 py-2">Reference</th><th className="text-left px-3 py-2">Type</th><th className="text-right px-3 py-2">Amount</th></tr></thead>
                <tbody>
                  {mappedRows.slice(0, 8).map((r, i) => (
                    <tr key={i} className="border-t border-[#E5E2DB]">
                      <td className="px-3 py-2">{r.transactionDate}</td>
                      <td className="px-3 py-2">{r.description}</td>
                      <td className="px-3 py-2">{r.referenceNo || '—'}</td>
                      <td className="px-3 py-2">{r.type}</td>
                      <td className="px-3 py-2 text-right">₹{r.amount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {mappedRows.length > 8 && <div className="text-[11px] text-[#66706B] mt-2">…and {mappedRows.length - 8} more.</div>}
            </div>
            <button onClick={handleImport} className="px-4 py-2 bg-[#0F5B55] hover:bg-[#08463F] text-white text-[13px] font-semibold rounded-[8px] flex items-center gap-2"><Upload className="w-4 h-4" /> Import {mappedRows.length} Line(s)</button>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
