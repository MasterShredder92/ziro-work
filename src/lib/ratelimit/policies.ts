import type { LimiterPolicy } from "./limiter";

/**
 * Canonical rate-limit policies. Keep `max` + `windowMs` tight enough to
 * stop abuse but loose enough to avoid false positives for real traffic.
 *
 * Defaults are conservative; override via env if operators need to tune.
 */

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export const POLICIES = {
  /** Unauthenticated form submissions (public intake, public form runner). */
  publicForms: {
    id: "public_forms",
    max: envInt("ZIRO_RL_PUBLIC_FORMS_MAX", 20),
    windowMs: envInt("ZIRO_RL_PUBLIC_FORMS_WINDOW_MS", 60_000),
  } satisfies LimiterPolicy,

  /** Public signature page submits. */
  publicSignature: {
    id: "public_signature",
    max: envInt("ZIRO_RL_PUBLIC_SIG_MAX", 10),
    windowMs: envInt("ZIRO_RL_PUBLIC_SIG_WINDOW_MS", 60_000),
  } satisfies LimiterPolicy,

  /** Public share-link reads (view a shared file/form). */
  publicShareLink: {
    id: "public_share_link",
    max: envInt("ZIRO_RL_PUBLIC_SHARE_MAX", 60),
    windowMs: envInt("ZIRO_RL_PUBLIC_SHARE_WINDOW_MS", 60_000),
  } satisfies LimiterPolicy,

  /** Login attempts per IP (brute-force protection). */
  loginIp: {
    id: "login_ip",
    max: envInt("ZIRO_RL_LOGIN_IP_MAX", 10),
    windowMs: envInt("ZIRO_RL_LOGIN_IP_WINDOW_MS", 5 * 60_000),
  } satisfies LimiterPolicy,

  /** Login attempts per tenant+ip combo. */
  loginTenantIp: {
    id: "login_tenant_ip",
    max: envInt("ZIRO_RL_LOGIN_TENANT_IP_MAX", 20),
    windowMs: envInt("ZIRO_RL_LOGIN_TENANT_IP_WINDOW_MS", 5 * 60_000),
  } satisfies LimiterPolicy,

  /** Generic IP-level brute-force ceiling across all auth surfaces. */
  ipBurst: {
    id: "ip_burst",
    max: envInt("ZIRO_RL_IP_BURST_MAX", 120),
    windowMs: envInt("ZIRO_RL_IP_BURST_WINDOW_MS", 60_000),
  } satisfies LimiterPolicy,
} as const;

export type PolicyId = (typeof POLICIES)[keyof typeof POLICIES]["id"];
