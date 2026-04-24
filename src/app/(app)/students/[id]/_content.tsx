"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

/* ─── Theme tokens (mirrors Family page) ─────────────────── */
const T = {
  bg:       "var(--z-bg, var(--z-surface))",
  surface:  "var(--z-surface)",
  surface2: "var(--z-surface-2, var(--z-surface))",
  border:   "var(--z-border)",
  fg:       "var(--z-fg)",
  muted:    "var(--z-muted)",
  label:    "var(--z-muted)",
  shadow:   "0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)",
};

const BRAND = "#00D16C"; // Ziro Green

/* ─── Types ──────────────────────────────────────────────── */
type StudentOverview = {
  id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  instrument: string | null;
  bio: string | null;
  goals: string | null;
  learning_style: string | null;
  teacher_id: string | null;
  lesson_day_of_week: string | null;
  blocks_per_week: number | null;
  experience_level: string | null;
  status: string | null;
};

type NoteType = "internal_studio" | "teacher_lesson" | "parent_comm";

type StudentNote = {
  id: string;
  student_id: string;
  author_id: string | null;
  author_name: string | null;
  author_role: string | null;
  note_type: NoteType;
  body: string;
  created_at: string;
  updated_at: string;
};

type TeacherName = {
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
};

type StudentFile = {
  id: string;
  file_name: string;
  file_size: number | null;
  file_url: string | null;
  storage_path: string | null;
  folder: string;
  created_at: string;
  uploaded_by: string | null;
  uploaded_by_role: string | null;
};

type Tab = "overview" | "files" | "notes" | "timeline";

/* ─── Note type config ───────────────────────────────────── */
const NOTE_TYPES: { value: NoteType; label: string; color: string; bg: string }[] = [
  { value: "internal_studio", label: "Internal",    color: "#6b7280", bg: "rgba(107,114,128,0.10)" },
  { value: "teacher_lesson",  label: "Lesson Note", color: "#2563eb", bg: "rgba(37,99,235,0.10)"   },
  { value: "parent_comm",     label: "Parent Comm", color: "#d97706", bg: "rgba(217,119,6,0.10)"   },
];
function getNoteTypeConfig(t: NoteType) {
  return NOTE_TYPES.find(n => n.value === t) ?? NOTE_TYPES[0];
}

/* ─── Helpers ────────────────────────────────────────────── */
function resolveTeacherName(t: TeacherName): string {
  if (t.display_name) return t.display_name;
  const parts = [t.first_name, t.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "—";
}
function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === undefined || bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return iso; }
}
function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  } catch { return iso; }
}

/* ─── Fading Brand Border Card ───────────────────────────────
   Mirrors BrandCard on /crm/families/[id].
   3px left gradient stripe: BRAND → transparent at 50%.
*/
function BrandCard({
  children,
  style,
  className,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        background: T.surface,
        borderRadius: 12,
        border: `1px solid ${T.border}`,
        borderLeft: "none",
        boxShadow: T.shadow,
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: `linear-gradient(to bottom, ${BRAND} 0%, ${BRAND}00 50%)`,
          borderRadius: "12px 0 0 12px",
          pointerEvents: "none",
        }}
      />
      {children}
    </div>
  );
}

/* ─── Card header row ────────────────────────────────────── */
function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4"
      style={{ borderBottom: `1px solid ${T.border}` }}
    >
      <h2 className="text-sm font-semibold" style={{ color: T.fg }}>{title}</h2>
      {action}
    </div>
  );
}

/* ─── Brand input ────────────────────────────────────────── */
function BrandInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%", padding: "6px 10px", borderRadius: 8,
        border: `1px solid ${focused ? BRAND : T.border}`,
        boxShadow: focused ? `0 0 0 3px ${BRAND}22` : "none",
        background: T.bg, color: T.fg, fontSize: 14, outline: "none",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
    />
  );
}

/* ─── Brand textarea ─────────────────────────────────────── */
function BrandTextarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%", padding: "6px 10px", borderRadius: 8,
        border: `1px solid ${focused ? BRAND : T.border}`,
        boxShadow: focused ? `0 0 0 3px ${BRAND}22` : "none",
        background: T.bg, color: T.fg, fontSize: 14, outline: "none", resize: "none",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
    />
  );
}

