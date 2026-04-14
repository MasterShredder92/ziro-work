import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/skills/templates?skill_id=... — get templates linked to a skill
export async function GET(req: NextRequest) {
  const supabase = getServiceClient();
  const skillId = new URL(req.url).searchParams.get("skill_id");

  if (!skillId) {
    return NextResponse.json({ error: "skill_id required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("agent_template_skills")
    .select("agent_template_id, priority, agent_templates(id, key, name, is_active, business_context)")
    .eq("skill_id", skillId)
    .order("priority", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/skills/templates — assign a skill to a template
export async function POST(req: NextRequest) {
  const supabase = getServiceClient();
  const { skill_id, template_id, priority = 50 } = await req.json();

  if (!skill_id || !template_id) {
    return NextResponse.json({ error: "skill_id and template_id required" }, { status: 400 });
  }

  // Enforce max 4 skills per template
  const { count } = await supabase
    .from("agent_template_skills")
    .select("id", { count: "exact", head: true })
    .eq("agent_template_id", template_id);

  if ((count || 0) >= 4) {
    return NextResponse.json(
      { error: "Template already has 4 skills (max). Remove one before adding." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("agent_template_skills")
    .insert({ agent_template_id: template_id, skill_id, priority })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Skill already assigned to this template" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/skills/templates — unassign a skill from a template
export async function DELETE(req: NextRequest) {
  const supabase = getServiceClient();
  const { skill_id, template_id } = await req.json();

  if (!skill_id || !template_id) {
    return NextResponse.json({ error: "skill_id and template_id required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("agent_template_skills")
    .delete()
    .eq("agent_template_id", template_id)
    .eq("skill_id", skill_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
