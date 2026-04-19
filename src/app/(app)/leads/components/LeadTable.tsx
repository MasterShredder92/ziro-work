import Link from "next/link";
import { cn } from "@/components/ui/utils/cn";
import type { LeadRow } from "@/lib/leads/types";

export interface LeadTableProps {
  leads: LeadRow[];
  basePath?: string;
  maxRows?: number;
  emptyMessage?: string;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function leadName(lead: LeadRow): string {
  const first = (lead as unknown as { first_name?: string | null }).first_name ?? "";
  const last = (lead as unknown as { last_name?: string | null }).last_name ?? "";
  const parent = (lead as unknown as { parent_name?: string | null }).parent_name ?? "";
  const fallback = (lead as unknown as { student_name?: string | null }).student_name ?? "";
  return `${first} ${last}`.trim() || parent || fallback || "Unnamed";
}

function StageBadge({ stage }: { stage: string | null | undefined }) {
  const label = stage ?? "new";
  const tone =
    label === "enrolled" || label === "converted"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : label === "lost"
        ? "bg-red-500/15 text-red-300 border-red-500/30"
        : label === "trial"
          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
          : "bg-white/5 text-[var(--z-muted)] border-[var(--z-border)]";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize",
        tone,
      )}
    >
      {label}
    </span>
  );
}

function TierBadge({
  tier,
}: {
  tier: LeadRow["qualification_tier"];
}) {
  const label = tier ?? "—";
  const tone =
    tier === "hot"
      ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
      : tier === "warm"
        ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
        : tier === "cold"
          ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
          : "bg-white/5 text-[var(--z-muted)] border-[var(--z-border)]";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em]",
        tone,
      )}
    >
      {label}
    </span>
  );
}

export function LeadTable({
  leads,
  basePath = "/leads",
  maxRows = 200,
  emptyMessage = "No leads yet.",
}: LeadTableProps) {
  const rows = leads.slice(0, maxRows);

  if (rows.length === 0) {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center text-sm text-[var(--z-muted)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[color-mix(in_oklab,var(--z-surface),white_2%)] text-[11px] uppercase tracking-wider text-[var(--z-muted)]">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold">Lead</th>
              <th className="px-4 py-2.5 text-left font-semibold">Instrument</th>
              <th className="px-4 py-2.5 text-left font-semibold">Source</th>
              <th className="px-4 py-2.5 text-left font-semibold">Stage</th>
              <th className="px-4 py-2.5 text-left font-semibold">Tier</th>
              <th className="px-4 py-2.5 text-right font-semibold">Score</th>
              <th className="px-4 py-2.5 text-right font-semibold">Age</th>
              <th className="px-4 py-2.5 text-right font-semibold">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((lead) => {
              const row = lead as unknown as Record<string, unknown>;
              const email = (row.email as string | null | undefined) ?? null;
              const phone = (row.phone as string | null | undefined) ?? null;
              const instrument =
                (row.instrument as string | null | undefined) ?? null;
              const source =
                (row.source as string | null | undefined) ??
                (row.how_heard as string | null | undefined) ??
                "—";
              return (
                <tr
                  key={lead.id}
                  className="border-t border-[var(--z-border)] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3 min-w-[220px]">
                    <Link
                      href={`${basePath}/${lead.id}`}
                      className="block min-w-0"
                    >
                      <div className="text-sm font-medium text-[var(--z-fg)] truncate">
                        {leadName(lead)}
                      </div>
                      <div className="text-xs text-[var(--z-muted)] truncate">
                        {email ?? phone ?? "—"}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--z-fg)]">
                    {instrument ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--z-fg)]">{source}</td>
                  <td className="px-4 py-3">
                    <StageBadge stage={lead.stage ?? null} />
                  </td>
                  <td className="px-4 py-3">
                    <TierBadge tier={lead.qualification_tier} />
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--z-fg)]">
                    {lead.qualification_score ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--z-muted)]">
                    {lead.age_days}d
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--z-muted)]">
                    {formatDate(lead.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
