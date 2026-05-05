/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageTransition } from "@/components/system/PageTransition";
import { PageHeader } from "@/components/ui/PageHeader";
import { LOCATION_MAP, LOCATIONS } from "@/lib/config/locations";

type Teacher = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  email?: string | null;
  phone?: string | null;
  photo_url?: string | null;
  instruments?: string[];
  status?: string | null;
  is_active?: boolean;
  pay_rate_per_half_hour?: number | null;
  rate_per_block?: number;
  needs_1099?: boolean;
  w9_completed_at?: string | null;
  hire_date?: string | null;
  teacher_role?: string | null;
  bio?: string | null;
  is_sub_available?: boolean;
  sub_available?: boolean | null;
  location_ids?: string[];
};

const ZIRO_GREEN = "#00D16C";

const INSTRUMENT_EMOJI: Record<string, string> = {
  guitar: "🎸", bass: "🎸", piano: "🎹", keyboard: "🎹",
  drums: "🥁", percussion: "🥁", violin: "🎻", viola: "🎻",
  cello: "🎻", trumpet: "🎺", trombone: "🎺", saxophone: "🎷",
  clarinet: "🎷", flute: "🎷", voice: "🎤", vocals: "🎤",
  ukulele: "🪕", banjo: "🪕",
};

function instrEmoji(instr?: string | null) {
  if (!instr) return "🎵";
  const key = instr.toLowerCase();
  for (const [k, v] of Object.entries(INSTRUMENT_EMOJI)) { if (key.includes(k)) return v; }
  return "🎵";
}

