/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AgentPageBar } from "@/components/agentOS/AgentPageBar";
import { StudentTimeline } from "@/components/students/StudentTimeline";
import { ChampionshipReportCard } from "@/components/reports/ChampionshipReportCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { loadStudentSurface, type StudentSurfaceDTO } from "./actions";
import { PageTransition } from "@/components/system/PageTransition";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

type Tab = "profile" | "edit" | "sessions" | "timeline" | "reports";

type Invoice = {
  id: string;
  amount: number;
  status: string;
  due_date?: string | null;
  paid_date?: string | null;
  description?: string | null;
};

type ChampionshipReport = {
  id: string;
  tenant_id: string;
  student_id: string;
  report_type: string;
  content: any;
  file_url: string | null;
  delivered_at: string | null;
  created_at: string;
};

type StudentRaw = {
  id: string;
  first_name: string;
  last_name: string;
  instrument?: string | null;
  status?: string | null;
  bio?: string | null;
  goals?: string | null;
  learning_style?: string | null;
  teacher_notes?: string | null;
  experience?: string | null;
  notes?: string | null;
  email?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  start_date?: string | null;
  rate_per_session?: number | null;
  blocks_per_week?: number | null;
  tags?: string[] | null;
  teacher_id?: string | null;
  family_id?: string | null;
  tenant_id: string;
};

function invoiceStatusBadge(s: string) {
  const l = s.toLowerCase();
  if (l === "paid") return "bg-[#00ff88]/10 text-[#00ff88]";
  if (l === "overdue") return "bg-red-500/10 text-red-400";
  if (l === "pending") return "bg-amber-400/10 text-amber-400";
  return "bg-white/5 text-[#909098]";
}

