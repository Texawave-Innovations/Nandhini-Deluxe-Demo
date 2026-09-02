// One-off generator for the client-facing AI Roadmap PDF (public/nandhini-ai-roadmap.pdf).
// Not part of the running app — run manually (`npx tsx scripts/generate-ai-roadmap-pdf.ts`)
// whenever constants/aiRoadmap.ts changes, then convert the HTML it writes with headless Chrome:
//
//   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
//     --print-to-pdf=public/nandhini-ai-roadmap.pdf --no-pdf-header-footer \
//     docs/ai-roadmap-print-source.html
//
// Kept as a real .html file in docs/ (outside src/, so it never ships in the Next.js bundle) so
// the PDF can be regenerated later without re-deriving the layout.

import * as fs from 'fs';
import * as path from 'path';
import { AI_ROADMAP_ITEMS, AIRoadmapStatus } from '../src/constants/aiRoadmap';

const STATUS_META: Record<AIRoadmapStatus, { label: string; color: string; bg: string }> = {
  LIVE: { label: 'LIVE IN THIS DEMO', color: '#23865B', bg: '#E1F0E7' },
  NEXT: { label: 'READY TO BUILD NEXT', color: '#3377A8', bg: '#E4EEF5' },
  ROADMAP: { label: 'ON THE ROADMAP', color: '#66706B', bg: '#F3F0E9' },
};

const areas = Array.from(new Set(AI_ROADMAP_ITEMS.map((i) => i.area)));
const liveCount = AI_ROADMAP_ITEMS.filter((i) => i.status === 'LIVE').length;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const cardHtml = (item: (typeof AI_ROADMAP_ITEMS)[number]) => {
  const meta = STATUS_META[item.status];
  return `
    <div class="card">
      <div class="card-top">
        <div class="card-title">${esc(item.title)}</div>
        <div class="chip" style="color:${meta.color};background:${meta.bg}">${meta.label}</div>
      </div>
      <p class="card-what">${esc(item.what)}</p>
      <p class="card-field"><span class="k">How</span>${esc(item.how)}</p>
      <p class="card-field"><span class="k">Value</span>${esc(item.value)}</p>
    </div>`;
};

const sectionHtml = (area: string) => `
    <section>
      <h2>${esc(area)}</h2>
      <div class="grid">
        ${AI_ROADMAP_ITEMS.filter((i) => i.area === area).map(cardHtml).join('\n')}
      </div>
    </section>`;

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Nandhini Deluxe — AI Roadmap</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;500;600;700&display=swap">
<style>
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Inter', system-ui, sans-serif; color: #202522; background: #FFFFFF; font-size: 10.5px; line-height: 1.45; }
  header { border-bottom: 2px solid #0F5B55; padding-bottom: 10px; margin-bottom: 16px; }
  .eyebrow { font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #C59A45; margin: 0 0 4px; }
  h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 700; font-size: 26px; margin: 0 0 6px; color: #0F5B55; }
  .sub { font-size: 11px; color: #66706B; margin: 0; max-width: 90%; }
  section { break-inside: auto; margin-bottom: 12px; }
  h2 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 15px; font-weight: 700; color: #0F5B55; border-bottom: 1px solid #E5E2DB; padding-bottom: 3px; margin: 0 0 8px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .card { border: 1px solid #E5E2DB; border-radius: 6px; padding: 8px 10px; break-inside: avoid; }
  .card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 6px; margin-bottom: 4px; }
  .card-title { font-weight: 700; font-size: 10.5px; line-height: 1.25; }
  .chip { font-size: 7px; font-weight: 700; letter-spacing: 0.04em; padding: 2px 6px; border-radius: 100px; white-space: nowrap; flex-shrink: 0; }
  .card-what { margin: 0 0 4px; color: #202522; }
  .card-field { margin: 0 0 2px; color: #66706B; }
  .card-field .k { font-weight: 700; color: #202522; text-transform: uppercase; font-size: 8px; letter-spacing: 0.05em; margin-right: 4px; }
  footer { margin-top: 14px; padding-top: 8px; border-top: 1px solid #E5E2DB; font-size: 8.5px; color: #66706B; }
</style>
</head>
<body>
  <header>
    <p class="eyebrow">Intelligence Roadmap</p>
    <h1>Nandhini Deluxe — AI Roadmap</h1>
    <p class="sub">${liveCount} of ${AI_ROADMAP_ITEMS.length} ideas below are already live in this demo, computed from real data the same way every other module works — the rest is exactly what we can build next, each scoped to the screen and data it extends.</p>
  </header>
  ${areas.map(sectionHtml).join('\n')}
  <footer>Every "live" item is a deterministic, rule-based computation over this demo's own data — not a hosted AI model — the same honesty convention the rest of the platform already uses.</footer>
</body>
</html>`;

const outDir = path.join(__dirname, '..', 'docs');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'ai-roadmap-print-source.html');
fs.writeFileSync(outPath, html, 'utf-8');
console.log(`Wrote ${outPath}`);
