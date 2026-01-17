// src/middleware.ts
// Middleware to set URL headers for auth redirect preservation
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Create response and add URL headers for server components to use
  const response = NextResponse.next();

  // Set the full URL (path + query) for auth redirect preservation
  const url = request.nextUrl.pathname + request.nextUrl.search;
  response.headers.set("x-url", url);
  response.headers.set("x-invoke-path", request.nextUrl.pathname);
  response.headers.set("x-invoke-query", request.nextUrl.search.slice(1)); // Remove leading ?

  return response;
}

// Only run on pages that might need auth (profile, etc.)
export const config = {
  matcher: [
    // Match all paths except static files and API routes
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
