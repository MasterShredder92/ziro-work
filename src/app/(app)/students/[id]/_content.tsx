"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

/* ─── Types ──────────────────────────────────────────────── */
type StudentOverview = {
  id: string;
  bio: string | null;
  goals: string | null;
  learning_style: string | null;
  teacher_id: string | null;
  lesson_day_of_week: string | null;
  blocks_per_week: number | null;
  rate_per_session: number | null;
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
  file_url: string;
  folder: string;
  created_at: string;
  uploaded_by: string | null;
  uploaded_by_role: string | null;
};

type Tab = "overview" | "files" | "timeline";

/* ─── Helpers ────────────────────────────────────────────── */
function resolveTeacherName(t: TeacherName): string {
  if (t.display_name) return t.display_name;
  const parts = [t.first_name, t.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "—";
}

function formatCurrency(val: number | null): string {
  if (val === null || val === undefined) return "—";
  return `$${Number(val).toFixed(2)}`;
}

function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === undefined || bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/* ─── Tab nav ────────────────────────────────────────────── */
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "files", label: "Files" },
  { id: "timeline", label: "Timeline" },
];

function TabNav({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800">
      <nav className="-mb-px flex gap-0" aria-label="Student tabs">
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={[
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                isActive
                  ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:border-zinc-600",
              ].join(" ")}
              aria-selected={isActive}
              role="tab"
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ─── Card wrapper ───────────────────────────────────────── */
function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </h2>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

/* ─── Edit button placeholder ────────────────────────────── */
function EditButton() {
  return (
    <button
      disabled
      className="rounded-md px-3 py-1.5 text-xs font-medium text-zinc-500 ring-1 ring-zinc-200 dark:text-zinc-400 dark:ring-zinc-700 transition-colors cursor-not-allowed opacity-60"
      title="Edit — coming soon"
    >
      Edit
    </button>
  );
}

/* ─── Field row ──────────────────────────────────────────── */
function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        {label}
      </dt>
      <dd className="text-sm text-zinc-700 dark:text-zinc-300">
        {value && value.trim() ? value : <span className="text-zinc-400 dark:text-zinc-600">—</span>}
      </dd>
    </div>
  );
}

/* ─── Learning Profile card ──────────────────────────────── */
function LearningProfileCard({ student }: { student: StudentOverview }) {
  return (
    <Card title="Learning Profile" action={<EditButton />}>
      <dl className="flex flex-col gap-4">
        <Field label="Bio" value={student.bio} />
        <Field label="Goals" value={student.goals} />
        <Field label="Learning Style" value={student.learning_style} />
      </dl>
    </Card>
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
    <Card title="Enrollment Details">
      <dl className="flex flex-col gap-4">
        <Field label="Teacher" value={teacherLoading ? "Loading…" : teacherName ?? "—"} />
        <Field label="Lesson Day" value={student.lesson_day_of_week} />
        <Field
          label="Blocks / Week"
          value={student.blocks_per_week !== null && student.blocks_per_week !== undefined ? String(student.blocks_per_week) : null}
        />
        <Field
          label="Rate / Session"
          value={student.rate_per_session !== null && student.rate_per_session !== undefined ? formatCurrency(student.rate_per_session) : null}
        />
      </dl>
    </Card>
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
          <div key={i} className="h-52 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
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
      <LearningProfileCard student={student} />
      <EnrollmentDetailsCard student={student} teacherName={teacherName} teacherLoading={teacherLoading} />
    </div>
  );
}

