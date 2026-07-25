// Runs in an isolated world with access to Node APIs, before the page's own
// scripts. contextBridge is the only thing that crosses into the page's
// actual context — this is the entire native-capability surface the web app
// can see. Keep it narrow and match src/app/present/[serviceId]/electron-bridge.ts
// in the main repo, which is the typed contract the web app codes against.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("declareDesktop", {
  isElectron: true,
  platform: process.platform,
  getDisplays: () => ipcRenderer.invoke("displays:list"),
  openPresenterWindow: (kind, url, bounds) =>
    ipcRenderer.invoke("presenter-window:open", { kind, url, bounds }),
});
