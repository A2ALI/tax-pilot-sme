# Nigeria Retail Tax Pilot (2026) — Technical & Legal Breakdown

> A production-grade, offline-first Progressive Web App engineered for Nigerian SME traders.
> Built to survive aggressive mobile cache clearing, zero-connectivity market environments, and real-world FIRS tax compliance for NTA 2025.

---

## 1. Technical Stack & The 'Why'

### Vite + React + TypeScript

| Technology | Reason |
|---|---|
| **Vite** | Millisecond HMR, native ESM, WASM file bundling with `?url` imports — critical for loading DuckDB's 30MB WASM binary without blocking the main thread |
| **React** | Component-level state subscriptions via Zustand mean only the impacted UI slice re-renders when a sale is recorded — not the entire ledger |
| **TypeScript** | Strict typing catches interface mismatches (e.g. `SalesLedgerItem extends InventoryItem`) at compile time, preventing runtime NaN bugs in tax calculations in production |

A traditional **Create React App** or **Next.js** approach was explicitly avoided. CRA is deprecated and bloated. Next.js introduces server-side infrastructure that is fundamentally incompatible with the offline-first, no-backend architecture required for a tool used in Alaba Market or Ariaria.

---

### DuckDB-Wasm: In-Browser Analytics Instead of a Backend

**The core architectural decision** of this project is that there is no server, no cloud database, and no API. DuckDB-Wasm runs the full analytical engine inside the browser's WebWorker thread.

**Why not Firebase / Supabase / PostgreSQL?**

| Problem with Backend DBs | How DuckDB-Wasm Solves It |
|---|---|
| Requires stable internet | Runs 100% offline in the browser |
| Monthly infrastructure cost | Zero hosting cost forever |
| Latency on slow Nigerian 3G connections | Sub-millisecond query execution (WASM runs in RAM) |
| Server data breaches | Trader's ledger never leaves their device |
| Backend scaling costs as user base grows | Each user's device is their own isolated server |

DuckDB in the browser can execute analytical SQL (`GROUP BY`, `SUM`, `WHERE category = 'General Goods'`) against thousands of sales records instantly because it compiles to native-speed WebAssembly, not interpreted JavaScript.

**Relevant configuration in `vite.config.ts`:**
```typescript
optimizeDeps: {
  exclude: ['@duckdb/duckdb-wasm'] // Prevent Vite from pre-bundling the WASM binary
}
```

This tells Vite not to pre-process DuckDB's binary — it is loaded as a raw URL and instantiated inside a WebWorker at runtime, which is the only valid way to run WASM in a browser without freezing the UI thread.

---

### The Hybrid Storage Strategy: Why Two Persistence Layers?

The app uses **two deliberately separate storage mechanisms** that solve two completely different failure modes.

#### Layer 1: Zustand + IndexedDB (via `idb-keyval`) — Metadata & All Business Data

**What it stores:** Business profile (`name`, `isRegistered`, `locationType`), onboarding step, active tab, inventory array, sales log, employees, operating costs.

**How it works (`store.ts`):**
```typescript
const idbStorage: StateStorage = {
  getItem: async (name) => (await get(name)) || null,
  setItem: async (name, value) => idbSet(name, value),
  removeItem: async (name) => del(name),
};

// Zustand persist middleware writes to IndexedDB on every state change
storage: createJSONStorage(() => idbStorage),
partialize: (state) => ({
  profile: state.profile,
  inventory: state.inventory,
  salesLog: state.salesLog,
  employees: state.employees,
  operatingCosts: state.operatingCosts
})
```

**Why IndexedDB over `localStorage`?** `localStorage` is capped at 5MB, synchronous (blocks the UI thread), and wiped first under OS storage pressure. IndexedDB is asynchronous, can hold gigabytes of structured data, and is far more resilient to browser cache-clearing than `localStorage`.

#### Layer 2: DuckDB-Wasm + OPFS — The Analytical Engine

**What it provides:** SQL-powered querying capability used for VAT calculations, CIT thresholds, and CSV export. The OPFS (Origin Private File System) layer was the original persistence target, but due to browser-level WebWorker threading constraints — specifically, OPFS Access Handles cannot be shared between two Worker instances during the same origin session — the primary persistence was delegated to IndexedDB (which has no such threading restriction). DuckDB remains active as the in-session query engine.

**The critical insight:** IndexedDB is the reliable "hard disk" for state. DuckDB is the "CPU" that runs complex queries. This separation means the app persists data independently of DuckDB's WASM thread lifecycle.

---

### Cross-Origin Isolation: Mandatory for OPFS and SharedArrayBuffer

