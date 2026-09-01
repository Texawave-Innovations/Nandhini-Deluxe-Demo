// Demo-data reset for AI Insights: regenerates Vendor + Inventory (stock ledger/batches) seed
// data and, by default, only PREVIEWS it — nothing is written to Firebase unless you pass
// --apply. Scoped deliberately narrow: `erp/vendors/vendors`, `erp/inventory/ledgerEntries` and
// `erp/inventory/batches` are the only paths touched. Everything else — POS, Purchase, Finance
// (vendor bills/payments), Reconciliation, Tally, Sales, Hotel, Banquet, and all HR/Attendance
// data (a completely separate `hr/*` Firebase namespace, see hrms-store.ts) — is left alone,
// because Vendor and Inventory Item IDs are stable across a reseed (see vendor.seed.ts /
// inventory.seed.ts), so nothing that references them by ID is orphaned by this reset.
//
// Usage:
//   npm run seed          -- dry run: prints what would change, touches nothing
//   npm run seed:apply    -- writes the regenerated data to Firebase
//
// Run before a demo to clear out whatever ad-hoc stock/vendor state accumulated from prior
// testing and restore the rich, AI-Insights-friendly baseline (multiple org-wide low-stock
// items, multiple consumption-anomaly outlets, broader vendor overdue coverage) that
// inventory.seed.ts / purchase.seed.ts / finance.seed.ts now generate.

import * as dotenv from 'dotenv';
dotenv.config();

import { INITIAL_LOCATIONS } from '../src/mock-data/seed';
import { generateOpeningStock, INITIAL_INVENTORY_ITEMS } from '../src/mock-data/inventory.seed';
import { INITIAL_VENDORS } from '../src/mock-data/vendor.seed';
import { aiInsightsService } from '../src/services/aiInsightsService';

const APPLY = process.argv.includes('--apply');
const AS_OF_DATE = '2026-08-30';

async function main() {
  console.log(`\n${'='.repeat(60)}\nNandhini Deluxe ERP — AI Insights demo-data seed\n${'='.repeat(60)}\n`);

  const { ledgerEntries, batches } = generateOpeningStock(INITIAL_LOCATIONS);

  console.log(`Vendors:        ${INITIAL_VENDORS.length}`);
  console.log(`Ledger entries: ${ledgerEntries.length}`);
  console.log(`Stock batches:  ${batches.length}`);

  const reorders = aiInsightsService.suggestReorders(INITIAL_INVENTORY_ITEMS, ledgerEntries);
  console.log(`\nInventory reorder alerts this will produce (${reorders.length}):`);
  reorders.forEach((r) => console.log(`  [${r.severity}] ${r.title} — ${r.description}`));

  const anomalies = aiInsightsService.detectConsumptionAnomalies(ledgerEntries, INITIAL_INVENTORY_ITEMS, INITIAL_LOCATIONS, AS_OF_DATE);
  console.log(`\nConsumption-anomaly alerts this will produce (${anomalies.length}):`);
  anomalies.forEach((a) => console.log(`  [${a.severity}] ${a.title} — ${a.description}`));

  if (!APPLY) {
    console.log(`\n${'-'.repeat(60)}`);
    console.log('DRY RUN — nothing written. Vendor risk / customer risk / settlement / revenue');
    console.log('insights are unaffected by this script and already read live Firebase data.');
    console.log('\nRun `npm run seed:apply` to write this to Firebase (erp/vendors/vendors,');
    console.log('erp/inventory/ledgerEntries, erp/inventory/batches only).');
    return;
  }

  console.log(`\n${'-'.repeat(60)}`);
  console.log('Writing to Firebase...');

  // Imported lazily so a dry run never even initializes the Firebase connection.
  const { db } = await import('../src/services/firebase');
  const { ref, set, goOffline } = await import('firebase/database');

  await set(ref(db, 'erp/vendors/vendors'), INITIAL_VENDORS);
  console.log('  ✓ erp/vendors/vendors');
  await set(ref(db, 'erp/inventory/ledgerEntries'), ledgerEntries);
  console.log('  ✓ erp/inventory/ledgerEntries');
  await set(ref(db, 'erp/inventory/batches'), batches);
  console.log('  ✓ erp/inventory/batches');

  console.log('\nDone. Open the app (any page) to see AI Insights populated.');
  goOffline(db);
}

// Firebase's RTDB client SDK holds the Node process open via its persistent connection even
// after every write resolves — force-exit once main() settles, with a hard timeout as a
// safety net in case the connection doesn't close cleanly in a given environment.
main()
  .then(() => setTimeout(() => process.exit(0), 300))
  .catch((err) => {
    console.error('\nSeed script failed:', err);
    process.exit(1);
  });
// Force-exit safety net: Firebase's RTDB client SDK can keep the Node process alive on its own
// even after goOffline(), in some environments — this guarantees the script always returns
// control to the terminal.
setTimeout(() => process.exit(1), 20000);
