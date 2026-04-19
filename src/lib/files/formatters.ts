type LastAccessLike = {
  lastAccessedAt?: unknown;
  lastAccessed?: unknown;
  accessedAt?: unknown;
  timestamp?: unknown;
  at?: unknown;
};

export type NormalizedTimestamp = {
  iso: string;
  relative: string;
};

const EMPTY_RESULT: NormalizedTimestamp = { iso: "", relative: "-" };

function toDate(value: unknown): Date | null {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return null;
  return d;
}

function pickRawTimestamp(input: LastAccessLike | null | undefined): string | null {
  if (!input || typeof input !== "object") return null;
  const candidate =
    input.lastAccessedAt ??
    input.lastAccessed ??
    input.accessedAt ??
    input.timestamp ??
    input.at;
  return typeof candidate === "string" ? candidate : null;
}

function relativeFromDate(d: Date): string {
  const deltaMs = Date.now() - d.getTime();
  if (!Number.isFinite(deltaMs)) return "just now";
  const minutes = Math.floor(Math.abs(deltaMs) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

export function normalizeAccessTimestamp(
  input: LastAccessLike | null | undefined,
): NormalizedTimestamp {
  const raw = pickRawTimestamp(input);
  if (!raw) return EMPTY_RESULT;
  const date = toDate(raw);
  if (!date) return EMPTY_RESULT;
  return {
    iso: date.toISOString(),
    relative: relativeFromDate(date),
  };
}

// Backwards-compatible alias while callers migrate to normalizeAccessTimestamp.
export const normalizeLastAccessedTimestamp = normalizeAccessTimestamp;
