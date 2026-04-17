/**
 * Security headers for authenticated app + API surfaces.
 *
 * Scope note:
 *   These headers apply ONLY to `/admin`, `/teacher`, `/family`, `/student`,
 *   `/dashboard`, and `/api/*` paths via the middleware gate. The public
 *   marketing site is intentionally excluded until a separate pass reviews
 *   CSP allowlists for marketing-only assets.
 */

export interface SecurityHeaderOptions {
  /** Include HSTS (only in production — harmless but noisy on localhost). */
  includeHsts?: boolean;
  /** Nonce for inline <script>/<style>. If set, CSP uses `'nonce-<value>'`. */
  cspNonce?: string;
  /** Relax CSP to allow unsafe-inline (legacy surfaces still inlining). */
  allowUnsafeInline?: boolean;
}

const CSP_DIRECTIVES_BASE: Record<string, string[]> = {
  "default-src": ["'self'"],
  "base-uri": ["'self'"],
  "object-src": ["'none'"],
  "frame-ancestors": ["'none'"],
  "form-action": ["'self'"],
  "img-src": ["'self'", "data:", "blob:", "https:"],
  "font-src": ["'self'", "data:", "https:"],
  "connect-src": ["'self'", "https:", "wss:"],
  "script-src": ["'self'"],
  "style-src": ["'self'"],
  "worker-src": ["'self'", "blob:"],
  "manifest-src": ["'self'"],
};

function buildCsp(options: SecurityHeaderOptions): string {
  const directives: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(CSP_DIRECTIVES_BASE)) directives[k] = [...v];

  if (options.cspNonce) {
    directives["script-src"].push(`'nonce-${options.cspNonce}'`);
    directives["style-src"].push(`'nonce-${options.cspNonce}'`);
  }
  if (options.allowUnsafeInline) {
    directives["script-src"].push("'unsafe-inline'");
    directives["style-src"].push("'unsafe-inline'");
  }
  return Object.entries(directives)
    .map(([k, v]) => `${k} ${v.join(" ")}`)
    .join("; ");
}

export function buildSecurityHeaders(options: SecurityHeaderOptions = {}): Record<string, string> {
  const headers: Record<string, string> = {
    "x-frame-options": "DENY",
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "content-security-policy": buildCsp(options),
    "cross-origin-opener-policy": "same-origin",
    "cross-origin-resource-policy": "same-origin",
  };
  if (options.includeHsts) {
    headers["strict-transport-security"] = "max-age=63072000; includeSubDomains; preload";
  }
  return headers;
}

/** Paths that should receive the security headers. Keep in sync with middleware. */
export const SECURE_PATH_PREFIXES = [
  "/admin",
  "/director",
  "/teacher",
  "/family",
  "/student",
  "/dashboard",
  "/api",
] as const;

export function pathShouldBeSecured(pathname: string): boolean {
  return SECURE_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}
