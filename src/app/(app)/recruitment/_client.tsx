/* eslint-disable react-hooks/set-state-in-effect */

"use client";
import { useEffect, useState, useCallback } from "react";
import { PageTransition } from "@/components/system/PageTransition";
import { AgentPageBar } from "@/components/agentOS/AgentPageBar";
import { LOCATION_MAP, LOCATIONS } from "@/lib/config/locations";

type Prospect = {
  id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  instruments?: string[] | null;
  status: string;
  source?: string | null;
  notes?: string | null;
  resume_url?: string | null;
  location_id?: string | null;
  created_at: string;
};

const STATUSES = [
  { key: "new", label: "New", color: "#0EA5E9", bg: "#0EA5E910" },
  { key: "screening", label: "Screening", color: "#7C3AED", bg: "#7C3AED10" },
  { key: "interview", label: "Interview", color: "#F59E0B", bg: "#F59E0B10" },
  { key: "offer", label: "Offer", color: "#00ff88", bg: "#00ff8810" },
  { key: "hired", label: "Hired", color: "#22C55E", bg: "#22C55E10" },
  { key: "rejected", label: "Rejected", color: "#EF4444", bg: "#EF444410" },
];

const INSTRUMENT_EMOJI: Record<string, string> = {
  guitar: "🎸", bass: "🎸", piano: "🎹", keyboard: "🎹",
  drums: "🥁", violin: "🎻", viola: "🎻", cello: "🎻",
  trumpet: "🎺", trombone: "🎺", saxophone: "🎷", voice: "🎤", vocals: "🎤",
};
function instrEmoji(instr: string) {
  const key = instr.toLowerCase();
  for (const [k, v] of Object.entries(INSTRUMENT_EMOJI)) { if (key.includes(k)) return v; }
  return "🎵";
}
function initials(p: Prospect): string {
  return ((p.first_name?.[0] ?? "") + (p.last_name?.[0] ?? "")).toUpperCase() || "?";
}
function statusCfg(key: string) {
  return STATUSES.find(s => s.key === key) ?? { key, label: key, color: "#505055", bg: "#50505510" };
}

