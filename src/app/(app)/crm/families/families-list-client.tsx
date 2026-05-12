"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AddFamilyModal } from "./add-family-modal";
import { SmartBackButton } from "@/components/navigation/SmartBackButton";

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

type StudentEntry = {
  id: string;
  name: string;
  instrument?: string | null;
  status?: string | null;
  teacherName?: string | null;
};

type LocationOpt = { id: string; name: string };
type Props = {
  rows: FamilyRow[];
  counts: Record<string, number>;
  locationNameById: Record<string, string>;
  locationOptions?: LocationOpt[];
  studentsByFamily?: Record<string, StudentEntry[]>;
  teacherByFamily?: Record<string, string>;
};

/* ─── Brand ──────────────────────────────────────────────── */
const ZIRO_GREEN = "#00D16C";

/* ─── Location colors (pills only) ──────────────────────── */
const LOC_COLORS: Record<string, { bg: string; fg: string }> = {
  bellevue: { bg: "rgba(124,58,237,0.12)",  fg: "#7c3aed" },
  gretna:   { bg: "rgba(5,150,105,0.12)",   fg: "#059669" },
  omaha:    { bg: "rgba(185,28,28,0.12)",    fg: "#b91c1c" },
  elkhorn:  { bg: "rgba(29,78,216,0.12)",    fg: "#1d4ed8" },
};
function locStyle(name: string | null) {
  if (!name) return { bg: "rgba(107,114,128,0.1)", fg: "#6b7280" };
  const n = name.toLowerCase();
  for (const [k, v] of Object.entries(LOC_COLORS)) if (n.includes(k)) return v;
  return { bg: "rgba(107,114,128,0.1)", fg: "#6b7280" };
}
function shortLoc(name: string | null): string {
  if (!name) return "—";
  const n = name.toLowerCase();
  if (n.includes("bellevue")) return "Bellevue";
  if (n.includes("gretna"))   return "Gretna";
  if (n.includes("omaha"))    return "Omaha";
  if (n.includes("elkhorn"))  return "Elkhorn";
  return name.replace(/music lessons?/i, "").trim() || name;
}

/* ─── Instrument normalization + emoji ───────────────────── */
const INST_MAP: Record<string, string> = {
  paino:"Piano",pino:"Piano",pano:"Piano",
  gutar:"Guitar",guitr:"Guitar",
  voce:"Voice",vioce:"Voice",
  drums:"Drums",drum:"Drums",
  base:"Bass",bas:"Bass",
  viloin:"Violin",violen:"Violin",
  ukele:"Ukulele",ukelele:"Ukulele",
};
const INSTRUMENT_EMOJI: Record<string, string> = {
  guitar:"🎸", bass:"🎸", piano:"🎹", keyboard:"🎹",
  drums:"🥁", percussion:"🥁", violin:"🎻", viola:"🎻",
  cello:"🎻", trumpet:"🎺", trombone:"🎺", saxophone:"🎷",
  clarinet:"🎷", flute:"🎷", voice:"🎤", vocals:"🎤",
  ukulele:"🪕", banjo:"🪕", harp:"🎵",
};
function instrEmoji(name: string): string {
  const k = name.toLowerCase();
  for (const [key, val] of Object.entries(INSTRUMENT_EMOJI)) {
    if (k.includes(key)) return val;
  }
  return "🎵";
}
function normInst(raw: string): string {
  const l = raw.trim().toLowerCase();
  // Return proper-case canonical name
  const mapped = INST_MAP[l];
  if (mapped) return mapped;
  // Capitalize first letter of each word for unknown instruments
  return raw.trim().replace(/\b\w/g, c => c.toUpperCase());
}
function parseInst(arr: string[] | null | undefined): string[] {
  if (!arr?.length) return [];
  return [...new Set(arr.flatMap(i => i.split(/[,;/]+/)).map(normInst).filter(Boolean))].sort();
}

