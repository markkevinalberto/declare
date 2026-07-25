import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the dev server accept requests (including the HMR websocket) from
  // other devices on the same LAN — testing the presenter console from a
  // phone or another PC over http://192.168.1.x. Without this, Next.js
  // rejects those as cross-origin dev requests by default; the failed HMR
  // socket doesn't just break live-reload, its constant reconnect attempts
  // can also make the page feel unresponsive to clicks. Update the pattern
  // if your router's subnet ever changes from 192.168.1.x.
  allowedDevOrigins: ["192.168.1.*"],
};

export default nextConfig;