/* ─── Brand select ───────────────────────────────────────── */
function BrandSelect({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        padding: "6px 10px", borderRadius: 8,
        border: `1px solid ${focused ? BRAND : T.border}`,
        boxShadow: focused ? `0 0 0 3px ${BRAND}22` : "none",
        background: T.bg, color: T.fg, fontSize: 13, outline: "none", cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
    >
      {children}
    </select>
  );
}

/* ─── Tab nav ────────────────────────────────────────────── */
const TABS: { id: Tab; label: string }[] = [
  { id: "overview",  label: "Overview"  },
  { id: "files",     label: "Files"     },
  { id: "notes",     label: "Notes"     },
  { id: "timeline",  label: "Timeline"  },
];

function TabNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div style={{ borderBottom: `1px solid ${T.border}` }}>
      <nav className="-mb-px flex gap-0" aria-label="Student tabs">
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              role="tab"
              aria-selected={isActive}
              style={{
                padding: "12px 16px", fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? T.fg : T.muted,
                background: "transparent",
                border: "none",
                borderBottom: `2px solid ${isActive ? BRAND : "transparent"}`,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "color 0.15s, border-color 0.15s",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ─── Field row ──────────────────────────────────────────── */
function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.label }}>{label}</dt>
      <dd className="text-sm" style={{ color: T.fg }}>
        {value && value.trim() ? value : <span style={{ color: T.label }}>—</span>}
      </dd>
    </div>
  );
}

/* ─── Learning Profile card ──────────────────────────────── */
function LearningProfileCard({ student, onSaved }: { student: StudentOverview; onSaved: (updated: Partial<StudentOverview>) => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draftInstrument, setDraftInstrument] = useState(student.instrument ?? "");
  const [draftBio, setDraftBio] = useState(student.bio ?? "");
  const [draftGoals, setDraftGoals] = useState(student.goals ?? "");
  const [draftStyle, setDraftStyle] = useState(student.learning_style ?? "");

  function handleCancel() {
    setDraftInstrument(student.instrument ?? "");
    setDraftBio(student.bio ?? "");
    setDraftGoals(student.goals ?? "");
    setDraftStyle(student.learning_style ?? "");
    setEditing(false);
    setSaveError(null);
    setSaveState("idle");
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/crm/students/${student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-tenant-id": DEFAULT_TENANT_ID },
        body: JSON.stringify({
          instrument:     draftInstrument.trim() || null,
          bio:            draftBio.trim() || null,
          goals:          draftGoals.trim() || null,
          learning_style: draftStyle.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? `Save failed (${res.status})`);
      }
      const j = await res.json();
      onSaved({
        instrument:     j.data?.instrument     ?? (draftInstrument.trim() || null),
        bio:            j.data?.bio            ?? (draftBio.trim() || null),
        goals:          j.data?.goals          ?? (draftGoals.trim() || null),
        learning_style: j.data?.learning_style ?? (draftStyle.trim() || null),
      });
      setSaveState("saved");
      setEditing(false);
      setTimeout(() => setSaveState("idle"), 2500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
      setSaveState("error");
    } finally {
      setSaving(false);
    }
  }

  const action = editing ? (
    <div className="flex items-center gap-2">
      {saving && <span className="text-xs" style={{ color: T.muted }}>Saving…</span>}
      {saveState === "error" && !saving && (
        <span className="text-xs" style={{ color: "#b91c1c" }} title={saveError ?? undefined}>Error</span>
      )}
      <button onClick={handleCancel} disabled={saving}
        className="rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-70 disabled:opacity-50"
        style={{ background: T.surface2, color: T.muted, border: `1px solid ${T.border}` }}>
        Cancel
      </button>
      <button onClick={handleSave} disabled={saving}
        className="rounded-lg px-3 py-1.5 text-xs font-semibold hover:opacity-80 transition-opacity disabled:opacity-50"
        style={{ background: T.fg, color: T.bg }}>
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      {saveState === "saved" && <span className="text-xs" style={{ color: "#059669" }}>✓ Saved</span>}
      <button onClick={() => setEditing(true)}
        className="rounded-lg px-3 py-1.5 text-xs font-medium hover:opacity-80 transition-opacity"
        style={{ background: T.surface2, color: T.fg, border: `1px solid ${T.border}` }}>
        Edit
      </button>
    </div>
  );

  return (
    <BrandCard>
      <CardHeader title="Learning Profile" action={action} />
      <div className="px-5 py-4">
        {saveError && <p className="mb-3 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-500">{saveError}</p>}
        {editing ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.label }}>Instrument</label>
              <BrandInput value={draftInstrument} onChange={setDraftInstrument} placeholder="e.g. Guitar, Drums, Piano" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.label }}>Bio</label>
              <BrandTextarea value={draftBio} onChange={setDraftBio} placeholder="Brief background about the student..." rows={3} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.label }}>Goals</label>
              <BrandTextarea value={draftGoals} onChange={setDraftGoals} placeholder="What does the student want to achieve?" rows={3} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.label }}>Learning Style</label>
              <BrandInput value={draftStyle} onChange={setDraftStyle} placeholder="e.g. Visual, Auditory, Hands-on" />
            </div>
          </div>
        ) : (
          <dl className="flex flex-col gap-4">
            <Field label="Instrument"     value={student.instrument} />
            <Field label="Bio"            value={student.bio} />
            <Field label="Goals"          value={student.goals} />
            <Field label="Learning Style" value={student.learning_style} />
          </dl>
        )}
      </div>
    </BrandCard>
  );
}

