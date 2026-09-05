"use client";

import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App, type URLOpenListenerEvent } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { loginWithGoogle, getGoogleOAuthUrl } from "./actions";

// Where Android hands the OAuth redirect back to this app — registered as
// an intent filter in android/app/src/main/AndroidManifest.xml.
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

    // Google's sign-in page refuses to load inside this app's own WebView
    // ("This browser or app may not be secure"), so handleClick below opens
    // it in the device's external browser instead — this listener is what
    // catches the user coming back once they've signed in there.
    const listener = App.addListener("appUrlOpen", async (event: URLOpenListenerEvent) => {
      if (!event.url.startsWith(NATIVE_CALLBACK_SCHEME) || handledRef.current) return;
      handledRef.current = true;

      await Browser.close().catch(() => {});
      const supabase = createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(event.url);
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
    const { url, error } = await getGoogleOAuthUrl(callback);
    if (error || !url) {
      toast.error(error ?? "Could not start Google sign-in.");
      setPending(false);
      return;
    }
    await Browser.open({ url });
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
