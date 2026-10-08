# Native builds — Android APK + Windows EXE

One codebase, three shells. The app auto-detects its shell (`src/lib/shell.ts`) and
picks the richest BLE engine. In-app: sidebar → **APK / EXE** for the 15-row
Web vs APK vs EXE matrix.

## Android APK (Capacitor)

1. `npm install`
2. `npm run build` — produces the single-file `dist/index.html`.
3. `npx cap add android` — once, creates the `android/` project (already committed).
4. `npx cap sync android` — copies web assets + plugins into the shell.
5. `cd android && ./gradlew assembleDebug`
6. APK → `android/app/build/outputs/apk/debug/app-debug.apk`

CI: `.github/workflows/build-android.yml` builds `app-debug.apk` on every push and
uploads it as the `app-debug-apk` artifact.

Does the APK give richer data? **Yes, substantially** — unfiltered scan, every packet,
real MACs, complete AD structures, background scanning, fused GPS + compass, no
HTTPS/flag limits.

## Windows EXE (Electron)

1. `npm run build`
2. `npx electron-builder --win` (config: `electron-builder.yml`)
3. Installer → `dist-electron/ProxiCore-POINT-Setup-*.exe`

Shell files: `electron/main.cjs` + `electron/preload.cjs` (exposes `pointElectron`).

## Shared cloud

All shells share the Supabase backend (`supabase/schema.sql`) — see README
"Shared cloud" section. Without it the app is fully local-first.
