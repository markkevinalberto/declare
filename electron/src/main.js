const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const { APP_URL, ICON_PATH } = require("./constants");
const {
  createOrFocusPresenterWindow,
  attachWindowOpenHandler,
  getDisplaysInfo,
  PRELOAD_PATH,
} = require("./windows");

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
    mainWindow.on("closed", () => {
      mainWindow = null;
    });
  }

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    if (process.platform === "win32") {
      app.setAppUserModelId("com.declare.app");
    }

    ipcMain.handle("displays:list", () => getDisplaysInfo());
    ipcMain.handle("presenter-window:open", (_event, { kind, url, bounds }) => {
      createOrFocusPresenterWindow(kind, url, bounds);
    });

    createMainWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
