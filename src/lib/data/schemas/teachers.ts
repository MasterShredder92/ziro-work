import { z } from "zod";

export const teacherStatusSchema = z.enum(["active", "inactive"]);

export const teacherSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().min(1),
  created_at: z.string().min(1),

  name: z.string().min(1),
  email: z.string().email().nullable(),
  phone: z.string().min(1).nullable(),

  status: teacherStatusSchema,
  max_students: z.number().int().nonnegative().nullable(),
  weekly_capacity_minutes: z.number().int().nonnegative().nullable(),
  notes: z.string().nullable(),
  archived_at: z.string().min(1).nullable(),
});

export const teacherInsertSchema = teacherSchema
  .omit({ id: true, created_at: true })
  .extend({
    id: z.string().uuid().optional(),
    created_at: z.string().min(1).optional(),
  });

export const teacherUpdateSchema = teacherSchema
  .omit({ id: true, tenant_id: true, created_at: true })
  .partial();

