// Creates/reuses/positions the projector and stage-display windows, and
// intercepts the web app's window.open()/<a target> calls so they open as
// native positioned windows instead of Electron's default popup behavior.
//
// No custom `session` partition is used anywhere in this file — every
// window shares Electron's default persistent session, which is what keeps
// the Supabase auth cookie, localStorage (display prefs, hotkey settings),
// and the BroadcastChannel-based live slide sync between presenter/
// projector/stage all working exactly as they do across browser tabs today,
// with zero changes to that layer. Do not add a partition here.
const path = require("path");
const { BrowserWindow, screen, shell } = require("electron");
const { APP_URL, ICON_PATH } = require("./constants");
const { log } = require("./logger");

const PRELOAD_PATH = path.join(__dirname, "preload.js");

/** Matches Electron's normal DevTools shortcuts (F12, or Ctrl+Shift+I), which
 * silently stop working once Menu.setApplicationMenu(null) removes the
 * default menu template they're normally wired through. */
function isDevToolsShortcut(input) {
  if (input.type !== "keyDown") return false;
  if (input.key === "F12") return true;
  return (
    input.control &&
    input.shift &&
    (input.key === "I" || input.key === "i")
  );
}

/**
 * Wires up file-based diagnostics logging (see logger.js) and the DevTools
 * keyboard-shortcut fallback for a given window. `label` (e.g. "main",
 * "projector", "stage") is prefixed onto every log line so lines from
 * different windows are attributable.
 * @param {import("electron").BrowserWindow} win
 * @param {string} label
 */
function attachDiagnostics(win, label) {
  win.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    log(`[${label}] console-message`, { level, message, line, sourceId });
  });
  win.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    log(`[${label}] did-fail-load`, { errorCode, errorDescription, validatedURL });
  });
  win.webContents.on("did-finish-load", () => {
    log(`[${label}] did-finish-load`);
  });
  win.webContents.on("render-process-gone", (_event, details) => {
    log(`[${label}] render-process-gone`, details);
  });
  win.on("unresponsive", () => {
    log(`[${label}] unresponsive`);
  });
  win.on("responsive", () => {
    log(`[${label}] responsive`);
  });
  win.webContents.on("before-input-event", (_event, input) => {
    if (isDevToolsShortcut(input)) {
      win.webContents.toggleDevTools();
    }
  });
}

/** @type {Map<"projector" | "stage", import("electron").BrowserWindow>} */
const presenterWindows = new Map();

function getDisplaysInfo() {
  const displays = screen.getAllDisplays();
  const primaryId = screen.getPrimaryDisplay().id;
  return displays.map((d, i) => ({
    label: `Display ${i + 1}`,
    left: d.bounds.x,
    top: d.bounds.y,
    width: d.bounds.width,
    height: d.bounds.height,
    isPrimary: d.id === primaryId,
  }));
}

// No saved preference yet: put the output on the first non-primary display,
// fullscreen, if one exists — otherwise open windowed on the single display
// rather than fullscreening over the presenter's own screen.
function defaultPlacement() {
  const displays = screen.getAllDisplays();
  const primary = screen.getPrimaryDisplay();
  const nonPrimary = displays.find((d) => d.id !== primary.id);
  if (nonPrimary) {
    return {
      bounds: {
        left: nonPrimary.bounds.x,
        top: nonPrimary.bounds.y,
        width: nonPrimary.bounds.width,
        height: nonPrimary.bounds.height,
      },
      fullscreen: true,
    };
  }
  return { bounds: null, fullscreen: false };
}

function attachWindowOpenHandler(win) {
  win.webContents.setWindowOpenHandler(({ url, frameName }) => {
    if (frameName.startsWith("projection-")) {
      createOrFocusPresenterWindow("projector", url, null);
      return { action: "deny" };
    }
    if (frameName.startsWith("stage-")) {
      createOrFocusPresenterWindow("stage", url, null);
      return { action: "deny" };
    }
    if (!url.startsWith(APP_URL)) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });
}

/**
 * @param {"projector" | "stage"} kind
 * @param {string} url
 * @param {{left: number, top: number, width: number, height: number} | null} bounds
 */
function createOrFocusPresenterWindow(kind, url, bounds) {
  const existing = presenterWindows.get(kind);
  if (existing && !existing.isDestroyed()) {
    existing.loadURL(url);
    if (bounds) {
      existing.setBounds({
        x: bounds.left,
        y: bounds.top,
        width: bounds.width,
        height: bounds.height,
      });
    }
    existing.show();
    existing.focus();
    return existing;
  }

  let targetBounds = bounds;
  let shouldFullscreen = Boolean(bounds);
  if (!targetBounds) {
    const placement = defaultPlacement();
    targetBounds = placement.bounds;
    shouldFullscreen = placement.fullscreen;
  }

  const win = new BrowserWindow({
    x: targetBounds ? targetBounds.left : undefined,
    y: targetBounds ? targetBounds.top : undefined,
    width: targetBounds ? targetBounds.width : 1280,
    height: targetBounds ? targetBounds.height : 720,
    show: false,
    frame: false,
    icon: ICON_PATH,
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.loadURL(url);
  attachWindowOpenHandler(win);
  attachDiagnostics(win, kind);

  win.once("ready-to-show", () => {
    win.show();
    if (shouldFullscreen) win.setFullScreen(true);
  });

  // Real escape hatch since the DOM double-click-to-toggle-fullscreen
  // handlers in projection-screen.tsx/stage-display.tsx are inert here —
  // they call the DOM Fullscreen API, which Electron's native fullscreen
  // never touches.
  win.webContents.on("before-input-event", (_event, input) => {
    if (input.type === "keyDown" && input.key === "Escape") {
      win.setFullScreen(false);
    }
  });

  win.on("closed", () => {
    presenterWindows.delete(kind);
  });

  presenterWindows.set(kind, win);
  return win;
}

module.exports = {
  createOrFocusPresenterWindow,
  attachWindowOpenHandler,
  attachDiagnostics,
  isDevToolsShortcut,
  getDisplaysInfo,
  PRELOAD_PATH,
};
