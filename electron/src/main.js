const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require("electron");
const { autoUpdater } = require("electron-updater");
const { APP_URL, ICON_PATH } = require("./constants");
const {
  createOrFocusPresenterWindow,
  attachWindowOpenHandler,
  attachDiagnostics,
  getDisplaysInfo,
  PRELOAD_PATH,
} = require("./windows");
const { log, LOG_PATH } = require("./logger");

// Must run before app is ready and before requestSingleInstanceLock — kept
// as defense-in-depth against GPU-driver-related white-screen issues, even
// though the actual root cause of a prior incident was a relative-URL bug
// (fixed in display-preferences.tsx), not the GPU process.
app.disableHardwareAcceleration();

// Duplicate instances mid-service could each try to own the projector/stage
// output — refuse a second launch and just focus the existing window.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  let mainWindow = null;

  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  function createMainWindow() {
    mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      icon: ICON_PATH,
      webPreferences: {
        preload: PRELOAD_PATH,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });
    mainWindow.loadURL(APP_URL);
    attachWindowOpenHandler(mainWindow);
    attachDiagnostics(mainWindow, "main");
    mainWindow.webContents.on("before-input-event", (_event, input) => {
      if (
        input.type === "keyDown" &&
        input.control &&
        input.shift &&
        (input.key === "L" || input.key === "l")
      ) {
        shell.showItemInFolder(LOG_PATH);
      }
    });
    mainWindow.on("closed", () => {
      mainWindow = null;
    });
  }

  // No-op in dev — there's no packaged installer/feed to update against,
  // and electron-updater expects app.isPackaged app metadata to work from.
  function initAutoUpdater() {
    if (!app.isPackaged) return;
    autoUpdater.on("error", (err) => {
      log("[updater] error", err == null ? err : err.stack || err.message || err);
    });
    autoUpdater.on("update-downloaded", (info) => {
      log("[updater] update-downloaded", info);
      dialog
        .showMessageBox({
          type: "info",
          buttons: ["Restart now", "Later"],
          defaultId: 0,
          cancelId: 1,
          title: "Update ready",
          message: "A new version of Declare has been downloaded.",
          detail: "Restart now to install it, or install it later on quit.",
        })
        .then(({ response }) => {
          if (response === 0) autoUpdater.quitAndInstall();
        });
    });
    autoUpdater.checkForUpdates().catch((err) => {
      log("[updater] checkForUpdates failed", err == null ? err : err.stack || err.message || err);
    });
  }

  app.whenReady().then(async () => {
    Menu.setApplicationMenu(null);
    if (process.platform === "win32") {
      app.setAppUserModelId("com.declare.app");
    }

    log("[startup]", {
      appVersion: app.getVersion(),
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      platform: process.platform,
      arch: process.arch,
    });
    log("[startup-gpu]", JSON.stringify(await app.getGPUInfo("basic")));

    ipcMain.handle("displays:list", () => getDisplaysInfo());
    ipcMain.handle("presenter-window:open", (_event, { kind, url, bounds }) => {
      createOrFocusPresenterWindow(kind, url, bounds);
    });

    createMainWindow();
    initAutoUpdater();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
