import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual, } from "node:crypto";
/**
 * AES-256-GCM at-rest encryption for sensitive fields (PII, tokens).
 *
 * Key provisioning:
 *   - Set `ZIRO_ENCRYPTION_KEY` in the environment. Accepted formats:
 *       * 64 hex chars (32 bytes)
 *       * Any length string — it will be SHA-256'd to derive a 32-byte key.
 *         Non-hex keys let operators use any strong passphrase, but we
 *         emit a warning on first derivation.
 *
 * Ciphertext envelope (JSON, base64-encoded fields):
 *   { v: 1, iv: "...", tag: "...", ct: "...", aad?: "..." }
 *
 * Store the whole envelope. Never store the raw plaintext alongside it.
 */
const ALGO = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;
const g = globalThis;
function resolveKey() {
    if (g.__ziro_encryption_key)
        return g.__ziro_encryption_key;
    const raw = process.env.ZIRO_ENCRYPTION_KEY;
    if (!raw || raw.length === 0) {
        throw new Error("ZIRO_ENCRYPTION_KEY is not set. Refuse to encrypt/decrypt without a key.");
    }
    // 64 hex chars -> 32 bytes
    if (/^[0-9a-fA-F]{64}$/.test(raw)) {
        g.__ziro_encryption_key = Buffer.from(raw, "hex");
        return g.__ziro_encryption_key;
    }
    if (!g.__ziro_encryption_warned) {
        console.warn("[security.crypto] ZIRO_ENCRYPTION_KEY is not 64 hex chars; deriving 32-byte key via SHA-256. " +
            "For long-term storage prefer a raw 32-byte hex key.");
        g.__ziro_encryption_warned = true;
    }
    g.__ziro_encryption_key = createHash("sha256").update(raw).digest();
    return g.__ziro_encryption_key;
}
export function encrypt(plaintext, options = {}) {
    const key = resolveKey();
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGO, key, iv, { authTagLength: TAG_BYTES });
    if (options.aad)
        cipher.setAAD(Buffer.from(options.aad, "utf8"));
    const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    const envelope = {
        v: 1,
        iv: iv.toString("base64"),
        tag: tag.toString("base64"),
        ct: ct.toString("base64"),
    };
    if (options.aad)
        envelope.aad = options.aad;
    return envelope;
}
export function decrypt(envelope) {
    if (!envelope || envelope.v !== 1) {
        throw new Error("Unknown cipher envelope version");
    }
    const key = resolveKey();
    const iv = Buffer.from(envelope.iv, "base64");
    const tag = Buffer.from(envelope.tag, "base64");
    const ct = Buffer.from(envelope.ct, "base64");
    if (iv.length !== IV_BYTES)
        throw new Error("Invalid IV length");
    if (tag.length !== TAG_BYTES)
        throw new Error("Invalid auth tag length");
    const decipher = createDecipheriv(ALGO, key, iv, { authTagLength: TAG_BYTES });
    if (envelope.aad)
        decipher.setAAD(Buffer.from(envelope.aad, "utf8"));
    decipher.setAuthTag(tag);
    const out = Buffer.concat([decipher.update(ct), decipher.final()]);
    return out.toString("utf8");
}
/** Serialize a CipherEnvelope to a single string. JSON is stable; no nesting concerns. */
export function envelopeToString(envelope) {
    return JSON.stringify(envelope);
}
export function envelopeFromString(raw) {
    const parsed = JSON.parse(raw);
    if (!parsed ||
        typeof parsed !== "object" ||
        parsed.v !== 1 ||
        typeof parsed.iv !== "string" ||
        typeof parsed.tag !== "string" ||
        typeof parsed.ct !== "string") {
        throw new Error("Not a valid cipher envelope");
    }
    return parsed;
}
/**
 * Constant-time string compare for secrets / tokens.
 * Both strings are utf8-encoded first; mismatched-length inputs always fail.
 */
export function timingSafeEqualStrings(a, b) {
    const aBuf = Buffer.from(a, "utf8");
    const bBuf = Buffer.from(b, "utf8");
    if (aBuf.length !== bBuf.length)
        return false;
    return timingSafeEqual(aBuf, bBuf);
}
