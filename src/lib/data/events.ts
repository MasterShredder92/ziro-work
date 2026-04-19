import type { DbClient, FacadeResult, ListResult, PageParams } from "./core";
import { decodeCursor, encodeCursor, offsetRange, toErrorInfo } from "./core";
import type { EventLog, EventLogInsert } from "./models/events";

export interface ListEventsParams {
  tenantId: string;
  page: PageParams;
  entityType?: string;
  entityId?: string;
  eventType?: string;
}

type EventCursorPayload = { created_at: string; id: string };

export async function listEvents(
  client: DbClient,
  params: ListEventsParams
): Promise<FacadeResult<ListResult<EventLog>>> {
  try {
    let q = client
      .from("events")
      .select("*")
      .eq("tenant_id", params.tenantId);

    if (params.entityType) q = q.eq("entity_type", params.entityType);
    if (params.entityId) q = q.eq("entity_id", params.entityId);
    if (params.eventType) q = q.eq("event_type", params.eventType);

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
          items: ((data ?? []) as unknown[]).map((r) => r as EventLog),
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
    const decoded = cursor ? decodeCursor<EventCursorPayload>(cursor) : null;

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

    const items = ((data ?? []) as unknown[]).map((r) => r as EventLog);
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

export async function createEvent(
  client: DbClient,
  input: EventLogInsert
): Promise<FacadeResult<EventLog>> {
  try {
    const { data, error } = await client
      .from("events")
      .insert(input)
      .select("*")
      .single();
    if (error) return { data: null, error: toErrorInfo(error) };
    return { data: data as EventLog, error: null };
  } catch (err) {
    return { data: null, error: toErrorInfo(err) };
  }
}

