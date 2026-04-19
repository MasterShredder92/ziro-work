import { z } from "zod";

export const studentLifecycleTypeSchema = z.enum([
  "created",
  "enrolled",
  "paused",
  "resumed",
  "attendance",
  "invoice",
  "note",
  "risk",
  "archived",
]);

export const studentLifecycleEntrySchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().min(1),
  created_at: z.string().min(1),

  student_id: z.string().uuid(),
  type: studentLifecycleTypeSchema,
  occurred_at: z.string().min(1),

  title: z.string().nullable(),
  detail: z.string().nullable(),
  payload: z.record(z.string(), z.unknown()).nullable(),
});

export const studentLifecycleInsertSchema = studentLifecycleEntrySchema
  .omit({ id: true, created_at: true })
  .extend({
    id: z.string().uuid().optional(),
    created_at: z.string().min(1).optional(),
  });

export const studentLifecycleUpdateSchema = studentLifecycleEntrySchema
  .omit({
    id: true,
    tenant_id: true,
    created_at: true,
    student_id: true,
  })
  .partial();