function AddProspectModal({ onClose, onAdd }: { onClose: () => void; onAdd: (p: Omit<Prospect, "id" | "created_at">) => void }) {
  const [form, setForm] = useState<{ first_name: string; last_name: string; email: string; phone: string; instruments: string; source: string; notes: string; location_id: string; status: string }>({ first_name: "", last_name: "", email: "", phone: "", instruments: "", source: "indeed", notes: "", location_id: LOCATIONS[0].id as string, status: "new" });
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onAdd({ ...form, instruments: form.instruments ? form.instruments.split(",").map(s => s.trim()).filter(Boolean) : [] });
    onClose();
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#2b2b2f] bg-[#111113] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white">Add Candidate</h2>
          <button onClick={onClose} className="text-[#505055] hover:text-white text-lg">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="First name *" required value={form.first_name} onChange={e => setForm(f => ({...f, first_name: e.target.value}))} className="rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] px-3 py-2 text-sm text-white placeholder-[#404048] focus:border-[#00ff88]/30 focus:outline-none" />
            <input placeholder="Last name *" required value={form.last_name} onChange={e => setForm(f => ({...f, last_name: e.target.value}))} className="rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] px-3 py-2 text-sm text-white placeholder-[#404048] focus:border-[#00ff88]/30 focus:outline-none" />
          </div>
          <input placeholder="Email" type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className="w-full rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] px-3 py-2 text-sm text-white placeholder-[#404048] focus:border-[#00ff88]/30 focus:outline-none" />
          <input placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className="w-full rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] px-3 py-2 text-sm text-white placeholder-[#404048] focus:border-[#00ff88]/30 focus:outline-none" />
          <input placeholder="Instruments (comma-separated)" value={form.instruments} onChange={e => setForm(f => ({...f, instruments: e.target.value}))} className="w-full rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] px-3 py-2 text-sm text-white placeholder-[#404048] focus:border-[#00ff88]/30 focus:outline-none" />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.source} onChange={e => setForm(f => ({...f, source: e.target.value}))} className="rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] px-3 py-2 text-sm text-white focus:outline-none">
              <option value="indeed">Indeed</option><option value="referral">Referral</option><option value="website">Website</option><option value="social">Social Media</option><option value="other">Other</option>
            </select>
            <select value={form.location_id} onChange={e => setForm(f => ({...f, location_id: e.target.value}))} className="rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] px-3 py-2 text-sm text-white focus:outline-none">
              {LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <textarea placeholder="Notes…" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2} className="w-full rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] px-3 py-2 text-sm text-white placeholder-[#404048] focus:border-[#00ff88]/30 focus:outline-none resize-none" />
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-[#1c1c1e] py-2 text-sm font-semibold text-[#505055] hover:text-white transition-colors">Cancel</button>
            <button type="submit" className="flex-1 rounded-lg bg-[#00ff88]/10 py-2 text-sm font-semibold text-[#00ff88] hover:bg-[#00ff88]/20 transition-colors">Add Candidate</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProspectCard({ prospect, onStatusChange, onSelect, isSelected }: { prospect: Prospect; onStatusChange: (id: string, status: string) => void; onSelect: (p: Prospect) => void; isSelected: boolean }) {
  const sc = statusCfg(prospect.status);
  const lc = prospect.location_id ? LOCATION_MAP[prospect.location_id] : null;
  return (
    <div onClick={() => onSelect(prospect)} className={`rounded-xl border cursor-pointer transition-all overflow-hidden ${isSelected ? "border-[#00ff88]/40 bg-[#00ff88]/5" : "border-[#1c1c1e] bg-[#0a0a0c] hover:border-[#2b2b2f]"}`}>
      {lc && <div className="h-0.5 w-full" style={{ backgroundColor: lc.color }} />}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1c1c1e] text-xs font-bold text-[#909098]">{initials(prospect)}</div>
            <div>
              <div className="text-sm font-bold text-white">{prospect.first_name} {prospect.last_name}</div>
              <div className="text-[10px] text-[#505055]">{prospect.email ?? prospect.phone ?? "—"}</div>
            </div>
          </div>
          <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: sc.bg, color: sc.color }}>{sc.label}</span>
        </div>
        {(prospect.instruments ?? []).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {(prospect.instruments ?? []).slice(0, 3).map((instr, i) => (
              <span key={i} className="rounded-full bg-[#1c1c1e] px-2 py-0.5 text-[10px] text-[#909098]">{instrEmoji(instr)} {instr}</span>
            ))}
          </div>
        )}
        <div className="mt-2 flex items-center justify-between">
          <div className="text-[10px] text-[#505055]">{prospect.source ?? "—"}{lc ? ` · ${lc.name}` : ""}</div>
          <div className="flex gap-1">
            {prospect.status !== "hired" && <button onClick={e => { e.stopPropagation(); onStatusChange(prospect.id, "hired"); }} className="rounded px-1.5 py-0.5 text-[10px] font-bold text-[#22c55e] hover:bg-[#22c55e]/10 transition-colors">Hire</button>}
            {prospect.status !== "rejected" && <button onClick={e => { e.stopPropagation(); onStatusChange(prospect.id, "rejected"); }} className="rounded px-1.5 py-0.5 text-[10px] font-bold text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors">Pass</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProspectDetailPanel({ prospect, onClose, onStatusChange }: { prospect: Prospect; onClose: () => void; onStatusChange: (id: string, status: string) => void }) {
  const sc = statusCfg(prospect.status);
  const lc = prospect.location_id ? LOCATION_MAP[prospect.location_id] : null;
  return (
    <div className="flex flex-col h-full">
      {lc && <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: lc.color }} />}
      <div className="flex items-center justify-between border-b border-[#1c1c1e] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1c1c1e] text-xs font-bold text-[#909098]">{initials(prospect)}</div>
          <div>
            <div className="text-sm font-bold text-white">{prospect.first_name} {prospect.last_name}</div>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: sc.bg, color: sc.color }}>{sc.label}</span>
          </div>
        </div>
        <button onClick={onClose} className="text-[#505055] hover:text-white text-lg">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <section>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Contact</div>
          <div className="space-y-1.5 text-sm">
            {prospect.email && <div className="flex gap-3 text-[#909098]"><span className="text-[#505055] w-12">Email</span>{prospect.email}</div>}
            {prospect.phone && <div className="flex gap-3 text-[#909098]"><span className="text-[#505055] w-12">Phone</span>{prospect.phone}</div>}
            {lc && <div className="flex gap-3 text-[#909098]"><span className="text-[#505055] w-12">Location</span><span style={{ color: lc.color }}>{lc.name}</span></div>}
            {prospect.source && <div className="flex gap-3 text-[#909098]"><span className="text-[#505055] w-12">Source</span>{prospect.source}</div>}
          </div>
        </section>
        {(prospect.instruments ?? []).length > 0 && (
          <section>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Instruments</div>
            <div className="flex flex-wrap gap-2">
              {(prospect.instruments ?? []).map((instr, i) => (
                <span key={i} className="rounded-full border border-[#2b2b2f] bg-[#111113] px-3 py-1 text-xs text-[#909098]">{instrEmoji(instr)} {instr}</span>
              ))}
            </div>
          </section>
        )}
        {prospect.notes && <section><div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Notes</div><p className="text-sm text-[#909098] leading-relaxed">{prospect.notes}</p></section>}
        {prospect.resume_url && <a href={prospect.resume_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-[#2b2b2f] px-4 py-2.5 text-sm font-semibold text-[#909098] hover:text-white hover:border-[#404048] transition-colors">📄 View Resume</a>}
        <section>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Move to Stage</div>
          <div className="grid grid-cols-2 gap-2">
            {STATUSES.filter(s => s.key !== prospect.status).map(s => (
              <button key={s.key} onClick={() => onStatusChange(prospect.id, s.key)} className="rounded-lg border px-3 py-2 text-xs font-semibold transition-colors" style={{ borderColor: `${s.color}30`, color: s.color, backgroundColor: `${s.color}08` }}>{s.label}</button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export function RecruitmentClient() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/recruitment").then(r => r.json()).then(res => { setProspects(res.data ?? []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = useCallback(async (id: string, status: string) => {
    await fetch("/api/recruitment", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    setProspects(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    if (selectedProspect?.id === id) setSelectedProspect(prev => prev ? { ...prev, status } : null);
  }, [selectedProspect]);

  const handleAdd = useCallback(async (data: Omit<Prospect, "id" | "created_at">) => {
    const res = await fetch("/api/recruitment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const json = await res.json();
    if (json.data) setProspects(prev => [json.data, ...prev]);
  }, []);

  const filtered = statusFilter === "all" ? prospects : prospects.filter(p => p.status === statusFilter);
  const counts = Object.fromEntries(STATUSES.map(s => [s.key, prospects.filter(p => p.status === s.key).length]));
  const activeCount = prospects.filter(p => !["hired", "rejected"].includes(p.status)).length;

  return (
    <PageTransition>
      <div className="flex h-[calc(100vh-56px)] flex-col overflow-hidden">
        <div className="shrink-0 border-b border-[#1c1c1e] px-6 py-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div><h1 className="text-xl font-extrabold text-white">Recruitment</h1><p className="text-xs text-[#505055]">Teacher pipeline — {activeCount} active candidates</p></div>
            <button onClick={() => setShowAdd(true)} className="rounded-lg bg-[#00ff88]/10 px-4 py-2 text-sm font-semibold text-[#00ff88] hover:bg-[#00ff88]/20 transition-colors">+ Add Candidate</button>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            <button onClick={() => setStatusFilter("all")} className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${statusFilter === "all" ? "bg-white/8 text-white border-white/10" : "text-[#505055] border-[#1c1c1e] hover:text-[#909098]"}`}>All ({prospects.length})</button>
            {STATUSES.map(s => (
              <button key={s.key} onClick={() => setStatusFilter(s.key)} className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold border transition-colors"
                style={statusFilter === s.key ? { backgroundColor: `${s.color}20`, color: s.color, borderColor: `${s.color}50` } : { color: "#505055", borderColor: "#1c1c1e" }}>
                {s.label}{counts[s.key] > 0 ? ` (${counts[s.key]})` : ""}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{[1,2,3,4,5,6].map(i => <div key={i} className="h-28 animate-pulse rounded-xl bg-white/5" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
                <div className="text-4xl">📋</div>
                <div className="text-sm font-semibold text-[#909098]">No candidates in this stage</div>
                <button onClick={() => setShowAdd(true)} className="rounded-lg bg-[#00ff88]/10 px-4 py-2 text-sm font-semibold text-[#00ff88] hover:bg-[#00ff88]/20 transition-colors">+ Add First Candidate</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map(p => <ProspectCard key={p.id} prospect={p} onStatusChange={handleStatusChange} onSelect={setSelectedProspect} isSelected={selectedProspect?.id === p.id} />)}
              </div>
            )}
          </div>
          <div className="hidden xl:flex w-80 shrink-0 flex-col border-l border-[#1c1c1e] bg-[#0a0a0c]">
            {selectedProspect ? (
              <ProspectDetailPanel prospect={selectedProspect} onClose={() => setSelectedProspect(null)} onStatusChange={handleStatusChange} />
            ) : (
              <div className="p-4 space-y-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#303035]">AI Assistant</div>
                <AgentPageBar agentId="star" chatPlaceholder="Ask Star about candidates or hiring…" pageContext={{ page: "recruitment", activeCount, totalCount: prospects.length, statusCounts: counts }} />
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#303035]">Pipeline Summary</div>
                  {STATUSES.filter(s => counts[s.key] > 0).map(s => (
                    <div key={s.key} className="flex items-center justify-between rounded-lg border border-[#1c1c1e] bg-[#111113] px-3 py-2">
                      <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} /><span className="text-xs text-[#909098]">{s.label}</span></div>
                      <span className="text-xs font-bold text-white">{counts[s.key]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {showAdd && <AddProspectModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </PageTransition>
  );
}
