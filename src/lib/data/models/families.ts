import type { DbId, IsoDateTime } from "@/lib/data/core";

export interface Family {
  id: DbId;
  tenant_id: string;
  created_at: IsoDateTime;

  name: string;
  primary_email: string | null;
  primary_phone: string | null;

  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;

  notes: string | null;
  archived_at: IsoDateTime | null;
}

export type FamilyInsert = Omit<Family, "id" | "created_at"> & {
  id?: DbId;
  created_at?: IsoDateTime;
};

export type FamilyUpdate = Partial<
  Omit<Family, "id" | "tenant_id" | "created_at">
>;

