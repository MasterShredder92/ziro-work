"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

/* ─── Types ──────────────────────────────────────────────── */
type FamilyRow = {
  id: string;
  name: string;
  status: string | null;
  primary_email: string | null;
  primary_phone: string | null;
  primary_location_id: string | null;
  billing_status: string;
  is_military: boolean | null;
  instruments?: string[] | null;
};

type StudentPill = {
  id: string;
  name: string;
  instrument?: string | null;
  status?: string | null;
};

type Props = {
  rows: FamilyRow[];
  counts: Record<string, number>;
  locationNameById: Record<string, string>;
  studentsByFamily?: Record<string, StudentPill[]>;
};

/* ─── Ziro Brand Green ───────────────────────────────────── */
const ZIRO_GREEN = "#00D16C";

/* ─── Location brand colors (pills only) ────────────────── */
const LOCATION_COLORS: Record<string, { bg: string; color: string }> = {
  bellevue: { bg: "rgba(124,58,237,0.12)",  color: "#7c3aed" },
  gretna:   { bg: "rgba(5,150,105,0.12)",   color: "#059669" },
  omaha:    { bg: "rgba(185,28,28,0.12)",    color: "#b91c1c" },
  elkhorn:  { bg: "rgba(29,78,216,0.12)",    color: "#1d4ed8" },
};
function locationPillStyle(name: string | null): { bg: string; color: string } {
  if (!name) return { bg: "rgba(107,114,128,0.1)", color: "#6b7280" };
  const n = name.toLowerCase();
  for (const [key, val] of Object.entries(LOCATION_COLORS)) {
    if (n.includes(key)) return val;
  }
  return { bg: "rgba(107,114,128,0.1)", color: "#6b7280" };
}
function shortLocation(name: string | null): string {
  if (!name) return "Unknown";
  const n = name.toLowerCase();
  if (n.includes("bellevue")) return "Bellevue";
  if (n.includes("gretna"))   return "Gretna";
  if (n.includes("omaha"))    return "Omaha";
  if (n.includes("elkhorn"))  return "Elkhorn";
  return name.replace(/music lessons?/i, "").trim() || name;
}

/* ─── Instrument normalization ───────────────────────────── */
const INSTRUMENT_MAP: Record<string, string> = {
  paino: "PIANO", pino: "PIANO", pano: "PIANO",
  gutar: "GUITAR", guitr: "GUITAR",
  voce: "VOICE", vioce: "VOICE",
  drums: "DRUMS", drum: "DRUMS",
  base: "BASS", bas: "BASS",
  viloin: "VIOLIN", violen: "VIOLIN",
  ukele: "UKULELE", ukelele: "UKULELE",
};
function normalizeInstrument(raw: string): string {
  const lower = raw.trim().toLowerCase();
  return INSTRUMENT_MAP[lower] ?? raw.trim().toUpperCase();
}
function parseInstruments(instruments: string[] | null | undefined): string[] {
  if (!instruments || instruments.length === 0) return [];
  return [...new Set(
    instruments.flatMap(i => i.split(/[,;/]+/)).map(normalizeInstrument).filter(Boolean)
  )].sort();
}

/* ─── Avatar ─────────────────────────────────────────────── */
const AVATAR_COLORS: [string, string][] = [
  ["rgba(0,209,108,0.15)", "#00D16C"],
  ["rgba(124,58,237,0.15)", "#7c3aed"],
  ["rgba(5,150,105,0.15)", "#059669"],
  ["rgba(29,78,216,0.15)", "#1d4ed8"],
  ["rgba(185,28,28,0.15)", "#b91c1c"],
  ["rgba(217,119,6,0.15)", "#d97706"],
  ["rgba(37,99,235,0.15)", "#2563eb"],
  ["rgba(16,185,129,0.15)", "#059669"],
];
function avatarColor(name: string): [string, string] {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length] as [string, string];
}
function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

/* ─── Tab types ──────────────────────────────────────────── */
type TabId = "active" | "inactive";

