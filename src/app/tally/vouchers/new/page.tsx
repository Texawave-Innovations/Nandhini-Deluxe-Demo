'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ShellLayout from '@/components/layout/ShellLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import { ArrowLeft, Plus, Trash2, CheckCircle2, AlertCircle, Paperclip, ScanLine, X } from 'lucide-react';
import { useLedgerStore } from '@/store/ledger-store';
import { useVendorStore } from '@/store/vendor-store';
import { LedgerAccount, VoucherType } from '@/types/ledger';
import { ocrService, OCRBillExtraction } from '@/services/ocrService';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const round2 = (n: number) => Math.round(n * 100) / 100;

// Manual entry only supports the classic bookkeeping voucher types — Purchase Bill / Sales
// Invoice are always system-derived from a VendorBill/SalesInvoice, never entered by hand here.
const MANUAL_VOUCHER_TYPES: VoucherType[] = ['PAYMENT', 'RECEIPT', 'JOURNAL', 'CONTRA', 'DEBIT_NOTE', 'CREDIT_NOTE'];
const VOUCHER_TYPE_LABEL: Record<VoucherType, string> = {
  PAYMENT: 'Payment', RECEIPT: 'Receipt', JOURNAL: 'Journal', CONTRA: 'Contra',
  DEBIT_NOTE: 'Debit Note', CREDIT_NOTE: 'Credit Note', PURCHASE_BILL: 'Purchase Bill', SALES_INVOICE: 'Sales Invoice',
};

interface LineDraft {
  key: string;
  ledgerAccountId: string;
  drCr: 'DEBIT' | 'CREDIT';
  amount: string;
  particulars: string;
}

function emptyLine(drCr: 'DEBIT' | 'CREDIT'): LineDraft {
  return { key: `${Date.now()}-${Math.random()}`, ledgerAccountId: '', drCr, amount: '', particulars: '' };
}

