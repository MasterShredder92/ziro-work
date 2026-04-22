import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { roleGuard } from "@/middleware/roleGuard";

/**
 * ZiroWork Proxy (Next.js 16.2.3+)
 * 
 * In Next.js 16.2.3, the 'middleware.ts' file is replaced by 'proxy.ts'.
 * The main export function MUST be named 'proxy' instead of 'middleware'.
 * 
 * Architecture:
 * 1. Role-based access control for protected routes (via roleGuard)
 * 2. Open pass-through for agentic API routes (no auth challenge)
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow all agent API routes to pass through without auth challenge
  // This is required for the Manus Tool Loop to work
  if (pathname.startsWith("/api/agent")) {
    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-manus-api-key");
    return response;
  }

  // Handle OPTIONS preflight for CORS
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // Apply role-based access control for protected routes
  const guardResult = await roleGuard(request);
  if (guardResult) return guardResult;

  return NextResponse.next();
}

export const config = {
  // Match all routes EXCEPT:
  // - /api/agent/* (agentic routes — open pass-through)
  // - Static files and Next.js internals
  matcher: [
    "/((?!api/agent|_next/static|_next/image|favicon.ico).*)",
  ],
};
