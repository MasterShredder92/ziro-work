"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useDashboardTasks } from "./_useDashboardTasks";

type DashboardMetrics = {
  activeStudents: number;
  activeFamilies: number;
  collectedCents: number;
  totalInvoicedCents: number;
  outstandingCents: number;
  overdueCount: number;
  scheduledCents: number;
  projectedMonthlyCents: number;
};

function usd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function useCountUp(target: number, enabled: boolean): string {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    if (!enabled || target === 0) { setDisplay(target); return; }
    const start = performance.now();
    const duration = 900;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, enabled]);
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(display / 100);
}

// Animated donut SVG
function RevenueDonut({
  collected, outstanding, scheduled, animated,
}: {
  collected: number; outstanding: number; scheduled: number; animated: boolean;
}) {
  const total = collected + outstanding + scheduled;
  if (total === 0) return null;
  const r = 54;
  const circ = 2 * Math.PI * r;
  const collectedPct = collected / total;
  const outstandingPct = outstanding / total;
  const scheduledPct = scheduled / total;
  const collectedDash = animated ? collectedPct * circ : 0;
  const outstandingDash = animated ? outstandingPct * circ : 0;
  const scheduledDash = animated ? scheduledPct * circ : 0;
  const collectedOffset = 0;
  const outstandingOffset = -(collectedPct * circ);
  const scheduledOffset = -((collectedPct + outstandingPct) * circ);
  const collectedPctNum = Math.round(collectedPct * 100);

  return (
    <div className="relative flex-shrink-0" style={{ width: 140, height: 140 }}>
      <svg width={140} height={140} viewBox="0 0 140 140">
        {/* track */}
        <circle cx={70} cy={70} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={10} />
        {/* scheduled (grey) */}
        <circle cx={70} cy={70} r={r} fill="none"
          stroke="rgba(144,144,152,0.4)" strokeWidth={10}
          strokeDasharray={`${scheduledDash} ${circ - scheduledDash}`}
          strokeDashoffset={scheduledOffset}
          strokeLinecap="butt"
          transform="rotate(-90 70 70)"
          style={{ transition: animated ? "stroke-dasharray 1.2s cubic-bezier(0.16,1,0.3,1) 0.4s" : "none" }}
        />
        {/* outstanding (red) */}
        <circle cx={70} cy={70} r={r} fill="none"
          stroke="#ef4444" strokeWidth={10}
          strokeDasharray={`${outstandingDash} ${circ - outstandingDash}`}
          strokeDashoffset={outstandingOffset}
          strokeLinecap="butt"
          transform="rotate(-90 70 70)"
          style={{
            filter: "drop-shadow(0 0 6px rgba(239,68,68,0.5))",
            transition: animated ? "stroke-dasharray 1.2s cubic-bezier(0.16,1,0.3,1) 0.2s" : "none",
          }}
        />
        {/* collected (green) */}
        <circle cx={70} cy={70} r={r} fill="none"
          stroke="#c4f036" strokeWidth={10}
          strokeDasharray={`${collectedDash} ${circ - collectedDash}`}
          strokeDashoffset={collectedOffset}
          strokeLinecap="butt"
          transform="rotate(-90 70 70)"
          style={{
            filter: "drop-shadow(0 0 8px rgba(196,240,54,0.6))",
            transition: animated ? "stroke-dasharray 1.2s cubic-bezier(0.16,1,0.3,1)" : "none",
          }}
        />
        {/* center text */}
        <text x={70} y={65} textAnchor="middle" fill="#c4f036" fontSize={22} fontWeight={800} fontFamily="Space Grotesk, sans-serif"
          style={{ filter: "drop-shadow(0 0 6px rgba(196,240,54,0.5))" }}>
          {collectedPctNum}%
        </text>
        <text x={70} y={82} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize={9} fontWeight={600} fontFamily="Space Grotesk, sans-serif" letterSpacing="0.08em">
          COLLECTED
        </text>
      </svg>
    </div>
  );
}

