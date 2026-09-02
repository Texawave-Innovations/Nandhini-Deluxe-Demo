// Client-facing "what AI can do here" catalogue — same idiom as MODULE_NAV in navigation.ts:
// plain typed data, no logic. Feeds both AIRoadmapModal.tsx (in-app) and the printed PDF at
// public/nandhini-ai-roadmap.pdf. `status` tracks build reality, not ambition:
//   LIVE     — shipped in this demo right now (Tier 1 AI Insights + the invoice-scan flagship)
//   NEXT     — buildable behind one LLM/vision integration, no new dataset required
//   ROADMAP  — needs a new dataset or a heavier build (a real optimizer, live object counting)
// Keep this in sync with aiInsightsService.ts / purchaseService.simulateInvoiceScan when either
// changes — this file is presentation only and does not affect app behavior.

export type AIRoadmapStatus = 'LIVE' | 'NEXT' | 'ROADMAP';

export interface AIRoadmapItem {
  id: string;
  area: string;
  title: string;
  what: string;
  how: string;
  value: string;
  status: AIRoadmapStatus;
}

export const AI_ROADMAP_ITEMS: AIRoadmapItem[] = [
  // --- Flagship ---
  {
    id: 'invoice-ocr',
    area: 'Purchase & Finance',
    title: 'Invoice Scan → GRN → 3-Way Match',
    what: 'Photograph a vendor invoice at GRN entry; it auto-fills the receipt and the existing 3-way match engine catches the rest.',
    how: 'A vision model reads the invoice into structured line items; each field carries a confidence score, so low-confidence lines are flagged for a human glance rather than trusted silently.',
    value: 'Cuts GRN entry from ~10 minutes to under one, and catches short-deliveries or rate drift the moment the invoice is scanned.',
    status: 'LIVE',
  },
  // --- Front of House ---
  {
    id: 'cashier-anomaly',
    area: 'Front of House',
    title: 'Discount & Void Watch',
    what: 'Flags a cashier or outlet whose complimentary bills and discounts run well above their peers.',
    how: 'Statistical comparison of each cashier\'s concession rate against their outlet\'s own average, over a trailing 14-day window.',
    value: 'Surfaces a billing-integrity issue before it becomes a quarter-end surprise.',
    status: 'LIVE',
  },
  {
    id: 'cross-sell',
    area: 'Front of House',
    title: 'Billing-Time Upsell Prompts',
    what: 'Identifies a popular item that rarely gets paired with another popular item, as a concrete bundle suggestion.',
    how: 'Market-basket co-occurrence analysis over recent orders — the same technique behind "customers who bought this also bought."',
    value: 'A specific, testable combo idea to lift average ticket, not a generic upsell tip.',
    status: 'LIVE',
  },
  {
    id: 'order-chit-ocr',
    area: 'Front of House',
    title: 'Order-Chit Recognition',
    what: 'A captain\'s handwritten table chit, photographed at the counter, becomes a punched POS order.',
    how: 'Vision-LLM reads handwriting against the live Menu Master and resolves item names by fuzzy match.',
    value: 'No re-typing item names under pressure during a rush.',
    status: 'NEXT',
  },
  {
    id: 'review-triage',
    area: 'Front of House',
    title: 'Aggregator Review Triage',
    what: 'Swiggy/Zomato reviews auto-sorted into food, delivery, or service complaints and routed to the right outlet manager.',
    how: 'Sentiment and topic classification (NLP) over review text — needs a review dataset the app doesn\'t ingest today, only settlement amounts.',
    value: 'The angriest complaints reach a manager first, not buried in a star-rating average.',
    status: 'ROADMAP',
  },
  // --- Kitchen & Inventory ---
  {
    id: 'trending-reorder',
    area: 'Kitchen & Inventory',
    title: 'Demand-Aware Reordering',
    what: 'Catches an item that\'s still above its static reorder level but trending toward a stockout — the case a fixed threshold misses.',
    how: 'Recent consumption trend converted into "days of cover" against current stock, layered on top of the existing reorder-level rule.',
    value: 'A purchase order goes out before the shelf actually empties, not after.',
    status: 'LIVE',
  },
  {
    id: 'expiry-radar',
    area: 'Kitchen & Inventory',
    title: 'Expiry & Waste Radar',
    what: 'Flags a batch drifting toward expiry early enough to push it into a special, a staff meal, or a transfer.',
    how: 'Forward-looking scan of batch expiry dates already captured at GRN — distinct from the existing wastage report, which only looks backward at what\'s already been thrown out.',
    value: 'Fewer write-offs, caught while the stock is still usable.',
    status: 'LIVE',
  },
  {
    id: 'camera-stock-count',
    area: 'Kitchen & Inventory',
    title: 'Camera Stock Count',
    what: 'Walk the store room, photograph each shelf; the count reconciles against what the ledger expects.',
    how: 'Computer-vision object counting per SKU — genuinely harder than invoice OCR, since a cluttered shelf is a much noisier scene than a printed line item.',
    value: 'A physical audit in minutes rather than a clipboard afternoon — worth prototyping, but flagged honestly as lower-fidelity than the other vision use cases.',
    status: 'ROADMAP',
  },
  // --- Purchase & Finance ---
  {
    id: 'vendor-bill-anomaly',
    area: 'Purchase & Finance',
    title: 'Duplicate & Price-Creep Watch',
    what: 'Catches a vendor invoice submitted twice, or a rate that has crept up across bills without a renegotiated PO.',
    how: 'Exact-match duplicate detection on vendor + invoice number, plus a rate-drift check per vendor+item across recent bills.',
    value: 'Two ways to overpay a vendor, caught automatically instead of by a sharp-eyed reviewer.',
    status: 'LIVE',
  },
  {
    id: 'cash-flow-gap',
    area: 'Purchase & Finance',
    title: 'Cash-Flow Gap Signal',
    what: 'Flags when near-term vendor bills outweigh near-term customer collections.',
    how: 'Nets the existing AP and AR aging-bucket calculations against each other — no new forecasting model, just the two ledgers read together.',
    value: 'A payables crunch seen a week early instead of discovered at payment time.',
    status: 'LIVE',
  },
  {
    id: 'match-explanation',
    area: 'Purchase & Finance',
    title: 'Plain-English Match Notes',
    what: 'Turns a bare "MISMATCH — ₹340 variance" into a written explanation of what likely happened and what to check.',
    how: 'An LLM narrates the existing 3-way match output — no new matching logic, just readable copy on top of it.',
    value: 'A finance exec can act on the mismatch without opening the line-by-line panel first.',
    status: 'NEXT',
  },
  // --- Sales & Guest Accounts ---
  {
    id: 'collections-assistant',
    area: 'Sales & Guest Accounts',
    title: 'Collections Assistant',
    what: 'Drafts the payment-reminder message for every overdue account, tone-matched to how overdue it is.',
    how: 'LLM drafting keyed off the existing AR aging bucket and customer risk ranking.',
    value: 'Ready-to-send reminders instead of a finance exec writing each one from scratch.',
    status: 'NEXT',
  },
  {
    id: 'quote-drafting',
    area: 'Sales & Guest Accounts',
    title: 'Quote & Proposal Drafting',
    what: 'Guest count, occasion, and budget in — a formatted catering proposal out.',
    how: 'LLM generation grounded in the Menu Master and historical pricing for similar orders.',
    value: 'A same-call proposal instead of a follow-up email days later.',
    status: 'NEXT',
  },
  // --- Hotel Front Desk ---
  {
    id: 'room-rate-advisor',
    area: 'Hotel Front Desk',
    title: 'Dynamic Rate Advisor',
    what: 'Suggests a rate bump when the next few days are trending toward a sellout, or a promo when occupancy is running low.',
    how: 'Near-term booked-room-nights compared against total room-nights available per outlet.',
    value: 'A revenue-manager habit, applied automatically at outlets too small to have one.',
    status: 'LIVE',
  },
  {
    id: 'guest-personalization',
    area: 'Hotel Front Desk',
    title: 'Guest Memory Upsell',
    what: 'A returning guest checked in today gets flagged with what they actually ordered last stay.',
    how: 'Matches the current guest\'s phone number against past reservations, then reads their last stay\'s folio for a concrete room-service history.',
    value: 'A proactive "the usual?" instead of a generic greeting.',
    status: 'LIVE',
  },
  {
    id: 'no-show-risk',
    area: 'Hotel Front Desk',
    title: 'No-Show Risk Flag',
    what: 'Flags a reservation still marked BOOKED on or after its own check-in date.',
    how: 'A direct read of reservation status against the business date — the actual moment a no-show becomes real, not a speculative prediction.',
    value: 'A room released or a guest called before the night is lost to an empty booking.',
    status: 'LIVE',
  },
  // --- Banquet & Events ---
  {
    id: 'banquet-demand-gap',
    area: 'Banquet & Events',
    title: 'Hall Demand Heatmap',
    what: 'Flags a hall with zero confirmed bookings in the next two weeks.',
    how: 'A direct scan of upcoming CONFIRMED bookings per hall against the calendar.',
    value: 'Time to run a promotion before the date is a guaranteed empty hall, not after.',
    status: 'LIVE',
  },
  {
    id: 'banquet-quote',
    area: 'Banquet & Events',
    title: 'Instant Banquet Quote',
    what: 'Hall, date, guest count, and budget in — a package quote with menu suggestions out.',
    how: 'LLM generation grounded in hall capacity, past booking rates, and the Menu Master.',
    value: 'A same-conversation quote instead of a callback the next day.',
    status: 'NEXT',
  },
  // --- Workforce (HRMS) ---
  {
    id: 'attendance-pattern',
    area: 'Workforce (HRMS)',
    title: 'Attendance Pattern Watch',
    what: 'Flags an employee whose late arrivals or unplanned absences have piled up over the last month.',
    how: 'Trailing 30-day count of LATE/ABSENT attendance statuses per employee against a threshold.',
    value: 'A manager conversation happens while it\'s still a pattern, not after it becomes a habit.',
    status: 'LIVE',
  },
  {
    id: 'resume-screening',
    area: 'Workforce (HRMS)',
    title: 'Resume Screening & Ranking',
    what: 'A stack of applications for an open role becomes a ranked shortlist with the reasoning shown.',
    how: 'Resume parsing plus skill/requirement matching against the role — needs a resume-upload field the ATS doesn\'t capture today.',
    value: 'Hours of first-pass screening compressed into a ranked list.',
    status: 'NEXT',
  },
  {
    id: 'smart-roster',
    area: 'Workforce (HRMS)',
    title: 'Smart Roster Builder',
    what: 'Builds next month\'s shift roster balancing labor cost, expected footfall, and weekly-off preferences.',
    how: 'A real constraint-based schedule optimizer — genuine optimization engineering, not a quick add, replacing today\'s deterministic seed generator.',
    value: 'The single biggest time sink in outlet management, automated — but scoped honestly as the heaviest build on this list.',
    status: 'ROADMAP',
  },
  // --- Executive Intelligence ---
  {
    id: 'outlet-benchmark',
    area: 'Executive Intelligence',
    title: 'Peer-Outlet Benchmarking',
    what: 'Flags the one outlet trailing its peers on trailing revenue by a meaningful margin.',
    how: 'Reuses the existing outlet-comparison report, adding a peer-median deviation check on top.',
    value: 'The comparison a regional manager doesn\'t have time to run by hand every week.',
    status: 'LIVE',
  },
  {
    id: 'ask-your-data',
    area: 'Executive Intelligence',
    title: 'Ask-Your-Data Assistant',
    what: 'The existing chat widget upgraded from keyword matching to real questions answered in real language.',
    how: 'LLM function-calling over the Reports & Analytics service and live store data, with drill-down links back into the app.',
    value: '"Which outlet\'s margin dropped last week, and why?" — answered, not just routed to a report.',
    status: 'NEXT',
  },
  {
    id: 'daily-digest',
    area: 'Executive Intelligence',
    title: 'Auto-Narrated Daily Digest',
    what: 'Every outlet manager gets three sentences on yesterday: sales vs. target, one thing to fix, one thing going well.',
    how: 'LLM narrative generation over the existing dashboard KPI computation; the text is a straightforward build, sending it out by WhatsApp/email is a further step needing a messaging integration.',
    value: 'A daily brief that\'s actually read, instead of a dashboard that has to be opened.',
    status: 'NEXT',
  },
];
