import type { DbClient, FacadeResult, ListResult, PageParams } from "./core";
import { decodeCursor, encodeCursor, offsetRange, toErrorInfo } from "./core";
import type { Student, StudentInsert, StudentUpdate } from "./models/students";

export interface ListStudentsParams {
  tenantId: string;
  page: PageParams;
  search?: string;
  includeArchived?: boolean;
  status?: "active" | "paused" | "inactive";
  familyId?: string;
  teacherId?: string;
  locationId?: string;
}

type StudentCursorPayload = { created_at: string; id: string };

function escapeLikeTerm(term: string) {
  return term.replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function applyStudentSearch<T extends { or: (filter: string) => T }>(q: T, term: string): T {
  const t = `%${escapeLikeTerm(term)}%`;
  return q.or([`first_name.ilike.${t}`, `last_name.ilike.${t}`, `email.ilike.${t}`, `phone.ilike.${t}`].join(","));
}

function isMissingStudentsTableError(err: unknown): boolean {
  const msg =
    err && typeof err === "object" && "message" in err
      ? String((err as { message: unknown }).message ?? "")
      : String(err ?? "");
  return (
    msg.includes("Could not find the table") ||
    msg.includes("table 'public.students'") ||
    msg.includes('relation "public.students" does not exist') ||
    msg.includes("public.students")
  );
}

function emptyOffsetList<T>(page: PageParams): ListResult<T> {
  if (page.mode === "offset") {
    const { page: p, pageSize, from, to } = offsetRange(page.page, page.pageSize);
    return {
      items: [],
      pageInfo: { mode: "offset", page: p, pageSize, range: { from, to } },
    };
  }
  const limit =
    Number.isFinite(page.limit) && page.limit > 0 ? Math.floor(page.limit) : 50;
  return {
    items: [],
    pageInfo: { mode: "cursor", cursor: page.cursor, limit, nextCursor: undefined },
  };
}

export async function listStudents(
  client: DbClient,
  params: ListStudentsParams
): Promise<FacadeResult<ListResult<Student>>> {
  try {
    let q = client
      .from("students")
      .select("*")
      .eq("tenant_id", params.tenantId);

    if (params.includeArchived !== true) q = q.is("deactivated_at", null);
    if (params.status) q = q.eq("status", params.status);
    if (params.familyId) q = q.eq("family_id", params.familyId);
    if (params.teacherId) q = q.eq("teacher_id", params.teacherId);
    if (params.locationId) {
      q = q.eq("location_id", params.locationId);
    }
    if (params.search && params.search.trim().length > 0)
      q = applyStudentSearch(q, params.search.trim());

    if (params.page.mode === "offset") {
      const { page, pageSize, from, to } = offsetRange(
        params.page.page,
        params.page.pageSize
      );
      const { data, error } = await q
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to);
      if (error) {
        if (isMissingStudentsTableError(error)) {
          console.error("Supabase students table missing or query failed:", error);
          return { data: emptyOffsetList<Student>(params.page), error: null };
        }
        return { data: null, error: toErrorInfo(error) };
      }
      return {
        data: {
          items: ((data ?? []) as unknown[]).map((r) => r as Student),
          pageInfo: { mode: "offset", page, pageSize, range: { from, to } },
        },
        error: null,
      };
    }

    const limit =
      Number.isFinite(params.page.limit) && params.page.limit > 0
        ? Math.floor(params.page.limit)
        : 50;
    const cursor = params.page.cursor?.trim();
    const decoded = cursor ? decodeCursor<StudentCursorPayload>(cursor) : null;

    let cq = q
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit);

    if (decoded?.created_at && decoded?.id) {
      cq = cq.or(
        [
          `created_at.lt.${decoded.created_at}`,
          `and(created_at.eq.${decoded.created_at},id.lt.${decoded.id})`,
        ].join(",")
      );
    }

    const { data, error } = await cq;
    if (error) {
      if (isMissingStudentsTableError(error)) {
        console.error("Supabase students table missing or query failed:", error);
        return { data: emptyOffsetList<Student>(params.page), error: null };
      }
      return { data: null, error: toErrorInfo(error) };
    }

    const items = ((data ?? []) as unknown[]).map((r) => r as Student);
    const last = items.at(-1);
    const nextCursor =
      last?.created_at && last?.id
        ? encodeCursor({ created_at: last.created_at, id: last.id })
        : undefined;

    return {
      data: {
        items,
        pageInfo: { mode: "cursor", cursor: cursor || undefined, limit, nextCursor },
      },
      error: null,
    };
  } catch (err) {
    if (isMissingStudentsTableError(err)) {
      console.error("Supabase students table missing or query failed:", err);
      return { data: emptyOffsetList<Student>(params.page), error: null };
    }
    return { data: null, error: toErrorInfo(err) };
  }
}

