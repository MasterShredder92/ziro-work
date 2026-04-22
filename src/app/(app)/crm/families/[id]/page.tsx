"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

/* ─── Types ─────────────────────────────────────────────── */
type Family = {
  id: string; name: string; parent_name?: string | null;
  parent_first_name?: string | null; parent_last_name?: string | null;
  primary_email: string | null; primary_phone: string | null;
  address_line1?: string | null; address_line2?: string | null;
  city?: string | null; state?: string | null; postal_code?: string | null;
  notes?: string | null; billing_notes?: string | null;
  billing_day?: number | null; billing_status?: string | null;
  rate_tier?: string | null; rate_tier_override?: string | null;
  rate_tier_reason?: string | null; autopay_enabled?: boolean | null;
  emergency_contact_name?: string | null; emergency_contact_phone?: string | null;
  emergency_contact_relationship?: string | null;
  scheduling_notes?: string | null; notify_via_sms?: boolean | null;
  notify_via_email?: boolean | null; is_military?: boolean | null;
  primary_location_id?: string | null; status?: string | null;
  archived_at?: string | null; created_at: string;
};

type Student = {
  id: string; first_name: string; last_name: string;
  instrument?: string | null; status?: string | null;
  teacher_id?: string | null; location_id?: string | null;
  enrollment_date?: string | null; start_date?: string | null;
  goals?: string | null; learning_style?: string | null;
  notes?: string | null; teacher_notes?: string | null;
  experience?: string | null; bio?: string | null;
  date_of_birth?: string | null; email?: string | null; phone?: string | null;
};

type Invoice = {
  id: string; total_cents: number; status: string;
  due_date?: string | null; is_recurring?: boolean | null;
  live_url_token?: string | null; invoice_month?: string | null;
  created_at?: string;
};

type Teacher = {
  id: string; first_name?: string | null; last_name?: string | null;
  display_name?: string | null; photo_url?: string | null;
  bio?: string | null; personality?: string | null;
  lesson_style?: string | null; instruments?: string[] | null;
  primary_instruments?: string | null; teaching_strengths?: string | null;
  musical_strengths_background?: string | null;
  customer_facing_match_summary?: string | null;
  preferred_age_range?: string | null; best_match_students?: string | null;
  teacher_role?: string | null;
};

type AuditEvent = {
  id: string; action: string; table_name?: string | null;
  entity_name?: string | null; user_name?: string | null;
  user_role?: string | null; reason?: string | null;
  old_value?: unknown; new_value?: unknown; created_at: string;
};

type Tab = "students" | "invoices" | "edit" | "timeline" | "teachers";

/* ─── Helpers ────────────────────────────────────────────── */
function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function statusColor(s?: string | null) {
  const v = (s ?? "").toLowerCase();
  if (v === "active") return "bg-emerald-500/10 text-emerald-400";
  if (v === "inactive" || v === "archived") return "bg-white/5 text-[#909098]";
  if (v === "trial") return "bg-amber-400/10 text-amber-400";
  if (v === "paused") return "bg-blue-400/10 text-blue-400";
  return "bg-white/5 text-[#909098]";
}

function invoiceColor(s: string) {
  const v = s.toLowerCase();
  if (v === "paid") return "bg-emerald-500/10 text-emerald-400";
  if (v === "overdue") return "bg-red-400/10 text-red-400";
  if (v === "draft") return "bg-white/5 text-[#909098]";
  if (v === "sent") return "bg-blue-400/10 text-blue-400";
  return "bg-white/5 text-[#909098]";
}

const LOCATIONS: Record<string, { name: string; color: string }> = {
  "loc-elkhorn":   { name: "Elkhorn",   color: "#00ff88" },
  "loc-papillion": { name: "Papillion", color: "#ff9900" },
  "loc-bellevue":  { name: "Bellevue",  color: "#00aaff" },
  "loc-omaha":     { name: "Omaha",     color: "#ff44aa" },
};