function LedgerAccountPicker({ accounts, value, onChange }: { accounts: LedgerAccount[]; value: string; onChange: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const selected = accounts.find((a) => a.id === value);
  const filtered = (query
    ? accounts.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()) || a.code.toLowerCase().includes(query.toLowerCase()))
    : accounts
  ).slice(0, 50);

  return (
    <div className="relative">
      <input
        type="text"
        value={open ? query : (selected ? selected.name : '')}
        onFocus={() => { setOpen(true); setQuery(''); }}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search ledger account…"
        className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]"
      />
      {open && (
        <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-[#E5E2DB] rounded-lg shadow-lg">
          {filtered.length === 0 && <div className="px-3 py-2 text-[12px] text-[#66706B]">No matches.</div>}
          {filtered.map((a) => (
            <button
              key={a.id} type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(a.id); setOpen(false); setQuery(''); }}
              className="w-full text-left px-3 py-2 text-[13px] hover:bg-[#F3F0E9] flex items-center justify-between gap-2"
            >
              <span className="truncate">{a.name}</span>
              <span className="text-[11px] text-[#66706B] shrink-0">{a.accountType}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OcrFieldInput({ label, confidence, value, onChange, type = 'text' }: { label: string; confidence: number; value: string; onChange: (v: string) => void; type?: 'text' | 'number' | 'date' }) {
  const tone = confidence >= 85 ? 'text-[#23865B]' : confidence >= 60 ? 'text-[#C68A28]' : 'text-[#C94B45]';
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[11px] font-semibold text-[#66706B]">{label}</label>
        <span className={`text-[10px] font-semibold ${tone}`}>{confidence}%</span>
      </div>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-2.5 py-1.5 text-[13px] bg-white" />
    </div>
  );
}

export default function NewVoucherPage() {
  return (
    <Suspense fallback={null}>
      <NewVoucherForm />
    </Suspense>
  );
}

function NewVoucherForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('draftId');
  const { vouchers, ledgerAccounts, createManualVoucher, updateDraftVoucher, postVoucher } = useLedgerStore();
  const { vendors } = useVendorStore();

  const [voucherType, setVoucherType] = useState<VoucherType>('JOURNAL');
  const [voucherDate, setVoucherDate] = useState(new Date().toISOString().slice(0, 10));
  const [narration, setNarration] = useState('');
  const [lines, setLines] = useState<LineDraft[]>([emptyLine('DEBIT'), emptyLine('CREDIT')]);
  const [attachmentName, setAttachmentName] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  // OCR bill capture (mock — see ocrService.ts): scanning only ever produces a suggestion held
  // in this local state; nothing is written to the voucher until the accountant reviews/edits it
  // here and explicitly clicks "Apply to Voucher" below, and even then Save/Post is still a
  // separate, later, explicit step. OCR can never post a voucher on its own.
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRBillExtraction | null>(null);
  const [ocrEdited, setOcrEdited] = useState<{ vendorName: string; amount: string; billDate: string; gstin: string } | null>(null);

  // Pre-fill from an existing DRAFT when editing (?draftId=...) — Posted vouchers never reach
  // this form since Vouchers page only links "Edit Draft" for status === 'DRAFT'.
  useEffect(() => {
    if (!draftId) return;
    const draft = vouchers.find((v) => v.id === draftId && v.status === 'DRAFT');
    if (!draft) return;
    setVoucherType(draft.voucherType);
    setVoucherDate(draft.voucherDate);
    setNarration(draft.narration);
    setAttachmentName(draft.attachmentName);
    setLines(draft.lines.map((l) => ({ key: `${l.ledgerAccountId}-${Math.random()}`, ledgerAccountId: l.ledgerAccountId, drCr: l.drCr, amount: String(l.amount), particulars: l.particulars })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId, vouchers.length]);

  const totalDebit = round2(lines.filter((l) => l.drCr === 'DEBIT').reduce((s, l) => s + (parseFloat(l.amount) || 0), 0));
  const totalCredit = round2(lines.filter((l) => l.drCr === 'CREDIT').reduce((s, l) => s + (parseFloat(l.amount) || 0), 0));
  const difference = round2(totalDebit - totalCredit);
  const balanced = difference === 0 && totalDebit > 0;

  const updateLine = (key: string, patch: Partial<LineDraft>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const removeLine = (key: string) => setLines((ls) => ls.length > 2 ? ls.filter((l) => l.key !== key) : ls);
  const addLine = () => setLines((ls) => [...ls, emptyLine('DEBIT')]);

  const runOcrScan = () => {
    if (!attachmentName) return;
    setOcrScanning(true);
    setOcrResult(null);
    // Simulated scan latency — this is a mock extraction (ocrService.ts), not a real OCR call.
    setTimeout(() => {
      const result = ocrService.scanBillImage(attachmentName, vendors, voucherDate);
      setOcrResult(result);
      setOcrEdited({ vendorName: result.vendorName.value, amount: String(result.amount.value), billDate: result.billDate.value, gstin: result.gstin.value });
      setOcrScanning(false);
    }, 700);
  };

  const applyOcrResult = () => {
    if (!ocrResult || !ocrEdited) return;
    setVoucherDate(ocrEdited.billDate);
    if (!narration.trim()) {
      setNarration(`Bill from ${ocrEdited.vendorName} (GSTIN ${ocrEdited.gstin}) — OCR extracted, ${ocrResult.overallConfidencePercent}% confidence, reviewed by accountant`);
    }
    const amount = parseFloat(ocrEdited.amount) || 0;
    const vendorAccount = ocrResult.matchedVendorId ? ledgerAccounts.find((a) => a.vendorId === ocrResult.matchedVendorId) : undefined;
    const purchasesAccount = ledgerAccounts.find((a) => a.code === 'LAC-EXP-PURCHASE');
    if (vendorAccount && purchasesAccount && amount > 0) {
      setLines([
        { key: `ocr-dr-${Date.now()}`, ledgerAccountId: purchasesAccount.id, drCr: 'DEBIT', amount: String(amount), particulars: `Purchases per scanned bill (${attachmentName})` },
        { key: `ocr-cr-${Date.now() + 1}`, ledgerAccountId: vendorAccount.id, drCr: 'CREDIT', amount: String(amount), particulars: `Bill from ${ocrEdited.vendorName}` },
      ]);
    }
    setOcrResult(null);
    setOcrEdited(null);
  };

  function toLedgerEntries() {
    const complete = lines.filter((l) => l.ledgerAccountId && parseFloat(l.amount) > 0);
    return complete.map((l) => ({ ledgerAccountId: l.ledgerAccountId, drCr: l.drCr, amount: round2(parseFloat(l.amount)), particulars: l.particulars || narration }));
  }

  function handleSave(post: boolean) {
    setError(undefined);
    const entries = toLedgerEntries();
    if (entries.length < 2) { setError('Add at least 2 complete lines (ledger account + amount) before saving.'); return; }
    if (!narration.trim()) { setError('Narration is required.'); return; }

    if (draftId) {
      const res = updateDraftVoucher(draftId, { voucherType, voucherDate, narration, lines: entries, attachmentName });
      if (!res.ok) { setError(res.error); return; }
      if (post) {
        const postRes = postVoucher(draftId, 'Finance Executive');
        if (!postRes.ok) { setError(postRes.error); return; }
      }
      router.push('/tally/vouchers');
      return;
    }

    const voucher = createManualVoucher({ voucherType, voucherDate, narration, lines: entries, attachmentName, createdBy: 'Finance Executive' });
    if (post) {
      const postRes = postVoucher(voucher.id, 'Finance Executive');
      if (!postRes.ok) { setError(postRes.error); return; }
    }
    router.push('/tally/vouchers');
  }

  return (
    <ShellLayout>
      <div className="space-y-5 max-w-3xl">
        <button onClick={() => router.push('/tally/vouchers')} className="flex items-center gap-1.5 text-[13px] text-[#66706B] hover:text-[#202522]"><ArrowLeft className="w-4 h-4" /> Back to Vouchers</button>
        <SectionHeader title={draftId ? 'Edit Draft Voucher' : 'New Voucher'} subtitle="Saved as Draft until posted. Once posted, a voucher is immutable — corrections require a Reversal entry." />

        {error && <div className="flex items-center gap-2 text-[13px] text-[#C94B45] bg-[#C94B45]/5 border border-[#C94B45]/30 rounded-lg px-3 py-2"><AlertCircle className="w-4 h-4 shrink-0" /> {error}</div>}

        <div className="bg-white border border-[#E5E2DB] rounded-[10px] p-5 shadow-brand-xs space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Voucher Type</label>
              <select value={voucherType} onChange={(e) => setVoucherType(e.target.value as VoucherType)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]">
                {MANUAL_VOUCHER_TYPES.map((t) => <option key={t} value={t}>{VOUCHER_TYPE_LABEL[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Date</label>
              <input type="date" value={voucherDate} onChange={(e) => setVoucherDate(e.target.value)} className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
            </div>
          </div>

          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Narration</label>
            <textarea value={narration} onChange={(e) => setNarration(e.target.value)} rows={2} placeholder="e.g. Being electricity bill paid for August" className="w-full border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
          </div>

          <div>
            <label className="text-[12px] font-semibold text-[#66706B] block mb-1">Attach Bill <span className="font-normal text-[#66706B]">(file is not actually uploaded — a demo placeholder for the underlying document)</span></label>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="file"
                onChange={(e) => { setAttachmentName(e.target.files?.[0]?.name); setOcrResult(null); setOcrEdited(null); }}
                className="text-[12px] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-[#E5E2DB] file:bg-white file:text-[12px] file:font-semibold"
              />
              {attachmentName && <span className="text-[12px] text-[#66706B] flex items-center gap-1"><Paperclip className="w-3.5 h-3.5" /> {attachmentName}</span>}
              {attachmentName && (
                <button onClick={runOcrScan} disabled={ocrScanning} className="h-8 px-3 bg-[#3377A8] hover:bg-[#2A6288] disabled:opacity-50 text-white text-[12px] font-semibold rounded-lg flex items-center gap-1.5">
                  <ScanLine className="w-3.5 h-3.5" /> {ocrScanning ? 'Scanning…' : 'Scan Bill (OCR)'}
                </button>
              )}
            </div>

            {ocrResult && ocrEdited && (
              <div className="mt-3 border border-[#3377A8]/30 bg-[#3377A8]/5 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[12px] font-semibold text-[#202522]">OCR Extraction — review and edit before applying</div>
                  <div className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${ocrResult.overallConfidencePercent >= 85 ? 'bg-[#23865B]/10 text-[#23865B]' : ocrResult.overallConfidencePercent >= 60 ? 'bg-[#C68A28]/10 text-[#C68A28]' : 'bg-[#C94B45]/10 text-[#C94B45]'}`}>
                    Overall confidence {ocrResult.overallConfidencePercent}%
                  </div>
                </div>
                {ocrResult.overallConfidencePercent < 60 && (
                  <div className="flex items-center gap-1.5 text-[11px] text-[#C94B45]"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> Low confidence — verify every field carefully before applying.</div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <OcrFieldInput label="Vendor" confidence={ocrResult.vendorName.confidencePercent} value={ocrEdited.vendorName} onChange={(v) => setOcrEdited((s) => s && { ...s, vendorName: v })} />
                  <OcrFieldInput label="Amount" confidence={ocrResult.amount.confidencePercent} value={ocrEdited.amount} onChange={(v) => setOcrEdited((s) => s && { ...s, amount: v })} type="number" />
                  <OcrFieldInput label="Bill Date" confidence={ocrResult.billDate.confidencePercent} value={ocrEdited.billDate} onChange={(v) => setOcrEdited((s) => s && { ...s, billDate: v })} type="date" />
                  <OcrFieldInput label="GSTIN" confidence={ocrResult.gstin.confidencePercent} value={ocrEdited.gstin} onChange={(v) => setOcrEdited((s) => s && { ...s, gstin: v })} />
                </div>
                {!ocrResult.matchedVendorId && (
                  <div className="text-[11px] text-[#66706B]">Vendor name didn&apos;t match an existing ledger account — date/narration will still be applied, but you&apos;ll need to pick the ledger lines manually.</div>
                )}
                <div className="flex items-center gap-2">
                  <button onClick={applyOcrResult} className="h-9 px-3 bg-[#0F5B55] hover:bg-[#08463F] text-white text-[12px] font-semibold rounded-lg flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Apply to Voucher</button>
                  <button onClick={() => { setOcrResult(null); setOcrEdited(null); }} className="h-9 px-3 border border-[#E5E2DB] text-[#66706B] text-[12px] font-semibold rounded-lg flex items-center gap-1.5"><X className="w-3.5 h-3.5" /> Discard</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-[#E5E2DB] rounded-[10px] p-5 shadow-brand-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-[#202522]">Ledger Entries</h3>
            <button onClick={addLine} className="text-[12px] font-semibold text-[#0F5B55] flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add Line</button>
          </div>

          <div className="space-y-2">
            {lines.map((l) => (
              <div key={l.key} className="grid grid-cols-[1fr_90px_120px_1fr_28px] gap-2 items-start">
                <LedgerAccountPicker accounts={ledgerAccounts} value={l.ledgerAccountId} onChange={(id) => updateLine(l.key, { ledgerAccountId: id })} />
                <select value={l.drCr} onChange={(e) => updateLine(l.key, { drCr: e.target.value as 'DEBIT' | 'CREDIT' })} className="border border-[#E5E2DB] rounded-lg px-2 py-2 text-[13px]">
                  <option value="DEBIT">Dr</option>
                  <option value="CREDIT">Cr</option>
                </select>
                <input type="number" min="0" step="0.01" value={l.amount} onChange={(e) => updateLine(l.key, { amount: e.target.value })} placeholder="Amount" className="border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
                <input type="text" value={l.particulars} onChange={(e) => updateLine(l.key, { particulars: e.target.value })} placeholder="Particulars (optional)" className="border border-[#E5E2DB] rounded-lg px-3 py-2 text-[13px]" />
                <button onClick={() => removeLine(l.key)} disabled={lines.length <= 2} className="h-9 flex items-center justify-center text-[#66706B] hover:text-[#C94B45] disabled:opacity-30"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-6 pt-3 border-t border-[#E5E2DB] text-[13px]">
            <div>Total Debit: <span className="font-semibold text-[#202522]">{inr(totalDebit)}</span></div>
            <div>Total Credit: <span className="font-semibold text-[#202522]">{inr(totalCredit)}</span></div>
            <div className={`flex items-center gap-1.5 font-semibold ${balanced ? 'text-[#23865B]' : 'text-[#C94B45]'}`}>
              {balanced ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {balanced ? 'Balanced' : `Difference: ${inr(Math.abs(difference))}`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => handleSave(false)} className="h-10 px-4 bg-white border border-[#E5E2DB] hover:border-[#0F5B55] text-[#202522] font-semibold text-[13px] rounded-[8px]">Save as Draft</button>
          <button onClick={() => handleSave(true)} disabled={!balanced} className="h-10 px-4 bg-[#0F5B55] hover:bg-[#08463F] disabled:opacity-40 text-white font-semibold text-[13px] rounded-[8px]">Save &amp; Post</button>
        </div>
      </div>
    </ShellLayout>
  );
}
