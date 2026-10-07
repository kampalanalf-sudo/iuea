# ProxiCore POINT (Person Of Interest Tracking Tool)

Live BLE scanning, identity ledger, Groq analysis and an admin P.O.I.N.T. operational map. The application entry point is `src/App.tsx`.

## What it does

- **Production SCAN / STOP radar** using Web Bluetooth `requestLEScan` (Chrome/Edge, HTTPS or localhost). No simulated devices.
- **Distance from RSSI path-loss** with iBeacon / Eddystone calibration when present. Bearings are source-reported only — ordinary BLE cannot measure direction without AoA hardware.
- **Identity ledger** that merges repeats on fingerprint, device ID, iBeacon UUID+major/minor, Eddystone UID and payload hashes. Rotating `Person-` / `BLE-` labels stay separate unless a stable token matches.
- **Admin P.O.I.N.T. view**: combined identities from every scanning console, juxtaposed over an OpenStreetMap around the admin's live GPS.
- **Groq live analysis** (`llama-3.3-70b-versatile`) over a session snapshot.
- **CSV / JSON / screenshot import** with OCR review, plus CSV, JSON and printable HTML export.
- **Login + admin visibility**: analysts keep their own sessions; admins review every published workspace on the device.
- **In-app manuals**: sidebar → Manuals (Operator Manual + Admin Manual), printable.

## Data inputs

- Live advertisements (name, RSSI, TX power, manufacturer / service payloads).
- POINT CSV: `name,dist,rssi,bearing,timestamp,lat,lon`.
- JSON observations and device-detail text / screenshots.

## Shared cloud (Supabase) — all users, one backend

Yes. POINT supports Supabase as the shared store so every operator's scans land in one place for Admin + P.O.I.N.T.

1. Create a free project at supabase.com → copy Project URL + anon public key.
2. In Supabase Dashboard → SQL Editor → paste and Run **`supabase/schema.sql`** (creates `point_operators`, `point_sessions`, `point_observations` + open prototype policies).
3. In POINT → Settings → Shared cloud → paste URL + anon key → Save → Test connection.
4. From then on each console auto-pushes its workspace ~1.5 s after every change. Admin and P.O.I.N.T. merge cloud + local, refresh every 15 s and live via realtime.
5. For Vercel deploys you can also set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` env vars (see `.env.example`) — Settings entries override them per device.

Without Supabase the app still works fully offline; Admin only sees workspaces saved on that same browser.

## Privacy and interpretation

Processing is local-first. Map tiles (OpenStreetMap), Groq analysis and Supabase sync need internet. Supabase stores raw BLE observations (names, RSSI, payloads, scanner coords) — enable it only for authorised operations. Coordinates in CSVs are scanner positions, not target GPS. Broadcast names are not proof of a person — never present a `Person-` label as personal identification.

## Native builds — Android APK + Windows EXE

One codebase, three shells. The app auto-detects its shell (`src/lib/native.ts`) and picks the richest BLE engine. Full guide: `docs/NATIVE_BUILDS.md` + in-app sidebar → **APK / EXE**.

- **Android APK (Capacitor):** `capacitor.config.ts` → `npx cap add android` → `./gradlew assembleDebug`. CI: `.github/workflows/build-android.yml` produces `app-debug.apk`.
- **Windows EXE (Electron):** `electron/main.cjs` + `electron/preload.cjs` + `electron-builder.yml`. CI: `.github/workflows/build-windows.yml` produces `ProxiCore-POINT-Setup-*.exe`.

Does the APK give richer data? **Yes, substantially** — unfiltered scan, every packet, real MACs, complete AD structures, background scanning, fused GPS + compass, no HTTPS/flag limits. See the in-app 15-row Web vs APK vs EXE matrix.

## Development and deploy

Install with `npm install`, run with `npm run dev`, build with `npm run build` (single-file `dist/index.html`).

To host on Vercel: push this repo to GitHub, then in Vercel → Add New Project → import the repo → framework preset **Vite** → build command `npm run build`, output `dist`. Add `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in Vercel → Environment Variables if you want cloud pre-configured. The Groq key is entered in-app per user.
# proxicore-point
