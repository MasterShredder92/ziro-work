/**
 * /api/student-messages
 *
 * Student/parent feedback system.
 * Routes to Director dashboard ONLY — never directly to teacher.
 * Supports anonymous submissions.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase";
import { assertServiceRoleAllowed } from "@/lib/supabaseAuthenticated";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Schema = z.object({
  student_id: z.string().uuid().nullable().optional(),
  family_id: z.string().uuid().nullable().optional(),
  category: z.enum(["Issue", "Note", "General", "Billing"]).default("General"),
  content: z.string().min(1).max(2000),
  is_anonymous: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    assertServiceRoleAllowed("Anonymous feedback submissions — no caller session, public endpoint");
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { student_id, family_id, category, content, is_anonymous } = parsed.data;

    const tenantId =
      req.headers.get("x-tenant-id") ||
      new URL(req.url).searchParams.get("tenantId") ||
      DEFAULT_TENANT_ID;

    const db = getServiceClient();

    const { data, error } = await db
      .from("student_messages")
      .insert({
        tenant_id: tenantId,
        student_id: student_id ?? null,
        family_id: family_id ?? null,
        category,
        content,
        is_anonymous,
        admin_reviewed: false,
        forwarded_to_teacher: false,
      })
      .select("id, category, is_anonymous, created_at")
      .single();

    if (error) {
      console.error("[student-messages] Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}

// Director: list unreviewed messages
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenantId") || DEFAULT_TENANT_ID;
  const unreviewed = url.searchParams.get("unreviewed") === "true";

  const db = getServiceClient();

  let query = db
    .from("student_messages")
    .select("id, student_id, family_id, category, content, is_anonymous, admin_reviewed, forwarded_to_teacher, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (unreviewed) {
    query = query.eq("admin_reviewed", false);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data ?? [] });
}
