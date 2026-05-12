"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

/* ─── Types ──────────────────────────────────────────────── */
type StudentData = {
  id: string;
  first_name: string;
  last_name: string;
  instrument: string | null;
  status: string | null;
  family_id: string | null;
  bio: string | null; // used as preferred name if set
};

type FamilyData = {
  id: string;
  name: string;
};

/* ─── Status badge ───────────────────────────────────────── */
function StatusBadge({ status }: { status: string | null }) {
  const s = (status ?? "").toLowerCase();

  let classes = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase";

  if (s === "active") {
    classes += " bg-emerald-500/15 text-emerald-400 dark:bg-emerald-500/20 dark:text-emerald-300";
  } else if (s === "paused") {
    classes += " bg-blue-400/15 text-blue-400 dark:bg-blue-400/20 dark:text-blue-300";
  } else if (s === "withdrawn" || s === "inactive") {
    classes += " bg-zinc-500/15 text-zinc-400 dark:bg-zinc-500/20 dark:text-zinc-400";
  } else {
    classes += " bg-zinc-500/10 text-zinc-500 dark:text-zinc-400";
  }

  return <span className={classes}>{status ?? "Unknown"}</span>;
}

/* ─── Skeleton ───────────────────────────────────────────── */
function HeaderSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-5 h-16 w-full max-w-xl rounded-xl bg-zinc-200 dark:bg-zinc-700" />
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2 mb-5">
        <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-3 w-2 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-3 w-28 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-3 w-2 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
      </div>
      {/* Header skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-8 w-56 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
        <div className="h-6 w-20 rounded-full bg-zinc-200 dark:bg-zinc-700" />
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────── */
export function StudentOverviewHeader() {
  const params = useParams<{ id: string }>();
  const studentId = params?.id ?? "";

  const [student, setStudent] = useState<StudentData | null>(null);
  const [family, setFamily] = useState<FamilyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;

    async function load() {
      setLoading(true);
      setError(null);
      setFamily(null);
      try {
        // Fetch student
        const studentRes = await fetch(
          `/api/crm/students/${studentId}`,
          { headers: { "x-tenant-id": DEFAULT_TENANT_ID } }
        );
        if (!studentRes.ok) throw new Error(`Student not found (${studentRes.status})`);
        const studentJson = await studentRes.json();
        const raw = studentJson?.data ?? studentJson;
        const s = raw as StudentData;
        setStudent(s);

        // Fetch family if linked
        if (s.family_id) {
          const familyRes = await fetch(
            `/api/crm/families/${s.family_id}`,
            { headers: { "x-tenant-id": DEFAULT_TENANT_ID } }
          );
          if (familyRes.ok) {
            const familyJson = await familyRes.json();
            const f = familyJson?.data ?? familyJson;
            setFamily(f as FamilyData);
          } else {
            setFamily(null);
          }
        } else {
          setFamily(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load student");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [studentId]);

  if (loading) return <HeaderSkeleton />;

  if (error || !student) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {error ?? "Student not found."}
      </div>
    );
  }

  const fullName = `${student.first_name} ${student.last_name}`.trim();
  // preferred name: use bio only if it's short (≤ 30 chars) and looks like a name
  // When a real preferred_name column is added to the schema, swap this out.
  const preferredName: string | null = null; // placeholder — no preferred_name column yet

  return (
    <div>
      {/* ── Family card (student is attached to this account) ── */}
      {family ? (
        <div
          className="mb-5 rounded-xl border border-zinc-200/90 bg-gradient-to-br from-zinc-50 to-white px-4 py-3.5 shadow-sm dark:border-zinc-700/90 dark:from-zinc-900/80 dark:to-zinc-950/80 dark:shadow-none"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
            Family account
          </p>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
            <p className="text-lg font-semibold leading-snug tracking-tight text-zinc-900 dark:text-zinc-50">
              {family.name}
            </p>
            <Link
              href={`/crm/families/${family.id}`}
              className="shrink-0 text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              View family →
            </Link>
          </div>
        </div>
      ) : student.family_id ? (
        <div
          className="mb-5 rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3.5 dark:border-amber-900/50 dark:bg-amber-950/25"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-800/80 dark:text-amber-200/80">
            Family account
          </p>
          <p className="mt-1 text-sm text-amber-950/90 dark:text-amber-100/90">
            This student is linked to a family, but the family record could not be loaded.
          </p>
        </div>
      ) : (
        <div
          className="mb-5 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 px-4 py-3.5 dark:border-zinc-600 dark:bg-zinc-900/30"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
            Family account
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            This student is not linked to a family in CRM yet.
          </p>
        </div>
      )}

      {/* ── Breadcrumbs ─────────────────────────────────────── */}
      <nav
        aria-label="Breadcrumb"
        className="mb-5 flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400"
      >
        <Link
          href="/crm/families"
          className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          Families
        </Link>

        <span aria-hidden className="select-none text-zinc-300 dark:text-zinc-600">
          /
        </span>

        {family ? (
          <Link
            href={`/crm/families/${family.id}`}
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            {family.name}
          </Link>
        ) : (
          <span className="text-zinc-400 dark:text-zinc-500">Family</span>
        )}

        <span aria-hidden className="select-none text-zinc-300 dark:text-zinc-600">
          /
        </span>

        <span className="font-medium text-zinc-900 dark:text-zinc-100" aria-current="page">
          {fullName}
        </span>
      </nav>

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: name + preferred name + instrument */}
        <div className="flex flex-col gap-1">
          {/* Student full name */}
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            {fullName}
          </h1>

          {/* Preferred name — only shown if it exists */}
          {preferredName && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Goes by{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                &ldquo;{preferredName}&rdquo;
              </span>
            </p>
          )}

          {/* Instrument */}
          {student.instrument && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {student.instrument}
            </p>
          )}
        </div>

        {/* Right: status badge */}
        <div className="shrink-0 pt-0.5">
          <StatusBadge status={student.status} />
        </div>
      </div>
    </div>
  );
}
