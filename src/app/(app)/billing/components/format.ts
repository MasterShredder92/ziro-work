export function formatCents(
  cents: number | null | undefined,
  currency = "USD",
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(((cents ?? 0) as number) / 100);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US");
}

export function statusTone(status: string | null | undefined): string {
  switch ((status ?? "").toLowerCase()) {
    case "paid":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "void":
      return "bg-zinc-500/15 text-zinc-300 border-zinc-500/30";
    case "overdue":
      return "bg-red-500/15 text-red-300 border-red-500/30";
    case "partial":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "open":
    case "sent":
      return "bg-sky-500/15 text-sky-300 border-sky-500/30";
    case "draft":
    default:
      return "bg-white/5 text-[var(--z-muted)] border-[var(--z-border)]";
  }
}