/* ─── Enrollment Details card ────────────────────────────── */
function EnrollmentDetailsCard({
  student,
  teacherName,
  teacherLoading,
}: {
  student: StudentOverview;
  teacherName: string | null;
  teacherLoading: boolean;
}) {
  return (
    <BrandCard>
      <CardHeader title="Enrollment Details" />
      <div className="px-5 py-4">
        <dl className="flex flex-col gap-4">
          <Field label="Teacher"       value={teacherLoading ? "Loading…" : teacherName ?? "—"} />
          <Field label="Lesson Day"    value={student.lesson_day_of_week} />
          <Field label="Blocks / Week" value={student.blocks_per_week !== null && student.blocks_per_week !== undefined ? String(student.blocks_per_week) : null} />
          <Field label="Experience"    value={student.experience_level} />
          <Field label="Status"        value={student.status} />
        </dl>
      </div>
    </BrandCard>
  );
}

/* ─── Overview tab ───────────────────────────────────────── */
function OverviewTab({ studentId }: { studentId: string }) {
  const [student, setStudent] = useState<StudentOverview | null>(null);
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/crm/students/${studentId}`, {
          headers: { "x-tenant-id": DEFAULT_TENANT_ID },
        });
        if (!res.ok) throw new Error(`Failed to load student (${res.status})`);
        const json = await res.json();
        const s: StudentOverview = json.data;
        setStudent(s);
        if (s.teacher_id) {
          setTeacherLoading(true);
          try {
            const tRes = await fetch(`/api/crm/teachers/${s.teacher_id}`, {
              headers: { "x-tenant-id": DEFAULT_TENANT_ID },
            });
            if (tRes.ok) {
              const tJson = await tRes.json();
              const t: TeacherName = tJson.data ?? tJson;
              setTeacherName(resolveTeacherName(t));
            }
          } catch { /* non-blocking */ } finally {
            setTeacherLoading(false);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load student data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [studentId]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 animate-pulse">
        {[0, 1].map((i) => (
          <div key={i} className="h-52 rounded-xl" style={{ background: T.surface }} />
        ))}
      </div>
    );
  }
  if (error || !student) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {error ?? "Could not load student data."}
      </div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <LearningProfileCard student={student} onSaved={(updated) => setStudent((prev) => prev ? { ...prev, ...updated } : prev)} />
      <EnrollmentDetailsCard student={student} teacherName={teacherName} teacherLoading={teacherLoading} />
    </div>
  );
}

/* ─── Upload Zone ────────────────────────────────────────── */
function UploadZone({ studentId, onUploaded }: { studentId: string; onUploaded: (file: StudentFile) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/crm/students/${studentId}/files`, {
        method: "POST",
        headers: { "x-tenant-id": DEFAULT_TENANT_ID },
        body: form,
      });
      const json = await res.json();
      if (!res.ok) { showToast("error", json?.error ?? "Upload failed"); return; }
      showToast("success", `"${file.name}" uploaded`);
      onUploaded(json.data as StudentFile);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    uploadFile(files[0]);
  }

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback(() => setIsDragging(false), []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${isDragging ? BRAND : T.border}`,
        borderRadius: 12,
        background: isDragging ? T.surface2 : "transparent",
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        transition: "border-color 0.15s, background 0.15s",
        cursor: uploading ? "not-allowed" : "pointer",
      }}
      onClick={() => !uploading && inputRef.current?.click()}
    >
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 500,
          background: toast.type === "success" ? "rgba(5,150,105,0.12)" : "rgba(185,28,28,0.12)",
          color: toast.type === "success" ? "#059669" : "#b91c1c",
          border: `1px solid ${toast.type === "success" ? "rgba(5,150,105,0.3)" : "rgba(185,28,28,0.3)"}`,
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        }}>
          {toast.message}
        </div>
      )}
      <svg className="h-8 w-8" style={{ color: T.muted }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
      <p className="text-sm font-medium" style={{ color: T.muted }}>
        {uploading ? "Uploading…" : isDragging ? "Drop to upload" : "Drag & drop a file here"}
      </p>
      <button
        type="button"
        disabled={uploading}
        onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
        className="rounded-lg px-4 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: T.surface2, color: T.fg, border: `1px solid ${T.border}` }}
      >
        Select File
      </button>
      <p className="text-xs" style={{ color: T.label }}>PDF, images, audio, or any document</p>
      <input ref={inputRef} type="file" className="sr-only" onChange={(e) => handleFiles(e.target.files)} disabled={uploading} />
    </div>
  );
}

/* ─── File row ───────────────────────────────────────────── */
function FileRow({ file, studentId, onDeleted }: { file: StudentFile; studentId: string; onDeleted: (id: string) => void }) {
  function getFileIcon(name: string) {
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    if (["pdf"].includes(ext)) return "📄";
    if (["jpg","jpeg","png","gif","webp","svg"].includes(ext)) return "🖼️";
    if (["mp3","wav","m4a","ogg"].includes(ext)) return "🎵";
    if (["mp4","mov","avi","webm"].includes(ext)) return "🎬";
    if (["doc","docx"].includes(ext)) return "📝";
    if (["xls","xlsx","csv"].includes(ext)) return "📊";
    return "📎";
  }
  async function handleDelete() {
    if (!window.confirm(`Delete "${file.file_name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/crm/students/${studentId}/files?fileId=${file.id}`, {
      method: "DELETE",
      headers: { "x-tenant-id": DEFAULT_TENANT_ID },
    });
    if (res.ok) onDeleted(file.id);
    else alert("Delete failed. Please try again.");
  }
  return (
    <li
      className="flex items-center gap-3 px-4 py-3 transition-colors"
      style={{ borderBottom: `1px solid ${T.border}` }}
      onMouseEnter={e => (e.currentTarget.style.background = T.surface2)}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <span className="text-xl leading-none shrink-0" aria-hidden>{getFileIcon(file.file_name)}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" style={{ color: T.fg }}>{file.file_name}</p>
        <p className="text-xs" style={{ color: T.muted }}>
          {formatFileSize(file.file_size)} · {formatDate(file.created_at)}
          {file.uploaded_by_role && <> · <span className="capitalize">{file.uploaded_by_role}</span></>}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {file.file_url ? (
          <a href={file.file_url} target="_blank" rel="noopener noreferrer"
            className="rounded-lg px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-80"
            style={{ background: T.surface2, color: T.fg, border: `1px solid ${T.border}` }}>
            View
          </a>
        ) : (
          <span className="rounded-lg px-2.5 py-1 text-xs font-medium opacity-40" style={{ color: T.muted, border: `1px solid ${T.border}` }}>Unavailable</span>
        )}
        <button onClick={handleDelete}
          className="rounded-lg px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-80"
          style={{ background: "rgba(185,28,28,0.08)", color: "#b91c1c", border: "1px solid rgba(185,28,28,0.2)" }}
          title="Delete file">🗑</button>
      </div>
    </li>
  );
}