// Animated lifeline SVG
function Lifeline() {
  return (
    <svg
      viewBox="0 0 70 40"
      preserveAspectRatio="none"
      style={{ width: 60, height: 40, flexShrink: 0, overflow: "visible" }}
    >
      {/* base track */}
      <path d="M0 20 Q35 20 70 20" fill="none" stroke="rgba(196,240,54,0.1)" strokeWidth={1.5} />
      {/* primary pulse */}
      <path d="M0 20 Q35 20 70 20" fill="none" stroke="#c4f036" strokeWidth={1.5}
        strokeDasharray="12 60" strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 3px #c4f036)" }}>
        <animate attributeName="stroke-dashoffset" from="72" to="-72" dur="1.4s" repeatCount="indefinite" />
      </path>
      {/* secondary pulse */}
      <path d="M0 20 Q35 20 70 20" fill="none" stroke="rgba(196,240,54,0.45)" strokeWidth={1}
        strokeDasharray="5 80" strokeLinecap="round">
        <animate attributeName="stroke-dashoffset" from="85" to="-85" dur="2.1s" repeatCount="indefinite" />
      </path>
      {/* traveling dot */}
      <circle r="2.5" fill="#c4f036" style={{ filter: "drop-shadow(0 0 4px #c4f036)" }}>
        <animateMotion dur="1.4s" repeatCount="indefinite">
          <mpath href="#ll-path" />
        </animateMotion>
      </circle>
      <path id="ll-path" d="M0 20 Q35 20 70 20" fill="none" />
    </svg>
  );
}

