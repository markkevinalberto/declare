import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Keep the profile picture in sync with the OAuth provider (Google
      // sends avatar_url/picture in user metadata on every login).
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const oauthAvatar =
        user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture;
      if (user && typeof oauthAvatar === "string" && oauthAvatar) {
        await supabase
          .from("profiles")
          .update({ avatar_url: oauthAvatar })
          .eq("id", user.id);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Could not authenticate. Please try again.")}`
  );
}