/* ─── Files tab ──────────────────────────────────────────── */
function FilesTab({ studentId }: { studentId: string }) {
  const [files, setFiles] = useState<StudentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/crm/students/${studentId}/files`, {
          headers: { "x-tenant-id": DEFAULT_TENANT_ID },
        });
        if (!res.ok) throw new Error(`Failed to load files (${res.status})`);
        const json = await res.json();
        setFiles(json.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load files");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [studentId]);

  return (
    <div className="flex flex-col gap-5">
      <UploadZone studentId={studentId} onUploaded={(file) => setFiles((prev) => [file, ...prev])} />
      <BrandCard>
        <CardHeader
          title="Uploaded Files"
          action={
            !loading && files.length > 0 ? (
              <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: T.surface2, color: T.muted }}>
                {files.length}
              </span>
            ) : undefined
          }
        />
        {loading ? (
          <div className="flex flex-col gap-2 animate-pulse px-5 py-4">
            {[0,1,2].map((i) => <div key={i} className="h-10 rounded-lg" style={{ background: T.surface2 }} />)}
          </div>
        ) : error ? (
          <div className="px-5 py-4 text-sm text-red-400">{error}</div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <svg className="h-10 w-10" style={{ color: T.border }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
            <p className="text-sm font-medium" style={{ color: T.muted }}>No files uploaded for this student yet</p>
            <p className="text-xs" style={{ color: T.label }}>Use the upload zone above to add files</p>
          </div>
        ) : (
          <ul className="flex flex-col">
            {files.map((file) => (
              <FileRow key={file.id} file={file} studentId={studentId} onDeleted={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))} />
            ))}
          </ul>
        )}
      </BrandCard>
    </div>
  );
}

/* ─── Note type badge ────────────────────────────────────── */
function NoteTypeBadge({ type }: { type: NoteType }) {
  const cfg = getNoteTypeConfig(type);
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

/* ─── Notes tab ──────────────────────────────────────────── */
function NotesTab({ studentId }: { studentId: string }) {
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [noteType, setNoteType] = useState<NoteType>("internal_studio");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/crm/students/${studentId}/notes`, {
          headers: { "x-tenant-id": DEFAULT_TENANT_ID },
        });
        if (!res.ok) throw new Error(`Failed to load notes (${res.status})`);
        const json = await res.json();
        setNotes(json.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load notes");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [studentId]);

  async function handleSubmit() {
    if (!draft.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/crm/students/${studentId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": DEFAULT_TENANT_ID },
        body: JSON.stringify({ body: draft.trim(), note_type: noteType }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to save note");
      setNotes((prev) => [json.data, ...prev]);
      setDraft("");
      setNoteType("internal_studio");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save note");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!window.confirm("Delete this note? This cannot be undone.")) return;
    const res = await fetch(`/api/crm/students/${studentId}/notes?noteId=${noteId}`, {
      method: "DELETE",
      headers: { "x-tenant-id": DEFAULT_TENANT_ID },
    });
    if (res.ok) setNotes((prev) => prev.filter((n) => n.id !== noteId));
    else alert("Delete failed. Please try again.");
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Compose */}
      <BrandCard>
        <CardHeader title="Add Note" />
        <div className="px-5 py-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider shrink-0" style={{ color: T.label }}>Type</label>
            <BrandSelect value={noteType} onChange={(v) => setNoteType(v as NoteType)}>
              {NOTE_TYPES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
            </BrandSelect>
          </div>
          <BrandTextarea value={draft} onChange={setDraft} placeholder="Write a note about this student..." rows={3} />
          {submitError && <p className="text-xs text-red-500">{submitError}</p>}
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting || !draft.trim()}
              className="rounded-lg px-4 py-2 text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: T.fg, color: T.bg }}
            >
              {submitting ? "Saving…" : "Save Note"}
            </button>
          </div>
        </div>
      </BrandCard>

      {/* Feed */}
      <BrandCard>
        <CardHeader
          title="Note History"
          action={
            !loading && notes.length > 0 ? (
              <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: T.surface2, color: T.muted }}>{notes.length}</span>
            ) : undefined
          }
        />
        {loading ? (
          <div className="flex flex-col gap-3 animate-pulse px-5 py-4">
            {[0,1,2].map((i) => <div key={i} className="h-14 rounded-lg" style={{ background: T.surface2 }} />)}
          </div>
        ) : error ? (
          <div className="px-5 py-4 text-sm text-red-400">{error}</div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <p className="text-sm font-medium" style={{ color: T.muted }}>No notes yet for this student</p>
          </div>
        ) : (
          <div>
            {notes.map((note) => (
              <div key={note.id} className="px-5 py-4 flex flex-col gap-1.5" style={{ borderBottom: `1px solid ${T.border}` }}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold" style={{ color: T.fg }}>{note.author_name ?? "Unknown"}</span>
                    {note.author_role && (
                      <span className="rounded-full px-2 py-0.5 text-xs font-medium capitalize" style={{ background: T.surface2, color: T.muted }}>
                        {note.author_role}
                      </span>
                    )}
                    <NoteTypeBadge type={note.note_type ?? "internal_studio"} />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs" style={{ color: T.muted }}>{formatDateTime(note.created_at)}</span>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="rounded-lg px-1.5 py-0.5 text-xs transition-opacity hover:opacity-80"
                      style={{ background: "rgba(185,28,28,0.08)", color: "#b91c1c", border: "1px solid rgba(185,28,28,0.2)" }}
                      title="Delete note"
                    >🗑</button>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap" style={{ color: T.fg }}>{note.body}</p>
              </div>
            ))}
          </div>
        )}
      </BrandCard>
    </div>
  );
}

