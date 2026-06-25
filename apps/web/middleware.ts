import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js middleware — runs on every request.
 * Redirects unauthenticated users away from /dashboard/* to /login.
 * Redirects authenticated users away from /login to /dashboard.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options });
          supabaseResponse = NextResponse.next({ request });
          supabaseResponse.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: "", ...options });
          supabaseResponse = NextResponse.next({ request });
          supabaseResponse.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // getSession() reads and validates the JWT locally from cookies — no network round-trip.
  // If it throws (e.g. misconfigured env vars, Supabase JWKS unreachable), treat the
  // user as unauthenticated rather than letting the error propagate and leaking the page.
  let session = null;
  try {
    const result = await supabase.auth.getSession();
    session = result.data.session ?? null;
  } catch (err) {
    console.error("Middleware: getSession() failed — treating as unauthenticated:", err);
  }

  const { pathname } = request.nextUrl;

  // Redirect unauthenticated users from /dashboard/* to /login
  if (!session && pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users from auth pages to /dashboard
  if (session && (pathname === "/login" || pathname === "/signup" || pathname === "/reset-password")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/signup",
    "/reset-password",
  ],
};
