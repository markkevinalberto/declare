# Declare desktop shell

A thin Electron wrapper around the deployed web app
(`https://declare-cyan.vercel.app` by default). It doesn't run its own copy
of the server or hold any server secrets — it's a native window manager
around the same site, added so the presenter/projector/stage-display feature
can use real OS window/display APIs instead of browser equivalents (Window
Management API, Fullscreen API) that were causing real problems (multi-display
picking not working over LAN, fullscreen getting kicked out by native file
dialogs).

This is a separate, self-contained npm project — it has its own
`package.json`/`node_modules`, deliberately kept out of the main app's
dependency tree so the Vercel deployment is unaffected. Don't add a
`workspaces` field to the root `package.json`; that's the only thing that
would couple the two.

## Develop

```bash
npm install
npm run dev     # points at http://localhost:3000 — run `npm run dev` in the main repo first
npm start        # points at the real deployed URL
```

## Build the installer

```bash
npm run dist
```

Produces `dist/Declare-Setup-<version>.exe` (Windows NSIS installer,
per-user install, no admin rights required). It's unsigned — no code-signing
certificate is configured — so Windows SmartScreen will warn on first run on
any machine ("Windows protected your PC" → More info → Run anyway). That's
expected, not a bug.

## How it fits together

- `src/main.js` — app entry point: window lifecycle, single-instance lock,
  IPC handlers.
- `src/preload.js` — exposes `window.declareDesktop` to the loaded page via
  `contextBridge` (display list + a function to open the projector/stage
  windows on a specific display).
- `src/windows.js` — creates/reuses/positions the projector and stage
  `BrowserWindow`s, and intercepts the web app's `<a target="...">` /
  `window.open()` calls so they open as native windows instead of Electron's
  default popup behavior.
- `scripts/build-icon.js` — rasterizes the web app's `src/app/icon.svg` into
  a multi-resolution `.ico` for the app/installer icon. Run automatically by
  `npm run dist`.

The web app detects `window.declareDesktop` at runtime and branches its
display-preferences/window-opening code accordingly — see
`src/app/present/[serviceId]/electron-bridge.ts` in the main repo. Everything
else about the app (auth, data, the rest of the UI) is completely unaware
this shell exists; it's the same site either way.
