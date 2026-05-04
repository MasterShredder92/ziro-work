"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingDown, UserPlus, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

type InstrumentGap = {
  name: string;
  rooms: number;
  students: number;
  openSlots: number;
  revenueLostCents: number;
};

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
  teacherCount: number;
  studentsPerTeacher: number;
  shouldHire: boolean;
  hireInstrument: string | null;
  instruments: InstrumentGap[];
};

type GapData = {
  locations: LocationGap[];
  avgMonthlyPerStudentCents: number;
};

function usd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Location brand color map — matches skill spec
const LOCATION_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
  bellevue: { bg: "rgba(124,58,237,0.12)", text: "#7c3aed", glow: "rgba(124,58,237,0.25)" },
  gretna:   { bg: "rgba(5,150,105,0.12)",  text: "#059669", glow: "rgba(5,150,105,0.25)" },
  omaha:    { bg: "rgba(37,99,235,0.12)",  text: "#2563eb", glow: "rgba(37,99,235,0.25)" },
  elkhorn:  { bg: "rgba(217,119,6,0.12)",  text: "#d97706", glow: "rgba(217,119,6,0.25)" },
};

function locationBrand(name: string): { bg: string; text: string; glow: string } {
  const n = (name ?? "").toLowerCase();
  for (const [key, val] of Object.entries(LOCATION_COLORS)) {
    if (n.includes(key)) return val;
  }
  return { bg: "rgba(99,102,241,0.12)", text: "#6366f1", glow: "rgba(99,102,241,0.25)" };
}