DuckDB-Wasm at full speed requires access to `SharedArrayBuffer` for multi-threaded WASM execution. `SharedArrayBuffer` was disabled globally after the Spectre CPU vulnerability and is only re-enabled when a page declares **Cross-Origin Isolation**.

**Implementation — `public/_headers` (Netlify Production):**
```
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
```

**Implementation — `vite.config.ts` (Local Development):**
```typescript
server: {
  headers: {
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp",
  },
},
```

These two headers instruct the browser to:
1. **COOP (`same-origin`):** Isolate the browsing context so cross-origin windows cannot access the `window` object.
2. **COEP (`require-corp`):** Ensure all sub-resources declare they consent to being embedded.

When both headers are active, `crossOriginIsolated === true` in JavaScript, which unlocks `SharedArrayBuffer` and enables DuckDB's highest-performance execution bundle (`duckdb-eh.wasm` — the Exception Handling variant).

---

## 2. Legal Logic: NTA 2025 Implementation

### The ₦50 Million Small Company CIT Threshold

The Nigeria Finance Act 2019 (amended 2021, threshold reaffirmed in 2025 regulatory guidance) establishes that companies with annual gross turnover below **₦50,000,000** are fully exempt from Companies Income Tax (CIT).

**Implementation in `Dashboard.tsx`:**
```typescript
const totalRevenue = salesLog.reduce((acc, sale) => acc + sale.sellingPricePerUnit, 0);
const isSmallCompany = totalRevenue < 100000000;

let estimatedTax = 0;
if (!isSmallCompany) {
  // 30% CIT + 4% Education/Development Levy on Net Profit
  estimatedTax = Math.max(0, netProfit * 0.34);
}
```

The **34% combined rate** is composed of:
- **30% CIT** — The standard corporate income tax rate for medium/large companies
- **4% Development Levy** — The NITDA Education Tax (formally 2%, elevated to 4% in the 2023 Finance Act)

The `Math.max(0, netProfit * 0.34)` guard prevents the UI from displaying a negative tax liability if the business has made a net loss — negative tax is not remitted.

The Dashboard UI dynamically shows either:
- ✅ **"0% CIT (Turnover < ₦50M NTA 2025 rule)"** — green shield badge
- ⚠️ **"30% CIT + 4% Dev Levy Applied"** — red danger badge

---

### VAT Logic: Zero-Rated vs. Standard-Rated Items

**Nigerian VAT Law (Section 0 of VATA Cap V1 LFN 2004 and subsequent amendments)** specifies:

| Category | VAT Rate | Examples |
|---|---|---|
| Basic Food | 0% (Zero-rated) | Rice, Bread, Yam, Garri |
| Medicine & Books | 0% (Zero-rated) | Paracetamol, Textbooks |
| General Goods | 7.5% (Standard-rated) | Clothes, Electronics, Cosmetics |

**The critical legal nuance:** A small company (below ₦50M turnover) does NOT collect VAT on any item — including General Goods — because they are not required to register for VAT. Only VAT-registered businesses (which must register above the threshold) charge and remit VAT.

**Implementation in `store.ts` — `markAsSold()` function:**
```typescript
const isSmallCompany = totalPotentialTurnover < 100000000;

let vatRate = 0;
if (item.category === 'General Goods' && !isSmallCompany) {
  vatRate = 0.075; // 7.5% VAT only on General Goods, only above threshold
}
const vatCollected = item.sellingPricePerUnit * vatRate;
```

The condition `item.category === 'General Goods' && !isSmallCompany` encodes two independent legal requirements simultaneously:
1. The item must be in a taxable category (not Basic Food or Medicine/Books)
2. The business must have crossed the registration threshold

**Compliance page display (`Compliance.tsx`):**
```typescript
const vatTriggered = generalGoodsSold && !isSmallCompany;
```

When triggered, the user sees a red warning: _"VAT ACTIVE: 7.5% Surcharge Triggered — You must remit 7.5% VAT on these items."_ When safe, they see a green confirmation identifying the specific reason for their exemption.

---

### Staff & Owner Relief: The ₦800,000 Tax-Free Band (PAYE)

Nigeria's Personal Income Tax Act (PITA) provides a **Consolidated Relief Allowance (CRA)** of the higher of ₦200,000 or 1% of gross income, plus 20% of gross income. After applying the CRA, the first **₦800,000** of residual taxable income falls below the threshold where any meaningful PAYE becomes due.

The progressive PAYE bands implemented in `Deductibles.tsx`:

