"use client";
import { useEffect, useState, useCallback } from "react";
import { PageTransition } from "@/components/system/PageTransition";
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
  source_detail?: string | null;
  notes?: string | null;
  resume_url?: string | null;
  location_id?: string | null;
  created_at: string;
  // Full teacher profile fields — built during hiring process
  bio?: string | null;
  personality?: string | null;
  primary_instruments?: string | null;
  secondary_instruments?: string | null;
  lesson_style?: string | null;
  teaching_strengths?: string | null;
  musical_strengths_background?: string | null;
  style_genre_strengths?: string | null;
  skill_levels_by_instrument?: string | null;
  preferred_age_range?: string | null;
  acceptable_age_range?: string | null;
  best_first_lesson_fit?: string | null;
  best_match_students?: string | null;
  use_caution_internal_placement_notes?: string | null;
  meet_and_greet_fit?: string | null;
  substitute_coverage?: string | null;
  customer_facing_match_summary?: string | null;
  internal_matching_tags?: string | null;
  internal_match_notes?: string | null;
  director_notes?: string | null;
  interview_date?: string | null;
  audition_notes?: string | null;
  pay_rate_requested?: number | null;
  availability_notes?: string | null;
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

const inputCls = "w-full rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] px-3 py-2 text-sm text-white placeholder-[#404048] focus:border-[#00ff88]/30 focus:outline-none";
const labelCls = "block text-[10px] font-semibold uppercase tracking-widest text-[#505055] mb-1";

function AddProspectModal({ onClose, onAdd }: { onClose: () => void; onAdd: (p: Omit<Prospect, "id" | "created_at">) => void }) {
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", instruments: "", source: "indeed", notes: "", location_id: LOCATIONS[0].id as string, status: "new" });
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
            <input placeholder="First name *" required value={form.first_name} onChange={e => setForm(f => ({...f, first_name: e.target.value}))} className={inputCls} />
            <input placeholder="Last name *" required value={form.last_name} onChange={e => setForm(f => ({...f, last_name: e.target.value}))} className={inputCls} />
          </div>
          <input placeholder="Email" type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className={inputCls} />
          <input placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className={inputCls} />
          <input placeholder="Instruments (comma-separated)" value={form.instruments} onChange={e => setForm(f => ({...f, instruments: e.target.value}))} className={inputCls} />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.source} onChange={e => setForm(f => ({...f, source: e.target.value}))} className={inputCls}>
              <option value="indeed">Indeed</option><option value="referral">Referral</option><option value="website">Website</option><option value="social">Social Media</option><option value="other">Other</option>
            </select>
            <select value={form.location_id} onChange={e => setForm(f => ({...f, location_id: e.target.value}))} className={inputCls}>
              {LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <textarea placeholder="Notes…" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2} className={inputCls + " resize-none"} />
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

