import type { DbClient, FacadeResult } from "./core";
import { toErrorInfo } from "./core";
import type { EventEntityType, EventLog, EventLogInsert } from "./models/events";
import { createEvent } from "./events";

export interface LogEventParams {
  tenantId: string;
  entityType: EventEntityType;
  entityId?: string | null;
  eventType: string;
  actorId?: string | null;
  payload?: Record<string, unknown> | null;
}

export function buildEventInsert(p: LogEventParams): EventLogInsert {
  return {
    tenant_id: p.tenantId,
    entity_type: p.entityType,
    entity_id: p.entityId ?? null,
    event_type: p.eventType,
    actor_id: p.actorId ?? null,
    payload: p.payload ?? null,
  };
}

export async function logEvent(
  client: DbClient,
  p: LogEventParams
): Promise<FacadeResult<EventLog>> {
  try {
    return await createEvent(client, buildEventInsert(p));
  } catch (err) {
    return { data: null, error: toErrorInfo(err) };
  }
}

