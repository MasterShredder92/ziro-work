import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { AppError } from "@/lib/errors/AppError";
function parseSignatureHeader(raw) {
    const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
    let t = null;
    let v1 = null;
    for (const p of parts) {
        const [k, v] = p.split("=").map((s) => s.trim());
        if (!k || !v)
            continue;
        if (k === "t") {
            const n = Number(v);
            if (Number.isFinite(n))
                t = n;
        }
        else if (k === "v1") {
            v1 = v;
        }
    }
    if (t === null || !v1)
        return null;
    return { timestamp: t, v1 };
}
function hexToBuf(hex) {
    if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2 !== 0)
        return null;
    try {
        return Buffer.from(hex, "hex");
    }
    catch (_a) {
        return null;
    }
}
export function verifyWebhook(args) {
    var _a, _b;
    if (!args.signatureHeader)
        return { ok: false, reason: "missing_signature" };
    if (!args.secret)
        return { ok: false, reason: "missing_secret" };
    const parsed = parseSignatureHeader(args.signatureHeader);
    if (!parsed)
        return { ok: false, reason: "malformed_signature" };
    const tolerance = (_a = args.toleranceSeconds) !== null && _a !== void 0 ? _a : 300;
    const nowSec = Math.floor(((_b = args.now) !== null && _b !== void 0 ? _b : Date.now()) / 1000);
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
export function requireValidWebhook(args) {
    var _a;
    const result = verifyWebhook(args);
    if (!result.ok) {
        throw new AppError({
            code: "FORBIDDEN",
            message: "Webhook signature verification failed",
            details: { reason: (_a = result.reason) !== null && _a !== void 0 ? _a : "invalid" },
        });
    }
}
