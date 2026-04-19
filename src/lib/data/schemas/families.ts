import { z } from "zod";

export const familySchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().min(1),
  created_at: z.string().min(1),

  name: z.string().min(1),
  primary_email: z.string().email().nullable(),
  primary_phone: z.string().min(1).nullable(),

  address_line1: z.string().min(1).nullable(),
  address_line2: z.string().min(1).nullable(),
  city: z.string().min(1).nullable(),
  state: z.string().min(1).nullable(),
  postal_code: z.string().min(1).nullable(),

  notes: z.string().nullable(),
  archived_at: z.string().min(1).nullable(),
});

export const familyInsertSchema = familySchema
  .omit({ id: true, created_at: true })
  .extend({
    id: z.string().uuid().optional(),
    created_at: z.string().min(1).optional(),
  });

export const familyUpdateSchema = familySchema
  .omit({ id: true, tenant_id: true, created_at: true })
  .partial();

