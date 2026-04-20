/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageTransition } from "@/components/system/PageTransition";
import { PageHeader } from "@/components/ui/PageHeader";
import { AgentPageBar } from "@/components/agentOS/AgentPageBar";
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

const INSTRUMENT_EMOJI: Record<string, string> = {
  guitar: "🎸", bass: "🎸", piano: "🎹", keyboard: "🎹",
  drums: "🥁", percussion: "🥁", violin: "🎻", viola: "🎻",
  cello: "🎻", trumpet: "🎺", trombone: "🎺", saxophone: "🎷",
  clarinet: "🎷", flute: "🎷", voice: "🎤", vocals: "🎤",
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
function w9Status(t: Teacher): { label: string; color: string } {
  if (t.w9_completed_at) return { label: "W-9 ✓", color: "#22c55e" };
  if (t.needs_1099) return { label: "W-9 needed", color: "#f59e0b" };
  return { label: "No 1099", color: "#505055" };
}

function TeacherDetailPanel({ teacher, onClose }: { teacher: Teacher; onClose: () => void }) {
  const locIds = teacher.location_ids ?? [];
  const locConfigs = locIds.map(id => LOCATION_MAP[id]).filter(Boolean);
  const w9 = w9Status(teacher);
  const payRate = teacher.pay_rate_per_half_hour ?? teacher.rate_per_block ?? null;
  return (
    <div className="flex flex-col h-full">
      {locConfigs.length > 0 && (
        <div className="flex h-1.5 w-full shrink-0">
          {locConfigs.map((lc, i) => <div key={i} className="flex-1" style={{ backgroundColor: lc.color }} />)}
        </div>
      )}
      <div className="flex items-center justify-between border-b border-[#1c1c1e] px-6 py-4">
        <div className="flex items-center gap-3">
          {teacher.photo_url ? (
            <img src={teacher.photo_url} alt={teacherName(teacher)} className="h-12 w-12 rounded-full object-cover border border-[#2b2b2f]" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1c1c1e] text-sm font-bold text-[#909098]">{initials(teacher)}</div>
          )}
          <div>
            <div className="text-base font-bold text-white">{teacherName(teacher)}</div>
            <div className="text-xs text-[#505055]">{teacher.teacher_role ?? "Teacher"}</div>
          </div>
        </div>
        <button onClick={onClose} className="text-[#505055] hover:text-white transition-colors text-lg">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <section>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Contact</div>
          <div className="space-y-1.5 text-sm">
            {teacher.email && <div className="flex gap-3 text-[#909098]"><span className="text-[#505055] w-12">Email</span>{teacher.email}</div>}
            {teacher.phone && <div className="flex gap-3 text-[#909098]"><span className="text-[#505055] w-12">Phone</span>{teacher.phone}</div>}
            {teacher.hire_date && <div className="flex gap-3 text-[#909098]"><span className="text-[#505055] w-12">Hired</span>{new Date(teacher.hire_date).toLocaleDateString()}</div>}
          </div>
        </section>
        <section>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Compensation</div>
          <div className="flex items-center justify-between rounded-lg border border-[#1c1c1e] bg-[#111113] px-4 py-3">
            <div>
              <div className="text-lg font-extrabold text-[#00ff88]">{payRate != null ? `$${payRate}` : "—"}</div>
              <div className="text-[10px] text-[#505055]">per 30-min block</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold" style={{ color: w9.color }}>{w9.label}</div>
              <div className="text-[10px] text-[#505055]">{teacher.needs_1099 ? "1099 contractor" : "W-2 employee"}</div>
            </div>
          </div>
        </section>
        {(teacher.instruments ?? []).length > 0 && (
          <section>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Instruments</div>
            <div className="flex flex-wrap gap-2">
              {(teacher.instruments ?? []).map((instr, i) => (
                <span key={i} className="rounded-full border border-[#2b2b2f] bg-[#111113] px-3 py-1 text-xs text-[#909098]">{instrEmoji(instr)} {instr}</span>
              ))}
            </div>
          </section>
        )}
        {locConfigs.length > 0 && (
          <section>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Locations</div>
            <div className="flex flex-wrap gap-2">
              {locConfigs.map((lc, i) => (
                <span key={i} className="rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: `${lc.color}20`, color: lc.color }}>{lc.name}</span>
              ))}
            </div>
          </section>
        )}
        {teacher.bio && (
          <section>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Bio</div>
            <p className="text-sm text-[#909098] leading-relaxed">{teacher.bio}</p>
          </section>
        )}
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${(teacher.is_sub_available || teacher.sub_available) ? "bg-[#22c55e]" : "bg-[#505055]"}`} />
          <span className="text-xs text-[#909098]">{(teacher.is_sub_available || teacher.sub_available) ? "Available for sub coverage" : "Not available for subs"}</span>
        </div>
        <Link href={`/teachers/${teacher.id}`} className="flex items-center justify-center gap-2 rounded-lg border border-[#2b2b2f] px-4 py-2.5 text-sm font-semibold text-[#909098] hover:text-white hover:border-[#404048] transition-colors">
          View Full Profile →
        </Link>
      </div>
    </div>
  );
}

export function TeachersClient() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
  const [search, setSearch] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

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
      <div className="flex h-[calc(100vh-56px)] flex-col overflow-hidden">
        <div className="shrink-0 border-b border-[#1c1c1e] px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <PageHeader title="Teachers" subtitle="Staff directory, pay rates, and W-9 status" />
            <Link href="/crm/teachers/new" className="shrink-0 rounded-lg bg-[#00ff88]/10 px-4 py-2 text-sm font-semibold text-[#00ff88] hover:bg-[#00ff88]/20 transition-colors">+ Add Teacher</Link>
          </div>
          <div className="mt-3">
            <AgentPageBar agentId="vader" chatPlaceholder="Ask Vader about teachers or staffing…"
              pageContext={{ page: "teachers", totalTeachers: filtered.length, locationFilter, statusFilter }} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["all", ...LOCATIONS.map(l => l.id)].map(locId => {
              const locCfg = locId !== "all" ? LOCATION_MAP[locId] : null;
              const isActive = locationFilter === locId;
              return (
                <button key={locId} onClick={() => { setLocationFilter(locId); setSelectedTeacher(null); }}
                  className="rounded-full px-3 py-1 text-xs font-semibold transition-colors border"
                  style={isActive && locCfg ? { backgroundColor: `${locCfg.color}20`, color: locCfg.color, borderColor: `${locCfg.color}50` } : isActive ? { backgroundColor: "#00ff8815", color: "#00ff88", borderColor: "#00ff8830" } : { backgroundColor: "transparent", color: "#505055", borderColor: "#1c1c1e" }}>
                  {locId === "all" ? "All Locations" : locCfg?.name ?? locId}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex gap-2">
            <div className="flex rounded-lg border border-[#1c1c1e] overflow-hidden text-xs font-semibold">
              {(["all", "active", "inactive"] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 capitalize transition-colors ${statusFilter === s ? "bg-white/8 text-white" : "text-[#505055] hover:text-[#909098]"}`}>{s}</button>
              ))}
            </div>
            <input type="text" placeholder="Search teachers, instruments…" value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 rounded-lg border border-[#1c1c1e] bg-[#111113] px-3 py-1.5 text-sm text-white placeholder-[#404048] focus:border-[#00ff88]/30 focus:outline-none" />
          </div>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className={`flex-1 overflow-y-auto p-4 ${selectedTeacher ? "hidden lg:block" : ""}`}>
            {loading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 animate-pulse rounded-xl bg-white/5" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
                <div className="text-4xl">👩‍🏫</div>
                <div className="text-sm font-semibold text-[#909098]">No teachers found</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map(t => {
                  const locIds = t.location_ids ?? [];
                  const locConfigs = locIds.map(id => LOCATION_MAP[id]).filter(Boolean);
                  const isSelected = selectedTeacher?.id === t.id;
                  const w9 = w9Status(t);
                  const payRate = t.pay_rate_per_half_hour ?? t.rate_per_block ?? null;
                  return (
                    <button key={t.id} onClick={() => setSelectedTeacher(t.id === selectedTeacher?.id ? null : t)}
                      className={`text-left rounded-xl border transition-all overflow-hidden ${isSelected ? "border-[#00ff88]/40 bg-[#00ff88]/5" : "border-[#1c1c1e] bg-[#0a0a0c] hover:border-[#2b2b2f] hover:bg-white/2"}`}>
                      {locConfigs.length > 0 ? (
                        <div className="flex h-1 w-full">{locConfigs.map((lc, i) => <div key={i} className="flex-1" style={{ backgroundColor: lc.color }} />)}</div>
                      ) : <div className="h-1 w-full bg-[#1c1c1e]" />}
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="relative shrink-0">
                            {t.photo_url ? (
                              <img src={t.photo_url} alt={teacherName(t)} className="h-12 w-12 rounded-full object-cover border border-[#2b2b2f]" />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1c1c1e] text-sm font-bold text-[#909098] border border-[#2b2b2f]">{initials(t)}</div>
                            )}
                            {(t.is_active !== false) && <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#22c55e] border-2 border-[#0a0a0c]" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-white truncate">{teacherName(t)}</div>
                            <div className="text-xs text-[#505055] truncate">{t.email ?? "—"}</div>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {(t.instruments ?? []).slice(0, 3).map((instr, i) => (
                                <span key={i} className="rounded-full bg-[#1c1c1e] px-2 py-0.5 text-[10px] text-[#909098]">{instrEmoji(instr)} {instr}</span>
                              ))}
                              {(t.instruments ?? []).length > 3 && <span className="rounded-full bg-[#1c1c1e] px-2 py-0.5 text-[10px] text-[#505055]">+{(t.instruments ?? []).length - 3}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="text-xs">{payRate != null ? <span className="font-semibold text-[#00ff88]">${payRate}/30min</span> : <span className="text-[#505055]">Rate TBD</span>}</div>
                          <span className="text-[10px] font-semibold" style={{ color: w9.color }}>{w9.label}</span>
                        </div>
                        {locConfigs.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {locConfigs.map((lc, i) => <span key={i} className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${lc.color}20`, color: lc.color }}>{lc.name}</span>)}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {selectedTeacher && (
            <div className="w-full lg:w-96 shrink-0 border-l border-[#1c1c1e] bg-[#0a0a0c] overflow-y-auto">
              <TeacherDetailPanel teacher={selectedTeacher} onClose={() => setSelectedTeacher(null)} />
            </div>
          )}

        </div>
      </div>
    </PageTransition>
  );
}
