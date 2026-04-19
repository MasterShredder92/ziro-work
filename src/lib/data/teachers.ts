import type { DbClient, FacadeResult, ListResult, PageParams } from "./core";
import { decodeCursor, encodeCursor, offsetRange, toErrorInfo } from "./core";
import type { Teacher, TeacherInsert, TeacherUpdate } from "./models/teachers";

export interface ListTeachersParams {
  tenantId: string;
  page: PageParams;
  search?: string;
  includeArchived?: boolean;
  status?: "active" | "inactive";
  locationId?: string;
}

type TeacherCursorPayload = { created_at: string; id: string };

function escapeLikeTerm(term: string) {
  return term.replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function applyTeacherSearch<T extends { or: (filter: string) => T }>(q: T, term: string): T {
  const t = `%${escapeLikeTerm(term)}%`;
  return q.or(
    [
      `display_name.ilike.${t}`,
      `first_name.ilike.${t}`,
      `last_name.ilike.${t}`,
      `email.ilike.${t}`,
      `phone.ilike.${t}`,
    ].join(","),
  );
}

export async function listTeachers(
  client: DbClient,
  params: ListTeachersParams
): Promise<FacadeResult<ListResult<Teacher>>> {
  try {
    const applyBaseFilters = <T extends { eq: (column: string, value: unknown) => T; is: (column: string, value: unknown) => T; or: (filter: string) => T }>(query: T): T => {
      let filtered = query;
      if (params.includeArchived !== true) filtered = filtered.eq("is_active", true);
      if (params.status === "active") filtered = filtered.eq("is_active", true);
      if (params.status === "inactive") filtered = filtered.eq("is_active", false);
      if (params.search && params.search.trim().length > 0) {
        filtered = applyTeacherSearch(filtered, params.search.trim());
      }
      return filtered;
    };

    let q = client
      .from("teachers")
      .select("*")
      .eq("tenant_id", params.tenantId);

    q = applyBaseFilters(q);
    if (params.locationId) {
      const { data: teacherLinks, error: linksError } = await client
        .from("teacher_locations")
        .select("teacher_id")
        .eq("location_id", params.locationId);
      if (linksError) return { data: null, error: toErrorInfo(linksError) };
      const teacherIds = Array.from(
        new Set(
          (teacherLinks ?? [])
            .map((row) => row.teacher_id as string | null)
            .filter((id): id is string => !!id),
        ),
      );
      if (teacherIds.length === 0) {
        // Avoid a hard empty state when link rows are missing.
        q = applyBaseFilters(
          client.from("teachers").select("*").eq("tenant_id", params.tenantId),
        );
      } else {
        q = q.in("id", teacherIds);
      }
    }

    if (params.page.mode === "offset") {
      const { page, pageSize, from, to } = offsetRange(
        params.page.page,
        params.page.pageSize
      );
      const { data, error } = await q
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to);
      if (error) return { data: null, error: toErrorInfo(error) };
      return {
        data: {
          items: ((data ?? []) as unknown[]).map((r) => r as Teacher),
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
    const decoded = cursor ? decodeCursor<TeacherCursorPayload>(cursor) : null;

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
    if (error) return { data: null, error: toErrorInfo(error) };

    const items = ((data ?? []) as unknown[]).map((r) => r as Teacher);
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
    return { data: null, error: toErrorInfo(err) };
  }
}

export async function getTeacherById(
  client: DbClient,
  tenantId: string,
  id: string
): Promise<FacadeResult<Teacher | null>> {
  try {
    const { data, error } = await client
      .from("teachers")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .maybeSingle();
    if (error) return { data: null, error: toErrorInfo(error) };
    return { data: (data ?? null) as Teacher | null, error: null };
  } catch (err) {
    return { data: null, error: toErrorInfo(err) };
  }
}

export async function createTeacher(
  client: DbClient,
  input: TeacherInsert
): Promise<FacadeResult<Teacher>> {
  try {
    const { data, error } = await client
      .from("teachers")
      .insert(input)
      .select("*")
      .single();
    if (error) return { data: null, error: toErrorInfo(error) };
    return { data: data as Teacher, error: null };
  } catch (err) {
    return { data: null, error: toErrorInfo(err) };
  }
}

export async function updateTeacher(
  client: DbClient,
  tenantId: string,
  id: string,
  patch: TeacherUpdate
): Promise<FacadeResult<Teacher>> {
  try {
    const { data, error } = await client
      .from("teachers")
      .update(patch)
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) return { data: null, error: toErrorInfo(error) };
    return { data: data as Teacher, error: null };
  } catch (err) {
    return { data: null, error: toErrorInfo(err) };
  }
}