export function FamiliesListClient({ rows, counts, locationNameById, studentsByFamily = {} }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("active");
  const [search, setSearch] = useState("");

  const activeRows   = useMemo(() => rows.filter(r => (r.status ?? "").toLowerCase() === "active"), [rows]);
  const inactiveRows = useMemo(() => rows.filter(r => ["inactive", "paused", "archived"].includes((r.status ?? "").toLowerCase())), [rows]);

  const displayRows = tab === "active" ? activeRows : inactiveRows;

  const filtered = useMemo(() => {
    if (!search.trim()) return displayRows;
    const q = search.toLowerCase();
    return displayRows.filter(r =>
      r.name.toLowerCase().includes(q) ||
      (r.primary_email ?? "").toLowerCase().includes(q) ||
      (locationNameById[r.primary_location_id ?? ""] ?? "").toLowerCase().includes(q)
    );
  }, [displayRows, search, locationNameById]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* ── Top bar: tabs + search ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        paddingBottom: 16,
        flexWrap: "wrap",
      }}>
        {/* Tabs */}
        <div style={{
          display: "flex",
          gap: 4,
          background: "var(--z-surface)",
          borderRadius: 10,
          padding: 4,
          border: "1px solid var(--z-border)",
        }}>
          {(["active", "inactive"] as TabId[]).map(t => {
            const count = t === "active" ? activeRows.length : inactiveRows.length;
            const isActive = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "6px 16px",
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  border: "none",
                  transition: "all 0.15s",
                  background: isActive ? ZIRO_GREEN : "transparent",
                  color: isActive ? "#fff" : "var(--z-muted)",
                  boxShadow: isActive ? `0 2px 8px ${ZIRO_GREEN}44` : "none",
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
                <span style={{
                  marginLeft: 7,
                  padding: "1px 7px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  background: isActive ? "rgba(255,255,255,0.25)" : "var(--z-border)",
                  color: isActive ? "#fff" : "var(--z-muted)",
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <input
          type="search"
          placeholder="Search families…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: "7px 14px",
            borderRadius: 8,
            border: "1px solid var(--z-border)",
            background: "var(--z-surface)",
            color: "var(--z-fg)",
            fontSize: 13,
            outline: "none",
            width: 220,
          }}
        />
      </div>

      {/* ── Column header ── */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "var(--z-bg, var(--z-surface))",
        borderBottom: "1px solid var(--z-border)",
        display: "grid",
        gridTemplateColumns: "1fr 120px 120px 80px",
        padding: "8px 20px",
        gap: 12,
      }}>
        {["Family", "Location", "Students", "Billing"].map(h => (
          <span key={h} style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--z-muted)",
          }}>{h}</span>
        ))}
      </div>

      {/* ── Rows ── */}
      {filtered.length === 0 ? (
        <div style={{
          padding: "48px 0",
          textAlign: "center",
          color: "var(--z-muted)",
          fontSize: 14,
        }}>
          {search ? `No families match "${search}"` : `No ${tab} families`}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {filtered.map((row, idx) => {
            const locName  = locationNameById[row.primary_location_id ?? ""] ?? null;
            const locStyle = locationPillStyle(locName);
            const locShort = shortLocation(locName);
            const studentCount = counts[row.id] ?? 0;
            const students = studentsByFamily[row.id] ?? [];
            const instruments = parseInstruments(row.instruments);
            const [avatarBg, avatarFg] = avatarColor(row.name);
            const isMilitary = row.is_military === true;
            const isOverdue = (row.billing_status ?? "").toLowerCase() === "overdue";

            return (
              <div key={row.id}>
                {/* Card row */}
                <div
                  onClick={() => router.push(`/crm/families/${row.id}`)}
                  style={{
                    position: "relative",
                    display: "grid",
                    gridTemplateColumns: "1fr 120px 120px 80px",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 20px 14px 24px",
                    cursor: "pointer",
                    transition: "background 0.12s, transform 0.12s",
                    borderLeft: `3px solid ${ZIRO_GREEN}`,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.background = "var(--z-surface)";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.background = "transparent";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  }}
                >
                  {/* Col 1: Avatar + Name + sub-info */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, minWidth: 0 }}>
                    {/* Avatar */}
                    <div style={{
                      flexShrink: 0,
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: `radial-gradient(circle at 35% 35%, ${avatarBg}, ${avatarBg}88)`,
                      border: `2px solid ${avatarFg}44`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 800,
                      color: avatarFg,
                      letterSpacing: "-0.02em",
                    }}>
                      {initials(row.name)}
                    </div>

                    {/* Name + sub-label */}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "var(--z-fg)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: 240,
                        }}>
                          {row.name}
                        </span>
                        {isMilitary && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "1px 6px",
                            borderRadius: 20,
                            background: "rgba(124,58,237,0.12)",
                            color: "#7c3aed",
                            letterSpacing: "0.04em",
                          }}>
                            ★ MIL
                          </span>
                        )}
                        {isOverdue && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "1px 6px",
                            borderRadius: 20,
                            background: "rgba(185,28,28,0.1)",
                            color: "#b91c1c",
                            letterSpacing: "0.04em",
                          }}>
                            OVERDUE
                          </span>
                        )}
                      </div>

                      {/* Sub-label: email */}
                      {row.primary_email && (
                        <div style={{ fontSize: 12, color: "var(--z-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {row.primary_email}
                        </div>
                      )}

                      {/* Student name pills */}
                      {students.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 5 }}>
                          {students.slice(0, 5).map(s => (
                            <span key={s.id} style={{
                              fontSize: 11,
                              fontWeight: 500,
                              padding: "2px 8px",
                              borderRadius: 20,
                              background: "var(--z-surface)",
                              color: "var(--z-muted)",
                              border: "1px solid var(--z-border)",
                              whiteSpace: "nowrap",
                            }}>
                              {s.name}
                            </span>
                          ))}
                          {students.length > 5 && (
                            <span style={{
                              fontSize: 11,
                              fontWeight: 500,
                              padding: "2px 8px",
                              borderRadius: 20,
                              background: "var(--z-surface)",
                              color: "var(--z-muted)",
                              border: "1px solid var(--z-border)",
                            }}>
                              +{students.length - 5} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Instrument pills */}
                      {instruments.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 5 }}>
                          {instruments.map(inst => (
                            <span key={inst} style={{
                              fontSize: 10,
                              fontWeight: 600,
                              padding: "2px 7px",
                              borderRadius: 20,
                              background: `${ZIRO_GREEN}15`,
                              color: ZIRO_GREEN,
                              letterSpacing: "0.03em",
                            }}>
                              {inst}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Col 2: Location pill */}
                  <div>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "3px 10px",
                      borderRadius: 20,
                      background: locStyle.bg,
                      color: locStyle.color,
                      whiteSpace: "nowrap",
                    }}>
                      {locShort}
                    </span>
                  </div>

                  {/* Col 3: Student count */}
                  <div style={{ fontSize: 13, color: "var(--z-muted)", fontWeight: 500 }}>
                    {studentCount} {studentCount === 1 ? "student" : "students"}
                  </div>

                  {/* Col 4: Billing status */}
                  <div>
                    {(() => {
                      const bs = (row.billing_status ?? "").toLowerCase();
                      let bg = "rgba(107,114,128,0.1)", color = "#6b7280";
                      if (bs === "current" || bs === "paid")          { bg = "rgba(16,185,129,0.12)"; color = "#059669"; }
                      else if (bs === "overdue" || bs === "past_due") { bg = "rgba(185,28,28,0.1)";   color = "#b91c1c"; }
                      else if (bs === "paused")                       { bg = "rgba(37,99,235,0.12)";  color = "#2563eb"; }
                      return (
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 20,
                          background: bg,
                          color,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          whiteSpace: "nowrap",
                        }}>
                          {(row.billing_status ?? "—").replace(/_/g, " ")}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Gradient separator */}
                {idx < filtered.length - 1 && (
                  <div style={{
                    height: 1,
                    marginLeft: 24,
                    background: `linear-gradient(to right, ${ZIRO_GREEN}55 0%, ${ZIRO_GREEN}00 50%, transparent 100%)`,
                  }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
