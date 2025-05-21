import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse, type NextRequest } from "next/server";

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0;

export async function updateSession(request: NextRequest) {
  // If Supabase is not configured, just continue without auth
  if (!isSupabaseConfigured) {
    return NextResponse.next({
      request,
    });
  }

  // Initialize response early. This is crucial for createMiddlewareClient to set cookies.
  let response = NextResponse.next({
    request: {
      headers: request.headers, // Pass down request headers
    },
  });

  // Create a Supabase client configured to use cookies.
  // Pass request and the initialized response.
  const supabase = createMiddlewareClient({ req: request, res: response });

  // Handle auth code exchange (e.g., OAuth callback)
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
    // After exchanging code, the user should be authenticated.
    // The cookies should be set by createMiddlewareClient after exchangeCodeForSession.
    // Redirect to the intended URL or home page.
    const redirectPath = requestUrl.searchParams.get('next') || '/';
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // Main logic: Use getUser() to refresh session (if needed) and get user data.
  // This call also handles revalidating the session with the Supabase server.
  // createMiddlewareClient is expected to update cookies on `response` if the session changes.
  const { data: { user } } = await supabase.auth.getUser();

  // Define authentication routes that do not require a logged-in user.
  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/auth/login") ||
    request.nextUrl.pathname.startsWith("/auth/sign-up") ||
    request.nextUrl.pathname.startsWith("/auth/confirm"); // For email verification link

  // If the user is not authenticated and the route is not an auth route, redirect to login.
  if (!user && !isAuthRoute) {
    const loginUrl = new URL("/auth/login", request.url);
    // Optionally, preserve the intended destination to redirect after login.
    if (request.nextUrl.pathname && request.nextUrl.pathname !== "/") {
      loginUrl.searchParams.set("next", request.nextUrl.pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // If the user is authenticated and tries to access login or sign-up pages, redirect to home.
  if (user && (request.nextUrl.pathname.startsWith("/auth/login") || request.nextUrl.pathname.startsWith("/auth/sign-up"))) {
      return NextResponse.redirect(new URL("/", request.url));
  }
  
  // Return the response, which may have been modified by createMiddlewareClient (e.g., with new cookies).
  return response;
}
