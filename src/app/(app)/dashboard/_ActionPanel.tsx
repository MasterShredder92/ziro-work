"use client";

import Link from "next/link";
import { AlertTriangle, MapPin, Briefcase } from "lucide-react";
import { useDashboardTasks } from "./_useDashboardTasks";

function usd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const LOCATION_COLORS: Record<string, string> = {
  bellevue: "#7c3aed",
  gretna:   "#059669",
  omaha:    "#2563eb",
  elkhorn:  "#d97706",
};

function resolveLocColor(name: string, fallback: string | null): string {
  const n = (name ?? "").toLowerCase();
  for (const [key, val] of Object.entries(LOCATION_COLORS)) {
    if (n.includes(key)) return val;
  }
  return fallback ?? "#6366f1";
}

// Avatar initials from family name
function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// Deterministic color from name
function avatarColor(name: string): [string, string] {
  const palette: [string, string][] = [
    ["#c4f036", "rgba(0,255,136,0.15)"],
    ["#2563eb", "rgba(37,99,235,0.15)"],
    ["#7c3aed", "rgba(124,58,237,0.15)"],
    ["#d97706", "rgba(217,119,6,0.15)"],
    ["#ef4444", "rgba(239,68,68,0.15)"],
    ["#ec4899", "rgba(236,72,153,0.15)"],
    ["#06b6d4", "rgba(6,182,212,0.15)"],
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffff;
  return palette[hash % palette.length];
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
        background: `linear-gradient(135deg, ${accent}06 0%, transparent 100%)`,
        border: `1px solid ${accent}20`,
        boxShadow: `inset 0 1px 0 ${accent}10`,
      }}
    >
      <div className="mb-2.5 flex items-center gap-2">
        <div
          className="flex h-6 w-6 items-center justify-center rounded-lg"
          style={{ background: `${accent}20`, color: accent, boxShadow: `0 0 8px ${accent}30` }}
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
            style={{ background: `${accent}22`, color: accent, boxShadow: `0 0 8px ${accent}30` }}
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
  const data = useDashboardTasks();

  if (!data) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 rounded-xl"
            style={{
              background: "var(--z-surface)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.6s infinite",
              border: "1px solid var(--z-border)",
            }}
          />
        ))}
      </div>
    );
  }

  const overdue = data.overdueInvoices ?? [];
  const capacity = data.capacitySignals ?? [];
  const instruments = data.topInstruments ?? [];
  const hiring = data.hiringSignals ?? [];

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
            {overdue.slice(0, 5).map((inv) => {
              const [fg, bg] = avatarColor(inv.familyName);
              return (
                <Link
                  key={inv.invoiceId}
                  href={`/crm/families/${inv.familyId}`}
                  className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-xs transition-all duration-150"
                  style={{
                    borderLeft: "3px solid var(--z-danger)",
                    background: "rgba(239,68,68,0.04)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(239,68,68,0.08)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(239,68,68,0.04)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${bg.replace("0.15","0.4")}, ${bg.replace("0.15","0.25")})`,
                      color: fg,
                      border: `1.5px solid ${fg}40`,
                    }}
                  >
                    {initials(inv.familyName)}
                  </div>
                  <span className="flex-1 truncate font-medium" style={{ color: "var(--z-fg)" }}>
                    {inv.familyName}
                  </span>
                  <span className="ml-2 shrink-0 font-extrabold" style={{ color: "var(--z-danger)" }}>
                    {usd(inv.balanceCents)}
                  </span>
                </Link>
              );
            })}
            {overdue.length > 5 && (
              <Link
                href="/invoices?status=UNPAID"
                className="block px-2 py-1 text-[11px] font-semibold hover:underline"
                style={{ color: "var(--z-danger)" }}
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
                  style={{ background: `${color}08`, border: `1px solid ${color}18` }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: color, boxShadow: `0 0 6px ${color}` }}
                    />
                    <span className="truncate font-semibold" style={{ color }}>
                      {loc.locationName}
                    </span>
                  </div>
                  <span
                    className="ml-3 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ background: `${color}20`, color, boxShadow: `0 0 6px ${color}30` }}
                  >
                    {loc.openSlots} slots
                  </span>
                </div>
              );
            })}
            {instruments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-2 pt-1.5">
                {instruments.slice(0, 4).map((i) => (
                  <span
                    key={i.instrument}
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                    style={{ background: "rgba(37,99,235,0.12)", color: "var(--z-info)" }}
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
                style={{ background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.15)" }}
              >
                <span className="font-semibold" style={{ color: "var(--z-fg)" }}>
                  {d.dayName}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ background: "rgba(217,119,6,0.15)", color: "#d97706", boxShadow: "0 0 6px rgba(217,119,6,0.3)" }}
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
