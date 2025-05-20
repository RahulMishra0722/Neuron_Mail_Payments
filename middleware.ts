import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Define paths that should be public (no auth required)
  const publicPaths = [
    "/api/webhooks/paddle",
    // Add other webhook paths or public API endpoints here
  ];

  // Skip session update for webhook endpoints
  if (
    publicPaths.some(
      (publicPath) => path === publicPath || path.startsWith(`${publicPath}/`)
    )
  ) {
    // Instead of returning a response, just return undefined to let the request continue
    return;
  }

  // Apply the Supabase session update for all other routes
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