/* ─── Timeline types ─────────────────────────────────────── */
type EventType = "attendance" | "upload" | "note" | "system_update";
type TimelineEvent = {
  id: string;
  event_type: EventType;
  description: string;
  source_id: string | null;
  created_at: string;
  created_by_name: string | null;
  created_by_role: string | null;
};

/* ─── Event type pill ─────────────────────────────────────── */
const EVENT_TYPE_META: Record<EventType, { label: string; bg: string; color: string; dot: string }> = {
  attendance:    { label: "Attendance",    bg: "rgba(16,185,129,0.10)",  color: "#059669", dot: "#059669" },
  note:          { label: "Note",          bg: "rgba(37,99,235,0.10)",   color: "#2563eb", dot: "#2563eb" },
  upload:        { label: "Upload",        bg: "rgba(245,158,11,0.10)",  color: "#d97706", dot: "#d97706" },
  system_update: { label: "System Update", bg: "rgba(107,114,128,0.10)", color: "#6b7280", dot: "#6b7280" },
};
function EventTypePill({ type }: { type: EventType }) {
  const m = EVENT_TYPE_META[type] ?? EVENT_TYPE_META.system_update;
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ background: m.bg, color: m.color }}>
      {m.label}
    </span>
  );
}

/* ─── Timeline event row ──────────────────────────────────── */
function TimelineEventRow({ event, isLast }: { event: TimelineEvent; isLast: boolean }) {
  const m = EVENT_TYPE_META[event.event_type] ?? EVENT_TYPE_META.system_update;
  const ts = new Date(event.created_at);
  const dateStr = ts.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timeStr = ts.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return (
    <li className="relative flex gap-3 py-2.5" style={{ borderBottom: isLast ? "none" : `1px solid ${T.border}` }}>
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
        <div className="h-2 w-2 rounded-full" style={{ background: m.dot }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <EventTypePill type={event.event_type} />
          <time className="text-xs" style={{ color: T.muted }}>{dateStr} · {timeStr}</time>
          {event.created_by_name && (
            <span className="text-xs" style={{ color: T.muted }}>
              {event.created_by_name}{event.created_by_role ? ` (${event.created_by_role})` : ""}
            </span>
          )}
        </div>
        <p className="text-sm" style={{ color: T.fg }}>{event.description}</p>
      </div>
    </li>
  );
}

/* ─── Timeline empty state ────────────────────────────────── */
function TimelineEmptyState({ filtered }: { filtered?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <svg className="h-10 w-10" style={{ color: T.border }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p className="text-sm font-medium" style={{ color: T.muted }}>
        {filtered ? "No events match this filter" : "No events recorded yet"}
      </p>
    </div>
  );
}

/* ─── Filter chips ────────────────────────────────────────── */
const FILTER_OPTIONS: { id: EventType | "all"; label: string }[] = [
  { id: "all",           label: "All Events"  },
  { id: "attendance",    label: "Attendance"  },
  { id: "note",          label: "Notes"       },
  { id: "upload",        label: "Uploads"     },
  { id: "system_update", label: "System"      },
];
function FilterChips({ active, onChange }: { active: EventType | "all"; onChange: (v: EventType | "all") => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {FILTER_OPTIONS.map((opt) => {
        const isActive = opt.id === active;
        return (
          <button key={opt.id} onClick={() => onChange(opt.id)}
            className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
            style={{
              background: isActive ? "rgba(0,209,108,0.12)" : T.surface2,
              color: isActive ? "#00D16C" : T.muted,
              border: `1px solid ${isActive ? "#00D16C" : T.border}`,
            }}>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function TimelineTab({ studentId }: { studentId: string }) {
  const [allEvents, setAllEvents] = useState<TimelineEvent[]>([]);
  const [filter, setFilter] = useState<EventType | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/crm/students/${studentId}/timeline?limit=200`, {
          headers: { "x-tenant-id": DEFAULT_TENANT_ID },
        });
        if (!res.ok) throw new Error(`Failed to load timeline (${res.status})`);
        const json = await res.json();
        setAllEvents(json.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load timeline");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [studentId]);

  const filtered = filter === "all" ? allEvents : allEvents.filter((e) => e.event_type === filter);

  if (loading) {
    return (
      <div className="flex flex-col gap-3 animate-pulse">
        <div className="flex gap-1.5">
          {[0,1,2,3,4].map(i => <div key={i} className="h-7 w-20 rounded-full" style={{ background: T.surface2 }} />)}
        </div>
        {[0,1,2,3].map((i) => (
          <div key={i} className="flex gap-3 py-2.5" style={{ borderBottom: `1px solid ${T.border}` }}>
            <div className="mt-0.5 h-5 w-5 shrink-0 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full" style={{ background: T.surface2 }} />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 rounded" style={{ background: T.surface2 }} />
              <div className="h-3 w-full rounded" style={{ background: T.surface2 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(185,28,28,0.08)", color: "#b91c1c", border: "1px solid rgba(185,28,28,0.2)" }}>{error}</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <FilterChips active={filter} onChange={setFilter} />
      <p className="text-xs" style={{ color: T.muted }}>
        {filtered.length} event{filtered.length !== 1 ? "s" : ""}
        {filter !== "all" ? ` · filtered by ${FILTER_OPTIONS.find(o => o.id === filter)?.label}` : ""}
      </p>
      {filtered.length === 0 ? (
        <TimelineEmptyState filtered={filter !== "all"} />
      ) : (
        <ul className="flex flex-col" role="list" style={{ borderTop: `1px solid ${T.border}` }}>
          {filtered.map((event, i) => (
            <TimelineEventRow key={event.id} event={event} isLast={i === filtered.length - 1} />
          ))}
        </ul>
      )}
    </div>
  );
}

/* ─── Main export ────────────────────────────────────────── */
export function StudentOverviewContent() {
  const params = useParams<{ id: string }>();
  const studentId = params?.id ?? "";
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  return (
    <div className="flex flex-col gap-0">
      <TabNav active={activeTab} onChange={setActiveTab} />
      <div className="pt-5">
        {activeTab === "overview"  && <OverviewTab  studentId={studentId} />}
        {activeTab === "files"     && <FilesTab     studentId={studentId} />}
        {activeTab === "notes"     && <NotesTab     studentId={studentId} />}
        {activeTab === "timeline"  && <TimelineTab  studentId={studentId} />}
      </div>
    </div>
  );
}
