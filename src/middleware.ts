import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { roleGuard } from "@/middleware/roleGuard";
import { checkLimit, ipKey } from "@/lib/ratelimit/limiter";
import { POLICIES } from "@/lib/ratelimit/policies";
import { buildSecurityHeaders, pathShouldBeSecured } from "@/lib/security/headers";

const PROTECTED_PREFIXES = ["/admin", "/director", "/teacher", "/family", "/student"];

function applySecurityHeaders(res: NextResponse): NextResponse {
  const headers = buildSecurityHeaders({
    includeHsts: process.env.NODE_ENV === "production",
    allowUnsafeInline: true, // tightened in a follow-up once legacy inline scripts are audited
  });
  for (const [k, v] of Object.entries(headers)) res.headers.set(k, v);
  return res;
}

function extractIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // IP-level burst ceiling for protected routes. Pure in-memory on Edge;
  // the durable audit trail is recorded by API handlers when they invoke
  // the full enforceLimit helper.
  if (isProtectedPath(pathname)) {
    const ip = extractIp(req);
    const decision = checkLimit(ipKey(POLICIES.ipBurst.id, ip), POLICIES.ipBurst);
    if (!decision.ok) {
      const res = new NextResponse(
        JSON.stringify({
          code: "RATE_LIMITED",
          message: "Too many requests",
        }),
        {
          status: 429,
          headers: {
            "content-type": "application/json",
            "retry-after": String(
              Math.max(1, Math.ceil((decision.resetAt - Date.now()) / 1000)),
            ),
          },
        },
      );
      return applySecurityHeaders(res);
    }
  }

  const guarded = await roleGuard(req);
  if (guarded) {
    if (pathShouldBeSecured(pathname)) applySecurityHeaders(guarded);
    return guarded;
  }

  const res = NextResponse.next();
  if (pathShouldBeSecured(pathname)) applySecurityHeaders(res);
  return res;
}

export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/director/:path*",
    "/teacher/:path*",
    "/family/:path*",
    "/student/:path*",
    "/dashboard/:path*",
    "/api/:path*",
  ],
};
