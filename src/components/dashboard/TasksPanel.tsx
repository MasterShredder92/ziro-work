"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, UserPlus, MapPin, Briefcase } from "lucide-react";
import { formatUsdFromCents } from "./dashboardFormat";

type OverdueInvoice = {
  invoiceId: string;
  familyId: string;
  familyName: string;
  balanceCents: number;
  dueDate: string;
  status: string;
};

type UncontactedLead = {
  leadId: string;
  name: string;
  instrument: string | null;
  source: string | null;
  createdAt: string;
};

type CapacitySignal = {
  locationId: string;
  locationName: string;
  locationColor: string | null;
  openSlots: number;
};

type TopInstrument = {
  instrument: string;
  studentCount: number;
};

type HiringSignal = {
  dayOfWeek: number;
  dayName: string;
  sessions: number;
  uniqueTeachers: number;
};

type TasksData = {
  overdueInvoices: OverdueInvoice[];
  uncontactedLeads: UncontactedLead[];
  capacitySignals: CapacitySignal[];
  topInstruments: TopInstrument[];
  hiringSignals: HiringSignal[];
};

function SectionHeader({ icon, label, count }: { icon: React.ReactNode; label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 pb-1.5 pt-0.5">
      <span className="text-[var(--z-muted)]">{icon}</span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]">
        {label}
      </span>
      {count > 0 && (
        <span className="ml-auto rounded-full bg-[color-mix(in_oklab,var(--z-accent),transparent_82%)] px-2 py-0.5 text-[10px] font-bold text-[var(--z-accent)]">
          {count}
        </span>
      )}
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <p className="py-1.5 text-xs text-[color-mix(in_oklab,var(--z-fg),transparent_55%)]">{label}</p>
  );
}

export function TasksPanel() {
  const [data, setData] = useState<TasksData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/tasks", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json?.overdueInvoices !== undefined) {
          setData(json as TasksData);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 animate-pulse rounded-lg bg-[var(--z-surface-2)]" />
        ))}
      </div>
    );
  }

  const overdue = data?.overdueInvoices ?? [];
  const leads = data?.uncontactedLeads ?? [];
  const capacity = data?.capacitySignals ?? [];
  const instruments = data?.topInstruments ?? [];
  const hiring = data?.hiringSignals ?? [];

  // Hiring signal: top 3 busiest days with fewest teachers
  const hiringNeeds = hiring
    .filter((d) => d.sessions > 0)
    .sort((a, b) => b.sessions / (b.uniqueTeachers || 1) - a.sessions / (a.uniqueTeachers || 1))
    .slice(0, 3);

  return (
    <div className="space-y-4 divide-y divide-[color-mix(in_oklab,var(--z-border),transparent_40%)]">
      {/* ── Overdue invoices ──────────────────────────────────── */}
      <div>
        <SectionHeader
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
          label="Unpaid this month"
          count={overdue.length}
        />
        {overdue.length === 0 ? (
          <EmptyRow label="No outstanding balances this month." />
        ) : (
          <div className="space-y-1">
            {overdue.slice(0, 5).map((inv) => (
              <Link
                key={inv.invoiceId}
                href={`/crm/families/${inv.familyId}`}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-[color-mix(in_oklab,var(--z-surface-2),transparent_30%)]"
              >
                <span className="truncate font-medium text-[var(--z-fg)]">{inv.familyName}</span>
                <span className="ml-3 shrink-0 font-bold text-red-400">
                  {formatUsdFromCents(inv.balanceCents)}
                </span>
              </Link>
            ))}
            {overdue.length > 5 && (
              <Link
                href="/invoices?status=open"
                className="block px-2 py-1 text-[11px] text-[var(--z-accent)] hover:underline"
              >
                +{overdue.length - 5} more →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── Uncontacted leads ─────────────────────────────────── */}
      <div className="pt-3">
        <SectionHeader
          icon={<UserPlus className="h-3.5 w-3.5" />}
          label="Leads to contact"
          count={leads.length}
        />
        {leads.length === 0 ? (
          <EmptyRow label="No uncontacted leads right now." />
        ) : (
          <div className="space-y-1">
            {leads.slice(0, 5).map((lead) => (
              <Link
                key={lead.leadId}
                href={`/lifecycle/lead-work`}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-[color-mix(in_oklab,var(--z-surface-2),transparent_30%)]"
              >
                <span className="truncate font-medium text-[var(--z-fg)]">{lead.name}</span>
                {lead.instrument && (
                  <span className="ml-3 shrink-0 capitalize text-[var(--z-muted)]">
                    {lead.instrument}
                  </span>
                )}
              </Link>
            ))}
            {leads.length > 5 && (
              <Link
                href="/lifecycle/lead-work"
                className="block px-2 py-1 text-[11px] text-[var(--z-accent)] hover:underline"
              >
                +{leads.length - 5} more →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── Open capacity ─────────────────────────────────────── */}
      <div className="pt-3">
        <SectionHeader
          icon={<MapPin className="h-3.5 w-3.5" />}
          label="Open slots this month"
          count={capacity.reduce((s, c) => s + c.openSlots, 0)}
        />
        {capacity.length === 0 ? (
          <EmptyRow label="No open time blocks found." />
        ) : (
          <div className="space-y-1">
            {capacity.slice(0, 4).map((loc) => (
              <div
                key={loc.locationId}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs"
              >
                <span
                  className="truncate font-medium"
                  style={{ color: loc.locationColor ?? "var(--z-fg)" }}
                >
                  {loc.locationName}
                </span>
                <span className="ml-3 shrink-0 text-[var(--z-muted)]">
                  {loc.openSlots} slots
                </span>
              </div>
            ))}
            {instruments.length > 0 && (
              <p className="px-2 pt-1 text-[11px] text-[color-mix(in_oklab,var(--z-fg),transparent_45%)]">
                Top demand:{" "}
                {instruments
                  .slice(0, 3)
                  .map((i) => `${i.instrument} (${i.studentCount})`)
                  .join(", ")}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Hiring signals ────────────────────────────────────── */}
      <div className="pt-3">
        <SectionHeader
          icon={<Briefcase className="h-3.5 w-3.5" />}
          label="Hiring signals"
          count={0}
        />
        {hiringNeeds.length === 0 ? (
          <EmptyRow label="Not enough session data yet." />
        ) : (
          <div className="space-y-1">
            {hiringNeeds.map((d) => (
              <div
                key={d.dayOfWeek}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs"
              >
                <span className="font-medium text-[var(--z-fg)]">{d.dayName}</span>
                <span className="text-[var(--z-muted)]">
                  {d.sessions} sessions · {d.uniqueTeachers} teacher{d.uniqueTeachers !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
            {instruments.length > 0 && (
              <p className="px-2 pt-1 text-[11px] text-[color-mix(in_oklab,var(--z-fg),transparent_45%)]">
                Consider hiring:{" "}
                {instruments
                  .slice(0, 3)
                  .map((i) => i.instrument)
                  .join(", ")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
