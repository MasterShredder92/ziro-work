import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { AppError } from "@/lib/errors/AppError";

/**
 * HMAC signature verification for inbound webhooks.
 *
 * Producer sends `X-Ziro-Signature: t=<unix_seconds>,v1=<hex_digest>`
 * where digest = HMAC_SHA256(secret, `${t}.${rawBody}`).
 *
 * We tolerate a 5-minute clock skew by default to avoid flapping on
 * legitimate deliveries; operators can tighten this per webhook.
 */

export interface VerifyWebhookArgs {
  /** Raw request body (string) — do NOT use the parsed JSON. */
  rawBody: string;
  /** `X-Ziro-Signature` header value. */
  signatureHeader: string | null | undefined;
  /** Shared secret for this webhook. */
  secret: string;
  /** Max allowed clock skew in seconds. Default 300. */
  toleranceSeconds?: number;
  /** Override "now" for tests. */
  now?: number;
}

export interface VerifyWebhookResult {
  ok: boolean;
  reason?: string;
  timestamp?: number;
}

function parseSignatureHeader(
  raw: string,
): { timestamp: number; v1: string } | null {
  const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
  let t: number | null = null;
  let v1: string | null = null;
  for (const p of parts) {
    const [k, v] = p.split("=").map((s) => s.trim());
    if (!k || !v) continue;
    if (k === "t") {
      const n = Number(v);
      if (Number.isFinite(n)) t = n;
    } else if (k === "v1") {
      v1 = v;
    }
  }
  if (t === null || !v1) return null;
  return { timestamp: t, v1 };
}

function hexToBuf(hex: string): Buffer | null {
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2 !== 0) return null;
  try {
    return Buffer.from(hex, "hex");
  } catch {
    return null;
  }
}

export function verifyWebhook(args: VerifyWebhookArgs): VerifyWebhookResult {
  if (!args.signatureHeader) return { ok: false, reason: "missing_signature" };
  if (!args.secret) return { ok: false, reason: "missing_secret" };

  const parsed = parseSignatureHeader(args.signatureHeader);
  if (!parsed) return { ok: false, reason: "malformed_signature" };

  const tolerance = args.toleranceSeconds ?? 300;
  const nowSec = Math.floor((args.now ?? Date.now()) / 1000);
  if (Math.abs(nowSec - parsed.timestamp) > tolerance) {
    return { ok: false, reason: "stale_timestamp", timestamp: parsed.timestamp };
  }

  const expectedHex = createHmac("sha256", args.secret)
    .update(`${parsed.timestamp}.${args.rawBody}`)
    .digest("hex");

  const a = hexToBuf(expectedHex);
  const b = hexToBuf(parsed.v1);
  if (!a || !b || a.length !== b.length) {
    return { ok: false, reason: "bad_signature", timestamp: parsed.timestamp };
  }
  if (!timingSafeEqual(a, b)) {
    return { ok: false, reason: "bad_signature", timestamp: parsed.timestamp };
  }
  return { ok: true, timestamp: parsed.timestamp };
}

export function requireValidWebhook(args: VerifyWebhookArgs): void {
  const result = verifyWebhook(args);
  if (!result.ok) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "Webhook signature verification failed",
      details: { reason: result.reason ?? "invalid" },
    });
  }
}
