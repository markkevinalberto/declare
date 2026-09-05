"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Capacitor } from "@capacitor/core";
import { App, type URLOpenListenerEvent } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { loginWithGoogle } from "./actions";

// Where Android hands the OAuth redirect back to this app — registered as
// an intent filter in android/app/src/main/AndroidManifest.xml.
const NATIVE_CALLBACK_SCHEME = "mka.declare.app://auth-callback";

/**
 * A one-off client used ONLY to kick off the native sign-in, configured for
 * the implicit flow instead of this app's normal PKCE default. PKCE stores
 * a code_verifier client-side and expects to find it again when exchanging
 * the code — that verifier didn't reliably survive the round trip out to
 * Android's external browser and back (confirmed via Supabase's own auth
 * logs: every /authorize call correctly reached Google and came back, but
 * every /token exchange failed with 404 flow_state_not_found regardless of
 * how long the round trip took). Implicit flow returns the session tokens
 * directly in the redirect itself, so there's nothing to look up server-side
 * and nothing that can go missing in transit.
 */
function createImplicitFlowClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { flowType: "implicit" } }
  );
}

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

    // Google's sign-in page refuses to load inside this app's own WebView
    // ("This browser or app may not be secure"), so handleClick below opens
    // it in the device's external browser instead — this listener is what
    // catches the user coming back once they've signed in there.
    const listener = App.addListener("appUrlOpen", async (event: URLOpenListenerEvent) => {
      if (!event.url.startsWith(NATIVE_CALLBACK_SCHEME) || handledRef.current) return;
      handledRef.current = true;

      await Browser.close().catch(() => {});

      // Implicit-flow tokens come back in the URL fragment
      // (...#access_token=...&refresh_token=...), not a query param.
      const fragment = event.url.split("#")[1] ?? "";
      const params = new URLSearchParams(fragment);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (!access_token || !refresh_token) {
        toast.error(params.get("error_description") ?? "Google sign-in didn't complete.");
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
    handledRef.current = false;
    const callback = next
      ? `${NATIVE_CALLBACK_SCHEME}?next=${encodeURIComponent(next)}`
      : NATIVE_CALLBACK_SCHEME;

    const supabase = createImplicitFlowClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback, skipBrowserRedirect: true },
    });
    if (error || !data.url) {
      toast.error(error?.message ?? "Could not start Google sign-in.");
      setPending(false);
      return;
    }
    await Browser.open({ url: data.url });
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
      {pending ? "Opening Google sign-in…" : "Continue with Google"}
    </Button>
  );
}