function ReportsTab({ studentId, tenantId }: { studentId: string; tenantId: string }) {
  const [reports, setReports] = useState<ChampionshipReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("Student");

  useEffect(() => {
    Promise.all([
      fetch(`/api/students/${studentId}/reports`, {
        headers: { "x-tenant-id": tenantId },
      }).then((r) => r.json()),
      fetch(`/api/students/${studentId}`, {
        headers: { "x-tenant-id": tenantId },
      }).then((r) => r.json()),
    ])
      .then(([reportsRes, studentRes]) => {
        setReports(Array.isArray(reportsRes.data) ? reportsRes.data : []);
        if (studentRes.data) {
          const { first_name, last_name } = studentRes.data;
          setStudentName([first_name, last_name].filter(Boolean).join(" ") || "Student");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [studentId, tenantId]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-white/5" />)}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#1c1c1e] bg-[#0a0a0c] p-6 text-center">
        <p className="text-sm text-[#505055]">No Championship-Level reports found for this student.</p>
        <p className="text-xs text-[#303035] mt-1">Reports will appear here as Stewie generates them.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <ChampionshipReportCard
          key={report.id}
          report={report}
          studentName={studentName}
        />
      ))}
    </div>
  );
}

function SessionsTab({ studentId }: { studentId: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/invoices?studentId=${studentId}`)
      .then((r) => r.json())
      .then((res) => {
        setInvoices(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-white/5" />)}
      </div>
    );
  }

  if (invoices.length === 0) {
    return <div className="text-sm text-[#505055]">No sessions or invoices found for this student.</div>;
  }

  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const totalOutstanding = invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-3">
          <div className="text-xs text-[#505055]">Total Sessions</div>
          <div className="text-xl font-bold text-white">{invoices.length}</div>
        </div>
        <div className="rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-3">
          <div className="text-xs text-[#505055]">Total Paid</div>
          <div className="text-xl font-bold text-[#00ff88]">${totalPaid.toFixed(2)}</div>
        </div>
        <div className="rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-3">
          <div className="text-xs text-[#505055]">Outstanding</div>
          <div className={`text-xl font-bold ${totalOutstanding > 0 ? "text-red-400" : "text-[#505055]"}`}>
            ${totalOutstanding.toFixed(2)}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {invoices.map((inv) => (
          <div key={inv.id} className="flex items-center gap-3 rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white">${inv.amount.toFixed(2)}</div>
              <div className="text-xs text-[#505055]">
                {inv.description ?? "Session"} · Due {inv.due_date ?? "—"}
                {inv.paid_date ? ` · Paid ${inv.paid_date}` : ""}
              </div>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${invoiceStatusBadge(inv.status)}`}>
              {inv.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Student Profile View ───────────────────────────────────────────────────────
function StudentProfileView({ studentId }: { studentId: string }) {
  const [student, setStudent] = useState<StudentRaw | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/students/${studentId}`)
      .then((r) => r.json())
      .then((res) => {
        setStudent(res.data ?? res ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-10 animate-pulse rounded-lg bg-white/5" />)}</div>;
  }
  if (!student) {
    return <div className="text-sm text-[#505055]">Student details unavailable.</div>;
  }

  const rows: { label: string; value: string | null | undefined }[] = [
    { label: "Instrument", value: student.instrument },
    { label: "Status", value: student.status },
    { label: "Email", value: student.email },
    { label: "Phone", value: student.phone },
    { label: "Date of Birth", value: student.date_of_birth },
    { label: "Start Date", value: student.start_date },
    { label: "Rate / Session", value: student.rate_per_session != null ? `$${student.rate_per_session}` : null },
    { label: "Blocks / Week", value: student.blocks_per_week != null ? String(student.blocks_per_week) : null },
  ];

  return (
    <div className="space-y-4">
      {/* Contact & basics snapshot */}
      <div className="rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] divide-y divide-[var(--z-border)]">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#505055]">{label}</span>
            <span className="text-sm text-[var(--z-fg)]">{value ?? <span className="text-[#303035]">—</span>}</span>
          </div>
        ))}
      </div>

      {/* Learning profile */}
      {(student.bio || student.goals || student.learning_style || student.experience) && (
        <div className="rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-widest text-[#303035]">Learning Profile</div>
          {student.bio && <div><div className="text-xs text-[#505055] mb-0.5">Bio</div><div className="text-sm text-[var(--z-fg)]">{student.bio}</div></div>}
          {student.goals && <div><div className="text-xs text-[#505055] mb-0.5">Goals</div><div className="text-sm text-[var(--z-fg)]">{student.goals}</div></div>}
          {student.learning_style && <div><div className="text-xs text-[#505055] mb-0.5">Learning Style</div><div className="text-sm text-[var(--z-fg)]">{student.learning_style}</div></div>}
          {student.experience && <div><div className="text-xs text-[#505055] mb-0.5">Prior Experience</div><div className="text-sm text-[var(--z-fg)]">{student.experience}</div></div>}
        </div>
      )}

      {/* Notes */}
      {(student.teacher_notes || student.notes) && (
        <div className="rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-widest text-[#303035]">Notes</div>
          {student.teacher_notes && <div><div className="text-xs text-[#505055] mb-0.5">Teacher Notes</div><div className="text-sm text-[var(--z-fg)]">{student.teacher_notes}</div></div>}
          {student.notes && <div><div className="text-xs text-[#505055] mb-0.5">General Notes</div><div className="text-sm text-[var(--z-fg)]">{student.notes}</div></div>}
        </div>
      )}
    </div>
  );
}

// ─── Student Edit Form ────────────────────────────────────────────────────────
function StudentEditForm({ studentId, tenantId, onSaved }: { studentId: string; tenantId: string; onSaved: () => void }) {
  const [raw, setRaw] = useState<StudentRaw | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [instrument, setInstrument] = useState("");
  const [status, setStatus] = useState("active");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [startDate, setStartDate] = useState("");
  const [ratePerSession, setRatePerSession] = useState("");
  const [blocksPerWeek, setBlocksPerWeek] = useState("");
  const [bio, setBio] = useState("");
  const [goals, setGoals] = useState("");
  const [learningStyle, setLearningStyle] = useState("");
  const [experience, setExperience] = useState("");
  const [teacherNotes, setTeacherNotes] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch(`/api/students/${studentId}`, {
      headers: { "x-tenant-id": tenantId },
    })
      .then(r => r.json())
      .then(res => {
        const s: StudentRaw = res.data;
        setRaw(s);
        setFirstName(s.first_name ?? "");
        setLastName(s.last_name ?? "");
        setInstrument(s.instrument ?? "");
        setStatus(s.status ?? "active");
        setEmail(s.email ?? "");
        setPhone(s.phone ?? "");
        setDateOfBirth(s.date_of_birth ?? "");
        setStartDate(s.start_date ?? "");
        setRatePerSession(s.rate_per_session != null ? String(s.rate_per_session) : "");
        setBlocksPerWeek(s.blocks_per_week != null ? String(s.blocks_per_week) : "");
        setBio(s.bio ?? "");
        setGoals(s.goals ?? "");
        setLearningStyle(s.learning_style ?? "");
        setExperience(s.experience ?? "");
        setTeacherNotes(s.teacher_notes ?? "");
        setNotes(s.notes ?? "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [studentId, tenantId]);

  async function handleSave() {
    setSaving(true);
    setSaveStatus("idle");
    setSaveError(null);
    try {
      const patch: Record<string, unknown> = {
        first_name: firstName,
        last_name: lastName,
        instrument: instrument || null,
        status,
        email: email || null,
        phone: phone || null,
        date_of_birth: dateOfBirth || null,
        start_date: startDate || null,
        rate_per_session: ratePerSession ? parseFloat(ratePerSession) : undefined,
        blocks_per_week: blocksPerWeek ? parseInt(blocksPerWeek, 10) : undefined,
        bio: bio || null,
        goals: goals || null,
        learning_style: learningStyle || null,
        experience: experience || null,
        teacher_notes: teacherNotes || null,
        notes: notes || null,
      };
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-tenant-id": tenantId },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? `HTTP ${res.status}`);
      }
      setSaveStatus("success");
      setTimeout(() => { setSaveStatus("idle"); onSaved(); }, 2000);
    } catch (err) {
      setSaveStatus("error");
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-10 animate-pulse rounded-lg bg-white/5" />)}</div>;
  }
  if (!raw) {
    return <div className="text-sm text-red-400">Could not load student data.</div>;
  }

  const inputCls = "w-full rounded-lg border border-[#1c1c1e] bg-[#111113] px-3 py-2 text-sm text-white placeholder-[#404048] focus:border-[#00ff88]/30 focus:outline-none";
  const labelCls = "block text-xs font-semibold uppercase tracking-wider text-[#505055] mb-1";
  const sectionCls = "rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] p-4 space-y-3";

  return (
    <div className="space-y-4">
      {/* Basic Info */}
      <div className={sectionCls}>
        <div className="text-xs font-bold uppercase tracking-widest text-[#303035]">Basic Info</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>First Name</label>
            <input className={inputCls} value={firstName} onChange={e => setFirstName(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Last Name</label>
            <input className={inputCls} value={lastName} onChange={e => setLastName(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Instrument</label>
            <input className={inputCls} value={instrument} onChange={e => setInstrument(e.target.value)} placeholder="Guitar, Piano…" />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={status} onChange={e => setStatus(e.target.value)}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="inactive">Inactive</option>
              <option value="former">Former</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Email</label>
            <input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input className={inputCls} type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Date of Birth</label>
            <input className={inputCls} type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Start Date</label>
            <input className={inputCls} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Rate / Session ($)</label>
            <input className={inputCls} type="number" min="0" step="0.01" value={ratePerSession} onChange={e => setRatePerSession(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className={labelCls}>Blocks / Week</label>
            <input className={inputCls} type="number" min="0" step="1" value={blocksPerWeek} onChange={e => setBlocksPerWeek(e.target.value)} placeholder="1" />
          </div>
        </div>
      </div>

      {/* Learning Profile */}
      <div className={sectionCls}>
        <div className="text-xs font-bold uppercase tracking-widest text-[#303035]">Learning Profile</div>
        <div>
          <label className={labelCls}>Bio</label>
          <textarea className={inputCls} rows={2} value={bio} onChange={e => setBio(e.target.value)} placeholder="Brief student bio…" />
        </div>
        <div>
          <label className={labelCls}>Goals</label>
          <textarea className={inputCls} rows={2} value={goals} onChange={e => setGoals(e.target.value)} placeholder="What does this student want to achieve?" />
        </div>
        <div>
          <label className={labelCls}>Learning Style</label>
          <input className={inputCls} value={learningStyle} onChange={e => setLearningStyle(e.target.value)} placeholder="Visual, auditory, kinesthetic…" />
        </div>
        <div>
          <label className={labelCls}>Prior Experience</label>
          <input className={inputCls} value={experience} onChange={e => setExperience(e.target.value)} placeholder="Beginner, 2 years, etc." />
        </div>
      </div>

      {/* Teacher Notes */}
      <div className={sectionCls}>
        <div className="text-xs font-bold uppercase tracking-widest text-[#303035]">Teacher Notes</div>
        <div>
          <label className={labelCls}>Private Teacher Notes</label>
          <textarea className={inputCls} rows={3} value={teacherNotes} onChange={e => setTeacherNotes(e.target.value)} placeholder="Notes visible only to teachers and admins…" />
        </div>
        <div>
          <label className={labelCls}>General Notes</label>
          <textarea className={inputCls} rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="General notes…" />
        </div>
      </div>

      {/* Save */}
      {saveStatus === "success" && <p className="text-sm text-green-500">Student profile saved successfully.</p>}
      {saveStatus === "error" && saveError && <p className="text-sm text-red-400">Error: {saveError}</p>}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 rounded-xl bg-[#00ff88] py-3 text-sm font-bold text-black disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Profile"}
        </button>
      </div>
    </div>
  );
}

function StudentDetailLoaded({ studentId }: { studentId: string }) {
  const [data, setData] = useState<StudentSurfaceDTO | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("profile");

  function reload() {
    setLoading(true);
    void loadStudentSurface(studentId, DEFAULT_TENANT_ID).then((res) => {
      setLoading(false);
      if (!res.ok) { setErr(res.error); setData(null); }
      else { setErr(null); setData(res.data); }
    });
  }

  useEffect(() => { reload(); }, [studentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const agentStatus = useMemo(() => {
    if (!data) return "idle" as const;
    if (data.blockers.length > 0) return "blocked" as const;
    if (data.riskBand === "high") return "blocked" as const;
    return "active" as const;
  }, [data]);

  const TABS: { id: Tab; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "edit", label: "Edit" },
    { id: "sessions", label: "Sessions" },
    { id: "timeline", label: "Timeline" },
    { id: "reports", label: "Reports" },
  ];

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl space-y-4" data-tour="student-detail">
        {loading && <div className="text-sm text-[var(--z-muted)]">Loading…</div>}
        {err && <div className="text-sm text-[var(--z-danger)]">{err}</div>}
        {data && (
          <>
            <PageHeader title={data.studentName} subtitle={`${data.stageName} · ${data.riskBand} risk`} />

            {/* ── Sid agent bar — always at top, not a tab ── */}
            <AgentPageBar
              agentId="sid"
              chatPlaceholder="Ask Sid about this student…"
              pageContext={{
                page: "student-profile",
                studentId,
                studentName: data.studentName,
                stageName: data.stageName,
                riskBand: data.riskBand,
                agentSummary: data.agentSummary,
                nextActions: data.nextActions,
                blockers: data.blockers,
                agentStatus,
              }}
            />

            {/* ── Tabs ── */}
            <div className="flex gap-1 border-b border-[#1c1c1e] overflow-x-auto">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`shrink-0 px-4 py-2.5 text-sm font-semibold transition-colors ${
                    tab === t.id
                      ? "border-b-2 border-[#00ff88] text-[#00ff88]"
                      : "text-[#505055] hover:text-[#909098]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── Tab content ── */}
            {tab === "profile" && <StudentProfileView studentId={studentId} />}
            {tab === "edit" && (
              <StudentEditForm
                studentId={studentId}
                tenantId={DEFAULT_TENANT_ID}
                onSaved={() => { reload(); setTab("profile"); }}
              />
            )}
            {tab === "sessions" && <SessionsTab studentId={studentId} />}
            {tab === "timeline" && <StudentTimeline events={data.timeline} />}
            {tab === "reports" && <ReportsTab studentId={studentId} tenantId={DEFAULT_TENANT_ID} />}
          </>
        )}
      </div>
    </PageTransition>
  );
}

export function StudentDetailClient() {
  const params = useParams();
  const studentId = String(params?.id ?? "");
  if (!studentId) {
    return (
      <div className="h-full overflow-y-auto overflow-x-hidden p-[var(--z-space-6)]">
        <p className="text-sm text-[var(--z-muted)]">Missing student id.</p>
      </div>
    );
  }
  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-[var(--z-space-6)]">
      <StudentDetailLoaded key={studentId} studentId={studentId} />
    </div>
  );
}
