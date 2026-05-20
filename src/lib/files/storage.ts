// Storage engine for Files OS.
// Supabase Storage primary + in-memory fallback. Handles:
//   - upload, versioning, mime detection, thumbnail stub, signed URL, expiration.

import { clientFor } from "@data/_client";

const DEFAULT_BUCKET = "files";
const SIGNED_URL_DEFAULT_TTL = 60 * 60; // 1 hour

type GlobalStore = typeof globalThis & {
  __ziro_files_blob_store?: Map<string, Uint8Array>;
  __ziro_files_storage_missing?: boolean;
};

function blobStore(): Map<string, Uint8Array> {
  const g = globalThis as GlobalStore;
  if (!g.__ziro_files_blob_store) g.__ziro_files_blob_store = new Map();
  return g.__ziro_files_blob_store;
}

function markStorageMissing(): void {
  (globalThis as GlobalStore).__ziro_files_storage_missing = true;
}

function storageMissing(): boolean {
  return (globalThis as GlobalStore).__ziro_files_storage_missing === true;
}

function supabaseStorageErrorIsMissing(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const rec = err as Record<string, unknown>;
  const status = rec.statusCode ?? rec.status;
  const message = typeof rec.message === "string" ? rec.message.toLowerCase() : "";
  if (status === 404 || status === "404") return true;
  if (message.includes("bucket not found")) return true;
  if (message.includes("storage")) return true;
  return false;
}

export interface StoredBlob {
  storageKey: string;
  storageBucket: string;
  size: number;
  mimeType: string;
  checksum: string;
}

export interface UploadInput {
  tenantId: string;
  fileId: string;
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
  version?: number;
  bucket?: string;
}

/**
 * Sniff a MIME type from magic bytes when extension / browser type is missing.
 */
export function sniffMimeFromBytes(bytes: Uint8Array): string | null {
  if (bytes.length < 4) return null;
  const b0 = bytes[0];
  const b1 = bytes[1];
  const b2 = bytes[2];
  const b3 = bytes[3];
  if (b0 === 0x25 && b1 === 0x50 && b2 === 0x44 && b3 === 0x46) return "application/pdf";
  if (b0 === 0x89 && b1 === 0x50 && b2 === 0x4e && b3 === 0x47) return "image/png";
  if (b0 === 0xff && b1 === 0xd8 && b2 === 0xff) return "image/jpeg";
  if (b0 === 0x47 && b1 === 0x49 && b2 === 0x46 && b3 === 0x38) return "image/gif";
  if (b0 === 0x52 && b1 === 0x49 && b2 === 0x46 && b3 === 0x46) return "image/webp";
  if (b0 === 0x49 && b1 === 0x44 && b2 === 0x33) return "audio/mpeg";
  if (bytes.length >= 12 && b0 === 0 && b1 === 0 && b2 === 0 && b3 === 0x1c) return "video/mp4";
  if (b0 === 0x1a && b1 === 0x45 && b2 === 0xdf && b3 === 0xa3) return "video/webm";
  if (b0 === 0x7b || (b0 === 0x5b && bytes.length < 4096)) return "application/json";
  return null;
}

export function resolveMimeType(
  fileName: string,
  declared: string | undefined,
  bytes: Uint8Array,
): string {
  const d = (declared ?? "").trim().toLowerCase();
  if (d && d !== "application/octet-stream") return declared!;
  const sniffed = sniffMimeFromBytes(bytes);
  if (sniffed) return sniffed;
  return detectMimeType(fileName);
}

/** Filename-based MIME when bytes sniffing is inconclusive. */
export function detectMimeType(
  fileName: string,
  fallback = "application/octet-stream",
): string {
  const lower = fileName.toLowerCase();
  const ext = lower.split(".").pop() ?? "";
  const map: Record<string, string> = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
    txt: "text/plain",
    md: "text/markdown",
    csv: "text/csv",
    json: "application/json",
    xml: "application/xml",
    html: "text/html",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  };
  return map[ext] ?? fallback;
}

export function extensionFromName(fileName: string): string | null {
  const idx = fileName.lastIndexOf(".");
  if (idx < 0 || idx === fileName.length - 1) return null;
  return fileName.slice(idx + 1).toLowerCase();
}

/**
 * Simple but deterministic checksum for integrity (not cryptographic).
 * Good enough for change-detection; real deployments should swap for SHA-256.
 */
