import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { assertServiceRoleAllowed } from "@/lib/supabaseAuthenticated";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  assertServiceRoleAllowed("Admin review marker — no session guard; service-role used as interim");
  const { id } = await params;
  const db = getServiceClient();

  const { error } = await db
    .from("student_messages")
    .update({ admin_reviewed: true, reviewed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
