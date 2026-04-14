import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/agents/skills?agent_id=xxx — get skills attached to an agent
export async function GET(req: NextRequest) {
  const supabase = getServiceClient();
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get("agent_id");

  if (!agentId) {
    return NextResponse.json({ error: "agent_id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("agent_skills")
    .select("id, agent_id, skill_id, priority, created_at, skills(id, key, name, description, category, preferred_runtime, is_active, approval_status)")
    .eq("agent_id", agentId)
    .order("priority", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/agents/skills — attach a skill to an agent
export async function POST(req: NextRequest) {
  const supabase = getServiceClient();
  const body = await req.json();
  const { agent_id, skill_id, priority = 10 } = body;

  if (!agent_id || !skill_id) {
    return NextResponse.json(
      { error: "agent_id and skill_id are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("agent_skills")
    .insert({ agent_id, skill_id, priority })
    .select("id, agent_id, skill_id, priority, created_at, skills(id, key, name, description, category, preferred_runtime, is_active, approval_status)")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Skill already attached to this agent" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/agents/skills — detach a skill from an agent
export async function DELETE(req: NextRequest) {
  const supabase = getServiceClient();
  const body = await req.json();
  const { agent_id, skill_id } = body;

  if (!agent_id || !skill_id) {
    return NextResponse.json(
      { error: "agent_id and skill_id are required" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("agent_skills")
    .delete()
    .eq("agent_id", agent_id)
    .eq("skill_id", skill_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
