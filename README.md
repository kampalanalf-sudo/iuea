# TANK DISTRIBUTION — Online Music Distribution, DDEX Delivery & Royalty Engine

**Tank Distribution** is an industrial-grade independent music distribution, master catalog registry, and automated royalty splits platform built with **React 19 + TypeScript + Tailwind CSS**, backed by **Supabase (`@supabase/supabase-js` PostgreSQL, Auth & Storage)** and **GitHub Actions CI/CD**.

---

## Core Platform Capabilities

1. **Command Overview & Telemetry Console**
   - Real-time streaming and royalty USD velocity charts (`7D`, `30D`, `90D`, `12M`) across 150+ DSPs including **Spotify, Apple Music, TikTok/CapCut, YouTube Music + Content ID, Beatport, TIDAL, Amazon Music, Audiomack, and Instagram/Meta**.
   - Live DDEX ERN 4.3 Store Delivery Pipeline tracker & automated QC validation status.

2. **4-Step Release Distribution Wizard (`Distribute New Release`)**
   - **Step 1 — Metadata & 3000×3000px Artwork Studio**: Configure release metadata, auto-generate official **UPC-A Barcodes** (`8597...`), upload custom cover artwork (`PNG`/`JPG`), or generate procedural studio cover art with 6 visual presets.
   - **Step 2 — Lossless Audio Masters & ISRC Assignment**: Upload real `.wav`, `.mp3`, or `.flac` audio files from your computer (with real duration decoding and playback in the bottom transport bar) or add studio synth masters. Automatically assigns **ISRC codes** (`US-TNK-26-XXXXX`) and verifies `-14.0 LUFS` loudness specs.
   - **Step 3 — 100% Automated Royalty Splits Engine**: Add collaborators (`Primary Artist`, `Producer`, `Featured Artist`, `Mixing / Mastering`, `Songwriter`), assign payout rails (`Stripe Connect`, `Wise Multi-Currency`, `Bank Wire SWIFT`, `USDC Vault`), and lock splits at exactly `100.00%`.
   - **Step 4 — DSP Store Selection & DDEX ERN 4.3 Deployment**: Select target DSPs, enable YouTube Content ID & TikTok audio fingerprinting, and deploy directly to the catalog.

3. **Catalog & DDEX XML Inspector**
   - Search and filter by Title, Artist, Format (`Single`, `EP`, `Album`), Status (`Delivered`, `In Review`, `Draft`), UPC, or ISRC.
   - Inspect per-store delivery batches and export valid **DDEX ERN 4.3 XML Manifests**.

4. **Royalties, Collaborator Split Tree & Instant Payouts**
   - Execute instant royalty withdrawals, inspect per-release collaborator split math, and export official **CSV Royalty Statements**.

5. **Supabase & GitHub Cloud Studio**
   - Full `@supabase/supabase-js` integration (`src/lib/supabase.ts` & `src/services/distributionService.ts`).
   - Connect any live Supabase project directly in the UI or via `.env`, test table connectivity, sync your local catalog to Supabase with 1 click, and authenticate via GitHub OAuth.

---

## Supabase Database Setup

1. Create a new project in [Supabase](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard and run [`supabase/migrations/001_tank_distribution_schema.sql`](./supabase/migrations/001_tank_distribution_schema.sql).
3. Copy `.env.example` to `.env` and add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (or paste them directly inside the in-app **Supabase & GitHub** tab).

```bash
npm install
npm run dev
```
