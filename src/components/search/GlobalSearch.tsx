"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useStudents } from "@/hooks/data/useStudents";
import { useFamilies } from "@/hooks/data/useFamilies";
import { useTeachers } from "@/hooks/data/useTeachers";
import { useInvoices } from "@/hooks/data/useInvoices";
import { GlobalSearchInput } from "@/components/search/GlobalSearchInput";
import {
  GlobalSearchResults,
  type GlobalSearchResultRow,
} from "@/components/search/GlobalSearchResults";
import { bestFuzzyScore } from "@/lib/search/fuzzy";
import type { Student } from "@/lib/data/models/students";
import type { Family } from "@/lib/data/models/families";
import type { Teacher } from "@/lib/data/models/teachers";
import type { Invoice } from "@/lib/data/models/invoices";

const PAGE = { mode: "offset" as const, page: 1, pageSize: 80 };

export type GlobalSearchProps = {
  tenantId: string;
  onClose?: () => void;
};

function studentFields(s: Student) {
  return [
    s.name,
    s.email ?? "",
    s.phone ?? "",
    s.status,
    s.onboarding_stage ?? "",
    s.churn_risk ?? "",
  ];
}

function familyFields(f: Family) {
  return [f.name, f.primary_email ?? "", f.primary_phone ?? ""];
}

function teacherFields(t: Teacher) {
  return [t.name, t.email ?? "", t.phone ?? "", t.status];
}

function invoiceFields(inv: Invoice) {
  return [
    inv.description ?? "",
    inv.status,
    inv.external_ref ?? "",
    String(inv.amount_cents),
    inv.id,
  ];
}

function formatMoney(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(0)} ${currency}`;
  }
}

export function GlobalSearch({ tenantId, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const trimmed = query.trim();

  const studentParams = React.useMemo(
    () => ({
      tenantId,
      page: PAGE,
      search: trimmed.length ? trimmed : undefined,
    }),
    [tenantId, trimmed]
  );
  const familyParams = React.useMemo(
    () => ({
      tenantId,
      page: PAGE,
      search: trimmed.length ? trimmed : undefined,
    }),
    [tenantId, trimmed]
  );
  const teacherParams = React.useMemo(
    () => ({
      tenantId,
      page: PAGE,
      search: trimmed.length ? trimmed : undefined,
    }),
    [tenantId, trimmed]
  );
  const invoiceParams = React.useMemo(
    () => ({
      tenantId,
      page: PAGE,
      filters: undefined,
    }),
    [tenantId]
  );

  const fetchEnabled = trimmed.length > 0 && tenantId.length > 0;

  const students = useStudents(studentParams, { enabled: fetchEnabled });
  const families = useFamilies(familyParams, { enabled: fetchEnabled });
  const teachers = useTeachers(teacherParams, { enabled: fetchEnabled });
  const invoices = useInvoices(invoiceParams, { enabled: fetchEnabled });

  const loading =
    fetchEnabled &&
    (students.isLoading || families.isLoading || teachers.isLoading || invoices.isLoading);

  const results = React.useMemo(() => {
    if (!trimmed.length) return [];

    const q = trimmed;
    const out: GlobalSearchResultRow[] = [];

    const st = students.data?.items ?? [];
    for (const s of st) {
      if (bestFuzzyScore(q, studentFields(s)) < 0.28) continue;
      out.push({
        id: `student:${s.id}`,
        group: "students",
        title: s.name,
        description: [s.email, s.phone].filter(Boolean).join(" · ") || s.status,
        href: `/students/${s.id}`,
        badge: s.status,
        badgeVariant: s.status === "active" ? "success" : "neutral",
      });
    }

    const fa = families.data?.items ?? [];
    for (const f of fa) {
      if (bestFuzzyScore(q, familyFields(f)) < 0.28) continue;
      out.push({
        id: `family:${f.id}`,
        group: "families",
        title: f.name,
        description: [f.primary_email, f.primary_phone].filter(Boolean).join(" · ") || undefined,
        href: "/families",
        badge: "Family",
        badgeVariant: "neutral",
      });
    }

    const te = teachers.data?.items ?? [];
    for (const t of te) {
      if (bestFuzzyScore(q, teacherFields(t)) < 0.28) continue;
      out.push({
        id: `teacher:${t.id}`,
        group: "teachers",
        title: t.name,
        description: [t.email, t.phone].filter(Boolean).join(" · ") || t.status,
        href: `/teachers/${t.id}`,
        badge: t.status,
        badgeVariant: t.status === "active" ? "success" : "neutral",
      });
    }

    const inv = invoices.data?.items ?? [];
    for (const row of inv) {
      if (bestFuzzyScore(q, invoiceFields(row)) < 0.28) continue;
      out.push({
        id: `invoice:${row.id}`,
        group: "invoices",
        title: row.description?.trim() || `Invoice ${row.id.slice(0, 8)}`,
        description: `${formatMoney(row.amount_cents, row.currency)} · ${row.status}`,
        href: "/invoices",
        badge: row.status,
        badgeVariant:
          row.status === "overdue" ? "danger" : row.status === "paid" ? "success" : "warning",
      });
    }

    for (const s of st) {
      if (!s.onboarding_stage) continue;
      const stageScore = bestFuzzyScore(q, [
        s.name,
        s.onboarding_stage,
        "onboarding",
        "at risk",
        "lifecycle",
      ]);
      if (stageScore < 0.28) continue;
      out.push({
        id: `stage:${s.id}:${s.onboarding_stage}`,
        group: "stages",
        title: s.name,
        description: `Stage: ${s.onboarding_stage.replace(/_/g, " ")}`,
        href: `/students/${s.id}`,
        badge: s.onboarding_stage.replace(/_/g, " "),
        badgeVariant: s.onboarding_stage === "at_risk" ? "danger" : "success",
      });
    }

    return out;
  }, [trimmed, students.data, families.data, teachers.data, invoices.data]);

  const firstHref = results[0]?.href;

  const error =
    students.error?.message ||
    families.error?.message ||
    teachers.error?.message ||
    invoices.error?.message;

  return (
    <div>
      <GlobalSearchInput
        value={query}
        onChange={setQuery}
        autoFocus
        onSelect={() => {
          if (firstHref) {
            router.push(firstHref);
            onClose?.();
          }
        }}
      />
      {!trimmed.length ? (
        <p className="mt-[var(--z-space-4)] text-xs text-[var(--z-muted)]">
          Type a name, email, phone, status, or invoice detail. Results load as you type.
        </p>
      ) : loading ? (
        <p className="mt-[var(--z-space-4)] text-xs text-[var(--z-muted)]">Searching…</p>
      ) : error ? (
        <p className="mt-[var(--z-space-4)] text-xs text-[var(--z-danger)]">{error}</p>
      ) : results.length === 0 ? (
        <p className="mt-[var(--z-space-4)] text-xs text-[var(--z-muted)]">No matches yet.</p>
      ) : (
        <GlobalSearchResults results={results} />
      )}
    </div>
  );
}
