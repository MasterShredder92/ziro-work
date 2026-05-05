"use client";

import Link from "next/link";
import { UserPlus, ArrowRight, Clock } from "lucide-react";
import { useDashboardTasks } from "./_useDashboardTasks";

type UncontactedLead = {
  leadId: string;
  name: string;
  instrument: string | null;
  source: string | null;
  createdAt: string;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "yesterday";
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

function isUrgent(iso: string): boolean {
  const hours = (Date.now() - new Date(iso).getTime()) / 3600000;
  return hours < 48;
}

const INSTRUMENT_COLORS: Record<string, string> = {
  piano:    "#7c3aed",
  guitar:   "#00ff88",
  drums:    "#ef4444",
  vocals:   "#ec4899",
  violin:   "#2563eb",
  bass:     "#d97706",
  saxophone:"#f59e0b",
  cello:    "#06b6d4",
  flute:    "#a78bfa",
};

function instrColor(name: string | null): string {
  if (!name) return "#6366f1";
  return INSTRUMENT_COLORS[name.toLowerCase()] ?? "#6366f1";
}

export function LeadsBox() {
  const tasksData = useDashboardTasks();
  const leads: UncontactedLead[] | null = tasksData ? tasksData.uncontactedLeads : null;
  const count = leads?.length ?? 0;

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: count > 0
          ? "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,255,136,0.06), transparent 65%), var(--z-surface)"
          : "var(--z-surface)",
        border: count > 0 ? "1px solid rgba(0,255,136,0.3)" : "1px solid var(--z-border)",
        boxShadow: count > 0
          ? "0 0 32px rgba(0,255,136,0.06), inset 0 1px 0 var(--z-kpi-inset)"
          : "inset 0 1px 0 var(--z-kpi-inset)",
      }}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{
              background: count > 0 ? "rgba(0,255,136,0.15)" : "var(--z-surface-2)",
              color: count > 0 ? "var(--z-accent)" : "var(--z-muted)",
            }}
          >
            <UserPlus className="h-4 w-4" />
          </div>
          <div>
            <h2
              className="text-[0.6rem] font-bold uppercase tracking-[0.22em]"
              style={{ color: count > 0 ? "var(--z-accent)" : "var(--z-muted)" }}
            >
              Leads to Contact
            </h2>
            <p className="text-[10px]" style={{ color: "var(--z-muted)" }}>
              Uncontacted · no follow-up yet
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {count > 0 && (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-extrabold"
              style={{
                background: "rgba(0,255,136,0.2)",
                color: "var(--z-accent)",
                boxShadow: "0 0 12px rgba(0,255,136,0.3)",
              }}
            >
              {count}
            </div>
          )}
          <Link
            href="/crm/leads"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all duration-150 hover:-translate-y-px"
            style={{
              background: count > 0 ? "rgba(0,255,136,0.12)" : "var(--z-surface-2)",
              color: count > 0 ? "var(--z-accent)" : "var(--z-muted)",
              border: count > 0 ? "1px solid rgba(0,255,136,0.3)" : "1px solid var(--z-border)",
            }}
          >
            Open pipeline
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Content */}
      {leads === null ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-xl"
              style={{ background: "var(--z-surface-2)" }}
            />
          ))}
        </div>
      ) : count === 0 ? (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: "rgba(0,255,136,0.05)", border: "1px solid rgba(0,255,136,0.12)" }}
        >
          <div
            className="h-2 w-2 rounded-full"
            style={{ background: "var(--z-accent)", boxShadow: "0 0 6px var(--z-accent)" }}
          />
          <p className="text-xs font-semibold" style={{ color: "var(--z-accent)" }}>
            Pipeline clear — no uncontacted leads.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {leads.slice(0, 8).map((lead) => {
            const urgent = isUrgent(lead.createdAt);
            const color = instrColor(lead.instrument);
            return (
              <Link
                key={lead.leadId}
                href={`/crm/leads/${lead.leadId}`}
                className="group flex flex-col gap-2 rounded-xl p-3 transition-all duration-150 hover:-translate-y-px"
                style={{
                  background: urgent ? "rgba(0,255,136,0.06)" : "var(--z-surface-2)",
                  border: urgent
                    ? "1px solid rgba(0,255,136,0.2)"
                    : "1px solid var(--z-border)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,255,136,0.12)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,255,136,0.35)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLElement).style.borderColor = urgent
                    ? "rgba(0,255,136,0.2)"
                    : "var(--z-border)";
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="truncate text-xs font-bold"
                    style={{ color: "var(--z-fg)" }}
                  >
                    {lead.name}
                  </span>
                  {urgent && (
                    <div
                      className="h-1.5 w-1.5 shrink-0 rounded-full mt-1"
                      style={{ background: "var(--z-accent)", boxShadow: "0 0 5px var(--z-accent)" }}
                    />
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  {lead.instrument ? (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                      style={{ background: `${color}18`, color }}
                    >
                      {lead.instrument}
                    </span>
                  ) : (
                    <span />
                  )}
                  <div className="flex items-center gap-1" style={{ color: "var(--z-muted)" }}>
                    <Clock className="h-2.5 w-2.5" />
                    <span className="text-[10px]">{timeAgo(lead.createdAt)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
          {count > 8 && (
            <Link
              href="/crm/leads"
              className="flex items-center justify-center rounded-xl p-3 text-[11px] font-bold transition-all duration-150 hover:-translate-y-px"
              style={{
                background: "rgba(0,255,136,0.06)",
                border: "1px dashed rgba(0,255,136,0.25)",
                color: "var(--z-accent)",
              }}
            >
              +{count - 8} more →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