```typescript
function calculateMonthlyPAYE(monthlyGross: number): number {
  const annual = monthlyGross * 12;
  if (annual <= 800000) return 0;             // Tax-free band

  const cra = 200000 + (0.20 * annual);       // CRA: ₦200K + 20% of gross
  let taxable = annual - cra;
  if (taxable <= 0) return 0;

  let annualTax = 0;
  // Progressive bracket calculation (PITA Schedule):
  if (taxable > 300000)  { annualTax += 300000 * 0.07; taxable -= 300000; }  // 7% on first ₦300K
  if (taxable > 300000)  { annualTax += 300000 * 0.11; taxable -= 300000; }  // 11% on next ₦300K
  if (taxable > 500000)  { annualTax += 500000 * 0.15; taxable -= 500000; }  // 15% on next ₦500K
  if (taxable > 500000)  { annualTax += 500000 * 0.19; taxable -= 500000; }  // 19% on next ₦500K
  if (taxable > 1600000) { annualTax += 1600000 * 0.21; taxable -= 1600000; } // 21% on next ₦1.6M
  annualTax += taxable * 0.24;                                                 // 24% on remainder

  return annualTax / 12; // Return monthly obligation
}
```

Any staff member earning below **₦66,667/month** (₦800,000 / 12) is automatically marked **"Tax-Free (< ₦66,667 threshold)"** in green. Staff above this threshold trigger the progressive calculation and display their monthly PAYE obligation with an amber warning icon.

**Owner Salary:** The owner's monthly salary is treated as a formal business expense — subtracted from gross profit before the Net Profit figure is calculated, reducing the business's CIT-liable income legally.

```typescript
const netProfit = totalRevenue - (totalCostOfGoods + totalOperatingCosts + totalStaffCost + profile.ownerSalary);
```

---

### The Deductibles Engine: Business vs. Personal Spending

The Deductibles tab enforces a critical accounting distinction: only costs that are **wholly, exclusively, and necessarily** incurred in the production of business income are tax-deductible (Section 24, CITA).

**Allowed deductible categories in the system:**

| Category | Legal Basis |
|---|---|
| **Rent** | Shop/office lease directly enables trading |
| **Electricity** | Utility used in business premises |
| **Equipment** | Capital items used in production/trading |
| **Delivery Fuel** | Directly tied to revenue-generating activity |

**What the system deliberately excludes:**
- Personal food expenses
- Owner's children's school fees
- Private vehicle use unrelated to business
- Personal clothing (unless a business uniform)

The system does not allow a free-text "personal" category. Every item entered in the Operating Costs section is treated as a deductible business expense and directly reduces Net Profit on the Dashboard. The trader is guided by the category selector, which only offers legitimate business expense types. Anti-scam facts are displayed at the bottom of the Compliance page to educate traders on what cannot be claimed.

---

## 3. The RPA Component: Bulk Inventory Math as Automation

### Defining the Automation

Traditional bookkeeping requires a market trader to manually calculate their **True Unit Cost** for every bulk purchase — a multi-step arithmetic process involving purchase cost, transport, and loading fees. Human error in this step directly leads to underpricing, which means the trader sells at a loss without realising it.

The Bulk Inventory Engine in `Inventory.tsx` acts as **Robotic Process Automation (RPA)** by executing this calculation automatically and in real-time as the trader types, eliminating the error entirely.

**The RPA Formula:**
```typescript
const totalPurchase = numQty * numPrice;           // e.g. 100 bags × ₦5,000 = ₦500,000
const trueUnitCost = numQty > 0
  ? (totalPurchase + numTransport + numLabor) / numQty
  : 0;
// e.g. (₦500,000 + ₦15,000 transport + ₦5,000 loading) / 100 = ₦5,200.00 per bag
```

**The "RPA Logistics Math" display rendered live:**
```
Base Inventory Cost:   ₦500,000.00
+ Logistics Added:     ₦20,000.00
─────────────────────────────────
True Unit Cost:        ₦5,200.00 per unit
```

**What this replaces manually:**
1. Multiplying quantity × purchase price (error-prone with large numbers)
2. Dividing transport cost across all units (traders often skip this)
3. Dividing loading/labour cost across all units (almost always ignored)
4. Arriving at the final break-even unit cost

A trader who buys 100 bags of rice at ₦5,000 each and ignores their ₦20,000 transport cost believes their break-even is ₦5,000 per bag. The RPA engine tells them it is **₦5,200**. Pricing at ₦5,100 would be a loss. This single automated calculation is the most financially impactful feature in the entire application.

