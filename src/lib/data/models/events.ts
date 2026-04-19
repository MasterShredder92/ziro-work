import type { DbId, IsoDateTime } from "@/lib/data/core";

export type EventEntityType =
  | "family"
  | "student"
  | "teacher"
  | "invoice"
  | "lifecycle"
  | "system";

export interface EventLog {
  id: DbId;
  tenant_id: string;
  created_at: IsoDateTime;

  entity_type: EventEntityType;
  entity_id: DbId | null;
  event_type: string;

  actor_id: DbId | null;
  payload: Record<string, unknown> | null;
}

export type EventLogInsert = Omit<EventLog, "id" | "created_at"> & {
  id?: DbId;
  created_at?: IsoDateTime;
};

