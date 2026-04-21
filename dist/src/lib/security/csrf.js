import "server-only";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { AppError } from "@/lib/errors/AppError";
/**
 * Double-submit CSRF token.
 *
 * Flow:
 *   1. On any GET that renders a form, call `ensureCsrfToken()` once. It
 *      sets `ziro_csrf` cookie if missing and returns the token string.
 *   2. The form submits the same token back in a hidden field OR an
 *      `x-ziro-csrf` header.
 *   3. On non-safe verbs (POST/PUT/PATCH/DELETE), call `requireCsrf(req)`
 *      — it validates header/body token against cookie via constant-time
 *      compare.
 *
 * Supabase session cookies already use SameSite=Lax which blocks most
 * cross-site POSTs, but we enforce double-submit anyway for defence in depth.
 */
export const CSRF_COOKIE = "ziro_csrf";
export const CSRF_HEADER = "x-ziro-csrf";
export const CSRF_FIELD = "_csrf";
function generateToken() {
    return randomBytes(32).toString("base64url");
}
export async function ensureCsrfToken() {
    var _a;
    const store = await cookies();
    const existing = (_a = store.get(CSRF_COOKIE)) === null || _a === void 0 ? void 0 : _a.value;
    if (existing && existing.length >= 16)
        return existing;
    const token = generateToken();
    try {
        store.set({
            name: CSRF_COOKIE,
            value: token,
            httpOnly: false,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24,
        });
    }
    catch (_b) {
        // Setting cookies is only allowed in some Next.js phases; swallow silently
        // and let the next GET that can set cookies rotate it.
    }
    return token;
}
export async function getCsrfCookieToken() {
    var _a, _b;
    const store = await cookies();
    return (_b = (_a = store.get(CSRF_COOKIE)) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : null;
}
function tokensEqual(a, b) {
    const aBuf = Buffer.from(a, "utf8");
    const bBuf = Buffer.from(b, "utf8");
    if (aBuf.length !== bBuf.length)
        return false;
    return timingSafeEqual(aBuf, bBuf);
}
/**
 * Verify the CSRF token on the incoming request. Reads the token from the
 * header first, then falls back to an `_csrf` form field if the body is
 * form-encoded. Returns true on success; false (or throw) on failure.
 */
export async function verifyCsrf(req) {
    var _a;
    const cookieToken = await getCsrfCookieToken();
    if (!cookieToken)
        return false;
    const headerToken = req.headers.get(CSRF_HEADER);
    if (headerToken && tokensEqual(headerToken, cookieToken))
        return true;
    const contentType = (_a = req.headers.get("content-type")) !== null && _a !== void 0 ? _a : "";
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
        try {
            const cloned = req.clone();
            const form = await cloned.formData();
            const val = form.get(CSRF_FIELD);
            if (typeof val === "string" && tokensEqual(val, cookieToken))
                return true;
        }
        catch (_b) {
            return false;
        }
    }
    return false;
}
export async function requireCsrf(req) {
    const ok = await verifyCsrf(req);
    if (!ok)
        throw AppError.forbidden("CSRF token missing or invalid");
}
/**
 * Skip CSRF for requests that carry a valid bearer token or webhook
 * signature — those mechanisms prove intent on their own.
 */
export function isCsrfExempt(req) {
    const auth = req.headers.get("authorization");
    if (auth && /^Bearer\s+\S+/i.test(auth))
        return true;
    if (req.headers.get("x-ziro-signature"))
        return true;
    return false;
}
