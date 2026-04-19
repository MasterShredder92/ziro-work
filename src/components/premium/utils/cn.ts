type ClassValue =
  | string
  | number
  | false
  | null
  | undefined
  | ClassValue[]
  | { [klass: string]: unknown };

function toClassName(value: ClassValue): string {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(toClassName).filter(Boolean).join(" ");
  if (typeof value === "object") {
    return Object.entries(value)
      .filter(([, v]) => Boolean(v))
      .map(([k]) => k)
      .join(" ");
  }
  return "";
}

export function cn(...values: ClassValue[]) {
  return values.map(toClassName).filter(Boolean).join(" ");
}

