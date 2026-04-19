import { z } from "zod";

export const studentStatusSchema = z.enum(["active", "paused", "inactive"]);
export const studentOnboardingStageSchema = z.enum([
  "new",
  "first_week",
  "active",
  "at_risk",
]);

export const studentSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().min(1),
  created_at: z.string().min(1),

  family_id: z.string().uuid().nullable(),
  teacher_id: z.string().uuid().nullable(),

  name: z.string().min(1),
  email: z.string().email().nullable(),
  phone: z.string().min(1).nullable(),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),

  status: studentStatusSchema,

  enrollment_date: z.string().min(1).nullable(),
  onboarding_stage: studentOnboardingStageSchema.nullable(),
  last_attendance_at: z.string().min(1).nullable(),
  attendance_streak: z.number().int().nonnegative(),
  churn_risk: z.string().nullable(),

  notes: z.string().nullable(),
  archived_at: z.string().min(1).nullable(),
});

export const studentInsertSchema = studentSchema
  .omit({ id: true, created_at: true })
  .extend({
    id: z.string().uuid().optional(),
    created_at: z.string().min(1).optional(),
  });

export const studentUpdateSchema = studentSchema
  .omit({ id: true, tenant_id: true, created_at: true })
  .partial();

