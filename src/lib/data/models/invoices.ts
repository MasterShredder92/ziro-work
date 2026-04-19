import type { DbId, IsoDateTime } from "@/lib/data/core";

export type InvoiceStatus = "draft" | "sent" | "paid" | "void" | "overdue";

export interface Invoice {
  id: DbId;
  tenant_id: string;
  created_at: IsoDateTime;

  family_id: DbId | null;
  student_id: DbId | null;

  status: InvoiceStatus;
  currency: string; // ISO 4217 (e.g. "USD")
  amount_cents: number;

  issued_at: IsoDateTime | null;
  due_at: IsoDateTime | null;
  paid_at: IsoDateTime | null;

  description: string | null;
  external_ref: string | null;
  archived_at: IsoDateTime | null;
}

export type InvoiceInsert = Omit<Invoice, "id" | "created_at"> & {
  id?: DbId;
  created_at?: IsoDateTime;
};

export type InvoiceUpdate = Partial<
  Omit<Invoice, "id" | "tenant_id" | "created_at">
>;