/* ─── Avatar ─────────────────────────────────────────────── */
const AV_COLORS: [string, string][] = [
  ["rgba(0,209,108,0.18)",  "#00D16C"],
  ["rgba(124,58,237,0.18)", "#7c3aed"],
  ["rgba(5,150,105,0.18)",  "#059669"],
  ["rgba(29,78,216,0.18)",  "#1d4ed8"],
  ["rgba(185,28,28,0.18)",  "#b91c1c"],
  ["rgba(217,119,6,0.18)",  "#d97706"],
  ["rgba(37,99,235,0.18)",  "#2563eb"],
  ["rgba(16,185,129,0.18)", "#10b981"],
];
function avColor(name: string | null | undefined): [string, string] {
  if (!name) return AV_COLORS[0] as [string, string];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AV_COLORS[h % AV_COLORS.length] as [string, string];
}
function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}
function firstName(fullName: string | null | undefined): string {
  if (!fullName) return "";
  return fullName.split(/\s+/)[0] ?? fullName;
}

type TabId = "active" | "inactive";

export function FamiliesListClient({
  rows,
  counts,
  locationNameById,
  locationOptions = [],
  studentsByFamily = {},
  teacherByFamily = {},
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabId>("active");
  const [showAdd, setShowAdd] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Open modal automatically if URL is /crm/families?new=true
  useEffect(() => {
    if (searchParams?.get("new") === "true") {
      setShowAdd(true);
    }
  }, [searchParams]);

  const [search, setSearch] = useState("");
  const [filterTeacher, setFilterTeacher] = useState("");
  const [filterLocation, setFilterLocation] = useState("");

  const activeRows   = useMemo(() => rows.filter(r => (r.status ?? "").toLowerCase() === "active"), [rows]);
  const inactiveRows = useMemo(() => rows.filter(r => ["inactive","paused","archived"].includes((r.status ?? "").toLowerCase())), [rows]);
  const displayRows  = tab === "active" ? activeRows : inactiveRows;

  const allTeachers = useMemo(() => {
    const set = new Set<string>();
    for (const row of rows) {
      const t = teacherByFamily[row.id];
      if (t) t.split(",").map(s => s.trim()).filter(Boolean).forEach(n => set.add(n));
    }
    return [...set].sort();
  }, [rows, teacherByFamily]);

  const allLocations = useMemo(() => {
    const set = new Set<string>();
    for (const row of rows) {
      const l = locationNameById[row.primary_location_id ?? ""];
      if (l) set.add(l);
    }
    return [...set].sort();
  }, [rows, locationNameById]);

  const filtered = useMemo(() => {
    let list = displayRows;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r => {
        if ((r.name ?? '').toLowerCase().includes(q)) return true;
        if ((r.primary_email ?? "").toLowerCase().includes(q)) return true;
        if ((locationNameById[r.primary_location_id ?? ""] ?? "").toLowerCase().includes(q)) return true;
        const studs = studentsByFamily[r.id] ?? [];
        return studs.some(s => s.name.toLowerCase().includes(q));
      });
    }
    if (filterTeacher) {
      list = list.filter(r => {
        const t = teacherByFamily[r.id] ?? "";
        return t.split(",").map(s => s.trim()).includes(filterTeacher);
      });
    }
    if (filterLocation) {
      list = list.filter(r => (locationNameById[r.primary_location_id ?? ""] ?? "") === filterLocation);
    }
    return list;
  }, [displayRows, search, locationNameById, studentsByFamily, teacherByFamily, filterTeacher, filterLocation]);

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif", display: "flex", flexDirection: "column", gap: 0 }}>

      {/* ── Top bar ── */}
      <div style={{
        display: "flex",
        alignItems: isMobile ? "stretch" : "center",
        justifyContent: "space-between",
        gap: 8,
        paddingBottom: 12,
        flexDirection: isMobile ? "column" : "row",
        flexWrap: isMobile ? "nowrap" : "wrap",
      }}>
        {/* Back Button + Tabs + New Family */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 8 }}>
          <SmartBackButton />
          <div style={{ display: "flex", gap: 2, background: "var(--z-surface)", borderRadius: 8, padding: 3, border: "1px solid var(--z-border)" }}>
            {(["active","inactive"] as TabId[]).map(t => {
              const cnt = t === "active" ? (tab === "active" ? filtered.length : activeRows.length) : (tab === "inactive" ? filtered.length : inactiveRows.length);
              const on = tab === t;
              return (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding: "4px 14px", borderRadius: 6, fontSize: 12, fontWeight: on ? 700 : 500,
                  cursor: "pointer", border: "none", transition: "all 0.12s",
                  background: on ? ZIRO_GREEN : "transparent",
                  color: on ? "#000" : "var(--z-muted)",
                  boxShadow: on ? `0 1px 6px ${ZIRO_GREEN}44` : "none",
                }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                  <span style={{
                    marginLeft: 6, padding: "0px 6px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                    background: on ? "rgba(0,0,0,0.18)" : "var(--z-border)",
                    color: on ? "#000" : "var(--z-muted)",
                  }}>{cnt}</span>
                </button>
              );
            })}
          </div>
          {/* + New Family always visible on mobile top row */}
          {isMobile && (
            <button
              onClick={() => setShowAdd(true)}
              style={{
                padding: "6px 14px", borderRadius: 7, border: "none",
                background: ZIRO_GREEN, color: "#000",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              + New Family
            </button>
          )}
        </div>

        {/* Search + filters */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: isMobile ? "wrap" : "nowrap",
        }}>
          <input
            type="search"
            placeholder="Search families, students…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: "6px 12px", borderRadius: 7, border: "1px solid var(--z-border)",
              background: "var(--z-surface)", color: "var(--z-fg)", fontSize: 12, outline: "none",
              width: isMobile ? "100%" : 220,
              flex: isMobile ? "1 1 100%" : "none",
            }}
          />
          <div style={{ display: "flex", gap: 6, flex: isMobile ? "1 1 100%" : "none" }}>
            <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}
              style={{
                padding: "6px 8px", borderRadius: 7, border: "1px solid var(--z-border)",
                background: "var(--z-surface)", color: filterTeacher ? "var(--z-fg)" : "var(--z-muted)",
                fontSize: 12, outline: "none", cursor: "pointer", flex: 1,
              }}>
              <option value="">All Teachers</option>
              {allTeachers.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)}
              style={{
                padding: "6px 8px", borderRadius: 7, border: "1px solid var(--z-border)",
                background: "var(--z-surface)", color: filterLocation ? "var(--z-fg)" : "var(--z-muted)",
                fontSize: 12, outline: "none", cursor: "pointer", flex: 1,
              }}>
              <option value="">All Locations</option>
              {allLocations.map(l => <option key={l} value={l}>{l.replace(" Music Lessons", "")}</option>)}
            </select>
          </div>
          {(search || filterTeacher || filterLocation) && (
            <button onClick={() => { setSearch(""); setFilterTeacher(""); setFilterLocation(""); }}
              style={{
                padding: "6px 10px", borderRadius: 7, border: "1px solid var(--z-border)",
                background: "transparent", color: "var(--z-muted)", fontSize: 11, cursor: "pointer",
                whiteSpace: "nowrap",
              }}>Clear</button>
          )}
          {/* + New Family — desktop only */}
          {!isMobile && (
            <button
              onClick={() => setShowAdd(true)}
              style={{
                padding: "5px 14px", borderRadius: 7, border: "none",
                background: ZIRO_GREEN, color: "#000",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              + New Family
            </button>
          )}
        </div>
      </div>

      {/* ── DESKTOP: Column header ── */}
      {!isMobile && (
        <div style={{
          position: "sticky", top: 0, zIndex: 10,
          background: "var(--z-bg, var(--z-surface))",
          borderBottom: "1px solid var(--z-border)",
          display: "grid",
          gridTemplateColumns: "minmax(0,1.6fr) 100px minmax(0,1.2fr) 80px minmax(0,2fr)",
          padding: "6px 16px 6px 20px",
          gap: 8,
        }}>
          {["Family","Phone","Email","Location","Students & Teachers"].map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--z-muted)" }}>{h}</span>
          ))}
        </div>
      )}

      {/* ── Rows ── */}
      {filtered.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--z-muted)", fontSize: 13 }}>
          {(search || filterTeacher || filterLocation) ? `No families match the current filters` : `No ${tab} families`}
        </div>
      ) : isMobile ? (
        /* ═══════════════════════════════════════════════════════
           MOBILE: stacked card layout
           ═══════════════════════════════════════════════════════ */
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {filtered.map((row) => {
            const locName   = locationNameById[row.primary_location_id ?? ""] ?? null;
            const ls        = locStyle(locName);
            const locShort  = shortLoc(locName);
            const students  = studentsByFamily[row.id] ?? [];
            const [avBg, avFg] = avColor(row.name);
            const isMil     = row.is_military === true;
            const isOverdue = (row.billing_status ?? "").toLowerCase() === "overdue";

            const studentLines = students.slice(0, 6).map(s => ({
              name: firstName(s.name),
              instrument: s.instrument ? normInst(s.instrument) : null,
              teacher: s.teacherName ?? null,
            }));
            const extraCount = students.length > 6 ? students.length - 6 : 0;

            return (
              <div key={row.id}>
                <div
                  onClick={() => router.push(`/crm/families/${row.id}`)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0,
                    padding: "12px 16px 12px 0",
                    cursor: "pointer",
                    borderLeft: `4px solid ${ZIRO_GREEN}`,
                    position: "relative",
                  }}
                  onTouchStart={e => { (e.currentTarget as HTMLDivElement).style.background = "var(--z-surface)"; }}
                  onTouchEnd={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                >
                  {/* Row 1: Avatar + Name + MIL + Location + Chevron */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 12 }}>
                    {/* Avatar */}
                    <div style={{
                      flexShrink: 0, width: 36, height: 36, borderRadius: "50%",
                      background: `radial-gradient(circle at 35% 35%, ${avBg}, ${avBg}88)`,
                      border: `1.5px solid ${avFg}44`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 800, color: avFg, letterSpacing: "-0.02em",
                    }}>
                      {initials(row.name)}
                    </div>

                    {/* Name + badges */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: 14, fontWeight: 700, color: "var(--z-fg)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {(row.name ?? '').replace(/\s+family$/i, "").trim()}
                        </span>
                        {isMil && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 20,
                            background: "rgba(124,58,237,0.12)", color: "#7c3aed", letterSpacing: "0.04em",
                            whiteSpace: "nowrap",
                          }}>★ MIL</span>
                        )}
                        {isOverdue && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 20,
                            background: "rgba(185,28,28,0.1)", color: "#b91c1c", letterSpacing: "0.04em",
                            whiteSpace: "nowrap",
                          }}>OVERDUE</span>
                        )}
                      </div>
                    </div>

                    {/* Location pill + chevron */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                        background: ls.bg, color: ls.fg, whiteSpace: "nowrap",
                      }}>{locShort}</span>
                      <span style={{ color: "var(--z-muted)", fontSize: 14, lineHeight: 1 }}>›</span>
                    </div>
                  </div>

                  {/* Row 2: Email */}
                  {row.primary_email && (
                    <div style={{ paddingLeft: 58, marginTop: 4 }}>
                      <span style={{
                        fontSize: 11, color: "var(--z-muted)", fontWeight: 400,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        display: "block", maxWidth: "100%",
                      }}>
                        {row.primary_email.length > 32
                          ? row.primary_email.slice(0, 32) + "…"
                          : row.primary_email}
                      </span>
                    </div>
                  )}

                  {/* Row 3: Phone */}
                  {row.primary_phone && (
                    <div style={{ paddingLeft: 58, marginTop: 2 }}>
                      <span style={{ fontSize: 11, color: "var(--z-muted)", fontWeight: 400 }}>
                        {row.primary_phone}
                      </span>
                    </div>
                  )}

                  {/* Row 4+: Students */}
                  {studentLines.length > 0 && (
                    <div style={{ paddingLeft: 58, marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                      {studentLines.map((sl, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--z-fg)" }}>{sl.name}</span>
                          {sl.instrument && (
                            <span style={{
                              fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 20,
                              background: `${ZIRO_GREEN}18`, color: ZIRO_GREEN,
                              letterSpacing: "0.04em",
                            }}>{instrEmoji(sl.instrument)} {sl.instrument}</span>
                          )}
                          {sl.teacher && (
                            <span style={{ fontSize: 11, color: "var(--z-muted)", fontWeight: 400 }}>
                              {sl.teacher}
                            </span>
                          )}
                        </div>
                      ))}
                      {extraCount > 0 && (
                        <span style={{ fontSize: 10, color: "var(--z-muted)", fontWeight: 500 }}>+{extraCount} more</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Row separator */}
                <div style={{ position: "relative", height: 1, marginLeft: 4 }}>
                  <div style={{
                    position: "absolute", left: 0, top: 0, right: 0, height: 1,
                    background: `linear-gradient(to right, ${ZIRO_GREEN}66 0%, ${ZIRO_GREEN}22 40%, transparent 100%)`,
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════
           DESKTOP: original table layout — unchanged
           ═══════════════════════════════════════════════════════ */
        <div style={{ display: "flex", flexDirection: "column" }}>
          {filtered.map((row, idx) => {
            const locName   = locationNameById[row.primary_location_id ?? ""] ?? null;
            const ls        = locStyle(locName);
            const locShort  = shortLoc(locName);
            const students  = studentsByFamily[row.id] ?? [];
            const [avBg, avFg] = avColor(row.name);
            const isMil     = row.is_military === true;
            const isOverdue = (row.billing_status ?? "").toLowerCase() === "overdue";
            const instruments = parseInst(row.instruments);

            const studentLines = students.slice(0, 5).map(s => ({
              name: firstName(s.name),
              instrument: s.instrument ? normInst(s.instrument) : null,
              teacher: s.teacherName ?? null,
            }));
            const extraCount = students.length > 5 ? students.length - 5 : 0;

            return (
              <div key={row.id}>
                <div
                  onClick={() => router.push(`/crm/families/${row.id}`)}
                  style={{
                    position: "relative",
                    display: "grid",
                    gridTemplateColumns: "minmax(0,1.6fr) 100px minmax(0,1.2fr) 80px minmax(0,2fr)",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 16px 8px 0",
                    cursor: "pointer",
                    transition: "background 0.1s, transform 0.1s",
                    borderLeft: `4px solid ${ZIRO_GREEN}`,
                    borderBottom: "none",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.background = "var(--z-surface)";
                    el.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.background = "transparent";
                    el.style.transform = "translateY(0)";
                  }}
                >
                  {/* Col 1: Avatar + Name */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, paddingLeft: 12 }}>
                    <div style={{
                      flexShrink: 0, width: 32, height: 32, borderRadius: "50%",
                      background: `radial-gradient(circle at 35% 35%, ${avBg}, ${avBg}88)`,
                      border: `1.5px solid ${avFg}44`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 800, color: avFg, letterSpacing: "-0.02em",
                    }}>
                      {initials(row.name)}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "nowrap" }}>
                        <span style={{
                          fontSize: 13, fontWeight: 700, color: "var(--z-fg)",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200,
                        }}>
                          {(row.name ?? '').replace(/\s+family$/i, "").trim()}
                        </span>
                        {isMil && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 20,
                            background: "rgba(124,58,237,0.12)", color: "#7c3aed", letterSpacing: "0.04em",
                            whiteSpace: "nowrap",
                          }}>★ MIL</span>
                        )}
                        {isOverdue && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 20,
                            background: "rgba(185,28,28,0.1)", color: "#b91c1c", letterSpacing: "0.04em",
                            whiteSpace: "nowrap",
                          }}>OVERDUE</span>
                        )}
                      </div>
                      {instruments.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "nowrap", gap: 3, marginTop: 3, overflow: "hidden" }}>
                          {instruments.slice(0, 3).map(inst => (
                            <span key={inst} style={{
                              fontSize: 9, fontWeight: 600, padding: "1px 5px", borderRadius: 20,
                              background: `${ZIRO_GREEN}15`, color: ZIRO_GREEN, letterSpacing: "0.03em",
                              whiteSpace: "nowrap",
                            }}>{instrEmoji(inst)} {inst}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Col 2: Phone */}
                  <div style={{ fontSize: 11, color: "var(--z-muted)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {row.primary_phone ? <span>{row.primary_phone}</span> : <span style={{ color: "var(--z-border)", fontSize: 11 }}>—</span>}
                  </div>

                  {/* Col 3: Email */}
                  <div style={{ fontSize: 11, color: "var(--z-muted)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {row.primary_email ? <span title={row.primary_email}>{row.primary_email}</span> : <span style={{ color: "var(--z-border)", fontSize: 11 }}>—</span>}
                  </div>

                  {/* Col 4: Location pill */}
                  <div>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                      background: ls.bg, color: ls.fg, whiteSpace: "nowrap",
                    }}>{locShort}</span>
                  </div>

                  {/* Col 5: Students & Teachers */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 1, overflow: "hidden" }}>
                    {studentLines.length > 0 ? (
                      <>
                        {studentLines.map((sl, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, overflow: "hidden", whiteSpace: "nowrap" }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--z-fg)", flexShrink: 0 }}>{sl.name}</span>
                            {sl.instrument && (
                              <>
                                <span style={{ fontSize: 11, color: "var(--z-border)", flexShrink: 0 }}>•</span>
                                <span style={{ fontSize: 11, fontWeight: 500, color: "var(--z-muted)", flexShrink: 0 }}>{sl.instrument}</span>
                              </>
                            )}
                            {sl.teacher && (
                              <>
                                <span style={{ fontSize: 11, color: "var(--z-border)", flexShrink: 0 }}>•</span>
                                <span style={{ fontSize: 11, fontWeight: 500, color: "var(--z-muted)", overflow: "hidden", textOverflow: "ellipsis" }}>{sl.teacher}</span>
                              </>
                            )}
                          </div>
                        ))}
                        {extraCount > 0 && (
                          <span style={{ fontSize: 10, color: "var(--z-border)", fontWeight: 500 }}>+{extraCount} more</span>
                        )}
                      </>
                    ) : (
                      <span style={{ color: "var(--z-border)", fontSize: 11 }}>—</span>
                    )}
                  </div>
                </div>

                {/* Fading L-border bottom */}
                <div style={{ position: "relative", height: 1, marginLeft: 4 }}>
                  <div style={{
                    position: "absolute", left: 0, top: 0, right: 0, height: 1,
                    background: `linear-gradient(to right, ${ZIRO_GREEN}66 0%, ${ZIRO_GREEN}22 40%, transparent 100%)`,
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddFamilyModal
        open={showAdd}
        onClose={() => {
          setShowAdd(false);
          if (searchParams?.get("new") === "true") {
            router.replace("/crm/families");
          }
        }}
        locations={locationOptions}
      />
    </div>
  );
}
