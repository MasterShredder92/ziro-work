export function normalizeName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (trimmed.length === 0) return null;
  return trimmed
    .split(" ")
    .map((part) =>
      part.length <= 1
        ? part.toUpperCase()
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
    )
    .join(" ");
}

export function normalizePhone(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const str = String(raw);
  const digits = str.replace(/\D+/g, "");
  if (digits.length === 0) return null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.length === 0) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return trimmed;
}

export function normalizeDate(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  if (raw instanceof Date) {
    if (Number.isNaN(raw.getTime())) return null;
    return raw.toISOString();
  }
  if (typeof raw === "number") {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(`${trimmed}T00:00:00Z`);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  const d = new Date(trimmed);
  if (!Number.isNaN(d.getTime())) return d.toISOString();

  const mdy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (mdy) {
    const [, mm, dd, yRaw] = mdy;
    const year =
      yRaw.length === 2
        ? 2000 + Number.parseInt(yRaw, 10)
        : Number.parseInt(yRaw, 10);
    const month = Number.parseInt(mm, 10) - 1;
    const day = Number.parseInt(dd, 10);
    const parsed = new Date(Date.UTC(year, month, day));
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  return null;
}

export function normalizeMoney(raw: unknown): {
  amountCents: number;
  currency: string;
} | null {
  if (raw === null || raw === undefined) return null;

  let amountRaw: unknown = raw;
  let currency = "USD";

  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.currency === "string") currency = obj.currency.toUpperCase();
    if ("amount_cents" in obj && typeof obj.amount_cents === "number") {
      return { amountCents: Math.round(obj.amount_cents), currency };
    }
    if ("amountCents" in obj && typeof obj.amountCents === "number") {
      return { amountCents: Math.round(obj.amountCents), currency };
    }
    if ("amount" in obj) amountRaw = obj.amount;
  }

  if (typeof amountRaw === "number") {
    if (!Number.isFinite(amountRaw)) return null;
    return { amountCents: Math.round(amountRaw * 100), currency };
  }

  if (typeof amountRaw === "string") {
    const cleaned = amountRaw.replace(/[^\d.\-]/g, "");
    if (cleaned.length === 0) return null;
    const num = Number.parseFloat(cleaned);
    if (!Number.isFinite(num)) return null;
    return { amountCents: Math.round(num * 100), currency };
  }

  return null;
}
