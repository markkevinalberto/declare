// File-based diagnostics logger, independent of DevTools — DevTools itself
// relies on Chromium rendering, which could be exactly what's broken on a
// machine with display issues. This just appends plain text lines to a file
// in userData, so it works even when nothing else on-screen does.
const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const LOG_PATH = path.join(app.getPath("userData"), "declare-debug.log");

function log(...args) {
  try {
    const line = `[${new Date().toISOString()}] ${args
      .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
      .join(" ")}\n`;
    fs.appendFileSync(LOG_PATH, line);
  } catch {
    // A failed write must never throw — logging is best-effort diagnostics,
    // not something that should be able to crash the app.
  }
}

module.exports = { log, LOG_PATH };