export function CommandStrip() {
  const [m, setM] = useState<DashboardMetrics | null>(null);
  const [ready, setReady] = useState(false);
  const tasksData = useDashboardTasks();

  useEffect(() => {
    fetch("/api/dashboard/metrics", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json?.activeStudents !== undefined) {
          setM(json as DashboardMetrics);
          setTimeout(() => setReady(true), 120);
        }
      })
      .catch(() => null);
  }, []);

  const month = new Date().toLocaleString("default", { month: "long", year: "numeric" });
  const animatedCollected = useCountUp(m?.collectedCents ?? 0, ready);
  const leadsCount = tasksData?.uncontactedLeads?.length ?? 0;
  const collectionPct = m && m.totalInvoicedCents > 0
    ? Math.round((m.collectedCents / m.totalInvoicedCents) * 100) : 0;

  const cardBase: React.CSSProperties = {
    background: "var(--z-surface)",
    border: "1px solid var(--z-border)",
    borderRadius: 16,
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    position: "relative",
    overflow: "hidden",
  };

  const label: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--z-muted)",
    fontFamily: "Space Grotesk, sans-serif",
  };

  const shimmer = (
    <div style={{ ...cardBase, animation: "shimmer 1.6s infinite",
      backgroundImage: "linear-gradient(90deg, var(--z-surface) 25%, var(--z-surface-hover, rgba(255,255,255,0.04)) 50%, var(--z-surface) 75%)",
      backgroundSize: "200% 100%" }} />
  );

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr 2fr 1fr 1fr",
      gap: 12,
      alignItems: "stretch",
    }}>

      {/* 1 — LEADS */}
      <Link href="/crm/leads" style={{ textDecoration: "none" }}>
        <div style={{
          ...cardBase,
          borderLeft: `3px solid ${leadsCount > 0 ? "#bf36f8" : "var(--z-border)"}`,
          cursor: "pointer",
          transition: "box-shadow 0.2s",
          height: "100%",
          boxSizing: "border-box",
        }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 20px rgba(191,54,248,0.2)")}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
        >
          <div style={label}>New Leads</div>
          <div style={{
            fontSize: leadsCount > 0 ? 42 : 36,
            fontWeight: 900,
            lineHeight: 1,
            color: leadsCount > 0 ? "#bf36f8" : "var(--z-muted)",
            fontFamily: "Space Grotesk, sans-serif",
            // textShadow removed
          }}>
            {leadsCount}
          </div>
          <div style={{ fontSize: 11, color: "var(--z-muted)", fontFamily: "Space Grotesk, sans-serif" }}>
            {leadsCount > 0 ? "need contact" : "pipeline clear"}
          </div>
          {leadsCount > 0 && (
            <div style={{
              marginTop: 4,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: "rgba(191,54,248,0.15)",
              border: "1px solid rgba(191,54,248,0.3)",
              borderRadius: 6,
              padding: "2px 8px",
              fontSize: 10,
              fontWeight: 700,
              color: "#bf36f8",
              fontFamily: "Space Grotesk, sans-serif",
            }}>
              ⚡ Contact Now
            </div>
          )}
        </div>
      </Link>

      {/* 2 — STUDIO HEALTH SCORE */}
      {!m ? shimmer : (
        <div style={{ ...cardBase, borderLeft: "3px solid #c4f036" }}>
          <div style={label}>Studio Health</div>
          {/* Simple score ring */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
            <svg width={52} height={52} viewBox="0 0 52 52" style={{ flexShrink: 0 }}>
              <circle cx={26} cy={26} r={20} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
              <circle cx={26} cy={26} r={20} fill="none"
                stroke={collectionPct >= 75 ? "#c4f036" : collectionPct >= 50 ? "#f59e0b" : "#ef4444"}
                strokeWidth={6}
                strokeDasharray={`${(collectionPct / 100) * 125.7} 125.7`}
                strokeLinecap="round"
                transform="rotate(-90 26 26)"
                style={{
                  filter: `drop-shadow(0 0 6px ${collectionPct >= 75 ? "rgba(196,240,54,0.5)" : collectionPct >= 50 ? "rgba(245,158,11,0.5)" : "rgba(239,68,68,0.5)"})`,
                  transition: ready ? "stroke-dasharray 1s ease" : "none",
                }}
              />
              <text x={26} y={30} textAnchor="middle" fill="#c4f036" fontSize={11} fontWeight={800} fontFamily="Space Grotesk, sans-serif">
                {collectionPct}
              </text>
            </svg>
            <div>
              <div style={{ fontSize: 11, color: "var(--z-fg)", fontWeight: 700, fontFamily: "Space Grotesk, sans-serif" }}>
                {collectionPct >= 75 ? "Healthy" : collectionPct >= 50 ? "Moderate" : "Needs Work"}
              </div>
              <div style={{ fontSize: 10, color: "var(--z-muted)", fontFamily: "Space Grotesk, sans-serif" }}>
                collection rate
              </div>
            </div>
          </div>
          <div style={{ fontSize: 10, color: "var(--z-muted)", fontFamily: "Space Grotesk, sans-serif" }}>
            {m.activeStudents} active students
          </div>
        </div>
      )}

      {/* 3 — COLLECTED (spans 2 cols via grid) */}
      {!m ? (
        <div style={{ ...cardBase, animation: "shimmer 1.6s infinite",
          backgroundImage: "linear-gradient(90deg, var(--z-surface) 25%, var(--z-surface-hover, rgba(255,255,255,0.04)) 50%, var(--z-surface) 75%)",
          backgroundSize: "200% 100%" }} />
      ) : (
        <div style={{
          ...cardBase,
          background: "radial-gradient(ellipse 80% 60% at 30% 0%, rgba(196,240,54,0.06), transparent 60%), var(--z-surface)",
          padding: "14px 18px",
        }}>
          {/* top label */}
          <div style={{ ...label, marginBottom: 2 }}>Collected · {month}</div>
          {/* middle: big number + lifeline + donut */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <div style={{
              fontSize: 44,
              fontWeight: 900,
              lineHeight: 1,
              color: "#c4f036",
              fontFamily: "Space Grotesk, sans-serif",
              // textShadow removed
              flexShrink: 0,
            }}>
              {animatedCollected}
            </div>
            <Lifeline />
            <RevenueDonut
              collected={m.collectedCents}
              outstanding={m.outstandingCents}
              scheduled={m.scheduledCents}
              animated={ready}
            />
          </div>
          {/* bottom legend */}
          <div style={{
            display: "flex",
            alignItems: "center",
            borderTop: "1px solid var(--z-border)",
            paddingTop: 8,
            marginTop: 2,
            gap: 0,
          }}>
            {[
              { label: "Collected", value: usd(m.collectedCents), color: "#c4f036" },
              { label: "Outstanding", value: usd(m.outstandingCents), color: "#ef4444" },
              { label: "Scheduled", value: usd(m.scheduledCents), color: "var(--z-muted)" },
            ].map((item, i) => (
              <div key={i} style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 6,
                justifyContent: "center",
                borderRight: i < 2 ? "1px solid var(--z-border)" : "none",
              }}>
                <span style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: item.color,
                  flexShrink: 0,
                  boxShadow: `0 0 6px ${item.color}`,
                }} />
                <span style={{ fontSize: 10, color: "var(--z-muted)", fontFamily: "Space Grotesk, sans-serif" }}>
                  {item.label}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: item.color, fontFamily: "Space Grotesk, sans-serif" }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4 — BILLING SNAPSHOT */}
      <Link href="/invoices" style={{ textDecoration: "none" }}>
        {!m ? shimmer : (
          <div style={{
            ...cardBase,
            cursor: "pointer",
            height: "100%",
            boxSizing: "border-box",
            transition: "box-shadow 0.2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 20px rgba(196,240,54,0.1)")}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
          >
            <div style={label}>Billing Snapshot</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "var(--z-muted)", fontFamily: "Space Grotesk, sans-serif" }}>Outstanding</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#ef4444", fontFamily: "Space Grotesk, sans-serif",
                  }}>
                  {usd(m.outstandingCents)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "var(--z-muted)", fontFamily: "Space Grotesk, sans-serif" }}>Scheduled</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--z-fg)", fontFamily: "Space Grotesk, sans-serif" }}>
                  {usd(m.scheduledCents)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "var(--z-muted)", fontFamily: "Space Grotesk, sans-serif" }}>Next Month</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#bf36f8", fontFamily: "Space Grotesk, sans-serif" }}>
                  {usd(m.projectedMonthlyCents)}
                </span>
              </div>
            </div>
            <div style={{
              fontSize: 10, fontWeight: 700, color: "var(--z-muted)",
              fontFamily: "Space Grotesk, sans-serif",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              View Invoices →
            </div>
          </div>
        )}
      </Link>

      {/* 5 — NEEDS ATTENTION */}
      <div style={{ ...cardBase, borderLeft: "3px solid rgba(191,54,248,0.3)" }}>
        <div style={label}>Needs Attention</div>
        <div style={{
          fontSize: 42,
          fontWeight: 900,
          lineHeight: 1,
          color: "var(--z-muted)",
          fontFamily: "Space Grotesk, sans-serif",
        }}>
          0
        </div>
        <div style={{ fontSize: 11, color: "var(--z-muted)", fontFamily: "Space Grotesk, sans-serif" }}>
          retention agent monitoring
        </div>
        <div style={{
          marginTop: 4,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          background: "rgba(196,240,54,0.08)",
          border: "1px solid rgba(196,240,54,0.2)",
          borderRadius: 6,
          padding: "2px 8px",
          fontSize: 10,
          fontWeight: 700,
          color: "#c4f036",
          fontFamily: "Space Grotesk, sans-serif",
          width: "fit-content",
        }}>
          ✓ All Clear
        </div>
      </div>

    </div>
  );
}
