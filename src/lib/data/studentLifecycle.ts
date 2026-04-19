import type { DbClient, FacadeResult, ListResult, PageParams } from "./core";
import { decodeCursor, encodeCursor, offsetRange, toErrorInfo } from "./core";
import type {
  StudentLifecycleEntry,
  StudentLifecycleInsert,
  StudentLifecycleUpdate,
} from "./models/student_lifecycle";

export interface ListStudentLifecycleParams {
  tenantId: string;
  studentId: string;
  page: PageParams;
}

type LifecycleCursorPayload = { occurred_at: string; id: string };

export async function listStudentLifecycle(
  client: DbClient,
  params: ListStudentLifecycleParams
): Promise<FacadeResult<ListResult<StudentLifecycleEntry>>> {
  try {
    const base = client
      .from("student_lifecycle")
      .select("*")
      .eq("tenant_id", params.tenantId)
      .eq("student_id", params.studentId);

    if (params.page.mode === "offset") {
      const { page, pageSize, from, to } = offsetRange(
        params.page.page,
        params.page.pageSize
      );
      const { data, error } = await base
        .order("occurred_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to);
      if (error) return { data: null, error: toErrorInfo(error) };
      return {
        data: {
          items: ((data ?? []) as unknown[]).map(
            (r) => r as StudentLifecycleEntry
          ),
          pageInfo: { mode: "offset", page, pageSize, range: { from, to } },
        },
        error: null,
      };
    }

    const limit =
      Number.isFinite(params.page.limit) && params.page.limit > 0
        ? Math.floor(params.page.limit)
        : 100;
    const cursor = params.page.cursor?.trim();
    const decoded = cursor ? decodeCursor<LifecycleCursorPayload>(cursor) : null;

    let q = base
      .order("occurred_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit);

    if (decoded?.occurred_at && decoded?.id) {
      q = q.or(
        [
          `occurred_at.lt.${decoded.occurred_at}`,
          `and(occurred_at.eq.${decoded.occurred_at},id.lt.${decoded.id})`,
        ].join(",")
      );
    }

    const { data, error } = await q;
    if (error) return { data: null, error: toErrorInfo(error) };

    const items = ((data ?? []) as unknown[]).map(
      (r) => r as StudentLifecycleEntry
    );
    const last = items.at(-1);
    const nextCursor =
      last?.occurred_at && last?.id
        ? encodeCursor({ occurred_at: last.occurred_at, id: last.id })
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

export async function createStudentLifecycleEntry(
  client: DbClient,
  input: StudentLifecycleInsert
): Promise<FacadeResult<StudentLifecycleEntry>> {
  try {
    const { data, error } = await client
      .from("student_lifecycle")
      .insert(input)
      .select("*")
      .single();
    if (error) return { data: null, error: toErrorInfo(error) };
    return { data: data as StudentLifecycleEntry, error: null };
  } catch (err) {
    return { data: null, error: toErrorInfo(err) };
  }
}

export async function updateStudentLifecycleEntry(
  client: DbClient,
  tenantId: string,
  id: string,
  patch: StudentLifecycleUpdate
): Promise<FacadeResult<StudentLifecycleEntry>> {
  try {
    const { data, error } = await client
      .from("student_lifecycle")
      .update(patch)
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) return { data: null, error: toErrorInfo(error) };
    return { data: data as StudentLifecycleEntry, error: null };
  } catch (err) {
    return { data: null, error: toErrorInfo(err) };
  }
}

