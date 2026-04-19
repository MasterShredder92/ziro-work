import type { AgentContext } from "../agents/types";
import type { Student } from "../types/students";

export async function createEnrollment(ctx: AgentContext, { lead_id }: { lead_id: string }) {
  const { data: existing, error: existingErr } = await ctx.supabase
    .from("students")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("lead_id", lead_id)
    .maybeSingle();

  if (existingErr) throw existingErr;
  if (existing) return existing as Student;

  const now = new Date().toISOString();

  const { data: student, error } = await ctx.supabase
    .from("students")
    .insert({
      tenant_id: ctx.tenantId,
      lead_id,
      enrollment_date: now,
      attendance_streak: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return student as Student;
}

