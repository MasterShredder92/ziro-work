"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type LocationGap = {
  locationId: string;
  locationName: string;
  locationColor: string;
  totalRooms: number;
  totalCapacity: number;
  occupied: number;
  gap: number;
  fillPct: number;
  revenueLostCents: number;
  avgMonthlyPerStudentCents: number;
};

type LocationRevenue = {
  locationId: string;
  name: string;
  shortName: string;
  color: string;
  collectedCents: number;
  invoicedCents: number;
  outstandingCents: number;
};

type GapData = {
  locations: LocationGap[];
  avgMonthlyPerStudentCents: number;
};

type RevData = {
  locations: LocationRevenue[];
  month: string;
};

function usd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(cents / 100);
}

function shortName(name: string) {
  return name.replace(" Music Lessons", "").replace(" Music", "");
}

// Capacity meter bar
function CapacityMeter({ pct, color }: { pct: number; color: string }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(t);
  }, []);

  const barColor = pct >= 75 ? "#c4f036" : pct >= 50 ? "#f59e0b" : pct >= 30 ? color : "#ef4444";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{
        position: "relative",
        height: 6,
        borderRadius: 3,
        background: "rgba(255,255,255,0.06)",
        overflow: "visible",
      }}>
        {/* fill */}
        <div style={{
          position: "absolute",
          left: 0, top: 0, bottom: 0,
          width: animated ? `${Math.min(100, pct)}%` : "0%",
          borderRadius: 3,
          background: barColor,
          boxShadow: `0 0 8px ${barColor}88`,
          transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
        }} />
        {/* 75% target marker */}
        <div style={{
          position: "absolute",
          left: "75%",
          top: -3,
          bottom: -3,
          width: 1.5,
          background: "rgba(255,255,255,0.35)",
          borderRadius: 1,
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{
          fontSize: 11, fontWeight: 800,
          color: barColor,
          fontFamily: "Space Grotesk, sans-serif",
          // textShadow removed
        }}>
          {pct}%
        </span>
        <span style={{ fontSize: 10, color: "var(--z-muted)", fontFamily: "Space Grotesk, sans-serif" }}>
          target 75%
        </span>
      </div>
    </div>
  );
}

