"use client";

import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App, type URLOpenListenerEvent } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { loginWithGoogle } from "./actions";

// Where Android hands the OAuth redirect back to this app — registered as
// an intent filter in android/app/src/main/AndroidManifest.xml. Built by
// /auth/native-bridge, not by Supabase directly (see below).
const NATIVE_CALLBACK_SCHEME = "mka.declare.app://auth-callback";

export function GoogleSignInButton({ next }: { next?: string }) {
  const [isNative, setIsNative] = useState(false);
  const [pending, setPending] = useState(false);
  // Prevents double-handling if Android fires appUrlOpen more than once for
  // the same redirect (observed on some OEM browsers).
  const handledRef = useRef(false);

  useEffect(() => {
    // Capacitor's native-vs-web detection depends on the bridge injected
    // into the page at runtime, so it can only be checked client-side —
    // there's no external value being synchronized here, just a one-time
    // "which environment am I actually in" read.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  useEffect(() => {
    if (!isNative) return;

    const listener = App.addListener("appUrlOpen", async (event: URLOpenListenerEvent) => {
      if (!event.url.startsWith(NATIVE_CALLBACK_SCHEME) || handledRef.current) return;
      handledRef.current = true;

      await Browser.close().catch(() => {});

      // /auth/native-bridge built this URL itself (see that page), so the
      // shape is exactly this — no fragment-vs-query or code-vs-token
      // ambiguity to handle here.
      const params = new URLSearchParams(event.url.split("?")[1] ?? "");
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (!access_token || !refresh_token) {
        toast.error(params.get("error") ?? "Google sign-in didn't complete.");
        setPending(false);
        handledRef.current = false;
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      setPending(false);
      if (error) {
        toast.error(error.message);
        handledRef.current = false;
        return;
      }
      window.location.href = next && next.startsWith("/") ? next : "/";
    });

    return () => {
      listener.then((l) => l.remove());
    };
  }, [isNative, next]);

  async function handleNativeClick() {
    setPending(true);
    // The Android WebView and the external browser Google requires don't
    // share cookies, so any PKCE verifier this app stores before opening
    // Google's page is gone by the time the user comes back (confirmed via
    // Supabase's own auth logs: /authorize always succeeded, /token always
    // came back "flow_state_not_found" no matter how the code was shaped or
    // requested). The fix is to not cross that boundary at all: open this
    // app's own /login page in the external browser and let the entire
    // sign-in — verifier stored, Google visited, code exchanged — happen in
    // that one browser context, exactly like a normal website visitor.
    // /auth/native-bridge then hands the resulting session back to the app.
    const bridgeNext = next
      ? `/auth/native-bridge?next=${encodeURIComponent(next)}`
      : "/auth/native-bridge";
    const loginUrl = `${window.location.origin}/login?next=${encodeURIComponent(bridgeNext)}`;
    await Browser.open({ url: loginUrl });
  }

  if (!isNative) {
    return (
      <form action={loginWithGoogle}>
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <Button type="submit" variant="outline" className="w-full">
          Continue with Google
        </Button>
      </form>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={pending}
      onClick={handleNativeClick}
    >
      {pending ? "Opening sign-in…" : "Continue with Google"}
    </Button>
  );
}