/**
 * Yields to the event loop before hashing so clients can paint between work units.
 */
export async function checksumOfYielding(bytes: Uint8Array): Promise<string> {
  await new Promise<void>((r) => {
    if (typeof queueMicrotask === "function") queueMicrotask(() => r());
    else setTimeout(r, 0);
  });
  return checksumOf(bytes);
}

export async function checksumOf(bytes: Uint8Array): Promise<string> {
  try {
    const c = (globalThis as { crypto?: Crypto }).crypto;
    if (c?.subtle) {
      const buf = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(buf).set(bytes);
      const hash = await c.subtle.digest("SHA-256", buf);
      const view = new Uint8Array(hash);
      let out = "";
      for (let i = 0; i < view.length; i++) {
        out += view[i].toString(16).padStart(2, "0");
      }
      return out;
    }
  } catch {
    // fall through
  }
  let h = 5381;
  for (let i = 0; i < bytes.length; i++) {
    h = ((h << 5) + h + bytes[i]) | 0;
  }
  return `plain-${(h >>> 0).toString(16)}`;
}

export function decodeBase64(base64: string): Uint8Array {
  const clean = base64.includes(",")
    ? base64.slice(base64.indexOf(",") + 1)
    : base64;
  if (typeof atob === "function") {
    const bin = atob(clean);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  const buf = Buffer.from(clean, "base64");
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

export function encodeBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") return Buffer.from(bytes).toString("base64");
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  if (typeof btoa === "function") return btoa(s);
  return "";
}

/**
 * Virus-scan placeholder. In production, wire to ClamAV / 3rd party.
 */
export async function scanForVirus(
  _bytes: Uint8Array,
): Promise<"clean" | "infected" | "skipped"> {
  void _bytes;
  return "skipped";
}

/**
 * Thumbnail generation placeholder. Returns storage key where a thumbnail
 * would live. Real implementation would render PDFs and resize images.
 */
export async function generateThumbnail(
  mimeType: string,
  storageKey: string,
): Promise<string | null> {
  if (!mimeType.startsWith("image/") && mimeType !== "application/pdf") {
    return null;
  }
  return `${storageKey}.thumb`;
}

function buildStorageKey(
  tenantId: string,
  fileId: string,
  version: number,
  fileName: string,
): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  return `${tenantId}/${fileId}/v${version}-${safeName}`;
}

export async function uploadBlob(input: UploadInput): Promise<StoredBlob> {
  const bucket = input.bucket ?? DEFAULT_BUCKET;
  const version = input.version ?? 1;
  const storageKey = buildStorageKey(
    input.tenantId,
    input.fileId,
    version,
    input.fileName,
  );
  const mimeType = resolveMimeType(
    input.fileName,
    input.mimeType,
    input.bytes,
  );
  const checksum = await checksumOfYielding(input.bytes);

  if (!storageMissing()) {
    try {
      const supabase = await clientFor(input.tenantId);
      const { error } = await supabase.storage
        .from(bucket)
        .upload(storageKey, input.bytes, {
          contentType: mimeType,
          upsert: true,
        });
      if (error) throw error;
      return {
        storageKey,
        storageBucket: bucket,
        size: input.bytes.length,
        mimeType,
        checksum,
      };
    } catch (err) {
      if (supabaseStorageErrorIsMissing(err)) {
        markStorageMissing();
      } else {
        markStorageMissing();
      }
    }
  }

  const compositeKey = `${bucket}/${storageKey}`;
  blobStore().set(compositeKey, input.bytes);
  return {
    storageKey,
    storageBucket: bucket,
    size: input.bytes.length,
    mimeType,
    checksum,
  };
}

export async function readBlob(
  tenantId: string,
  storageKey: string,
  bucket: string = DEFAULT_BUCKET,
): Promise<Uint8Array | null> {
  if (!storageMissing()) {
    try {
      const supabase = await clientFor(tenantId);
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(storageKey);
      if (error) throw error;
      const buf = await data.arrayBuffer();
      return new Uint8Array(buf);
    } catch (err) {
      if (supabaseStorageErrorIsMissing(err)) markStorageMissing();
      else markStorageMissing();
    }
  }
  const compositeKey = `${bucket}/${storageKey}`;
  return blobStore().get(compositeKey) ?? null;
}