export async function getStudentById(
  client: DbClient,
  tenantId: string,
  id: string
): Promise<FacadeResult<Student | null>> {
  try {
    const { data, error } = await client
      .from("students")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .maybeSingle();
    if (error) {
      if (isMissingStudentsTableError(error)) {
        console.error("Supabase students table missing or query failed:", error);
        return { data: null, error: null };
      }
      return { data: null, error: toErrorInfo(error) };
    }
    return { data: (data ?? null) as Student | null, error: null };
  } catch (err) {
    if (isMissingStudentsTableError(err)) {
      console.error("Supabase students table missing or query failed:", err);
      return { data: null, error: null };
    }
    return { data: null, error: toErrorInfo(err) };
  }
}

export async function createStudent(
  client: DbClient,
  input: StudentInsert
): Promise<FacadeResult<Student>> {
  try {
    const { data, error } = await client
      .from("students")
      .insert(input)
      .select("*")
      .single();
    if (error) {
      if (isMissingStudentsTableError(error)) {
        console.error("Supabase students table missing or query failed:", error);
        return { data: null, error: toErrorInfo(error) };
      }
      return { data: null, error: toErrorInfo(error) };
    }
    return { data: data as Student, error: null };
  } catch (err) {
    if (isMissingStudentsTableError(err)) {
      console.error("Supabase students table missing or query failed:", err);
      return { data: null, error: toErrorInfo(err) };
    }
    return { data: null, error: toErrorInfo(err) };
  }
}

export async function updateStudent(
  client: DbClient,
  tenantId: string,
  id: string,
  patch: StudentUpdate
): Promise<FacadeResult<Student>> {
  try {
    const { data, error } = await client
      .from("students")
      .update(patch)
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      if (isMissingStudentsTableError(error)) {
        console.error("Supabase students table missing or query failed:", error);
        return { data: null, error: toErrorInfo(error) };
      }
      return { data: null, error: toErrorInfo(error) };
    }
    return { data: data as Student, error: null };
  } catch (err) {
    if (isMissingStudentsTableError(err)) {
      console.error("Supabase students table missing or query failed:", err);
      return { data: null, error: toErrorInfo(err) };
    }
    return { data: null, error: toErrorInfo(err) };
  }
}

export async function isStudentsTableAvailable(client: DbClient): Promise<boolean> {
  try {
    const { error } = await client
      .from("students")
      .select("id", { count: "exact", head: true })
      .limit(1);
    if (error) {
      if (isMissingStudentsTableError(error)) return false;
      return false;
    }
    return true;
  } catch (err) {
    if (isMissingStudentsTableError(err)) return false;
    return false;
  }
}

export async function deleteStudent(
  client: DbClient,
  tenantId: string,
  id: string
): Promise<FacadeResult<null>> {
  try {
    const { error } = await client
      .from("students")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", id);
    if (error) return { data: null, error: toErrorInfo(error) };
    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: toErrorInfo(err) };
  }
}

export async function deactivateStudent(
  client: DbClient,
  tenantId: string,
  id: string,
  deactivatedBy?: string,
  reason?: string,
  category?: string
): Promise<FacadeResult<Student>> {
  return updateStudent(client, tenantId, id, {
    status: "inactive",
  } as StudentUpdate);
}
