/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTransition } from "@/components/system/PageTransition";
import { AgentPageBar } from "@/components/agentOS/AgentPageBar";
import { LOCATION_MAP, LOCATIONS } from "@/lib/config/locations";

type Location = { id: string; name: string };
type Family = {
  id: string; name: string;
  primary_email?: string | null; primary_phone?: string | null;
  primary_location_id?: string | null; billing_status?: string | null;
  student_count?: number; balance_owed?: number;
};
type Student = {
  id: string; first_name: string; last_name: string;
  instrument?: string | null; status?: string | null;
  teacher_id?: string | null; rate_per_session?: number | null;
};
type Invoice = {
  id: string; amount: number; status: string;
  due_date?: string | null; paid_date?: string | null; description?: string | null;
};
type TimelineEvent = { id: string; type: string; label: string; timestamp: string; note?: string | null };

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
function statusColor(s?: string | null) {
  if (!s) return "text-[#505055]";
  const l = s.toLowerCase();
  if (l === "active") return "text-[#00ff88]";
  if (l === "paused") return "text-amber-400";
  if (l === "inactive" || l === "cancelled") return "text-red-400";
  return "text-[#909098]";
}
function invoiceStatusBadge(s: string) {
  const l = s.toLowerCase();
  if (l === "paid") return "bg-[#00ff88]/10 text-[#00ff88]";
  if (l === "overdue") return "bg-red-500/10 text-red-400";
  if (l === "pending") return "bg-amber-400/10 text-amber-400";
  return "bg-white/5 text-[#909098]";
}
function displayName(name: string): string { return name.replace(/\s+Family$/i, "").trim(); }