// SVG arc fill ring — animated
function FillRing({ pct, color, glow, size = 76, animated }: { pct: number; color: string; glow: string; size?: number; animated: boolean }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const filled = animated ? (pct / 100) * circ : 0;
  const cx = size / 2;
  const cy = size / 2;

  // Color logic: green if >85%, brand color if 60-85%, red if <60%
  const ringColor = pct >= 85 ? "#00ff88" : pct >= 60 ? color : "#ef4444";

  return (
    <svg width={size} height={size} className="shrink-0">
      {/* Outer ambient glow */}
      <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke={glow} strokeWidth="1" opacity="0.5" />
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={7} />
      {/* Fill arc */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={ringColor}
        strokeWidth={7}
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
        style={{
          filter: `drop-shadow(0 0 8px ${ringColor}aa)`,
          transition: "stroke-dasharray 0.9s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
      {/* Center % */}
      <text
        x={cx}
        y={cy - 3}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#fff"
        fontSize={size * 0.19}
        fontWeight="800"
      >
        {pct}%
      </text>
      <text
        x={cx}
        y={cy + 11}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="rgba(255,255,255,0.35)"
        fontSize={size * 0.1}
      >
        full
      </text>
    </svg>
  );
}

function LocationCard({ loc, animated }: { loc: LocationGap; animated: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const brand = locationBrand(loc.locationName);
  const isOverCapacity = loc.fillPct >= 100;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${brand.bg} 0%, rgba(255,255,255,0.01) 100%)`,
        border: `1px solid ${brand.text}30`,
        borderLeft: `3px solid ${brand.text}`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)`,
        transition: "box-shadow 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${brand.text}20, inset 0 1px 0 rgba(255,255,255,0.06)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)`;
      }}
    >
      {/* Header row */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Fill ring */}
        <FillRing pct={loc.fillPct} color={brand.text} glow={brand.glow} size={72} animated={animated} />

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-sm font-bold text-white truncate">{loc.locationName}</p>
            {loc.shouldHire && (
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                style={{
                  background: "rgba(245,158,11,0.15)",
                  color: "#f59e0b",
                  border: "1px solid rgba(245,158,11,0.3)",
                  boxShadow: "0 0 8px rgba(245,158,11,0.2)",
                }}
              >
                <UserPlus className="h-2.5 w-2.5" />
                Hire
              </span>
            )}
            {isOverCapacity && (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                style={{
                  background: "rgba(0,255,136,0.12)",
                  color: "#00ff88",
                  border: "1px solid rgba(0,255,136,0.25)",
                }}
              >
                At Capacity
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
            <span style={{ color: brand.text, fontWeight: 600 }}>{loc.occupied}</span>
            <span>students</span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
            <span>{loc.gap > 0 ? `${loc.gap} open` : "full"}</span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
            <span>{loc.totalRooms} rooms</span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
            <span>{loc.teacherCount} teachers</span>
          </div>
        </div>

        {/* Revenue lost + expand toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            {loc.revenueLostCents > 0 ? (
              <>
                <p className="text-xs font-bold" style={{ color: "#ef4444", textShadow: "0 0 10px rgba(239,68,68,0.3)" }}>
                  {usd(loc.revenueLostCents)}
                </p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                  /mo gap
                </p>
              </>
            ) : (
              <p className="text-xs font-bold" style={{ color: "#00ff88" }}>
                Full
              </p>
            )}
          </div>
          <div style={{ color: "rgba(255,255,255,0.3)" }}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </div>

      {/* Expanded instrument breakdown */}
      {expanded && (
        <div
          className="px-4 pb-4 pt-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          {/* Hire signal detail */}
          {loc.shouldHire && loc.hireInstrument && (
            <div
              className="flex items-start gap-2.5 rounded-xl p-3 mb-4"
              style={{
                background: "rgba(245,158,11,0.07)",
                border: "1px solid rgba(245,158,11,0.2)",
                boxShadow: "inset 0 1px 0 rgba(245,158,11,0.1)",
              }}
            >
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "#f59e0b" }} />
              <div>
                <p className="text-[11px] font-bold" style={{ color: "#f59e0b" }}>
                  Hire Signal — {capitalize(loc.hireInstrument)}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {loc.studentsPerTeacher} students/teacher · {loc.gap} open slots available
                  {loc.hireInstrument && ` · Run ads targeting ${capitalize(loc.hireInstrument)} to fill first`}
                </p>
              </div>
            </div>
          )}

          {/* Instrument rows */}
          <div className="space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>
              By Instrument
            </p>
            {loc.instruments.map((inst, idx) => {
              const barPct = inst.rooms > 0 ? Math.min(100, Math.round((inst.students / (inst.rooms * 20)) * 100)) : 0;
              const barColor = barPct >= 85 ? "#00ff88" : barPct >= 60 ? brand.text : "#ef4444";
              return (
                <div key={inst.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                        style={{
                          background: `${brand.text}18`,
                          color: brand.text,
                        }}
                      >
                        {capitalize(inst.name)}
                      </span>
                      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {inst.rooms} room{inst.rooms !== 1 ? "s" : ""} · {inst.students} students
                      </span>
                    </div>
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: inst.openSlots > 0 ? "#ef4444" : "#00ff88" }}
                    >
                      {inst.openSlots > 0 ? `${inst.openSlots} open` : "Full"}
                    </span>
                  </div>
                  {/* Fill bar */}
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: animated ? `${barPct}%` : "0%",
                        background: `linear-gradient(90deg, ${barColor}88, ${barColor})`,
                        boxShadow: `0 0 8px ${barColor}66`,
                        transition: `width 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 60}ms`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action link */}
          <Link
            href={`/schedule?location=${loc.locationId}`}
            className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold transition-opacity hover:opacity-75"
            style={{ color: brand.text }}
          >
            <TrendingDown className="h-3 w-3" />
            View Schedule →
          </Link>
        </div>
      )}
    </div>
  );
}

export function RevenueGaps() {
  const [data, setData] = useState<GapData | null>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/revenue-gaps")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setTimeout(() => setAnimated(true), 150);
      })
      .catch(() => null);
  }, []);

  if (!data) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-2xl"
            style={{
              background: "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          />
        ))}
      </div>
    );
  }

  const totalGapCents = data.locations.reduce((s, l) => s + l.revenueLostCents, 0);
  const totalOpenSlots = data.locations.reduce((s, l) => s + l.gap, 0);

  return (
    <div className="flex flex-col gap-3">
      {/* Summary bar */}
      <div
        className="flex items-center justify-between rounded-xl px-4 py-3"
        style={{
          background: "linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.04) 100%)",
          border: "1px solid rgba(239,68,68,0.2)",
          boxShadow: "inset 0 1px 0 rgba(239,68,68,0.08)",
        }}
      >
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4" style={{ color: "#ef4444" }} />
          <span className="text-[11px] font-bold" style={{ color: "#ef4444" }}>
            Total Revenue Gap
          </span>
        </div>
        <div className="text-right">
          <span
            className="text-sm font-extrabold"
            style={{ color: "#ef4444", textShadow: "0 0 16px rgba(239,68,68,0.4)" }}
          >
            {usd(totalGapCents)}
          </span>
          <span className="text-[10px] ml-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            /mo · {totalOpenSlots} open slots
          </span>
        </div>
      </div>

      {/* Location cards */}
      {data.locations.map((loc) => (
        <LocationCard key={loc.locationId} loc={loc} animated={animated} />
      ))}

      <p className="text-[10px] text-center" style={{ color: "rgba(255,255,255,0.18)" }}>
        {usd(data.avgMonthlyPerStudentCents)}/student avg · rooms × 20 capacity model · click to expand
      </p>
    </div>
  );
}
