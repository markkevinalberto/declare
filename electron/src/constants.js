const path = require("path");

const APP_URL = process.env.DECLARE_APP_URL || "https://declare-cyan.vercel.app";
const ICON_PATH = path.join(__dirname, "..", "build", "icon.ico");

module.exports = { APP_URL, ICON_PATH };