function teacherName(t: Teacher): string {
  if (t.display_name) return t.display_name;
  const parts = [t.first_name, t.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Unknown";
}

function initials(t: Teacher): string {
  const name = teacherName(t);
  const parts = name.split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const AV_PALETTES: [string, string][] = [
  ["#00D16C", "#003322"], ["#2563eb", "#0a1a3a"], ["#7c3aed", "#1a0a3a"],
  ["#f59e0b", "#2a1a00"], ["#ef4444", "#2a0a0a"], ["#06b6d4", "#002a2a"],
];
function avColor(name: string): [string, string] {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AV_PALETTES[h % AV_PALETTES.length];
}

export function TeachersClient() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ matched: number; unmatched: number; updated: number; unmatched_list: Array<{ name: string; email: string }> } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  async function handleSquareSync() {
    setSyncing(true);
    setSyncError(null);
    setSyncResult(null);
    try {
      const res = await fetch("/api/square/sync-team?dry_run=false", { method: "POST" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSyncResult(data);
      loadTeachers();
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  const loadTeachers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (locationFilter !== "all") params.set("locationId", locationFilter);
    if (statusFilter === "active") params.set("isActive", "true");
    if (statusFilter === "inactive") params.set("isActive", "false");
    fetch(`/api/crm/teachers?${params}`)
      .then(r => r.json())
      .then(res => {
        const raw: Teacher[] = Array.isArray(res.data) ? res.data : [];
        raw.sort((a, b) => teacherName(a).localeCompare(teacherName(b)));
        setTeachers(raw);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [locationFilter, statusFilter]);

  useEffect(() => { loadTeachers(); }, [loadTeachers]);

  const filtered = search
    ? teachers.filter(t => {
        const name = teacherName(t).toLowerCase();
        const instr = (t.instruments ?? []).join(" ").toLowerCase();
        const q = search.toLowerCase();
        return name.includes(q) || instr.includes(q) || (t.email ?? "").toLowerCase().includes(q);
      })
    : teachers;

  return (
    <PageTransition>
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)", overflow: "hidden" }}>

        {/* ── Header ── */}
        <div style={{ flexShrink: 0, borderBottom: "1px solid var(--z-border)", padding: isMobile ? "12px 16px" : "16px 24px" }}>

          {/* Title row + action buttons */}
          <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: 12, flexDirection: isMobile ? "column" : "row" }}>
            <PageHeader title="Teachers" subtitle="Staff directory, pay rates, and W-9 status" />
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <button
                onClick={handleSquareSync}
                disabled={syncing}
                style={{
                  borderRadius: 8, border: `1px solid ${ZIRO_GREEN}40`, padding: isMobile ? "5px 10px" : "6px 14px",
                  fontSize: isMobile ? 11 : 13, fontWeight: 600,
                  color: syncing ? "var(--z-muted)" : ZIRO_GREEN,
                  background: `${ZIRO_GREEN}10`, cursor: syncing ? "not-allowed" : "pointer",
                  opacity: syncing ? 0.6 : 1, display: "flex", alignItems: "center", gap: 6,
                  whiteSpace: "nowrap",
                }}
              >
                {syncing ? (
                  <><span style={{ display: "inline-block", width: 12, height: 12, border: `2px solid ${ZIRO_GREEN}40`, borderTop: `2px solid ${ZIRO_GREEN}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Syncing...</>
                ) : "⟳ Sync Square"}
              </button>
              <button
                onClick={() => setShowInvite(true)}
                style={{
                  borderRadius: 8, border: "1px solid var(--z-border)", padding: isMobile ? "5px 10px" : "6px 14px",
                  fontSize: isMobile ? 11 : 13, fontWeight: 600,
                  color: "var(--z-muted)", background: "transparent", cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >✉ Invite</button>
              <Link
                href="/crm/teachers/new"
                style={{
                  borderRadius: 8, background: `${ZIRO_GREEN}18`, padding: isMobile ? "5px 10px" : "6px 14px",
                  fontSize: isMobile ? 11 : 13, fontWeight: 600, color: ZIRO_GREEN, textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >+ Add Teacher</Link>
            </div>
          </div>

          {/* Location filter pills */}
          <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["all", ...LOCATIONS.map((l: { id: string }) => l.id)].map(locId => {
              const locCfg = locId !== "all" ? LOCATION_MAP[locId] : null;
              const isActive = locationFilter === locId;
              return (
                <button
                  key={locId}
                  onClick={() => setLocationFilter(locId)}
                  style={{
                    borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer",
                    border: `1px solid ${isActive && locCfg ? `${locCfg.color}50` : isActive ? `${ZIRO_GREEN}30` : "var(--z-border)"}`,
                    background: isActive && locCfg ? `${locCfg.color}20` : isActive ? `${ZIRO_GREEN}15` : "transparent",
                    color: isActive && locCfg ? locCfg.color : isActive ? ZIRO_GREEN : "var(--z-muted)",
                  }}
                >
                  {locId === "all" ? "All Locations" : locCfg?.name ?? locId}
                </button>
              );
            })}
          </div>

          {/* Status filter + search */}
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: isMobile ? "wrap" : "nowrap" }}>
            <div style={{ display: "flex", borderRadius: 8, border: "1px solid var(--z-border)", overflow: "hidden", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
              {(["all", "active", "inactive"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  style={{
                    padding: "5px 12px", textTransform: "capitalize", cursor: "pointer", border: "none",
                    background: statusFilter === s ? "rgba(255,255,255,0.08)" : "transparent",
                    color: statusFilter === s ? "var(--z-fg)" : "var(--z-muted)",
                  }}
                >{s}</button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Search teachers, instruments…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1, borderRadius: 8, border: "1px solid var(--z-border)", background: "var(--z-surface)",
                padding: "5px 12px", fontSize: 13, color: "var(--z-fg)", outline: "none",
                minWidth: 0,
              }}
            />
          </div>
        </div>

        {/* ── DESKTOP: Column header ── */}
        {!isMobile && (
          <div style={{
            flexShrink: 0,
            background: "var(--z-bg, #0a0a0c)",
            borderBottom: "1px solid var(--z-border)",
            display: "grid",
            gridTemplateColumns: "minmax(0,1.8fr) 140px minmax(0,1.2fr) minmax(0,1.2fr) 90px 80px",
            padding: "6px 16px 6px 20px",
            gap: 8,
          }}>
            {["Teacher", "Contact", "Instruments", "Location", "Pay Rate", "W-9"].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--z-muted)" }}>{h}</span>
            ))}
          </div>
        )}

        {/* ── Rows ── */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={{ height: 52, marginLeft: 4, borderLeft: `4px solid ${ZIRO_GREEN}40`, borderBottom: `1px solid var(--z-border)`, background: "rgba(255,255,255,0.01)" }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: "var(--z-muted)", fontSize: 13 }}>
              No teachers found
            </div>
          ) : isMobile ? (
            /* ═══════════════════════════════════════════════════════
               MOBILE: stacked card layout
               ═══════════════════════════════════════════════════════ */
            <div>
              {filtered.map(t => {
                const name = teacherName(t);
                const [avBg, avFg] = avColor(name);
                const payRate = t.pay_rate_per_half_hour ?? t.rate_per_block ?? null;
                const w9Done = !!t.w9_completed_at;
                const isActive = t.is_active !== false && (t.status ?? "active") !== "inactive";
                const locIds = t.location_ids ?? [];
                const locConfigs = locIds.map((id: string) => LOCATION_MAP[id]).filter(Boolean);
                const instrs = t.instruments ?? [];

                return (
                  <div key={t.id}>
                    <div
                      onClick={() => router.push(`/teachers/${t.id}`)}
                      style={{
                        display: "flex", flexDirection: "column", gap: 0,
                        padding: "12px 16px 12px 0",
                        cursor: "pointer",
                        borderLeft: `4px solid ${ZIRO_GREEN}`,
                        position: "relative",
                      }}
                      onTouchStart={e => { (e.currentTarget as HTMLDivElement).style.background = "var(--z-surface)"; }}
                      onTouchEnd={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                    >
                      {/* Row 1: Avatar + Name + Role | Location pills + Chevron */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 12 }}>
                        {/* Avatar */}
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          {t.photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={t.photo_url} alt={name} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: "1.5px solid var(--z-border)" }} />
                          ) : (
                            <div style={{
                              width: 38, height: 38, borderRadius: "50%",
                              background: `radial-gradient(circle at 35% 35%, ${avBg}, ${avBg}88)`,
                              border: `1.5px solid ${avFg}44`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 12, fontWeight: 800, color: avFg, letterSpacing: "-0.02em",
                            }}>
                              {initials(t)}
                            </div>
                          )}
                          {/* Active dot */}
                          <div style={{
                            position: "absolute", bottom: 0, right: 0,
                            width: 10, height: 10, borderRadius: "50%",
                            background: isActive ? "#22c55e" : "#505055",
                            border: "2px solid var(--z-bg, #0a0a0c)",
                          }} />
                        </div>

                        {/* Name + role */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--z-fg)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {name}
                          </div>
                          <div style={{ fontSize: 10, color: "var(--z-muted)", marginTop: 1 }}>
                            {t.teacher_role ?? "Music Teacher"}
                          </div>
                        </div>

                        {/* Location pills + chevron */}
                        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                          {locConfigs.slice(0, 2).map((lc: { color: string; name: string }, i: number) => (
                            <span key={i} style={{
                              fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 20,
                              background: `${lc.color}20`, color: lc.color, whiteSpace: "nowrap",
                            }}>{lc.name}</span>
                          ))}
                          {locConfigs.length > 2 && (
                            <span style={{ fontSize: 9, color: "var(--z-muted)" }}>+{locConfigs.length - 2}</span>
                          )}
                          <span style={{ color: "var(--z-muted)", fontSize: 14, lineHeight: 1, marginLeft: 2 }}>›</span>
                        </div>
                      </div>

                      {/* Row 2: Instrument pills */}
                      {instrs.length > 0 && (
                        <div style={{ paddingLeft: 60, marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {instrs.map((instr: string, i: number) => (
                            <span key={i} style={{
                              fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 20,
                              background: `${ZIRO_GREEN}15`, color: ZIRO_GREEN, whiteSpace: "nowrap",
                            }}>
                              {instrEmoji(instr)} {instr}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Row 3: Phone • Email */}
                      {(t.phone || t.email) && (
                        <div style={{ paddingLeft: 60, marginTop: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          {t.phone && (
                            <span style={{ fontSize: 11, color: "var(--z-muted)", fontWeight: 400 }}>{t.phone}</span>
                          )}
                          {t.phone && t.email && (
                            <span style={{ fontSize: 10, color: "var(--z-border)" }}>•</span>
                          )}
                          {t.email && (
                            <span style={{
                              fontSize: 11, color: "var(--z-muted)", fontWeight: 400,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              maxWidth: 200,
                            }}>
                              {t.email.length > 28 ? t.email.slice(0, 28) + "…" : t.email}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Row 4: Pay rate + W-9 */}
                      <div style={{ paddingLeft: 60, marginTop: 6, display: "flex", alignItems: "center", gap: 10 }}>
                        {payRate != null ? (
                          <span style={{ fontSize: 13, fontWeight: 700, color: ZIRO_GREEN }}>
                            ${payRate}<span style={{ fontSize: 9, fontWeight: 500, color: "var(--z-muted)", marginLeft: 2 }}>/blk</span>
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: "var(--z-border)" }}>No rate set</span>
                        )}
                        {w9Done ? (
                          <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "rgba(34,197,94,0.12)", color: "#22c55e", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>✓ W-9</span>
                        ) : (
                          <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "rgba(239,68,68,0.10)", color: "#ef4444", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>✕ W-9</span>
                        )}
                      </div>
                    </div>

                    {/* Fading separator */}
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
               DESKTOP: original 6-column table — unchanged
               ═══════════════════════════════════════════════════════ */
            <div>
              {filtered.map(t => {
                const name = teacherName(t);
                const [avBg, avFg] = avColor(name);
                const payRate = t.pay_rate_per_half_hour ?? t.rate_per_block ?? null;
                const w9Done = !!t.w9_completed_at;
                const isActive = t.is_active !== false && (t.status ?? "active") !== "inactive";
                const locIds = t.location_ids ?? [];
                const locConfigs = locIds.map((id: string) => LOCATION_MAP[id]).filter(Boolean);
                const instrs = t.instruments ?? [];

                return (
                  <div key={t.id}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0,1.8fr) 140px minmax(0,1.2fr) minmax(0,1.2fr) 90px 80px",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 16px 8px 0",
                        cursor: "pointer",
                        transition: "background 0.1s, transform 0.1s",
                        borderLeft: `4px solid ${ZIRO_GREEN}`,
                        borderBottom: "none",
                      }}
                      onClick={() => router.push(`/teachers/${t.id}`)}
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
                      {/* Col 1: Avatar + Name + role */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, paddingLeft: 12 }}>
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          {t.photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={t.photo_url} alt={name} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: "1.5px solid var(--z-border)" }} />
                          ) : (
                            <div style={{
                              width: 32, height: 32, borderRadius: "50%",
                              background: `radial-gradient(circle at 35% 35%, ${avBg}, ${avBg}88)`,
                              border: `1.5px solid ${avFg}44`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 11, fontWeight: 800, color: avFg, letterSpacing: "-0.02em",
                            }}>
                              {initials(t)}
                            </div>
                          )}
                          <div style={{
                            position: "absolute", bottom: -1, right: -1,
                            width: 9, height: 9, borderRadius: "50%",
                            background: isActive ? "#22c55e" : "#505055",
                            border: "2px solid var(--z-bg, #0a0a0c)",
                          }} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--z-fg)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {name}
                          </div>
                          <div style={{ fontSize: 10, color: "var(--z-muted)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {t.teacher_role ?? "Music Teacher"}
                          </div>
                        </div>
                      </div>

                      {/* Col 2: Stacked phone + email */}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 500, color: "var(--z-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {t.phone ?? <span style={{ color: "var(--z-border)" }}>—</span>}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--z-muted)", opacity: 0.7, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {t.email ?? <span style={{ color: "var(--z-border)" }}>—</span>}
                        </div>
                      </div>

                      {/* Col 3: Instrument pills with emojis */}
                      <div style={{ display: "flex", flexWrap: "nowrap", gap: 3, overflow: "hidden", alignItems: "center" }}>
                        {instrs.length === 0 ? (
                          <span style={{ fontSize: 11, color: "var(--z-border)" }}>—</span>
                        ) : (
                          instrs.slice(0, 3).map((instr: string, i: number) => (
                            <span key={i} style={{
                              fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 20,
                              background: `${ZIRO_GREEN}15`, color: ZIRO_GREEN, whiteSpace: "nowrap",
                            }}>
                              {instrEmoji(instr)} {instr}
                            </span>
                          ))
                        )}
                        {instrs.length > 3 && <span style={{ fontSize: 10, color: "var(--z-muted)" }}>+{instrs.length - 3}</span>}
                      </div>

                      {/* Col 4: Location pills */}
                      <div style={{ display: "flex", flexWrap: "nowrap", gap: 3, overflow: "hidden", alignItems: "center" }}>
                        {locConfigs.length === 0 ? (
                          <span style={{ fontSize: 11, color: "var(--z-border)" }}>—</span>
                        ) : (
                          locConfigs.slice(0, 2).map((lc: { color: string; name: string }, i: number) => (
                            <span key={i} style={{
                              fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20,
                              background: `${lc.color}20`, color: lc.color, whiteSpace: "nowrap",
                            }}>
                              {lc.name}
                            </span>
                          ))
                        )}
                        {locConfigs.length > 2 && <span style={{ fontSize: 10, color: "var(--z-muted)" }}>+{locConfigs.length - 2}</span>}
                      </div>

                      {/* Col 5: Pay rate */}
                      <div>
                        {payRate != null ? (
                          <span style={{ fontSize: 13, fontWeight: 700, color: ZIRO_GREEN }}>
                            ${payRate}<span style={{ fontSize: 9, fontWeight: 500, color: "var(--z-muted)", marginLeft: 2 }}>/blk</span>
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: "var(--z-border)" }}>—</span>
                        )}
                      </div>

                      {/* Col 6: W-9 pill */}
                      <div>
                        {w9Done ? (
                          <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "rgba(34,197,94,0.12)", color: "#22c55e", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>✓ W-9</span>
                        ) : (
                          <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "rgba(239,68,68,0.10)", color: "#ef4444", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>✕ W-9</span>
                        )}
                      </div>
                    </div>

                    {/* Fading L-border bottom separator */}
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
        </div>
      </div>

      {showInvite && (
        <InviteTeacherModal
          onClose={() => setShowInvite(false)}
          onSent={() => { setShowInvite(false); loadTeachers(); }}
        />
      )}

      {/* Square Sync Result Modal */}
      {(syncResult || syncError) && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#111113", border: "1px solid #1c1c1e", borderRadius: 12, padding: 28, minWidth: 360, maxWidth: 480, width: "90%" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--z-fg)" }}>
                {syncError ? "Sync Failed" : "Square Sync Complete"}
              </span>
              <button onClick={() => { setSyncResult(null); setSyncError(null); }} style={{ fontSize: 18, color: "var(--z-muted)", background: "none", border: "none", cursor: "pointer" }}>✕</button>
            </div>
            {syncError ? (
              <p style={{ color: "#ef4444", fontSize: 13 }}>{syncError}</p>
            ) : syncResult ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                  <div style={{ background: "rgba(0,209,108,0.08)", border: "1px solid rgba(0,209,108,0.2)", borderRadius: 8, padding: "12px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#00D16C" }}>{syncResult.matched}</div>
                    <div style={{ fontSize: 11, color: "var(--z-muted)", marginTop: 2 }}>Matched</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--z-border)", borderRadius: 8, padding: "12px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "var(--z-fg)" }}>{syncResult.updated}</div>
                    <div style={{ fontSize: 11, color: "var(--z-muted)", marginTop: 2 }}>Updated</div>
                  </div>
                  <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: "12px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#f59e0b" }}>{syncResult.unmatched}</div>
                    <div style={{ fontSize: 11, color: "var(--z-muted)", marginTop: 2 }}>Unmatched</div>
                  </div>
                </div>
                {syncResult.unmatched_list.length > 0 && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--z-muted)", marginBottom: 8 }}>Not in ZiroWork</p>
                    {syncResult.unmatched_list.map((u, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--z-border)", fontSize: 13 }}>
                        <span style={{ color: "var(--z-fg)" }}>{u.name}</span>
                        <span style={{ color: "var(--z-muted)", fontSize: 12 }}>{u.email || "no email"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : null}
            <button
              onClick={() => { setSyncResult(null); setSyncError(null); }}
              style={{ marginTop: 20, width: "100%", borderRadius: 8, background: `${ZIRO_GREEN}18`, border: `1px solid ${ZIRO_GREEN}30`, padding: "8px 0", fontSize: 13, fontWeight: 600, color: ZIRO_GREEN, cursor: "pointer" }}
            >Done</button>
          </div>
        </div>
      )}
    </PageTransition>
  );
}

function InviteTeacherModal({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSend() {
    if (!email.trim()) { setError("Email required"); return; }
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/crm/teachers/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), first_name: firstName.trim(), last_name: lastName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send invite");
      setSuccess(true);
      setTimeout(onSent, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#111113", border: "1px solid #1c1c1e", borderRadius: 12, padding: 28, minWidth: 340, maxWidth: 440, width: "90%" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--z-fg)" }}>Invite Teacher</span>
          <button onClick={onClose} style={{ fontSize: 18, color: "var(--z-muted)", background: "none", border: "none", cursor: "pointer" }}>✕</button>
        </div>
        {success ? (
          <p style={{ color: "#22c55e", fontSize: 14, textAlign: "center", padding: "16px 0" }}>Invite sent!</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              placeholder="First name"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              style={{ borderRadius: 8, border: "1px solid var(--z-border)", background: "var(--z-surface)", padding: "8px 12px", fontSize: 13, color: "var(--z-fg)", outline: "none" }}
            />
            <input
              placeholder="Last name"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              style={{ borderRadius: 8, border: "1px solid var(--z-border)", background: "var(--z-surface)", padding: "8px 12px", fontSize: 13, color: "var(--z-fg)", outline: "none" }}
            />
            <input
              placeholder="Email address *"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ borderRadius: 8, border: "1px solid var(--z-border)", background: "var(--z-surface)", padding: "8px 12px", fontSize: 13, color: "var(--z-fg)", outline: "none" }}
            />
            {error && <p style={{ color: "#ef4444", fontSize: 12, margin: 0 }}>{error}</p>}
            <button
              onClick={handleSend}
              disabled={sending}
              style={{ borderRadius: 8, background: `${ZIRO_GREEN}18`, border: `1px solid ${ZIRO_GREEN}30`, padding: "9px 0", fontSize: 13, fontWeight: 600, color: ZIRO_GREEN, cursor: sending ? "not-allowed" : "pointer", opacity: sending ? 0.6 : 1 }}
            >{sending ? "Sending…" : "Send Invite"}</button>
          </div>
        )}
      </div>
    </div>
  );
}