/* ─── Upload Zone ────────────────────────────────────────── */
function UploadZone({
  studentId,
  onUploaded,
}: {
  studentId: string;
  onUploaded: (file: StudentFile) => void;
}) {
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
      if (!res.ok) {
        showToast("error", json?.error ?? "Upload failed");
        console.log("[Files] Upload error:", json);
        return;
      }
      showToast("success", `"${file.name}" uploaded`);
      console.log("[Files] Uploaded:", json.data);
      onUploaded(json.data as StudentFile);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    // Upload first file only for now
    uploadFile(files[0]);
  }

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [studentId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div
          className={[
            "absolute -top-10 left-0 right-0 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-all",
            toast.type === "success"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
          ].join(" ")}
        >
          {toast.type === "success" ? "✓" : "✕"} {toast.message}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={[
          "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors select-none",
          isDragging
            ? "border-zinc-400 bg-zinc-50 dark:border-zinc-500 dark:bg-zinc-800/60"
            : "border-zinc-200 bg-zinc-50/50 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/40 dark:hover:border-zinc-600",
          uploading ? "opacity-60 cursor-not-allowed" : "",
        ].join(" ")}
      >
        {/* Folder icon */}
        <svg
          className="h-10 w-10 text-zinc-300 dark:text-zinc-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v4m0 0l-2-2m2 2l2-2" />
        </svg>

        <div className="text-center">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {uploading ? "Uploading…" : isDragging ? "Drop to upload" : "Drag & drop a file here"}
          </p>
          <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-600">
            or
          </p>
        </div>

        <button
          type="button"
          disabled={uploading}
          onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
          className="rounded-md bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm ring-1 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Select File
        </button>

        <p className="text-xs text-zinc-400 dark:text-zinc-600">
          PDF, images, audio, or any document
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={uploading}
      />
    </div>
  );
}

