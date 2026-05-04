"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingDown, UserPlus, AlertCircle } from "lucide-react";

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

// SVG arc fill ring
function FillRing({ pct, color, size = 80 }: { pct: number; color: string; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  const cx = size / 2;
  const cy = size / 2;
  return (
    <svg width={size} height={size} className="shrink-0">
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
      {/* Fill */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${color}88)`, transition: "stroke-dasharray 0.8s ease" }}
      />
      {/* Center text */}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#fff"
        fontSize={size * 0.2}
        fontWeight="700"
      >
        {pct}%
      </text>
      <text
        x={cx}
        y={cy + 12}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="rgba(255,255,255,0.4)"
        fontSize={size * 0.11}
      >
        full
      </text>
    </svg>
  );
}

function LocationCard({ loc }: { loc: LocationGap }) {
  const [expanded, setExpanded] = useState(false);
  const color = loc.locationColor;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderLeft: `3px solid ${color}`,
        boxShadow: `0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      {/* Header row */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Fill ring */}
        <FillRing pct={loc.fillPct} color={color} size={72} />

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-bold text-white truncate">{loc.locationName}</p>
            {loc.shouldHire && (
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}
              >
                <UserPlus className="h-2.5 w-2.5" />
                Hire
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
            <span>{loc.occupied} students</span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
            <span>{loc.gap} open slots</span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
            <span>{loc.totalRooms} rooms</span>
          </div>
        </div>

        {/* Revenue lost */}
        <div className="text-right shrink-0">
          <p className="text-xs font-bold" style={{ color: "#ef4444" }}>
            {usd(loc.revenueLostCents)}
          </p>
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            /mo gap
          </p>
        </div>
      </div>

      {/* Expanded instrument breakdown */}
      {expanded && (
        <div
          className="px-4 pb-4 pt-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          {/* Hire signal detail */}
          {loc.shouldHire && loc.hireInstrument && (
            <div
              className="flex items-start gap-2 rounded-xl p-3 mb-3 mt-3"
              style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}
            >
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "#f59e0b" }} />
              <div>
                <p className="text-[11px] font-semibold" style={{ color: "#f59e0b" }}>
                  Hire Signal — {capitalize(loc.hireInstrument)}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {loc.studentsPerTeacher} students/teacher · {loc.gap} open slots available
                  {loc.hireInstrument && ` · Focus ads on ${capitalize(loc.hireInstrument)} to fill first`}
                </p>
              </div>
            </div>
          )}

          {/* Instrument rows */}
          <div className="space-y-2 mt-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
              By Instrument
            </p>
            {loc.instruments.map((inst) => {
              const barPct = inst.rooms > 0 ? Math.min(100, Math.round((inst.students / (inst.rooms * 20)) * 100)) : 0;
              return (
                <div key={inst.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{
                          background: `${color}18`,
                          color: color,
                          border: `1px solid ${color}30`,
                        }}
                      >
                        {capitalize(inst.name)}
                      </span>
                      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {inst.rooms} room{inst.rooms !== 1 ? "s" : ""} · {inst.students} students
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-semibold" style={{ color: inst.openSlots > 0 ? "#ef4444" : "#00ff88" }}>
                        {inst.openSlots > 0 ? `${inst.openSlots} open` : "Full"}
                      </span>
                    </div>
                  </div>
                  {/* Fill bar */}
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${barPct}%`,
                        background: barPct >= 90 ? "#00ff88" : barPct >= 60 ? color : "#ef4444",
                        boxShadow: `0 0 6px ${color}66`,
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
            className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold transition-opacity hover:opacity-80"
            style={{ color: color }}
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

  useEffect(() => {
    fetch("/api/dashboard/revenue-gaps")
      .then((r) => r.json())
      .then((d) => setData(d))
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
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.2)",
        }}
      >
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4" style={{ color: "#ef4444" }} />
          <span className="text-[11px] font-semibold" style={{ color: "#ef4444" }}>
            Total Revenue Gap
          </span>
        </div>
        <div className="text-right">
          <span className="text-sm font-bold" style={{ color: "#ef4444" }}>
            {usd(totalGapCents)}
          </span>
          <span className="text-[10px] ml-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            /mo · {totalOpenSlots} open slots
          </span>
        </div>
      </div>

      {/* Location cards */}
      {data.locations.map((loc) => (
        <LocationCard key={loc.locationId} loc={loc} />
      ))}

      <p className="text-[10px] text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
        Based on {usd(data.avgMonthlyPerStudentCents)}/student avg · click any location to expand
      </p>
    </div>
  );
}
