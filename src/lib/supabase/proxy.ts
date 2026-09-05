import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/auth", "/invite", "/plan", "/join", "/privacy"];

/**
 * Set to the just-validated user's id once this middleware confirms the
 * session, so every Server Component's own auth check (getCurrentProfile in
 * current-user.ts) can trust it instead of independently re-validating the
 * session with a second network round-trip to Supabase's Auth server on
 * every navigation. ALWAYS overwritten below — a client can send this
 * header name itself, but that value is never trusted as-is.
 */
export const VALIDATED_USER_ID_HEADER = "x-declare-user-id";

function isPublicPath(pathname: string) {
  return (
    pathname === "/" ||
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  );
}

/**
 * Refreshes the Supabase session cookie on every request and performs an
 * optimistic redirect for unauthenticated users hitting a protected route.
 * This is NOT the source of truth for authorization — every server
 * component/action still verifies the session itself (getCurrentProfile
 * trusts VALIDATED_USER_ID_HEADER set below rather than re-checking from
 * scratch, but the underlying Supabase query it then runs is still fully
 * RLS-protected regardless of what id it's asked to look up).
 */
export async function updateSession(request: NextRequest) {
  // Collected here rather than applied immediately — the final response
  // object isn't built until after the user-id header below is also
  // settled, so the cookies get applied to that same final response.
  let cookiesToApply: { name: string; value: string; options: CookieOptions }[] =
    [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToApply = cookiesToSet;
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    const next = request.nextUrl.searchParams.get("next") ?? "";
    url.pathname =
      next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user) {
    request.headers.set(VALIDATED_USER_ID_HEADER, user.id);
  } else {
    request.headers.delete(VALIDATED_USER_ID_HEADER);
  }

  const response = NextResponse.next({ request });
  for (const { name, value, options } of cookiesToApply) {
    response.cookies.set(name, value, options);
  }
  return response;
}
