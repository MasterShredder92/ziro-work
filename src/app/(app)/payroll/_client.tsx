/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageTransition } from "@/components/system/PageTransition";
import { LOCATION_MAP, LOCATIONS } from "@/lib/config/locations";

type PayrollRow = {
  id: string;
  display_name: string;
  email?: string | null;
  photo_url?: string | null;
  instruments: string[];
  teacher_role?: string | null;
  pay_rate_per_half_hour: number;
  needs_1099?: boolean;
  w9_completed_at?: string | null;
  session_count: number;
  location_breakdown: { location_id: string; location_name: string; location_color: string; session_count: number; gross_pay_cents: number }[];
  gross_pay_cents: number;
  location_ids: string[];
};

type Summary = {
  totalGrossCents: number;
  totalSessions: number;
  startDate: string;
  endDate: string;
  teacherCount: number;
};

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function initials(name: string): string {
  const parts = name.split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function monthRange(offset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  const year = d.getFullYear();
  const month = d.getMonth();
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const end = new Date(year, month + 1, 1);
  const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-01`;
  return { start, end: endStr, label: d.toLocaleString("default", { month: "long", year: "numeric" }) };
}

export function PayrollClient() {
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [_summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState("all");
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedRow, setSelectedRow] = useState<PayrollRow | null>(null);
  const period = monthRange(monthOffset);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ start: period.start, end: period.end });
    if (locationFilter !== "all") params.set("locationId", locationFilter);
    fetch(`/api/payroll?${params}`)
      .then(r => r.json())
      .then(res => {
        setRows(res.rows ?? []);
        setSummary(res.summary ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [locationFilter, period.start, period.end]);

  useEffect(() => { load(); }, [load]);

  const filtered = locationFilter === "all"
    ? rows
    : rows.filter(r => r.location_ids.includes(locationFilter));

  const filteredGross = filtered.reduce((s, r) => s + r.gross_pay_cents, 0);
  const filteredSessions = filtered.reduce((s, r) => s + r.session_count, 0);

  return (
    <PageTransition>
      <div className="flex h-[calc(100vh-56px)] flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 border-b border-[#1c1c1e] px-6 py-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <h1 className="text-xl font-extrabold text-white">Payroll</h1>
              <p className="text-xs text-[#505055]">Teacher pay based on sessions taught</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setMonthOffset(o => o - 1)} className="rounded-lg border border-[#1c1c1e] bg-[#111113] px-3 py-1.5 text-xs text-[#909098] hover:text-white transition-colors">← Prev</button>
              <span className="text-sm font-semibold text-white min-w-[140px] text-center">{period.label}</span>
              <button onClick={() => setMonthOffset(o => o + 1)} disabled={monthOffset >= 0} className="rounded-lg border border-[#1c1c1e] bg-[#111113] px-3 py-1.5 text-xs text-[#909098] hover:text-white disabled:opacity-40 transition-colors">Next →</button>
            </div>
          </div>
          <div className="mb-3">
          </div>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] p-3">
              <div className="text-xl font-extrabold text-[#c4f036]">{fmt(filteredGross)}</div>
              <div className="text-[10px] text-[#505055]">Total gross pay</div>
            </div>
            <div className="rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] p-3">
              <div className="text-xl font-extrabold text-white">{filteredSessions.toLocaleString()}</div>
              <div className="text-[10px] text-[#505055]">Sessions taught</div>
            </div>
            <div className="rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] p-3">
              <div className="text-xl font-extrabold text-[#909098]">{filtered.length}</div>
              <div className="text-[10px] text-[#505055]">Teachers</div>
            </div>
          </div>
          {/* Location filter */}
          <div className="flex flex-wrap gap-2">
            {["all", ...LOCATIONS.map(l => l.id)].map(locId => {
              const lc = locId !== "all" ? LOCATION_MAP[locId] : null;
              const active = locationFilter === locId;
              return (
                <button key={locId} onClick={() => setLocationFilter(locId)}
                  className="rounded-full px-3 py-1 text-xs font-semibold border transition-colors"
                  style={active && lc ? { backgroundColor: `${lc.color}20`, color: lc.color, borderColor: `${lc.color}50` } : active ? { backgroundColor: "#c4f03615", color: "#c4f036", borderColor: "#c4f03630" } : { backgroundColor: "transparent", color: "#505055", borderColor: "#1c1c1e" }}>
                  {locId === "all" ? "All Locations" : lc?.name ?? locId}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Table */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
                <div className="text-4xl">💰</div>
                <div className="text-sm font-semibold text-[#909098]">No sessions found for this period</div>
              </div>
            ) : (
              <>
                {/* Table header */}
                <div className="grid px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-[#505055] border-b border-[#1c1c1e]"
                  style={{ gridTemplateColumns: "1fr 80px 80px 100px 80px" }}>
                  <span>Teacher</span>
                  <span className="text-right">Sessions</span>
                  <span className="text-right">Rate</span>
                  <span className="text-right">Gross Pay</span>
                  <span className="text-right">W-9</span>
                </div>
                {filtered.map(r => {
                  const locConfigs = r.location_ids.map(id => LOCATION_MAP[id]).filter(Boolean);
                  const isSelected = selectedRow?.id === r.id;
                  return (
                    <button key={r.id} onClick={() => setSelectedRow(r.id === selectedRow?.id ? null : r)}
                      className={`w-full grid px-6 py-3 border-b border-[#1c1c1e] text-left transition-colors ${isSelected ? "bg-[#c4f036]/5" : "hover:bg-white/2"}`}
                      style={{ gridTemplateColumns: "1fr 80px 80px 100px 80px" }}>
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Multi-location color bar */}
                        {locConfigs.length > 0 && (
                          <div className="flex flex-col gap-0.5 shrink-0">
                            {locConfigs.map((lc, i) => <div key={i} className="h-3 w-1 rounded-full" style={{ backgroundColor: lc.color }} />)}
                          </div>
                        )}
                        {r.photo_url ? (
                          <img src={r.photo_url} alt={r.display_name} className="h-8 w-8 rounded-full object-cover border border-[#2b2b2f] shrink-0" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1c1c1e] text-xs font-bold text-[#909098] shrink-0">{initials(r.display_name)}</div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white truncate">{r.display_name}</div>
                          <div className="text-[10px] text-[#505055] truncate">{r.instruments.slice(0, 2).join(", ") || r.teacher_role || "—"}</div>
                        </div>
                      </div>
                      <div className="text-right text-sm font-semibold text-[#909098] self-center">{r.session_count}</div>
                      <div className="text-right text-sm text-[#505055] self-center">${r.pay_rate_per_half_hour}/30m</div>
                      <div className="text-right text-sm font-extrabold text-[#c4f036] self-center">{fmt(r.gross_pay_cents)}</div>
                      <div className="text-right self-center">
                        {r.w9_completed_at ? (
                          <span className="text-[10px] font-semibold text-[#22c55e]">✓ W-9</span>
                        ) : r.needs_1099 ? (
                          <span className="text-[10px] font-semibold text-[#f59e0b]">Needed</span>
                        ) : (
                          <span className="text-[10px] text-[#505055]">—</span>
                        )}
                      </div>
                    </button>
                  );
                })}
                {/* Total row */}
                <div className="grid px-6 py-3 border-t-2 border-[#2b2b2f] bg-[#111113]"
                  style={{ gridTemplateColumns: "1fr 80px 80px 100px 80px" }}>
                  <div className="text-xs font-bold uppercase tracking-widest text-[#505055]">Total</div>
                  <div className="text-right text-sm font-bold text-white">{filteredSessions}</div>
                  <div />
                  <div className="text-right text-sm font-extrabold text-[#c4f036]">{fmt(filteredGross)}</div>
                  <div />
                </div>
              </>
            )}
          </div>

          {selectedRow && (
            <div className="w-full lg:w-96 shrink-0 border-l border-[#1c1c1e] bg-[#0a0a0c] overflow-y-auto">
              <PayrollDetailPanel row={selectedRow} onClose={() => setSelectedRow(null)} />
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

function PayrollDetailPanel({ row, onClose }: { row: PayrollRow; onClose: () => void }) {
  const locConfigs = row.location_ids.map(id => LOCATION_MAP[id]).filter(Boolean);
  return (
    <div className="flex flex-col h-full">
      {locConfigs.length > 0 && (
        <div className="flex h-1.5 w-full shrink-0">
          {locConfigs.map((lc, i) => <div key={i} className="flex-1" style={{ backgroundColor: lc.color }} />)}
        </div>
      )}
      <div className="flex items-center justify-between border-b border-[#1c1c1e] px-5 py-4">
        <div className="flex items-center gap-3">
          {row.photo_url ? (
            <img src={row.photo_url} alt={row.display_name} className="h-10 w-10 rounded-full object-cover border border-[#2b2b2f]" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1c1c1e] text-xs font-bold text-[#909098]">{initials(row.display_name)}</div>
          )}
          <div>
            <div className="text-sm font-bold text-white">{row.display_name}</div>
            <div className="text-[10px] text-[#505055]">{row.teacher_role ?? "Teacher"}</div>
          </div>
        </div>
        <button onClick={onClose} className="text-[#505055] hover:text-white text-lg">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="rounded-xl border border-[#1c1c1e] bg-[#111113] p-4">
          <div className="text-2xl font-extrabold text-[#c4f036]">{fmt(row.gross_pay_cents)}</div>
          <div className="text-xs text-[#505055]">Gross pay this period</div>
          <div className="mt-2 text-xs text-[#909098]">{row.session_count} sessions × ${row.pay_rate_per_half_hour}/30min</div>
        </div>
        {/* Sessions by location */}
        {row.location_breakdown.length > 0 && (
          <section>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Sessions by Location</div>
            <div className="space-y-1.5">
              {row.location_breakdown.map((lb) => (
                <div key={lb.location_id} className="flex items-center justify-between rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: lb.location_color }} />
                    <span className="text-xs text-[#909098]">{lb.location_name}</span>
                  </div>
                  <span className="text-xs font-bold text-white">{lb.session_count} sessions</span>
                </div>
              ))}
            </div>
          </section>
        )}
        {/* W-9 status */}
        <section>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Tax Status</div>
          <div className="flex items-center justify-between rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] px-3 py-2">
            <span className="text-xs text-[#909098]">1099 Contractor</span>
            {row.w9_completed_at ? (
              <span className="text-xs font-semibold text-[#22c55e]">W-9 on file ✓</span>
            ) : row.needs_1099 ? (
              <span className="text-xs font-semibold text-[#f59e0b]">W-9 needed</span>
            ) : (
              <span className="text-xs text-[#505055]">—</span>
            )}
          </div>
        </section>
        <Link href={`/teachers/${row.id}`} className="flex items-center justify-center gap-2 rounded-lg border border-[#2b2b2f] px-4 py-2.5 text-sm font-semibold text-[#909098] hover:text-white hover:border-[#404048] transition-colors">
          View Teacher Profile →
        </Link>
      </div>
    </div>
  );
}
