import { z } from "zod";

export const invoiceStatusSchema = z.enum([
  "draft",
  "sent",
  "paid",
  "void",
  "overdue",
]);

export const invoiceSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().min(1),
  created_at: z.string().min(1),

  family_id: z.string().uuid().nullable(),
  student_id: z.string().uuid().nullable(),

  status: invoiceStatusSchema,
  currency: z.string().min(3).max(3),
  amount_cents: z.number().int().nonnegative(),

  issued_at: z.string().min(1).nullable(),
  due_at: z.string().min(1).nullable(),
  paid_at: z.string().min(1).nullable(),

  description: z.string().nullable(),
  external_ref: z.string().nullable(),
  archived_at: z.string().min(1).nullable(),
});

export const invoiceInsertSchema = invoiceSchema
  .omit({ id: true, created_at: true })
  .extend({
    id: z.string().uuid().optional(),
    created_at: z.string().min(1).optional(),
  });

export const invoiceUpdateSchema = invoiceSchema
  .omit({ id: true, tenant_id: true, created_at: true })
  .partial();

