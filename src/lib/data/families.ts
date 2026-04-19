import type { DbClient, FacadeResult, ListResult, PageParams } from "./core";
import { decodeCursor, encodeCursor, offsetRange, toErrorInfo } from "./core";
import type { Family, FamilyInsert, FamilyUpdate } from "./models/families";

export interface ListFamiliesParams {
  tenantId: string;
  page: PageParams;
  search?: string;
  includeArchived?: boolean;
  locationId?: string;
}

type FamilyCursorPayload = { created_at: string; id: string };

function escapeLikeTerm(term: string) {
  return term.replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function applyFamilySearch<T extends { or: (filter: string) => T }>(q: T, term: string): T {
  const t = `%${escapeLikeTerm(term)}%`;
  // PostgREST OR filter
  return q.or(
    [
      `name.ilike.${t}`,
      `primary_email.ilike.${t}`,
      `primary_phone.ilike.${t}`,
    ].join(",")
  );
}

export async function listFamilies(
  client: DbClient,
  params: ListFamiliesParams
): Promise<FacadeResult<ListResult<Family>>> {
  try {
    const base = client
      .from("families")
      .select("*")
      .eq("tenant_id", params.tenantId);

    const withArchived =
      params.includeArchived === true
        ? base
        : base.is("archived_at", null);

    const withSearch =
      params.search && params.search.trim().length > 0
        ? applyFamilySearch(withArchived, params.search.trim())
        : withArchived;
    const withLocation = params.locationId
      ? withSearch.or(
          [
            `primary_location_id.eq.${params.locationId}`,
            "primary_location_id.is.null",
          ].join(","),
        )
      : withSearch;

    if (params.page.mode === "offset") {
      const { page, pageSize, from, to } = offsetRange(
        params.page.page,
        params.page.pageSize
      );

      const { data, error } = await withLocation
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to);

      if (error) return { data: null, error: toErrorInfo(error) };
      return {
        data: {
          items: ((data ?? []) as unknown[]).map((r) => r as Family),
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
    const decoded = cursor ? decodeCursor<FamilyCursorPayload>(cursor) : null;

    let q = withLocation
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit);

    if (decoded?.created_at && decoded?.id) {
      // Descending pagination: fetch rows "after" the cursor.
      q = q.or(
        [
          `created_at.lt.${decoded.created_at}`,
          `and(created_at.eq.${decoded.created_at},id.lt.${decoded.id})`,
        ].join(",")
      );
    }

    const { data, error } = await q;
    if (error) return { data: null, error: toErrorInfo(error) };

    const items = ((data ?? []) as unknown[]).map((r) => r as Family);
    const last = items.at(-1);
    const nextCursor =
      last?.created_at && last?.id
        ? encodeCursor({ created_at: last.created_at, id: last.id })
        : undefined;

    return {
      data: {
        items,
        pageInfo: {
          mode: "cursor",
          cursor: cursor || undefined,
          limit,
          nextCursor,
        },
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: toErrorInfo(err) };
  }
}

export async function getFamilyById(
  client: DbClient,
  tenantId: string,
  id: string
): Promise<FacadeResult<Family | null>> {
  try {
    const { data, error } = await client
      .from("families")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .maybeSingle();

    if (error) return { data: null, error: toErrorInfo(error) };
    return { data: (data ?? null) as Family | null, error: null };
  } catch (err) {
    return { data: null, error: toErrorInfo(err) };
  }
}

export async function createFamily(
  client: DbClient,
  input: FamilyInsert
): Promise<FacadeResult<Family>> {
  try {
    const { data, error } = await client
      .from("families")
      .insert(input)
      .select("*")
      .single();
    if (error) return { data: null, error: toErrorInfo(error) };
    return { data: data as Family, error: null };
  } catch (err) {
    return { data: null, error: toErrorInfo(err) };
  }
}

export async function updateFamily(
  client: DbClient,
  tenantId: string,
  id: string,
  patch: FamilyUpdate
): Promise<FacadeResult<Family>> {
  try {
    const { data, error } = await client
      .from("families")
      .update(patch)
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) return { data: null, error: toErrorInfo(error) };
    return { data: data as Family, error: null };
  } catch (err) {
    return { data: null, error: toErrorInfo(err) };
  }
}

export async function archiveFamily(
  client: DbClient,
  tenantId: string,
  id: string,
  archivedAt: string = new Date().toISOString()
): Promise<FacadeResult<Family>> {
  return updateFamily(client, tenantId, id, { archived_at: archivedAt });
}

