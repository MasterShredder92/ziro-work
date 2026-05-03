"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, MapPin, Briefcase } from "lucide-react";

type OverdueInvoice = {
  invoiceId: string;
  familyId: string;
  familyName: string;
  balanceCents: number;
  dueDate: string;
  status: string;
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
  capacitySignals: CapacitySignal[];
  topInstruments: TopInstrument[];
  hiringSignals: HiringSignal[];
};

function usd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const LOCATION_COLORS: Record<string, string> = {
  bellevue: "#7c3aed",
  gretna: "#059669",
  omaha: "#2563eb",
  elkhorn: "#d97706",
};

function resolveLocColor(name: string, fallback: string | null): string {
  const n = (name ?? "").toLowerCase();
  for (const [key, val] of Object.entries(LOCATION_COLORS)) {
    if (n.includes(key)) return val;
  }
  return fallback ?? "#6366f1";
}

function SectionBlock({
  icon,
  label,
  count,
  accent,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: `${accent}08`,
        border: `1px solid ${accent}22`,
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <div
          className="flex h-6 w-6 items-center justify-center rounded-lg"
          style={{ background: `${accent}20`, color: accent }}
        >
          {icon}
        </div>
        <span
          className="text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: accent }}
        >
          {label}
        </span>
        {count > 0 && (
          <span
            className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-extrabold"
            style={{ background: `${accent}25`, color: accent }}
          >
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <p className="py-1 text-[11px]" style={{ color: "var(--z-muted)" }}>
      {label}
    </p>
  );
}

export function ActionPanel() {
  const [data, setData] = useState<TasksData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/tasks", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json?.overdueInvoices !== undefined) setData(json as TasksData);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl"
            style={{ background: "#1a1a1c", border: "1px solid rgba(255,255,255,0.05)" }}
          />
        ))}
      </div>
    );
  }

  const overdue = data?.overdueInvoices ?? [];
  const capacity = data?.capacitySignals ?? [];
  const instruments = data?.topInstruments ?? [];
  const hiring = data?.hiringSignals ?? [];

  const hiringNeeds = hiring
    .filter((d) => d.sessions > 0)
    .sort((a, b) => b.sessions / (b.uniqueTeachers || 1) - a.sessions / (a.uniqueTeachers || 1))
    .slice(0, 3);

  return (
    <div className="space-y-3">
      {/* Overdue invoices */}
      <SectionBlock
        icon={<AlertTriangle className="h-3.5 w-3.5" />}
        label="Unpaid this month"
        count={overdue.length}
        accent="#ef4444"
      >
        {overdue.length === 0 ? (
          <EmptyState label="No outstanding balances." />
        ) : (
          <div className="space-y-1">
            {overdue.slice(0, 5).map((inv) => (
              <Link
                key={inv.invoiceId}
                href={`/crm/families/${inv.familyId}`}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs transition-all duration-100 hover:bg-[rgba(239,68,68,0.08)]"
              >
                <span className="truncate font-medium" style={{ color: "var(--z-fg)" }}>
                  {inv.familyName}
                </span>
                <span className="ml-3 shrink-0 font-extrabold" style={{ color: "#ef4444" }}>
                  {usd(inv.balanceCents)}
                </span>
              </Link>
            ))}
            {overdue.length > 5 && (
              <Link
                href="/invoices?status=open"
                className="block px-2 py-1 text-[11px] font-semibold hover:underline"
                style={{ color: "#ef4444" }}
              >
                +{overdue.length - 5} more →
              </Link>
            )}
          </div>
        )}
      </SectionBlock>

      {/* Open capacity */}
      <SectionBlock
        icon={<MapPin className="h-3.5 w-3.5" />}
        label="Open slots this month"
        count={capacity.reduce((s, c) => s + c.openSlots, 0)}
        accent="#2563eb"
      >
        {capacity.length === 0 ? (
          <EmptyState label="No open time blocks found." />
        ) : (
          <div className="space-y-1">
            {capacity.slice(0, 4).map((loc) => {
              const color = resolveLocColor(loc.locationName, loc.locationColor);
              return (
                <div
                  key={loc.locationId}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: color, boxShadow: `0 0 5px ${color}` }}
                    />
                    <span className="truncate font-semibold" style={{ color }}>
                      {loc.locationName}
                    </span>
                  </div>
                  <span
                    className="ml-3 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ background: `${color}18`, color }}
                  >
                    {loc.openSlots} slots
                  </span>
                </div>
              );
            })}
            {instruments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-2 pt-1">
                {instruments.slice(0, 4).map((i) => (
                  <span
                    key={i.instrument}
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                    style={{ background: "rgba(37,99,235,0.14)", color: "#2563eb" }}
                  >
                    {i.instrument} · {i.studentCount}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </SectionBlock>

      {/* Hiring signals */}
      <SectionBlock
        icon={<Briefcase className="h-3.5 w-3.5" />}
        label="Hiring signals"
        count={hiringNeeds.length}
        accent="#d97706"
      >
        {hiringNeeds.length === 0 ? (
          <EmptyState label="Not enough session data yet." />
        ) : (
          <div className="space-y-1">
            {hiringNeeds.map((d) => (
              <div
                key={d.dayOfWeek}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs"
              >
                <span className="font-semibold" style={{ color: "var(--z-fg)" }}>
                  {d.dayName}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ background: "rgba(217,119,6,0.15)", color: "#d97706" }}
                  >
                    {d.sessions} sessions
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--z-muted)" }}>
                    {d.uniqueTeachers} teacher{d.uniqueTeachers !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionBlock>
    </div>
  );
}
