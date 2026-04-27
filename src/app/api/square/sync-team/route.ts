/**
 * POST /api/square/sync-team
 *
 * Pulls all active Square team members and matches them to ZiroWork teachers
 * by email address. NEVER creates new teacher records — only updates existing
 * ones where email matches. Returns a full dry-run report before committing.
 *
 * Query params:
 *   ?dry_run=true  → report only, no DB writes (default: false)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

const SQUARE_API_BASE = "https://connect.squareup.com/v2";

type SquareTeamMember = {
  id: string;
  reference_id?: string;
  is_owner?: boolean;
  status: "ACTIVE" | "INACTIVE";
  given_name?: string;
  family_name?: string;
  email_address?: string;
  phone_number?: string;
  created_at?: string;
  updated_at?: string;
};

type SquareListTeamResponse = {
  team_members?: SquareTeamMember[];
  cursor?: string;
  errors?: Array<{ code: string; detail: string }>;
};

async function fetchAllSquareTeamMembers(token: string): Promise<SquareTeamMember[]> {
  const members: SquareTeamMember[] = [];
  let cursor: string | undefined;

  do {
    const body: Record<string, unknown> = { limit: 200 };
    if (cursor) body.cursor = cursor;

    const res = await fetch(`${SQUARE_API_BASE}/team-members/search`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Square-Version": "2024-01-18",
      },
      body: JSON.stringify({ query: { filter: { status: "ACTIVE" } }, ...body }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Square API error ${res.status}: ${err}`);
    }

    const data = await res.json() as SquareListTeamResponse;
    if (data.errors?.length) {
      throw new Error(`Square API errors: ${data.errors.map(e => e.detail).join(", ")}`);
    }

    if (data.team_members) members.push(...data.team_members);
    cursor = data.cursor;
  } while (cursor);

  return members;
}

export async function POST(req: NextRequest) {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "SQUARE_ACCESS_TOKEN not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const dryRun = searchParams.get("dry_run") !== "false";

  try {
    // 1. Fetch all active Square team members
    const squareMembers = await fetchAllSquareTeamMembers(token);

    // 2. Load all ZiroWork teachers with emails
    const supabase = getServiceClient();
    const { data: teachers, error: dbErr } = await supabase
      .from("teachers")
      .select("id, first_name, last_name, email, status, tenant_id")
      .eq("tenant_id", "00000000-0000-0000-0000-000000000001");

    if (dbErr) throw new Error(`DB error: ${dbErr.message}`);

    // 3. Build email → teacher map
    const teacherByEmail = new Map<string, typeof teachers[0]>();
    for (const t of teachers ?? []) {
      if (t.email) teacherByEmail.set(t.email.toLowerCase().trim(), t);
    }

    // 4. Match and build update plan
    const matched: Array<{
      square_id: string;
      teacher_id: string;
      email: string;
      square_name: string;
      ziro_name: string;
      status_change: string | null;
    }> = [];
    const unmatched: Array<{ square_id: string; email: string; name: string }> = [];

    for (const m of squareMembers) {
      const email = m.email_address?.toLowerCase().trim();
      if (!email) {
        unmatched.push({ square_id: m.id, email: "(no email)", name: `${m.given_name ?? ""} ${m.family_name ?? ""}`.trim() });
        continue;
      }
      const teacher = teacherByEmail.get(email);
      if (!teacher) {
        unmatched.push({ square_id: m.id, email, name: `${m.given_name ?? ""} ${m.family_name ?? ""}`.trim() });
        continue;
      }

      const squareName = `${m.given_name ?? ""} ${m.family_name ?? ""}`.trim();
      const ziroName = `${teacher.first_name ?? ""} ${teacher.last_name ?? ""}`.trim();
      const statusChange = m.status === "INACTIVE" && teacher.status === "active"
        ? "active → inactive"
        : null;

      matched.push({
        square_id: m.id,
        teacher_id: teacher.id,
        email,
        square_name: squareName,
        ziro_name: ziroName,
        status_change: statusChange,
      });
    }

    // 5. Apply updates if not dry run
    let updatedCount = 0;
    if (!dryRun) {
      for (const m of matched) {
        const updates: Record<string, unknown> = { square_team_member_id: m.square_id };
        if (m.status_change) updates.status = "inactive";

        const { error: upErr } = await supabase
          .from("teachers")
          .update(updates)
          .eq("id", m.teacher_id);

        if (!upErr) updatedCount++;
      }
    }

    return NextResponse.json({
      dry_run: dryRun,
      square_total: squareMembers.length,
      matched: matched.length,
      unmatched: unmatched.length,
      updated: dryRun ? 0 : updatedCount,
      matched_list: matched,
      unmatched_list: unmatched,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