function LocationCard({
  gap, rev,
}: {
  gap: LocationGap;
  rev: LocationRevenue | undefined;
}) {
  const color = gap.locationColor;
  const name = shortName(gap.locationName);
  // Revenue at 75% capacity
  const potential75 = Math.round(gap.totalCapacity * 0.75) * (gap.avgMonthlyPerStudentCents ?? 16000);
  const currentRev = rev?.collectedCents ?? gap.occupied * (gap.avgMonthlyPerStudentCents ?? 16000);

  return (
    <div style={{
      background: "var(--z-surface)",
      border: "1px solid var(--z-border)",
      borderTop: `3px solid ${color}`,
      borderRadius: 16,
      padding: "16px 16px 14px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      position: "relative",
      overflow: "hidden",
      transition: "box-shadow 0.2s",
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 0 24px ${color}33`)}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
    >
      {/* subtle glow bg */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 60,
        background: `radial-gradient(ellipse 80% 100% at 50% 0%, ${color}14, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: color,
            boxShadow: `0 0 8px ${color}`,
          }} />
          <span style={{
            fontSize: 13, fontWeight: 800,
            color: "var(--z-fg)",
            fontFamily: "Space Grotesk, sans-serif",
          }}>
            {name}
          </span>
        </div>
        <span style={{
          fontSize: 10, color: "var(--z-muted)",
          fontFamily: "Space Grotesk, sans-serif",
        }}>
          {gap.totalRooms} rooms
        </span>
      </div>

      {/* big fraction */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{
          fontSize: 40, fontWeight: 900, lineHeight: 1,
          color: color,
          fontFamily: "Space Grotesk, sans-serif",
          // textShadow removed
        }}>
          {gap.occupied}
        </span>
        <span style={{ fontSize: 18, color: "var(--z-muted)", fontFamily: "Space Grotesk, sans-serif" }}>/</span>
        <span style={{ fontSize: 18, fontWeight: 600, color: "var(--z-muted)", fontFamily: "Space Grotesk, sans-serif" }}>
          {gap.totalCapacity}
        </span>
      </div>
      <div style={{ fontSize: 10, color: "var(--z-muted)", marginTop: -6, fontFamily: "Space Grotesk, sans-serif" }}>
        booked / weekly capacity
      </div>

      {/* meter */}
      <CapacityMeter pct={gap.fillPct} color={color} />

      {/* revenue row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderTop: "1px solid var(--z-border)",
        paddingTop: 10,
        gap: 4,
      }}>
        <div>
          <div style={{
            fontSize: 14, fontWeight: 800,
            color: "#c4f036",
            fontFamily: "Space Grotesk, sans-serif",
            // textShadow removed
          }}>
            {usd(currentRev)}
          </div>
          <div style={{ fontSize: 9, color: "var(--z-muted)", fontFamily: "Space Grotesk, sans-serif" }}>
            collected this month
          </div>
        </div>
        <div style={{ fontSize: 16, color: "var(--z-muted)" }}>→</div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontSize: 14, fontWeight: 800,
            color: "#bf36f8",
            fontFamily: "Space Grotesk, sans-serif",
            // textShadow removed
          }}>
            {usd(potential75)}
          </div>
          <div style={{ fontSize: 9, color: "var(--z-muted)", fontFamily: "Space Grotesk, sans-serif" }}>
            at 75% capacity
          </div>
        </div>
      </div>
    </div>
  );
}

export function StudioCapacity() {
  const [gapData, setGapData] = useState<GapData | null>(null);
  const [revData, setRevData] = useState<RevData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/revenue-gaps", { cache: "no-store" })
      .then(r => r.json())
      .then(setGapData)
      .catch(() => null);
    fetch("/api/dashboard/location-revenue", { cache: "no-store" })
      .then(r => r.json())
      .then(setRevData)
      .catch(() => null);
  }, []);

  const totalBooked = gapData?.locations.reduce((s, l) => s + l.occupied, 0) ?? 0;
  const totalCap = gapData?.locations.reduce((s, l) => s + l.totalCapacity, 0) ?? 0;
  const totalOpen = totalCap - totalBooked;
  const totalGapRev = gapData?.locations.reduce((s, l) => s + l.revenueLostCents, 0) ?? 0;

  return (
    <div>
      {/* section header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 14,
      }}>
        <div style={{
          width: 3, height: 22,
          background: "linear-gradient(180deg, #c4f036, #bf36f8)",
          borderRadius: 2,
          flexShrink: 0,
          boxShadow: "0 0 8px rgba(196,240,54,0.4)",
        }} />
        <span style={{
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--z-fg)",
          fontFamily: "Space Grotesk, sans-serif",
        }}>
          Studio Capacity
        </span>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, var(--z-border), transparent)" }} />
        {gapData && (
          <span style={{ fontSize: 11, color: "var(--z-muted)", fontFamily: "Space Grotesk, sans-serif", whiteSpace: "nowrap" }}>
            <strong style={{ color: "var(--z-fg)" }}>{totalBooked}</strong> booked &nbsp;·&nbsp;
            <strong style={{ color: "var(--z-fg)" }}>{totalOpen}</strong> open &nbsp;·&nbsp;
            <span style={{ color: "#ef4444", fontWeight: 700 }}>{usd(totalGapRev)}/mo unrealized</span>
          </span>
        )}
      </div>

      {/* 4 location cards */}
      {!gapData ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              height: 220, borderRadius: 16,
              background: "var(--z-surface)",
              border: "1px solid var(--z-border)",
              animation: "shimmer 1.6s infinite",
              backgroundImage: "linear-gradient(90deg, var(--z-surface) 25%, var(--z-surface-hover, rgba(255,255,255,0.04)) 50%, var(--z-surface) 75%)",
              backgroundSize: "200% 100%",
            }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {gapData.locations.map((loc) => {
            const rev = revData?.locations.find(r => r.locationId === loc.locationId);
            return <LocationCard key={loc.locationId} gap={loc} rev={rev} />;
          })}
        </div>
      )}
    </div>
  );
}
