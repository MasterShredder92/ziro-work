import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "student_lesson_progress";

export type LessonCompletionStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "needs_review";

export type LessonCompletionRow = {
  id: string;
  tenant_id: string;
  student_id: string;
  lesson_id: string;
  unit_id: string | null;
  level_id: string | null;
  program_id: string | null;
  status: LessonCompletionStatus;
  score: number | null;
  notes: string | null;
  teacher_id: string | null;
  completed_at: string | null;
  updated_at: string;
  created_at: string;
};

export type StudentProgressFilter = {
  student_id?: string;
  lesson_id?: string;
  program_id?: string;
  status?: LessonCompletionStatus;
};

type GlobalStore = typeof globalThis & {
  __ziro_student_progress_store?: Map<string, LessonCompletionRow>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, LessonCompletionRow> {
  if (!g.__ziro_student_progress_store)
    g.__ziro_student_progress_store = new Map();
  return g.__ziro_student_progress_store;
}

export async function listStudentProgress(
  filter: StudentProgressFilter,
  tenantId?: string,
  opts?: ListOptions,
): Promise<LessonCompletionRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      let query = supabase.from(TABLE).select("*");
      if (tenantId) query = query.eq("tenant_id", tenantId);
      if (filter.student_id) query = query.eq("student_id", filter.student_id);
      if (filter.lesson_id) query = query.eq("lesson_id", filter.lesson_id);
      if (filter.program_id) query = query.eq("program_id", filter.program_id);
      if (filter.status) query = query.eq("status", filter.status);

      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "updated_at",
        ascending: opts?.ascending ?? false,
        limit: opts?.limit ?? 1000,
        offset: opts?.offset,
      });

      const { data, error } = await ordered;
      if (!error) return (data ?? []) as LessonCompletionRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  return Array.from(store().values())
    .filter((r) => (tenantId ? r.tenant_id === tenantId : true))
    .filter((r) => (filter.student_id ? r.student_id === filter.student_id : true))
    .filter((r) => (filter.lesson_id ? r.lesson_id === filter.lesson_id : true))
    .filter((r) => (filter.program_id ? r.program_id === filter.program_id : true))
    .filter((r) => (filter.status ? r.status === filter.status : true))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}
