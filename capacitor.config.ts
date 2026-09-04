import type { CapacitorConfig } from "@capacitor/cli";

// Declare is a server-rendered Next.js app (server actions, middleware,
// Supabase SSR cookies, realtime) — none of that survives a static export,
// so this wraps the live Vercel deployment in a native WebView rather than
// bundling a static build into the APK. `webDir` still has to point
// somewhere for Capacitor's own tooling, but nothing in it is ever shown.
const config: CapacitorConfig = {
  appId: "mka.declare.app",
  appName: "Declare",
  webDir: "www",
  server: {
    url: "https://declare-cyan.vercel.app",
    androidScheme: "https",
    // Google's OAuth pages actively refuse to sign in from an embedded
    // WebView ("This browser or app may not be secure") — email/password
    // login works fine as-is, but "Continue with Google" needs a follow-up
    // pass to route through an external Custom Tab (@capacitor/browser)
    // instead of this WebView before it'll work here.
    allowNavigation: ["accounts.google.com", "*.supabase.co"],
  },
};

export default config;
