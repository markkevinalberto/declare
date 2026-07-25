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

const PRELOAD_PATH = path.join(__dirname, "preload.js");

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

module.exports = { createOrFocusPresenterWindow, attachWindowOpenHandler, getDisplaysInfo, PRELOAD_PATH };