function ProspectDetailPanel({ prospect, onClose, onStatusChange, onUpdate }: {
  prospect: Prospect; onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onUpdate: (id: string, updates: Partial<Prospect>) => void;
}) {
  const sc = statusCfg(prospect.status);
  const lc = prospect.location_id ? LOCATION_MAP[prospect.location_id] : null;
  const [tab, setTab] = useState<"overview" | "profile" | "matching" | "internal">("overview");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Prospect>>({});
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setForm({
      bio: prospect.bio ?? "",
      personality: prospect.personality ?? "",
      primary_instruments: prospect.primary_instruments ?? "",
      secondary_instruments: prospect.secondary_instruments ?? "",
      lesson_style: prospect.lesson_style ?? "",
      teaching_strengths: prospect.teaching_strengths ?? "",
      musical_strengths_background: prospect.musical_strengths_background ?? "",
      style_genre_strengths: prospect.style_genre_strengths ?? "",
      skill_levels_by_instrument: prospect.skill_levels_by_instrument ?? "",
      preferred_age_range: prospect.preferred_age_range ?? "",
      acceptable_age_range: prospect.acceptable_age_range ?? "",
      best_first_lesson_fit: prospect.best_first_lesson_fit ?? "",
      best_match_students: prospect.best_match_students ?? "",
      use_caution_internal_placement_notes: prospect.use_caution_internal_placement_notes ?? "",
      meet_and_greet_fit: prospect.meet_and_greet_fit ?? "",
      substitute_coverage: prospect.substitute_coverage ?? "",
      customer_facing_match_summary: prospect.customer_facing_match_summary ?? "",
      internal_matching_tags: prospect.internal_matching_tags ?? "",
      internal_match_notes: prospect.internal_match_notes ?? "",
      director_notes: prospect.director_notes ?? "",
      interview_date: prospect.interview_date ?? "",
      audition_notes: prospect.audition_notes ?? "",
      availability_notes: prospect.availability_notes ?? "",
    });
    setEditing(true);
  }

  async function saveEdit() {
    setSaving(true);
    const cleaned: Partial<Prospect> = {};
    for (const [k, v] of Object.entries(form)) {
      (cleaned as Record<string, unknown>)[k] = v === "" ? null : v;
    }
    await onUpdate(prospect.id, cleaned);
    setEditing(false);
    setSaving(false);
  }

  const TABS = [
    { id: "overview" as const, label: "Overview" },
    { id: "profile" as const, label: "Profile" },
    { id: "matching" as const, label: "Matching" },
    { id: "internal" as const, label: "Internal" },
  ];

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
        <div className="flex items-center gap-2">
          {!editing && <button onClick={startEdit} className="rounded-lg border border-[#1c1c1e] px-3 py-1.5 text-xs font-semibold text-[#505055] hover:text-white transition-colors">Edit Profile</button>}
          <button onClick={onClose} className="text-[#505055] hover:text-white text-lg">✕</button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-[#1c1c1e] px-5 gap-4">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`py-2.5 text-xs font-semibold border-b-2 transition-colors ${tab === t.id ? "border-[#00ff88] text-white" : "border-transparent text-[#505055] hover:text-[#909098]"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {editing ? (
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-widest text-[#303035]">Editing Profile</div>
            {tab === "overview" && (
              <div className="space-y-3">
                <div><label className={labelCls}>Bio</label><textarea value={form.bio ?? ""} onChange={e => setForm(f => ({...f, bio: e.target.value}))} rows={3} className={inputCls + " resize-none"} /></div>
                <div><label className={labelCls}>Primary Instruments (comma-separated)</label><input value={form.primary_instruments ?? ""} onChange={e => setForm(f => ({...f, primary_instruments: e.target.value}))} className={inputCls} /></div>
                <div><label className={labelCls}>Secondary / Can Cover (comma-separated)</label><input value={form.secondary_instruments ?? ""} onChange={e => setForm(f => ({...f, secondary_instruments: e.target.value}))} className={inputCls} /></div>
                <div><label className={labelCls}>Interview Date</label><input type="date" value={form.interview_date ?? ""} onChange={e => setForm(f => ({...f, interview_date: e.target.value}))} className={inputCls} /></div>
                <div><label className={labelCls}>Audition Notes</label><textarea value={form.audition_notes ?? ""} onChange={e => setForm(f => ({...f, audition_notes: e.target.value}))} rows={2} className={inputCls + " resize-none"} /></div>
                <div><label className={labelCls}>Availability Notes</label><textarea value={form.availability_notes ?? ""} onChange={e => setForm(f => ({...f, availability_notes: e.target.value}))} rows={2} className={inputCls + " resize-none"} /></div>
              </div>
            )}
            {tab === "profile" && (
              <div className="space-y-3">
                <div><label className={labelCls}>Personality (comma-separated traits)</label><input value={form.personality ?? ""} onChange={e => setForm(f => ({...f, personality: e.target.value}))} placeholder="e.g. Warm, Patient, Structured" className={inputCls} /></div>
                <div><label className={labelCls}>Lesson Style</label><textarea value={form.lesson_style ?? ""} onChange={e => setForm(f => ({...f, lesson_style: e.target.value}))} rows={2} className={inputCls + " resize-none"} /></div>
                <div><label className={labelCls}>Teaching Strengths</label><textarea value={form.teaching_strengths ?? ""} onChange={e => setForm(f => ({...f, teaching_strengths: e.target.value}))} rows={2} className={inputCls + " resize-none"} /></div>
                <div><label className={labelCls}>Musical Background</label><textarea value={form.musical_strengths_background ?? ""} onChange={e => setForm(f => ({...f, musical_strengths_background: e.target.value}))} rows={2} className={inputCls + " resize-none"} /></div>
                <div><label className={labelCls}>Style / Genre Strengths (comma-separated)</label><input value={form.style_genre_strengths ?? ""} onChange={e => setForm(f => ({...f, style_genre_strengths: e.target.value}))} placeholder="e.g. Classical, Pop, Jazz, Rock" className={inputCls} /></div>
                <div><label className={labelCls}>Skill Levels by Instrument</label><textarea value={form.skill_levels_by_instrument ?? ""} onChange={e => setForm(f => ({...f, skill_levels_by_instrument: e.target.value}))} rows={2} className={inputCls + " resize-none"} /></div>
              </div>
            )}
            {tab === "matching" && (
              <div className="space-y-3">
                <div><label className={labelCls}>Customer-Facing Match Summary</label><textarea value={form.customer_facing_match_summary ?? ""} onChange={e => setForm(f => ({...f, customer_facing_match_summary: e.target.value}))} rows={3} className={inputCls + " resize-none"} /></div>
                <div><label className={labelCls}>Preferred Age Range</label><input value={form.preferred_age_range ?? ""} onChange={e => setForm(f => ({...f, preferred_age_range: e.target.value}))} placeholder="e.g. 8–18" className={inputCls} /></div>
                <div><label className={labelCls}>Acceptable Age Range</label><input value={form.acceptable_age_range ?? ""} onChange={e => setForm(f => ({...f, acceptable_age_range: e.target.value}))} placeholder="e.g. 5+" className={inputCls} /></div>
                <div><label className={labelCls}>Best First Lesson Fit</label><textarea value={form.best_first_lesson_fit ?? ""} onChange={e => setForm(f => ({...f, best_first_lesson_fit: e.target.value}))} rows={2} className={inputCls + " resize-none"} /></div>
                <div><label className={labelCls}>Best Match Students</label><textarea value={form.best_match_students ?? ""} onChange={e => setForm(f => ({...f, best_match_students: e.target.value}))} rows={2} className={inputCls + " resize-none"} /></div>
                <div><label className={labelCls}>Meet &amp; Greet Fit</label><textarea value={form.meet_and_greet_fit ?? ""} onChange={e => setForm(f => ({...f, meet_and_greet_fit: e.target.value}))} rows={2} className={inputCls + " resize-none"} /></div>
                <div><label className={labelCls}>Substitute Coverage</label><textarea value={form.substitute_coverage ?? ""} onChange={e => setForm(f => ({...f, substitute_coverage: e.target.value}))} rows={2} className={inputCls + " resize-none"} /></div>
              </div>
            )}
            {tab === "internal" && (
              <div className="space-y-3">
                <div><label className={labelCls}>⚠ Use Caution / Internal Placement Notes</label><textarea value={form.use_caution_internal_placement_notes ?? ""} onChange={e => setForm(f => ({...f, use_caution_internal_placement_notes: e.target.value}))} rows={3} className={inputCls + " resize-none"} /></div>
                <div><label className={labelCls}>Director Notes</label><textarea value={form.director_notes ?? ""} onChange={e => setForm(f => ({...f, director_notes: e.target.value}))} rows={3} className={inputCls + " resize-none"} /></div>
                <div><label className={labelCls}>Internal Match Notes</label><textarea value={form.internal_match_notes ?? ""} onChange={e => setForm(f => ({...f, internal_match_notes: e.target.value}))} rows={2} className={inputCls + " resize-none"} /></div>
                <div><label className={labelCls}>Internal Matching Tags (comma-separated)</label><input value={form.internal_matching_tags ?? ""} onChange={e => setForm(f => ({...f, internal_matching_tags: e.target.value}))} placeholder="e.g. beginner-friendly, classical, patient" className={inputCls} /></div>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={() => setEditing(false)} className="flex-1 rounded-lg border border-[#1c1c1e] py-2 text-sm font-semibold text-[#505055] hover:text-white transition-colors">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="flex-1 rounded-lg bg-[#00ff88]/10 py-2 text-sm font-semibold text-[#00ff88] hover:bg-[#00ff88]/20 transition-colors disabled:opacity-50">{saving ? "Saving…" : "Save Profile"}</button>
            </div>
          </div>
        ) : (
          <>
            {tab === "overview" && (
              <>
                <section>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Contact</div>
                  <div className="space-y-1.5 text-sm">
                    {prospect.email && <div className="flex gap-3 text-[#909098]"><span className="text-[#505055] w-14">Email</span>{prospect.email}</div>}
                    {prospect.phone && <div className="flex gap-3 text-[#909098]"><span className="text-[#505055] w-14">Phone</span>{prospect.phone}</div>}
                    {lc && <div className="flex gap-3 text-[#909098]"><span className="text-[#505055] w-14">Location</span><span style={{ color: lc.color }}>{lc.name}</span></div>}
                    {prospect.source && <div className="flex gap-3 text-[#909098]"><span className="text-[#505055] w-14">Source</span>{prospect.source}</div>}
                    {prospect.interview_date && <div className="flex gap-3 text-[#909098]"><span className="text-[#505055] w-14">Interview</span>{prospect.interview_date}</div>}
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
                {prospect.bio && <section><div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Bio</div><p className="text-sm text-[#909098] leading-relaxed">{prospect.bio}</p></section>}
                {prospect.notes && <section><div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Notes</div><p className="text-sm text-[#909098] leading-relaxed">{prospect.notes}</p></section>}
                {prospect.audition_notes && <section><div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Audition Notes</div><p className="text-sm text-[#909098] leading-relaxed">{prospect.audition_notes}</p></section>}
                {prospect.availability_notes && <section><div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Availability</div><p className="text-sm text-[#909098] leading-relaxed">{prospect.availability_notes}</p></section>}
                {prospect.resume_url && <a href={prospect.resume_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-[#2b2b2f] px-4 py-2.5 text-sm font-semibold text-[#909098] hover:text-white hover:border-[#404048] transition-colors">📄 View Resume</a>}
              </>
            )}
            {tab === "profile" && (
              <>
                {prospect.personality && (
                  <section>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Personality</div>
                    <div className="flex flex-wrap gap-2">
                      {prospect.personality.split(",").map(p => p.trim()).filter(Boolean).map(p => (
                        <span key={p} className="rounded-full border border-[#2b2b2f] bg-[#111113] px-3 py-1 text-xs text-white">{p}</span>
                      ))}
                    </div>
                  </section>
                )}
                {(prospect.primary_instruments || prospect.secondary_instruments) && (
                  <section>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Instruments</div>
                    {prospect.primary_instruments && <div className="mb-2"><div className="text-[10px] text-[#505055] mb-1">Primary</div><div className="flex flex-wrap gap-1">{prospect.primary_instruments.split(",").map(i => i.trim()).filter(Boolean).map(i => <span key={i} className="rounded-full border border-[#00ff88]/30 bg-[#00ff88]/5 px-2 py-0.5 text-xs text-[#00ff88]">{i}</span>)}</div></div>}
                    {prospect.secondary_instruments && <div><div className="text-[10px] text-[#505055] mb-1">Secondary</div><div className="flex flex-wrap gap-1">{prospect.secondary_instruments.split(",").map(i => i.trim()).filter(Boolean).map(i => <span key={i} className="rounded-full border border-[#1c1c1e] bg-[#0a0a0c] px-2 py-0.5 text-xs text-[#909098]">{i}</span>)}</div></div>}
                  </section>
                )}
                {prospect.style_genre_strengths && <section><div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Style / Genre</div><div className="flex flex-wrap gap-2">{prospect.style_genre_strengths.split(",").map(s => s.trim()).filter(Boolean).map(s => <span key={s} className="rounded-full border border-[#1c1c1e] bg-[#111113] px-2 py-0.5 text-xs text-[#909098]">{s}</span>)}</div></section>}
                {prospect.lesson_style && <section><div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Lesson Style</div><p className="text-sm text-[#909098]">{prospect.lesson_style}</p></section>}
                {prospect.teaching_strengths && <section><div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Teaching Strengths</div><p className="text-sm text-[#909098]">{prospect.teaching_strengths}</p></section>}
                {prospect.musical_strengths_background && <section><div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Musical Background</div><p className="text-sm text-[#909098]">{prospect.musical_strengths_background}</p></section>}
                {prospect.skill_levels_by_instrument && <section><div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Skill Levels</div><p className="text-sm text-[#909098]">{prospect.skill_levels_by_instrument}</p></section>}
                {!prospect.personality && !prospect.lesson_style && !prospect.teaching_strengths && (
                  <div className="text-sm text-[#505055] text-center py-8">No profile info yet — click &quot;Edit Profile&quot; to add teaching details.</div>
                )}
              </>
            )}
            {tab === "matching" && (
              <>
                {prospect.customer_facing_match_summary && <section><div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Match Summary</div><p className="text-sm text-[#909098]">{prospect.customer_facing_match_summary}</p></section>}
                {prospect.preferred_age_range && <section><div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Preferred Age Range</div><p className="text-sm text-[#909098]">{prospect.preferred_age_range}</p></section>}
                {prospect.acceptable_age_range && <section><div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Acceptable Age Range</div><p className="text-sm text-[#909098]">{prospect.acceptable_age_range}</p></section>}
                {prospect.best_first_lesson_fit && <section><div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Best First Lesson Fit</div><p className="text-sm text-[#909098]">{prospect.best_first_lesson_fit}</p></section>}
                {prospect.best_match_students && <section><div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Best Match Students</div><p className="text-sm text-[#909098]">{prospect.best_match_students}</p></section>}
                {prospect.meet_and_greet_fit && <section><div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Meet &amp; Greet Fit</div><p className="text-sm text-[#909098]">{prospect.meet_and_greet_fit}</p></section>}
                {prospect.substitute_coverage && <section><div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Substitute Coverage</div><p className="text-sm text-[#909098]">{prospect.substitute_coverage}</p></section>}
                {!prospect.customer_facing_match_summary && !prospect.preferred_age_range && !prospect.best_match_students && (
                  <div className="text-sm text-[#505055] text-center py-8">No matching info yet — click &quot;Edit Profile&quot; to add placement details.</div>
                )}
              </>
            )}
            {tab === "internal" && (
              <>
                {prospect.use_caution_internal_placement_notes && (
                  <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-amber-500/60 mb-2">⚠ Use Caution</div>
                    <p className="text-sm text-amber-100">{prospect.use_caution_internal_placement_notes}</p>
                  </section>
                )}
                {prospect.director_notes && <section><div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Director Notes</div><p className="text-sm text-[#909098]">{prospect.director_notes}</p></section>}
                {prospect.internal_match_notes && <section><div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Internal Match Notes</div><p className="text-sm text-[#909098]">{prospect.internal_match_notes}</p></section>}
                {prospect.internal_matching_tags && <section><div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Matching Tags</div><div className="flex flex-wrap gap-2">{prospect.internal_matching_tags.split(",").map(t => t.trim()).filter(Boolean).map(t => <span key={t} className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">{t}</span>)}</div></section>}
                {!prospect.director_notes && !prospect.internal_match_notes && !prospect.use_caution_internal_placement_notes && (
                  <div className="text-sm text-[#505055] text-center py-8">No internal notes yet — click &quot;Edit Profile&quot; to add director notes.</div>
                )}
              </>
            )}
            <section>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2">Move to Stage</div>
              <div className="grid grid-cols-2 gap-2">
                {STATUSES.filter(s => s.key !== prospect.status).map(s => (
                  <button key={s.key} onClick={() => onStatusChange(prospect.id, s.key)} className="rounded-lg border px-3 py-2 text-xs font-semibold transition-colors" style={{ borderColor: `${s.color}30`, color: s.color, backgroundColor: `${s.color}08` }}>{s.label}</button>
                ))}
              </div>
            </section>
          </>
        )}
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

  const handleUpdate = useCallback(async (id: string, updates: Partial<Prospect>) => {
    const res = await fetch("/api/recruitment", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updates }) });
    const json = await res.json();
    if (json.data) {
      setProspects(prev => prev.map(p => p.id === id ? { ...p, ...json.data } : p));
      setSelectedProspect(prev => prev?.id === id ? { ...prev, ...json.data } : prev);
    }
  }, []);

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
          <div className="hidden xl:flex w-96 shrink-0 flex-col border-l border-[#1c1c1e] bg-[#0a0a0c]">
            {selectedProspect ? (
              <ProspectDetailPanel prospect={selectedProspect} onClose={() => setSelectedProspect(null)} onStatusChange={handleStatusChange} onUpdate={handleUpdate} />
            ) : (
              <div className="p-4 space-y-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#303035]">AI Assistant</div>
      </div>
    </PageTransition>
  );
}