export async function deleteBlob(
  tenantId: string,
  storageKey: string,
  bucket: string = DEFAULT_BUCKET,
): Promise<void> {
  if (!storageMissing()) {
    try {
      const supabase = await clientFor(tenantId);
      const { error } = await supabase.storage.from(bucket).remove([storageKey]);
      if (error) throw error;
      return;
    } catch (err) {
      if (supabaseStorageErrorIsMissing(err)) markStorageMissing();
      else markStorageMissing();
    }
  }
  const compositeKey = `${bucket}/${storageKey}`;
  blobStore().delete(compositeKey);
}

export interface SignedUrlResult {
  url: string;
  expiresAt: string;
}

/**
 * Generate a signed URL. In fallback mode, returns a data URL which is only
 * safe for dev/preview.
 */
async function withBackoff<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (i === attempts - 1) break;
      await new Promise((r) => setTimeout(r, 120 * 2 ** i));
    }
  }
  throw last;
}

export async function createSignedUrl(
  tenantId: string,
  storageKey: string,
  opts?: { ttlSeconds?: number; bucket?: string; download?: boolean },
): Promise<SignedUrlResult> {
  const ttl = opts?.ttlSeconds ?? SIGNED_URL_DEFAULT_TTL;
  const bucket = opts?.bucket ?? DEFAULT_BUCKET;
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

  if (!storageMissing()) {
    try {
      const signed = await withBackoff(async () => {
        const supabase = await clientFor(tenantId);
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(storageKey, ttl, { download: opts?.download });
        if (error) throw error;
        return data.signedUrl;
      });
      return { url: signed, expiresAt };
    } catch (err) {
      if (supabaseStorageErrorIsMissing(err)) markStorageMissing();
      else markStorageMissing();
    }
  }

  const bytes = blobStore().get(`${bucket}/${storageKey}`);
  if (!bytes) {
    return { url: `file://${bucket}/${storageKey}`, expiresAt };
  }
  const mime = sniffMimeFromBytes(bytes) ?? detectMimeType(storageKey);
  const dataUrl = `data:${mime};base64,${encodeBase64(bytes)}`;
  return { url: dataUrl, expiresAt };
}

type GlobalSignedCache = typeof globalThis & {
  __ziro_files_signed_url_cache?: Map<string, SignedUrlResult>;
};

function signedUrlCacheMap(): Map<string, SignedUrlResult> {
  const g = globalThis as GlobalSignedCache;
  if (!g.__ziro_files_signed_url_cache)
    g.__ziro_files_signed_url_cache = new Map();
  return g.__ziro_files_signed_url_cache;
}

function signedUrlCacheKey(
  tenantId: string,
  storageKey: string,
  bucket: string,
  ttl: number,
  download?: boolean,
): string {
  return `${tenantId}|${bucket}|${storageKey}|${ttl}|${download ? "1" : "0"}`;
}

/** Reuse signed URLs until shortly before expiry to reduce storage API calls. */
export async function createSignedUrlCached(
  tenantId: string,
  storageKey: string,
  opts?: { ttlSeconds?: number; bucket?: string; download?: boolean },
): Promise<SignedUrlResult> {
  const ttl = opts?.ttlSeconds ?? SIGNED_URL_DEFAULT_TTL;
  const bucket = opts?.bucket ?? DEFAULT_BUCKET;
  const key = signedUrlCacheKey(tenantId, storageKey, bucket, ttl, opts?.download);
  const cached = signedUrlCacheMap().get(key);
  const skewMs = 15_000;
  if (cached && !isExpired(cached.expiresAt, new Date(Date.now() + skewMs))) {
    return cached;
  }
  const fresh = await createSignedUrl(tenantId, storageKey, opts);
  signedUrlCacheMap().set(key, fresh);
  return fresh;
}

/**
 * Upload then verify checksum round-trip; one automatic re-upload if mismatched.
 */
export async function uploadBlobWithIntegrityRetry(
  input: UploadInput,
): Promise<StoredBlob> {
  let stored = await uploadBlob(input);
  const roundTrip = await readBlob(input.tenantId, stored.storageKey, input.bucket);
  const h = roundTrip ? await checksumOf(roundTrip) : null;
  if (h && h !== stored.checksum) {
    stored = await uploadBlob(input);
  }
  return stored;
}

export function isExpired(
  expiresAt: string | null | undefined,
  now = new Date(),
): boolean {
  if (!expiresAt) return false;
  const exp = new Date(expiresAt).getTime();
  if (Number.isNaN(exp)) return false;
  return exp <= now.getTime();
}