The system also tracks profit at the point of sale:
```typescript
const profit = item.sellingPricePerUnit - item.trueUnitCost;
```

This means the profit figure on the Dashboard is **actual profit** (accounting for transport and labour), not simply the naive difference between selling price and purchase price.

---

## 4. PWA Mechanics: How the App Works Offline

### Add to Home Screen: The Native Install Flow

The app hooks into the browser's native `beforeinstallprompt` event using `InstallPopup.tsx`. This is a browser-level event fired when Chrome/Edge determines the site meets PWA installability criteria (HTTPS, valid manifest, service worker registered).

**The flow:**
```typescript
useEffect(() => {
  // Don't show if already installed as standalone app
  if (window.matchMedia('(display-mode: standalone)').matches) return;

  const handler = (e: any) => {
    e.preventDefault();      // Suppress browser's own mini-infobar
    setDeferredPrompt(e);    // Save the event for our custom button
    setShowPrompt(true);     // Show our branded install card
  };

  window.addEventListener('beforeinstallprompt', handler);
}, []);

// When user taps "Install Now":
deferredPrompt.prompt();                // Triggers the native OS install dialog
const { outcome } = await deferredPrompt.userChoice;
```

**iOS Safari** does not emit `beforeinstallprompt` (Apple's proprietary restriction). The app detects iOS via `navigator.userAgent` and shows a manual instruction card: _"Tap the Share icon, then choose 'Add to Home Screen'."_

Once installed, the app runs in **`display: standalone`** mode — no browser chrome, no address bar, full-screen like a native app, with its own icon on the home screen.

---

### Service Workers & Offline Caching

The PWA's offline capability is powered by **Workbox** (via `vite-plugin-pwa`), which generates a production Service Worker that pre-caches the entire application shell at install time.

**Workbox configuration in `vite.config.ts`:**
```typescript
workbox: {
  globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
  maximumFileSizeToCacheInBytes: 50 * 1024 * 1024, // 50MB limit for DuckDB WASM binary
}
```

The `wasm` extension is explicitly included in the glob pattern because DuckDB's WASM binaries (`duckdb-eh.wasm`, `duckdb-mvp.wasm`) must be cached for offline operation.

**What happens on first load (online):**
1. Service Worker installs and pre-caches: `index.html`, all JS bundles, CSS, the app manifest, and the DuckDB WASM binaries.
2. Total cached bundle: ~260KB JS + WASM binaries.

**What happens on subsequent loads (offline):**
1. Service Worker intercepts the network request.
2. Serves all assets from the browser's Cache Storage — no network required.
3. Zustand reads the persisted state from IndexedDB — all inventory, sales data, and the business profile load instantly.
4. The trader can add new inventory, record sales, and calculate taxes with zero internet connection.

**The update cycle (`registerType: 'autoUpdate'`):**
When the trader has internet access, the Service Worker silently downloads new versions in the background and activates on the next app open — exactly like a native app's auto-update mechanism — without ever interrupting the trader's session.

---

## Summary Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                  BROWSER (Trader's Phone)            │
│                                                      │
│  ┌──────────────┐    ┌──────────────────────────┐   │
│  │  React UI    │◄──►│   Zustand Store           │   │
│  │  (Main Thread│    │   (In-memory + IndexedDB) │   │
│  │  )           │    │   ─ profile               │   │
│  └──────────────┘    │   ─ inventory             │   │
│         │            │   ─ salesLog              │   │
│         │            │   ─ employees             │   │
│         ▼            │   ─ operatingCosts        │   │
│  ┌──────────────┐    └──────────┬───────────────┘   │
│  │  Service     │               │  idb-keyval writes │
│  │  Worker      │               ▼                    │
│  │  (Workbox)   │    ┌──────────────────────────┐   │
│  │  Offline     │    │   IndexedDB              │   │
│  │  Cache       │    │   (Permanent Storage)    │   │
│  └──────────────┘    └──────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  DuckDB WebWorker (Separate Thread)          │   │
│  │  ─ SQL query engine (VAT, CIT, analytics)   │   │
│  │  ─ OPFS ledger file (supplementary)         │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
         │
         │ HTTPS (when available)
         ▼
   ┌───────────┐
   │  Netlify  │  ← Static hosting only
   │  CDN      │    No server, no backend
   └───────────┘
```

**The bottom line:** A trader in Nnewi with no WiFi, on a ₦15,000 phone, running Tax Pilot as an installed PWA will have their entire business ledger, real-time PAYE calculations, VAT compliance status, and zero-error bulk inventory pricing available at all times — completely free, with no monthly subscription, and without their financial data ever touching a third-party server.