function FamilyDetailContent({ family, onClose }: { family: Family; onClose: () => void }) {
  const [tab, setTab] = useState<"students" | "invoices" | "timeline">("students");
  const [students, setStudents] = useState<Student[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const locConfig = family.primary_location_id ? LOCATION_MAP[family.primary_location_id] : null;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/crm/students?familyId=${family.id}`).then(r => r.json()).catch(() => ({ data: [] })),
      fetch(`/api/billing/invoices?family_id=${family.id}`).then(r => r.json()).catch(() => ({ data: [] })),
    ]).then(([sRes, iRes]) => {
      setStudents(Array.isArray(sRes.data) ? sRes.data : []);
      setInvoices(Array.isArray(iRes.data) ? iRes.data : []);
      const events: TimelineEvent[] = [];
      (Array.isArray(iRes.data) ? iRes.data : []).forEach((inv: Invoice) => {
        if (inv.paid_date) events.push({ id: `inv-paid-${inv.id}`, type: "payment", label: `Payment received — $${inv.amount}`, timestamp: inv.paid_date });
        events.push({ id: `inv-${inv.id}`, type: "invoice", label: `Invoice created — $${inv.amount} (${inv.status})`, timestamp: inv.due_date ?? "" });
      });
      events.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
      setTimeline(events);
      setLoading(false);
    });
  }, [family.id]);

  return (
    <div className="flex h-full flex-col bg-[#0a0a0c]">
      {locConfig && <div className="h-1 w-full shrink-0" style={{ backgroundColor: locConfig.color }} />}
      <div className="flex items-center justify-between border-b border-[#1c1c1e] px-4 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-base font-bold text-white">{displayName(family.name)}</div>
            {locConfig && <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${locConfig.color}20`, color: locConfig.color }}>{locConfig.name}</span>}
          </div>
          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[#505055]">
            {family.primary_email && <span className="truncate">{family.primary_email}</span>}
            {family.primary_phone && <span>{family.primary_phone}</span>}
            {family.balance_owed != null && family.balance_owed > 0 && <span className="font-semibold text-red-400">${family.balance_owed.toFixed(2)} owed</span>}
          </div>
        </div>
        <button onClick={onClose} className="ml-3 shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-[#505055] hover:bg-white/10 hover:text-white transition-colors text-lg">✕</button>
      </div>
      <div className="flex border-b border-[#1c1c1e] px-2">
        {(["students", "invoices", "timeline"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${tab === t ? "border-b-2 border-[#00ff88] text-[#00ff88]" : "text-[#505055] hover:text-[#909098]"}`}>{t}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-white/5" />)}</div>
        ) : (
          <>
            {tab === "students" && (
              <div className="space-y-2">
                {students.length === 0 ? <div className="text-sm text-[#505055]">No students linked to this family.</div> : students.map(s => (
                  <Link key={s.id} href={`/students/${s.id}`} className="flex items-center gap-3 rounded-lg border border-[#1c1c1e] bg-[#111113] p-3 hover:border-[#2b2b2f] hover:bg-white/3 transition-colors">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1c1c1e] text-lg">{instrEmoji(s.instrument)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{s.first_name} {s.last_name}</div>
                      <div className="flex items-center gap-2 text-xs text-[#505055]">
                        <span>{s.instrument ?? "—"}</span>
                        {s.rate_per_session != null && <span className="text-[#909098]">${s.rate_per_session}/session</span>}
                      </div>
                    </div>
                    <span className={`text-xs font-semibold ${statusColor(s.status)}`}>{s.status ?? "—"}</span>
                    <span className="text-[#303035] text-xs">→</span>
                  </Link>
                ))}
                <Link href={`/crm/students/new?familyId=${family.id}`} className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-dashed border-[#2b2b2f] p-3 text-xs font-semibold text-[#505055] hover:border-[#00ff88]/30 hover:text-[#00ff88] transition-colors">+ Add student</Link>
              </div>
            )}
            {tab === "invoices" && (
              <div className="space-y-2">
                {invoices.length === 0 ? <div className="text-sm text-[#505055]">No invoices found for this family.</div> : invoices.map(inv => (
                  <div key={inv.id} className="flex items-center gap-3 rounded-lg border border-[#1c1c1e] bg-[#111113] p-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white">${inv.amount.toFixed(2)}</div>
                      <div className="text-xs text-[#505055]">{inv.description ?? "Session"} · Due {inv.due_date ?? "—"}</div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${invoiceStatusBadge(inv.status)}`}>{inv.status}</span>
                  </div>
                ))}
              </div>
            )}
            {tab === "timeline" && (
              <div className="space-y-0">
                {timeline.length === 0 ? <div className="text-sm text-[#505055]">No timeline events yet.</div> : timeline.map((ev, i) => (
                  <div key={ev.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${ev.type === "payment" ? "bg-[#00ff88]" : "bg-[#2b2b2f]"}`} />
                      {i < timeline.length - 1 && <div className="w-px flex-1 bg-[#1c1c1e]" />}
                    </div>
                    <div className="pb-4 min-w-0">
                      <div className="text-xs font-semibold text-[#d4d4d4]">{ev.label}</div>
                      <div className="text-[10px] text-[#505055]">{ev.timestamp ? new Date(ev.timestamp).toLocaleDateString() : "—"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** Desktop side panel */
function FamilyDetailPanel({ family, onClose }: { family: Family; onClose: () => void }) {
  return (
    <div className="flex h-full flex-col border-l border-[#1c1c1e]">
      <FamilyDetailContent family={family} onClose={onClose} />
    </div>
  );
}

/** Mobile full-screen bottom sheet */
function FamilyDetailSheet({ family, onClose }: { family: Family; onClose: () => void }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl border-t border-[#1c1c1e] bg-[#0a0a0c] shadow-2xl"
        style={{ maxHeight: "92dvh", height: "92dvh" }}>
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="h-1 w-10 rounded-full bg-[#2b2b2f]" />
        </div>
        <div className="flex-1 overflow-hidden">
          <FamilyDetailContent family={family} onClose={onClose} />
        </div>
      </div>
    </>
  );
}

export function CRMHubClient() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("all");
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    fetch("/api/locations/options").then(r => r.json()).then(res => {
      setLocations(Array.isArray(res.data) ? res.data : []);
    }).catch(() => {});
  }, []);

  const loadFamilies = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedLocationId !== "all") params.set("locationId", selectedLocationId);
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    fetch(`/api/crm/families?${params}`).then(r => r.json()).then(res => {
      const raw: Family[] = Array.isArray(res.data) ? res.data : [];
      raw.sort((a, b) => displayName(a.name).localeCompare(displayName(b.name)));
      setFamilies(raw);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selectedLocationId, search, statusFilter]);

  useEffect(() => { const t = setTimeout(loadFamilies, 300); return () => clearTimeout(t); }, [loadFamilies]);

  const getLocName = (id: string) => {
    if (id === "all") return "All Locations";
    return locations.find(l => l.id === id)?.name ?? LOCATION_MAP[id]?.name ?? id;
  };
  const activeCount = families.filter(f => { const s = (f.billing_status ?? "").toLowerCase(); return s === "active" || s === ""; }).length;
  const inactiveCount = families.filter(f => { const s = (f.billing_status ?? "").toLowerCase(); return s === "inactive" || s === "cancelled" || s === "paused"; }).length;

  return (
    <PageTransition>
      <div className="flex h-[calc(100vh-56px)] flex-col overflow-hidden">
        <div className="shrink-0 border-b border-[#1c1c1e] px-4 py-4 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <PageHeader title="Families & Students" subtitle="All families, students, and their session history" />
            <Link href="/crm/families/new" className="shrink-0 rounded-lg bg-[#00ff88]/10 px-3 py-2 text-sm font-semibold text-[#00ff88] hover:bg-[#00ff88]/20 transition-colors">+ New</Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["all", ...LOCATIONS.map(l => l.id)].map(locId => {
              const locCfg = locId !== "all" ? LOCATION_MAP[locId] : null;
              const isActive = selectedLocationId === locId;
              return (
                <button key={locId} onClick={() => { setSelectedLocationId(locId); setSelectedFamily(null); }}
                  className="rounded-full px-3 py-1 text-xs font-semibold transition-colors border"
                  style={isActive && locCfg
                    ? { backgroundColor: `${locCfg.color}20`, color: locCfg.color, borderColor: `${locCfg.color}50` }
                    : isActive
                    ? { backgroundColor: "#00ff8815", color: "#00ff88", borderColor: "#00ff8840" }
                    : { backgroundColor: "transparent", color: "#505055", borderColor: "#1c1c1e" }}>
                  {getLocName(locId)}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex gap-2">
            <div className="flex rounded-lg border border-[#1c1c1e] overflow-hidden text-xs font-semibold">
              {[{ id: "all", label: `All (${families.length})` }, { id: "active", label: `Active (${activeCount})` }, { id: "inactive", label: `Inactive (${inactiveCount})` }].map(s => (
                <button key={s.id} onClick={() => setStatusFilter(s.id)} className={`px-3 py-1.5 transition-colors ${statusFilter === s.id ? "bg-white/8 text-white" : "text-[#505055] hover:text-[#909098]"}`}>{s.label}</button>
              ))}
            </div>
            <input type="text" placeholder="Search families..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 min-w-0 rounded-lg border border-[#1c1c1e] bg-[#111113] px-3 py-1.5 text-sm text-white placeholder-[#404048] focus:border-[#00ff88]/30 focus:outline-none" />
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Family list — always full width on mobile, narrows on desktop when panel open */}
          <div className={`flex flex-col overflow-y-auto border-r border-[#1c1c1e] transition-all duration-200 ${(!isMobile && selectedFamily) ? "w-80 shrink-0" : "flex-1"}`}>
            {loading ? (
              <div className="p-4 space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-16 animate-pulse rounded-lg bg-white/5" />)}</div>
            ) : families.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center p-8">
                <div className="text-4xl">👨‍👩‍👧</div>
                <div className="text-sm font-semibold text-[#909098]">No families found</div>
                <div className="text-xs text-[#505055]">{search ? "Try a different search term" : "Add your first family to get started"}</div>
              </div>
            ) : (
              <div className="divide-y divide-[#1c1c1e]">
                {families.map(fam => {
                  const locCfg = fam.primary_location_id ? LOCATION_MAP[fam.primary_location_id] : null;
                  const isSelected = selectedFamily?.id === fam.id;
                  return (
                    <button key={fam.id} onClick={() => setSelectedFamily(fam.id === selectedFamily?.id ? null : fam)} className={`w-full text-left transition-colors hover:bg-white/3 ${isSelected ? "bg-[#00ff88]/5" : ""}`}>
                      {locCfg && <div className="h-0.5 w-full" style={{ backgroundColor: locCfg.color }} />}
                      <div className={`flex items-center gap-3 px-4 py-3 ${isSelected ? "border-l-2 border-[#00ff88]" : ""}`}>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                          style={{ backgroundColor: locCfg ? `${locCfg.color}25` : "#1c1c1e", border: locCfg ? `1.5px solid ${locCfg.color}60` : "1.5px solid #2b2b2f", color: locCfg ? locCfg.color : "#909098" }}>
                          {displayName(fam.name).slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white truncate">{displayName(fam.name)}</div>
                          <div className="flex items-center gap-2 text-xs text-[#505055]">
                            {fam.primary_email && <span className="truncate max-w-[140px]">{fam.primary_email}</span>}
                            {fam.primary_phone && <span className="shrink-0">{fam.primary_phone}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {fam.balance_owed != null && fam.balance_owed > 0 && <span className="text-xs font-semibold text-red-400">${fam.balance_owed.toFixed(0)}</span>}
                          {locCfg && <span className="text-[9px] font-bold" style={{ color: locCfg.color }}>{locCfg.name}</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop side panel */}
          {!isMobile && selectedFamily && (
            <div className="flex-1 overflow-hidden">
              <FamilyDetailPanel family={selectedFamily} onClose={() => setSelectedFamily(null)} />
            </div>
          )}

          {/* Desktop AI sidebar (only when no family selected) */}
          {!selectedFamily && (
            <div className="hidden xl:flex w-72 shrink-0 flex-col border-l border-[#1c1c1e] bg-[#0a0a0c] p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-3">AI Assistant</div>
              <AgentPageBar agentId="vader" chatPlaceholder="Ask Vader about families or messaging…"
                pageContext={{ page: "crm-families", totalFamilies: families.length, activeCount, inactiveCount, selectedLocation: selectedLocationId !== "all" ? getLocName(selectedLocationId) : "All Locations" }} />
              <div className="mt-4 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#303035]">Quick Actions</div>
                <Link href="/lifecycle" className="flex items-center gap-2 rounded-lg border border-[#1c1c1e] bg-[#111113] px-3 py-2 text-xs font-semibold text-[#909098] hover:text-white hover:border-[#2b2b2f] transition-colors"><span>📋</span> View Lifecycle</Link>
                <Link href="/lifecycle?tab=win-back" className="flex items-center gap-2 rounded-lg border border-[#1c1c1e] bg-[#111113] px-3 py-2 text-xs font-semibold text-[#909098] hover:text-white hover:border-[#2b2b2f] transition-colors"><span>🔄</span> Win-Back Inactive</Link>
                <Link href="/crm/families/new" className="flex items-center gap-2 rounded-lg border border-[#1c1c1e] bg-[#111113] px-3 py-2 text-xs font-semibold text-[#909098] hover:text-white hover:border-[#2b2b2f] transition-colors"><span>➕</span> New Family</Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom sheet */}
      {isMobile && selectedFamily && (
        <FamilyDetailSheet family={selectedFamily} onClose={() => setSelectedFamily(null)} />
      )}
    </PageTransition>
  );
}
