import type { DbId, IsoDateTime } from "@/lib/data/core";

export type TeacherStatus = "active" | "inactive";

export interface Teacher {
  id: DbId;
  tenant_id: string;
  created_at: IsoDateTime;

  name: string;
  email: string | null;
  phone: string | null;

  status: TeacherStatus;
  max_students: number | null;
  weekly_capacity_minutes: number | null;
  notes: string | null;
  archived_at: IsoDateTime | null;
}

export type TeacherInsert = Omit<Teacher, "id" | "created_at"> & {
  id?: DbId;
  created_at?: IsoDateTime;
};

export type TeacherUpdate = Partial<
  Omit<Teacher, "id" | "tenant_id" | "created_at">
>;

