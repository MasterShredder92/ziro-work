import { randomUUID } from "crypto";
import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "progress_evidence";

export type ProgressEvidenceKind =
  | "note"
  | "image"
  | "video"
  | "audio"
  | "document"
  | "link";

export type ProgressEvidenceRow = {
  id: string;
  tenant_id: string;
  checkpoint_id: string;
  skill_id: string | null;
  goal_id: string | null;
  student_id: string;
  body: string | null;
  kind: ProgressEvidenceKind;
  file_url: string | null;
  file_name: string | null;
  file_mime: string | null;
  file_size_bytes: number | null;
  submitted_by: string | null;
  submitter_role: string | null;
  teacher_feedback: string | null;
  teacher_id: string | null;
  score: number | null;
  created_at: string;
  updated_at: string;
};

export type ProgressEvidenceFilter = {
  checkpoint_id?: string;
  skill_id?: string;
  goal_id?: string;
  student_id?: string;
  kind?: ProgressEvidenceKind;
};

type GlobalStore = typeof globalThis & {
  __ziro_progress_evidence_store?: Map<string, ProgressEvidenceRow>;
};

const g = globalThis as GlobalStore;

function store(): Map<string, ProgressEvidenceRow> {
  if (!g.__ziro_progress_evidence_store)
    g.__ziro_progress_evidence_store = new Map();
  return g.__ziro_progress_evidence_store;
}

export async function listEvidence(
  filter: ProgressEvidenceFilter,
  tenantId?: string,
  opts?: ListOptions,
): Promise<ProgressEvidenceRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      let query = supabase.from(TABLE).select("*");
      if (tenantId) query = query.eq("tenant_id", tenantId);
      if (filter.checkpoint_id)
        query = query.eq("checkpoint_id", filter.checkpoint_id);
      if (filter.skill_id) query = query.eq("skill_id", filter.skill_id);
      if (filter.goal_id) query = query.eq("goal_id", filter.goal_id);
      if (filter.student_id) query = query.eq("student_id", filter.student_id);
      if (filter.kind) query = query.eq("kind", filter.kind);

      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "created_at",
        ascending: opts?.ascending ?? false,
        limit: opts?.limit ?? 2000,
        offset: opts?.offset,
      });

      const { data, error } = await ordered;
      if (!error) return (data ?? []) as ProgressEvidenceRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  return Array.from(store().values())
    .filter((r) => (tenantId ? r.tenant_id === tenantId : true))
    .filter((r) =>
      filter.checkpoint_id ? r.checkpoint_id === filter.checkpoint_id : true,
    )
    .filter((r) => (filter.skill_id ? r.skill_id === filter.skill_id : true))
    .filter((r) => (filter.goal_id ? r.goal_id === filter.goal_id : true))
    .filter((r) => (filter.student_id ? r.student_id === filter.student_id : true))
    .filter((r) => (filter.kind ? r.kind === filter.kind : true))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export type UpsertEvidenceInput = Partial<ProgressEvidenceRow> & {
  tenant_id: string;
  checkpoint_id: string;
  student_id: string;
};

export async function upsertEvidence(
  input: UpsertEvidenceInput,
): Promise<ProgressEvidenceRow> {
  const now = new Date().toISOString();
  const row: ProgressEvidenceRow = {
    id: input.id ?? randomUUID(),
    tenant_id: input.tenant_id,
    checkpoint_id: input.checkpoint_id,
    skill_id: input.skill_id ?? null,
    goal_id: input.goal_id ?? null,
    student_id: input.student_id,
    body: input.body ?? null,
    kind: (input.kind as ProgressEvidenceKind) ?? "note",
    file_url: input.file_url ?? null,
    file_name: input.file_name ?? null,
    file_mime: input.file_mime ?? null,
    file_size_bytes: input.file_size_bytes ?? null,
    submitted_by: input.submitted_by ?? null,
    submitter_role: input.submitter_role ?? null,
    teacher_feedback: input.teacher_feedback ?? null,
    teacher_id: input.teacher_id ?? null,
    score: input.score ?? null,
    created_at: input.created_at ?? now,
    updated_at: now,
  };

  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(input.tenant_id);
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: "id" })
        .select("*")
        .single();
      if (!error && data) return data as ProgressEvidenceRow;
      if (error && isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else if (error) throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  store().set(row.id, row);
  return row;
}