/* ─── File row ───────────────────────────────────────────── */
function FileRow({ file }: { file: StudentFile }) {
  function getFileIcon(name: string) {
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    if (["pdf"].includes(ext)) return "📄";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "🖼️";
    if (["mp3", "wav", "m4a", "ogg"].includes(ext)) return "🎵";
    if (["mp4", "mov", "avi", "webm"].includes(ext)) return "🎬";
    if (["doc", "docx"].includes(ext)) return "📝";
    if (["xls", "xlsx", "csv"].includes(ext)) return "📊";
    return "📎";
  }

  return (
    <li className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60">
      {/* Icon */}
      <span className="text-xl leading-none shrink-0" aria-hidden>
        {getFileIcon(file.file_name)}
      </span>

      {/* File info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {file.file_name}
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          {formatFileSize(file.file_size)}
          {" · "}
          {formatDate(file.created_at)}
          {file.folder && file.folder !== "general" && (
            <> · <span className="capitalize">{file.folder}</span></>
          )}
        </p>
      </div>

      {/* Action button */}
      <a
        href={file.file_url === "#stub" ? undefined : file.file_url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Download ${file.file_name}`}
        onClick={file.file_url === "#stub" ? (e) => e.preventDefault() : undefined}
        className={[
          "shrink-0 rounded-md p-1.5 transition-colors",
          file.file_url === "#stub"
            ? "cursor-not-allowed text-zinc-300 dark:text-zinc-700"
            : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:text-zinc-200 dark:hover:bg-zinc-700",
        ].join(" ")}
        title={file.file_url === "#stub" ? "Storage not yet wired" : "Download / View"}
      >
        {/* Download icon */}
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4" />
        </svg>
      </a>
    </li>
  );
}

/* ─── Empty state ────────────────────────────────────────── */
function FilesEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <svg
        className="h-12 w-12 text-zinc-200 dark:text-zinc-700"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
        />
      </svg>
      <p className="text-sm font-medium text-zinc-400 dark:text-zinc-600">
        No files uploaded for this student yet
      </p>
      <p className="text-xs text-zinc-300 dark:text-zinc-700">
        Use the upload zone above to add files
      </p>
    </div>
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

  function handleUploaded(file: StudentFile) {
    setFiles((prev) => [file, ...prev]);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Upload zone */}
      <UploadZone studentId={studentId} onUploaded={handleUploaded} />

      {/* File feed */}
      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Uploaded Files
            {!loading && files.length > 0 && (
              <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {files.length}
              </span>
            )}
          </h2>
        </div>

        <div className="px-2 py-2">
          {loading ? (
            <div className="flex flex-col gap-2 animate-pulse px-3 py-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
              ))}
            </div>
          ) : error ? (
            <div className="px-3 py-3 text-sm text-red-400">{error}</div>
          ) : files.length === 0 ? (
            <FilesEmptyState />
          ) : (
            <ul className="flex flex-col">
              {files.map((file) => (
                <FileRow key={file.id} file={file} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Session log types ─────────────────────────────────── */
type SessionLog = {
  id: string;
  block_date: string;
  status: string;
  notes: string | null;
  teacher_note: string | null;
  lesson_notes: string | null;
  engagement_level: number | null;
  progress_indicator: string | null;
  instrument: string | null;
  worked_on: string[] | null;
  created_at: string;
};

/* ─── Status badge for session log ──────────────────────── */
function SessionStatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  let cls = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ";
  if (s === "attended" || s === "completed") {
    cls += "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400";
  } else if (s === "canceled" || s === "cancelled") {
    cls += "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400";
  } else if (s === "no_show" || s === "no-show") {
    cls += "bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400";
  } else if (s === "rescheduled") {
    cls += "bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400";
  } else {
    cls += "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400";
  }
  return <span className={cls}>{status.replace(/_/g, " ")}</span>;
}

/* ─── Detail pill ────────────────────────────────────────── */
function Pill({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
      <span className="font-medium text-zinc-400 dark:text-zinc-500">{label}</span>
      {String(value)}
    </span>
  );
}

/* ─── Single timeline entry ──────────────────────────────── */
function TimelineEntry({ log, isLast }: { log: SessionLog; isLast: boolean }) {
  const hasNotes = log.notes || log.teacher_note || log.lesson_notes;
  const hasWorkedOn = log.worked_on && log.worked_on.length > 0;

  return (
    <li className="relative flex gap-4">
      {/* Vertical line */}
      {!isLast && (
        <div
          className="absolute left-[11px] top-6 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800"
          aria-hidden
        />
      )}

      {/* Dot */}
      <div className="relative z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <div className="h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-500" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        {/* Header row */}
        <div className="flex flex-wrap items-center gap-2">
          <time className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            {formatDate(log.block_date)}
          </time>
          <SessionStatusBadge status={log.status} />
          {log.instrument && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500">{log.instrument}</span>
          )}
        </div>

        {/* Notes */}
        {hasNotes && (
          <div className="mt-2 flex flex-col gap-1.5">
            {log.lesson_notes && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{log.lesson_notes}</p>
            )}
            {log.notes && !log.lesson_notes && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{log.notes}</p>
            )}
            {log.teacher_note && (
              <p className="text-xs italic text-zinc-400 dark:text-zinc-500">
                Teacher: {log.teacher_note}
              </p>
            )}
          </div>
        )}

        {/* Worked on */}
        {hasWorkedOn && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {log.worked_on!.map((item, i) => (
              <span
                key={i}
                className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              >
                {item}
              </span>
            ))}
          </div>
        )}

        {/* Detail pills */}
        {(log.engagement_level !== null || log.progress_indicator) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {log.engagement_level !== null && (
              <Pill label="Engagement" value={`${log.engagement_level}/5`} />
            )}
            {log.progress_indicator && (
              <Pill label="Progress" value={log.progress_indicator} />
            )}
          </div>
        )}
      </div>
    </li>
  );
}

/* ─── Timeline empty state ───────────────────────────────── */
function TimelineEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <svg
        className="h-12 w-12 text-zinc-200 dark:text-zinc-700"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <p className="text-sm font-medium text-zinc-400 dark:text-zinc-600">
        No session logs recorded for this student yet
      </p>
    </div>
  );
}

/* ─── Timeline tab ───────────────────────────────────────── */
function TimelineTab({ studentId }: { studentId: string }) {
  const [logs, setLogs] = useState<SessionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/crm/students/${studentId}/timeline`, {
          headers: { "x-tenant-id": DEFAULT_TENANT_ID },
        });
        if (!res.ok) throw new Error(`Failed to load timeline (${res.status})`);
        const json = await res.json();
        setLogs(json.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load timeline");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="h-6 w-6 shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-800" />
            <div className="flex-1 space-y-2 pb-6">
              <div className="h-4 w-32 rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-3 w-full rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-3 w-3/4 rounded bg-zinc-100 dark:bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {error}
      </div>
    );
  }

  if (logs.length === 0) return <TimelineEmptyState />;

  return (
    <ul className="flex flex-col" role="list">
      {logs.map((log, i) => (
        <TimelineEntry key={log.id} log={log} isLast={i === logs.length - 1} />
      ))}
    </ul>
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
        {activeTab === "overview" && <OverviewTab studentId={studentId} />}
        {activeTab === "files" && <FilesTab studentId={studentId} />}
        {activeTab === "timeline" && <TimelineTab studentId={studentId} />}
      </div>
    </div>
  );
}
