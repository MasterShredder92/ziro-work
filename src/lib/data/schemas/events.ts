import { z } from "zod";

export const eventEntityTypeSchema = z.enum([
  "family",
  "student",
  "teacher",
  "invoice",
  "lifecycle",
  "system",
]);

export const eventLogSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().min(1),
  created_at: z.string().min(1),

  entity_type: eventEntityTypeSchema,
  entity_id: z.string().uuid().nullable(),
  event_type: z.string().min(1),

  actor_id: z.string().uuid().nullable(),
  payload: z.record(z.string(), z.unknown()).nullable(),
});

export const eventLogInsertSchema = eventLogSchema
  .omit({ id: true, created_at: true })
  .extend({
    id: z.string().uuid().optional(),
    created_at: z.string().min(1).optional(),
  });

