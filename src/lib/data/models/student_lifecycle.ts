import type { DbId, IsoDateTime } from "@/lib/data/core";

export type StudentLifecycleType =
  | "created"
  | "enrolled"
  | "paused"
  | "resumed"
  | "attendance"
  | "invoice"
  | "note"
  | "risk"
  | "archived";

export interface StudentLifecycleEntry {
  id: DbId;
  tenant_id: string;
  created_at: IsoDateTime;

  student_id: DbId;
  type: StudentLifecycleType;
  occurred_at: IsoDateTime;

  title: string | null;
  detail: string | null;
  payload: Record<string, unknown> | null;
}

export type StudentLifecycleInsert = Omit<
  StudentLifecycleEntry,
  "id" | "created_at"
> & {
  id?: DbId;
  created_at?: IsoDateTime;
};

export type StudentLifecycleUpdate = Partial<
  Omit<StudentLifecycleEntry, "id" | "tenant_id" | "created_at" | "student_id">
>;