const inputCls = "w-full rounded-xl border border-[#1c1c1e] bg-[#111113] px-3 py-2.5 text-sm text-white placeholder-[#404048] focus:border-[#00ff88]/40 focus:outline-none";
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-[#505055] mb-1";
const sectionCls = "rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] p-5 space-y-4";

/* ─── Main Component ─────────────────────────────────────── */
export default function FamilyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const tenantId = DEFAULT_TENANT_ID;

  const [tab, setTab] = useState<Tab>("students");
  const [family, setFamily] = useState<Family | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [timeline, setTimeline] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [famRes, stuRes, invRes] = await Promise.all([
        fetch(`/api/crm/families/${id}`, { headers: { "x-tenant-id": tenantId } }).then(r => r.json()),
        fetch(`/api/students?family_id=${id}&page_size=50`, { headers: { "x-tenant-id": tenantId } }).then(r => r.json()),
        fetch(`/api/billing/invoices?family_id=${id}&page_size=20`, { headers: { "x-tenant-id": tenantId } }).then(r => r.json()).catch(() => ({ data: [] })),
      ]);
      if (famRes?.data) setFamily(famRes.data);
      else { setError("Family not found."); return; }
      const stuList: Student[] = stuRes?.data?.items ?? stuRes?.data ?? [];
      setStudents(stuList);
      const invData = invRes?.data;
      setInvoices(Array.isArray(invData) ? invData : Array.isArray(invData?.items) ? invData.items : []);

      // Load teachers for students
      const teacherIds = [...new Set(stuList.map((s: Student) => s.teacher_id).filter(Boolean))] as string[];
      if (teacherIds.length > 0) {
        const tRes = await Promise.all(
          teacherIds.map(tid =>
            fetch(`/api/teachers/${tid}`, { headers: { "x-tenant-id": tenantId } })
              .then(r => r.json()).catch(() => null)
          )
        );
        setTeachers(tRes.filter(Boolean).map((r: { data?: Teacher }) => r?.data).filter(Boolean) as Teacher[]);
      }
    } catch {
      setError("Failed to load family.");
    } finally {
      setLoading(false);
    }
  }, [id, tenantId]);

  const loadTimeline = useCallback(async () => {
    if (!id) return;
    const res = await fetch(`/api/audit-log?record_id=${id}&page_size=50`, {
      headers: { "x-tenant-id": tenantId }
    }).then(r => r.json()).catch(() => ({ data: [] }));
    const rows = res?.data?.items ?? res?.data ?? [];
    setTimeline(rows);
  }, [id, tenantId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab === "timeline") loadTimeline(); }, [tab, loadTimeline]);

  if (loading) return (
    <div className="flex h-64 items-center justify-center text-[#909098] text-sm">Loading…</div>
  );
  if (error || !family) return (
    <div className="flex h-64 flex-col items-center justify-center gap-3">
      <p className="text-[#909098] text-sm">{error ?? "Family not found."}</p>
      <button onClick={() => router.back()} className="rounded-lg border border-[#2b2b2f] px-4 py-2 text-sm text-[#909098] hover:text-white transition-colors">← Go Back</button>
    </div>
  );

  const displayName = family.parent_first_name
    ? `${family.parent_first_name} ${family.parent_last_name ?? ""}`.trim()
    : family.parent_name ?? family.name;

  const TABS: { key: Tab; label: string }[] = [
    { key: "students",  label: `Students (${students.length})` },
    { key: "invoices",  label: `Invoices (${invoices.length})` },
    { key: "edit",      label: "Edit" },
    { key: "timeline",  label: "Timeline" },
    { key: "teachers",  label: "Meet Your Teachers" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      {/* Back */}
      <Link href="/crm/families" className="inline-flex items-center gap-1.5 text-sm text-[#909098] hover:text-[#00ff88] transition-colors">
        ← All Families
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1a1a1e] text-xl font-bold text-[#00ff88] shrink-0 ring-2 ring-[#00ff88]/20">
          {initials(family.name)}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white truncate">{family.name}</h1>
          <p className="text-sm text-[#909098]">
            {displayName !== family.name ? displayName + " · " : ""}
            {family.archived_at ? "Archived" : family.status ?? "Active"}
            {family.primary_location_id && LOCATIONS[family.primary_location_id] && (
              <span className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: LOCATIONS[family.primary_location_id].color + "20", color: LOCATIONS[family.primary_location_id].color }}>
                {LOCATIONS[family.primary_location_id].name}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {family.primary_email && (
            <a href={`mailto:${family.primary_email}`} className="rounded-lg border border-[#1c1c1e] px-3 py-1.5 text-xs text-[#909098] hover:text-white hover:border-[#2b2b2f] transition-colors">
              Email
            </a>
          )}
          {family.primary_phone && (
            <a href={`tel:${family.primary_phone}`} className="rounded-lg border border-[#1c1c1e] px-3 py-1.5 text-xs text-[#909098] hover:text-white hover:border-[#2b2b2f] transition-colors">
              Call
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#1c1c1e] overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? "border-[#00ff88] text-[#00ff88]"
                : "border-transparent text-[#909098] hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Students Tab ── */}
      {tab === "students" && (
        <div className="space-y-3">
          {students.length === 0 ? (
            <div className={sectionCls}>
              <p className="text-sm text-[#505055]">No students linked to this family.</p>
            </div>
          ) : (
            students.map(s => {
              const teacher = teachers.find(t => t.id === s.teacher_id);
              const loc = s.location_id ? LOCATIONS[s.location_id] : null;
              return (
                <div key={s.id} className="rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a1a1e] text-sm font-bold text-[#909098] shrink-0">
                        {initials(`${s.first_name} ${s.last_name}`)}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{s.first_name} {s.last_name}</p>
                        <p className="text-xs text-[#909098]">
                          {s.instrument ?? "No instrument"}{loc ? ` · ${loc.name}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {loc && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: loc.color + "20", color: loc.color }}>
                          {loc.name}
                        </span>
                      )}
                      {s.status && (
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${statusColor(s.status)}`}>
                          {s.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Student details grid */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                    {s.enrollment_date && <div><span className="text-[#505055]">Enrolled</span> <span className="text-[#d4d4d4]">{new Date(s.enrollment_date).toLocaleDateString()}</span></div>}
                    {s.start_date && <div><span className="text-[#505055]">Start Date</span> <span className="text-[#d4d4d4]">{new Date(s.start_date).toLocaleDateString()}</span></div>}
                    {s.experience && <div><span className="text-[#505055]">Experience</span> <span className="text-[#d4d4d4]">{s.experience}</span></div>}
                    {s.learning_style && <div><span className="text-[#505055]">Learning Style</span> <span className="text-[#d4d4d4]">{s.learning_style}</span></div>}
                    {teacher && <div><span className="text-[#505055]">Teacher</span> <span className="text-[#d4d4d4]">{teacher.display_name ?? [teacher.first_name, teacher.last_name].filter(Boolean).join(" ")}</span></div>}
                  </div>

                  {s.goals && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#505055] mb-1">Goals</p>
                      <p className="text-xs text-[#d4d4d4] leading-relaxed">{s.goals}</p>
                    </div>
                  )}
                  {s.notes && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#505055] mb-1">Notes</p>
                      <p className="text-xs text-[#d4d4d4] leading-relaxed">{s.notes}</p>
                    </div>
                  )}
                  {s.teacher_notes && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#505055] mb-1">Teacher Notes</p>
                      <p className="text-xs text-[#d4d4d4] leading-relaxed">{s.teacher_notes}</p>
                    </div>
                  )}

                  {/* Progress report link */}
                  <div className="flex items-center gap-2 pt-1">
                    <Link href={`/students/${s.id}/progress`} className="text-xs text-[#00ff88] hover:opacity-80 transition-opacity">
                      View Progress Reports →
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Invoices Tab ── */}
      {tab === "invoices" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#909098]">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""} on file</p>
            <Link
              href={`/invoices?family_id=${family.id}&return=family`}
              className="rounded-xl bg-[#00ff88] px-4 py-2 text-xs font-bold text-black hover:opacity-90 transition-opacity"
            >
              + Create Invoice
            </Link>
          </div>
          {invoices.length === 0 ? (
            <div className={sectionCls}>
              <p className="text-sm text-[#505055]">No invoices yet. Create the first one above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {invoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] px-5 py-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">${(inv.total_cents / 100).toFixed(2)}</span>
                      {inv.is_recurring && <span className="text-[10px] text-[#505055]">🔁 Recurring</span>}
                    </div>
                    <div className="text-xs text-[#505055]">
                      {inv.due_date ? `Due ${new Date(inv.due_date).toLocaleDateString()}` : "No due date"}
                      {inv.invoice_month ? ` · ${inv.invoice_month}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${invoiceColor(inv.status)}`}>
                      {inv.status}
                    </span>
                    {inv.live_url_token && (
                      <a href={`/invoice/${inv.live_url_token}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-[#909098] hover:text-[#00ff88] transition-colors">
                        View →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Edit Tab ── */}
      {tab === "edit" && (
        <EditFamilyForm family={family} tenantId={tenantId} onSaved={(updated) => setFamily(updated)} />
      )}

      {/* ── Timeline Tab ── */}
      {tab === "timeline" && (
        <div className="space-y-3">
          {timeline.length === 0 ? (
            <div className={sectionCls}>
              <p className="text-sm text-[#505055]">No activity recorded yet.</p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-4">
              <div className="absolute left-2 top-0 bottom-0 w-px bg-[#1c1c1e]" />
              {timeline.map(ev => (
                <div key={ev.id} className="relative">
                  <div className="absolute -left-4 top-1.5 h-2 w-2 rounded-full bg-[#00ff88]/60" />
                  <div className="rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] px-4 py-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-white capitalize">{ev.action.replace(/_/g, " ")}</span>
                      <span className="text-[10px] text-[#505055]">{new Date(ev.created_at).toLocaleString()}</span>
                    </div>
                    {ev.entity_name && <p className="text-xs text-[#909098]">{ev.entity_name}</p>}
                    {ev.user_name && (
                      <p className="text-[10px] text-[#505055]">
                        by {ev.user_name}{ev.user_role ? ` (${ev.user_role})` : ""}
                      </p>
                    )}
                    {ev.reason && <p className="text-xs text-[#909098] italic">"{ev.reason}"</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Meet Your Teachers Tab ── */}
      {tab === "teachers" && (
        <div className="space-y-4">
          {teachers.length === 0 ? (
            <div className={sectionCls}>
              <p className="text-sm text-[#505055]">No teachers assigned to students in this family yet.</p>
            </div>
          ) : (
            teachers.map(t => {
              const name = t.display_name ?? [t.first_name, t.last_name].filter(Boolean).join(" ") ?? "Teacher";
              const instruments = t.instruments?.join(", ") ?? t.primary_instruments ?? null;
              const tags = t.personality?.split(",").map(p => p.trim()).filter(Boolean) ?? [];
              return (
                <div key={t.id} className="rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] overflow-hidden">
                  {/* Photo header */}
                  <div className="relative h-48 bg-gradient-to-br from-[#0d0d10] to-[#1a1a1e] flex items-center justify-center">
                    {t.photo_url ? (
                      <img src={t.photo_url} alt={name} className="h-full w-full object-cover object-top" />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#1a1a1e] text-3xl font-bold text-[#00ff88]">
                        {initials(name)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-5">
                      <p className="text-xl font-bold text-white">{name}</p>
                      {t.teacher_role && <p className="text-xs text-[#909098]">{t.teacher_role}</p>}
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    {instruments && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#505055] mb-1.5">Instruments</p>
                        <div className="flex flex-wrap gap-1.5">
                          {instruments.split(",").map(i => (
                            <span key={i} className="rounded-full border border-[#1c1c1e] bg-[#111113] px-3 py-1 text-xs text-white">{i.trim()}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {t.bio && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#505055] mb-1.5">About {name.split(" ")[0]}</p>
                        <p className="text-sm text-[#d4d4d4] leading-relaxed">{t.bio}</p>
                      </div>
                    )}

                    {t.customer_facing_match_summary && (
                      <div className="rounded-lg border border-[#00ff88]/20 bg-[#00ff88]/5 px-4 py-3">
                        <p className="text-xs text-[#00ff88] leading-relaxed">{t.customer_facing_match_summary}</p>
                      </div>
                    )}

                    {t.lesson_style && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#505055] mb-1">Lesson Style</p>
                        <p className="text-sm text-[#d4d4d4]">{t.lesson_style}</p>
                      </div>
                    )}

                    {tags.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#505055] mb-1.5">Personality</p>
                        <div className="flex flex-wrap gap-1.5">
                          {tags.map(tag => (
                            <span key={tag} className="rounded-full border border-[#505055]/40 bg-[#1a1a1e] px-3 py-1 text-xs text-white">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {t.teaching_strengths && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#505055] mb-1">Teaching Strengths</p>
                        <p className="text-sm text-[#d4d4d4]">{t.teaching_strengths}</p>
                      </div>
                    )}

                    {t.best_match_students && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#505055] mb-1">Best Fit Students</p>
                        <p className="text-sm text-[#d4d4d4]">{t.best_match_students}</p>
                      </div>
                    )}

                    {/* Which students in this family are with this teacher */}
                    {(() => {
                      const myStudents = students.filter(s => s.teacher_id === t.id);
                      if (myStudents.length === 0) return null;
                      return (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#505055] mb-1.5">Teaching in This Family</p>
                          <div className="flex flex-wrap gap-2">
                            {myStudents.map(s => (
                              <span key={s.id} className="rounded-full bg-[#1a1a1e] border border-[#1c1c1e] px-3 py-1 text-xs text-white">
                                {s.first_name} {s.last_name} {s.instrument ? `· ${s.instrument}` : ""}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Meta */}
      <p className="text-xs text-[#303035]">
        Family ID: {family.id} · Created {new Date(family.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}

/* ─── Edit Family Form ───────────────────────────────────── */
function EditFamilyForm({ family, tenantId, onSaved }: {
  family: Family; tenantId: string; onSaved: (f: Family) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const [name, setName] = useState(family.name ?? "");
  const [parentFirst, setParentFirst] = useState(family.parent_first_name ?? "");
  const [parentLast, setParentLast] = useState(family.parent_last_name ?? "");
  const [email, setEmail] = useState(family.primary_email ?? "");
  const [phone, setPhone] = useState(family.primary_phone ?? "");
  const [addr1, setAddr1] = useState(family.address_line1 ?? "");
  const [addr2, setAddr2] = useState(family.address_line2 ?? "");
  const [city, setCity] = useState(family.city ?? "");
  const [state, setState] = useState(family.state ?? "");
  const [zip, setZip] = useState(family.postal_code ?? "");
  const [notes, setNotes] = useState(family.notes ?? "");
  const [billingNotes, setBillingNotes] = useState(family.billing_notes ?? "");
  const [billingDay, setBillingDay] = useState(family.billing_day?.toString() ?? "1");
  const [rateTier, setRateTier] = useState(family.rate_tier ?? "");
  const [rateTierOverride, setRateTierOverride] = useState(family.rate_tier_override ?? "");
  const [rateTierReason, setRateTierReason] = useState(family.rate_tier_reason ?? "");
  const [autopay, setAutopay] = useState(family.autopay_enabled ?? false);
  const [isMilitary, setIsMilitary] = useState(family.is_military ?? false);
  const [ecName, setEcName] = useState(family.emergency_contact_name ?? "");
  const [ecPhone, setEcPhone] = useState(family.emergency_contact_phone ?? "");
  const [ecRel, setEcRel] = useState(family.emergency_contact_relationship ?? "");
  const [schedulingNotes, setSchedulingNotes] = useState(family.scheduling_notes ?? "");
  const [notifySms, setNotifySms] = useState(family.notify_via_sms ?? true);
  const [notifyEmail, setNotifyEmail] = useState(family.notify_via_email ?? true);

  async function handleSave() {
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch(`/api/crm/families/${family.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-tenant-id": tenantId },
        body: JSON.stringify({
          name, parent_first_name: parentFirst || null, parent_last_name: parentLast || null,
          primary_email: email || null, primary_phone: phone || null,
          address_line1: addr1 || null, address_line2: addr2 || null,
          city: city || null, state: state || null, postal_code: zip || null,
          notes: notes || null, billing_notes: billingNotes || null,
          billing_day: billingDay ? parseInt(billingDay) : null,
          rate_tier: rateTier || null,
          rate_tier_override: rateTierOverride || null,
          rate_tier_reason: rateTierReason || null,
          autopay_enabled: autopay, is_military: isMilitary,
          emergency_contact_name: ecName || null,
          emergency_contact_phone: ecPhone || null,
          emergency_contact_relationship: ecRel || null,
          scheduling_notes: schedulingNotes || null,
          notify_via_sms: notifySms, notify_via_email: notifyEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Save failed");
      onSaved(data.data);
      setStatus("success");
    } catch (e: unknown) {
      setErrMsg(e instanceof Error ? e.message : "Unknown error");
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Family Name */}
      <div className={sectionCls}>
        <div className="text-xs font-bold uppercase tracking-widest text-[#303035]">Family Info</div>
        <div><label className={labelCls}>Family Name</label><input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Smith Family" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Parent First Name</label><input className={inputCls} value={parentFirst} onChange={e => setParentFirst(e.target.value)} /></div>
          <div><label className={labelCls}>Parent Last Name</label><input className={inputCls} value={parentLast} onChange={e => setParentLast(e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Email</label><input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div><label className={labelCls}>Phone</label><input className={inputCls} type="tel" value={phone} onChange={e => setPhone(e.target.value)} /></div>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-white">
            <input type="checkbox" checked={isMilitary} onChange={e => setIsMilitary(e.target.checked)} className="h-4 w-4 accent-[#00ff88]" />
            Military Family
          </label>
        </div>
      </div>

      {/* Address */}
      <div className={sectionCls}>
        <div className="text-xs font-bold uppercase tracking-widest text-[#303035]">Address</div>
        <div><label className={labelCls}>Street Address</label><input className={inputCls} value={addr1} onChange={e => setAddr1(e.target.value)} /></div>
        <div><label className={labelCls}>Apt / Suite</label><input className={inputCls} value={addr2} onChange={e => setAddr2(e.target.value)} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className={labelCls}>City</label><input className={inputCls} value={city} onChange={e => setCity(e.target.value)} /></div>
          <div><label className={labelCls}>State</label><input className={inputCls} value={state} onChange={e => setState(e.target.value)} maxLength={2} /></div>
          <div><label className={labelCls}>ZIP</label><input className={inputCls} value={zip} onChange={e => setZip(e.target.value)} /></div>
        </div>
      </div>

      {/* Billing */}
      <div className={sectionCls}>
        <div className="text-xs font-bold uppercase tracking-widest text-[#303035]">Billing</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Rate Tier</label>
            <select className={inputCls} value={rateTier} onChange={e => setRateTier(e.target.value)}>
              <option value="">— Select —</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="discount">Discount</option>
              <option value="military">Military</option>
              <option value="scholarship">Scholarship</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Rate Override ($)</label>
            <input className={inputCls} type="number" min="0" step="0.01" value={rateTierOverride} onChange={e => setRateTierOverride(e.target.value)} placeholder="e.g. 85.00" />
          </div>
        </div>
        {rateTierOverride && (
          <div><label className={labelCls}>Override Reason</label><input className={inputCls} value={rateTierReason} onChange={e => setRateTierReason(e.target.value)} placeholder="Scholarship, sibling discount, etc." /></div>
        )}
        <div>
          <label className={labelCls}>Billing Day of Month</label>
          <input className={inputCls} type="number" min="1" max="28" value={billingDay} onChange={e => setBillingDay(e.target.value)} />
          <p className="mt-1 text-[10px] text-[#505055]">Recurring invoices send on this day. Default: 1st.</p>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-white">
            <input type="checkbox" checked={autopay} onChange={e => setAutopay(e.target.checked)} className="h-4 w-4 accent-[#00ff88]" />
            Autopay Enabled
          </label>
        </div>
        <div><label className={labelCls}>Billing Notes</label><textarea className={inputCls} rows={2} value={billingNotes} onChange={e => setBillingNotes(e.target.value)} placeholder="Internal billing notes…" /></div>
      </div>

      {/* Notifications */}
      <div className={sectionCls}>
        <div className="text-xs font-bold uppercase tracking-widest text-[#303035]">Notifications</div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-white">
            <input type="checkbox" checked={notifyEmail} onChange={e => setNotifyEmail(e.target.checked)} className="h-4 w-4 accent-[#00ff88]" />
            Email Notifications
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-white">
            <input type="checkbox" checked={notifySms} onChange={e => setNotifySms(e.target.checked)} className="h-4 w-4 accent-[#00ff88]" />
            SMS Notifications
          </label>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className={sectionCls}>
        <div className="text-xs font-bold uppercase tracking-widest text-[#303035]">Emergency Contact</div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Name</label><input className={inputCls} value={ecName} onChange={e => setEcName(e.target.value)} /></div>
          <div><label className={labelCls}>Phone</label><input className={inputCls} type="tel" value={ecPhone} onChange={e => setEcPhone(e.target.value)} /></div>
        </div>
        <div><label className={labelCls}>Relationship</label><input className={inputCls} value={ecRel} onChange={e => setEcRel(e.target.value)} placeholder="Parent, Grandparent, etc." /></div>
      </div>

      {/* Notes */}
      <div className={sectionCls}>
        <div className="text-xs font-bold uppercase tracking-widest text-[#303035]">Notes</div>
        <div><label className={labelCls}>General Notes</label><textarea className={inputCls} rows={3} value={notes} onChange={e => setNotes(e.target.value)} /></div>
        <div><label className={labelCls}>Scheduling Notes</label><textarea className={inputCls} rows={2} value={schedulingNotes} onChange={e => setSchedulingNotes(e.target.value)} /></div>
      </div>

      {status === "success" && <p className="text-sm text-emerald-400">Family profile saved.</p>}
      {status === "error" && <p className="text-sm text-red-400">Error: {errMsg}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-xl bg-[#00ff88] py-3 text-sm font-bold text-black disabled:opacity-50 hover:opacity-90 transition-opacity"
      >
        {saving ? "Saving…" : "Save Family Profile"}
      </button>
    </div>
  );
}
