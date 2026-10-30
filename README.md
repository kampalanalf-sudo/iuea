# TANK DISTRIBUTION — Online Music Distribution, DDEX Delivery & Royalty Engine

**Tank Distribution** is a music distribution platform prototype built with **React 19 + TypeScript + Tailwind CSS**, with optional Supabase integration and GitHub Actions CI.

> **Security status — prototype only.** The current sign-in checks an email and role in the browser without verifying ownership, and client-side role checks do not protect data. The included database migration grants public read/write access to several tables, and the DSP panel stores credentials in the browser. Do not use real account, financial, catalog, or API-secret data until verified authentication, restrictive server-side permissions and secure secret handling are implemented. GitHub Pages is public static hosting, not an access-control layer.

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
   - Optional `@supabase/supabase-js` connection and catalog sync code lives in `src/lib/supabase.ts` and `src/services/distributionService.ts`.
   - The current login is not backed by verified Supabase Auth; the database policies and credential handling must be secured before use with real data.

---

## Supabase Database Setup

The current migration is **not safe for production**: it includes public read/write policies. Before connecting real data, implement Supabase Auth, restrictive row-level security, server-side role checks and secure server-side storage of integration secrets. Do not apply the existing migration to a production database as-is.

For an isolated test project only, the client can be configured with a Supabase URL and a publishable/anon key through `.env` or the in-app cloud panel. Never put a Supabase service-role key or third-party secret into a browser environment variable.

```bash
npm install
npm run dev
```

---

## GitHub Pages custom domain

The build is prepared for `tankmusicdistribution.site`, including `CNAME` files and a root/static entry point. See [DOMAIN_SETUP.md](./DOMAIN_SETUP.md) for domain verification, GitHub Pages, Namecheap DNS and HTTPS steps. The Pages source must contain the built changes; the `CNAME` files alone do not set up DNS.

---

## Deploying to Netlify

This repository includes a pre-configured [`netlify.toml`](./netlify.toml) and [`public/_redirects`](./public/_redirects) for zero-config deployment on Netlify:

1. Log in to [Netlify](https://app.netlify.com) and click **Add new site → Import an existing project**.
2. Choose **GitHub** and select the **`kampalanalf-sudo/iuea`** repository.
3. Select branch **`arena/b41594a2-iuea`** (or **`main`** after merging the pull request).
4. Netlify will automatically detect these settings from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Node version:** `22`
5. *(Optional)* Under **Site configuration → Environment variables**, add:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase Anon Public Key
6. Click **Deploy site**.

