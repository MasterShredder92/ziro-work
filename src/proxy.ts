import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { roleGuard } from "@/middleware/roleGuard";

/**
 * ZiroWork Middleware
 * 
 * Handles two concerns:
 * 1. Role-based access control for protected routes (via roleGuard)
 * 2. Open pass-through for agentic API routes (no auth challenge)
 * 
 * Per the PaperclipAI implementation guide:
 * "You must explicitly exclude your agentic API routes from your middleware."
 * This prevents Vercel's WAF from blocking agentic requests with 403 errors.
 */
export async function middleware(request: NextRequest) {
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
