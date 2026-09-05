"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// The last leg of native Google sign-in (see GoogleSignInButton for the
// full explanation). By the time a browser lands here, it just finished
// the normal web login flow — Google, then /auth/callback — in this same
// browser tab, so a valid session already sits in this tab's cookies. This
// page's only job is to read that session and hand it to the native app
// through the mka.declare.app:// custom scheme, since the app's own WebView
// has no access to this tab's cookies.
function NativeBridge() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"working" | "error">("working");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (!session) {
        setStatus("error");
        return;
      }

      const next = searchParams.get("next");
      const bridgeUrl = new URL("mka.declare.app://auth-callback");
      bridgeUrl.searchParams.set("access_token", session.access_token);
      bridgeUrl.searchParams.set("refresh_token", session.refresh_token);
      if (next) bridgeUrl.searchParams.set("next", next);
      window.location.href = bridgeUrl.toString();
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  if (status === "error") {
    return (
      <div className="grid min-h-svh place-items-center px-6 text-center">
        <div>
          <p className="font-medium">Sign-in didn&apos;t complete.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Go back to the app and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-svh place-items-center px-6 text-center text-sm text-muted-foreground">
      Signing you in…
    </div>
  );
}

export default function NativeBridgePage() {
  return (
    <Suspense>
      <NativeBridge />
    </Suspense>
  );
}
