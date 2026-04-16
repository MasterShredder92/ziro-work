import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/agents — list agents with optional filters
export async function GET(req: NextRequest) {
  const supabase = getServiceClient();
  const { searchParams } = new URL(req.url);

  const status = searchParams.get("status"); // active | deployed | idle | retired | all
  const context = searchParams.get("context") || "music_school";
  const mode = searchParams.get("mode"); // persistent | ephemeral | all
  const ownerType = searchParams.get("owner_type"); // system | user | all
  const includeArchived = searchParams.get("include_archived") === "true";
  const excludeStar = searchParams.get("exclude_star") === "true";

  let query = supabase
    .from("agents")
    .select("*")
    .order("zirorb_sort", { ascending: true })
    .order("name", { ascending: true })
    .limit(100);

  if (context !== "all") {
    query = query.eq("business_context", context);
  }

  if (!includeArchived) {
    query = query.eq("is_archived", false);
  }

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (mode && mode !== "all") {
    query = query.eq("mode", mode);
  }

  if (ownerType && ownerType !== "all") {
    query = query.eq("owner_type", ownerType);
  }

  // Exclude STAR orchestrator from specialist agent lists
  if (excludeStar) {
    query = query.neq("slug", "star");
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/agents — create a new specialist agent (cannot create Star)
export async function POST(req: NextRequest) {
  const supabase = getServiceClient();
  const body = await req.json();

  const {
    name,
    slug,
    role,
    purpose,
    instructions,
    system_prompt,
    mode = "ephemeral",
    owner_type = "user",
    color = "#00ff88",
    usage_triggers = [],
    auto_use_by_ziro = true,
    profile_summary,
    business_context = "music_school",
    template_id,
    zirorb_id,
    zirorb_sort = 0,
  } = body;

  if (!name || !role) {
    return NextResponse.json(
      { error: "name and role are required" },
      { status: 400 }
    );
  }

  // Generate slug from name if not provided
  const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  // Block creating an agent with slug "star"
  if (finalSlug === "star") {
    return NextResponse.json(
      { error: "Cannot create an agent with slug 'star'. Configure Star in Star Config." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("agents")
    .insert({
      name,
      slug: finalSlug,
      role,
      purpose: purpose || null,
      instructions: instructions || null,
      system_prompt: system_prompt || null,
      mode,
      owner_type,
      color,
      usage_triggers,
      auto_use_by_ziro,
      profile_summary: profile_summary || null,
      business_context,
      template_id: template_id || null,
      zirorb_id: zirorb_id || null,
      zirorb_sort: Number.isFinite(Number(zirorb_sort)) ? Number(zirorb_sort) : 0,
      status: "active",
      is_visible_in_ui: true,
      is_archived: false,
      created_by: "admin",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// Helper: check if agent is Star (protected from profile edits via this API)
async function isStarAgent(supabase: ReturnType<typeof getServiceClient>, id: string): Promise<boolean> {
  const { data } = await supabase.from("agents").select("slug").eq("id", id).single();
  return data?.slug === "star";
}

// PATCH /api/agents — update a specialist agent or perform lifecycle actions
export async function PATCH(req: NextRequest) {
  const supabase = getServiceClient();
  const body = await req.json();
  const { id, action, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const now = new Date().toISOString();

  // Block profile edits on Star — Star is configured exclusively through /api/star-config
  if (!action && await isStarAgent(supabase, id)) {
    return NextResponse.json(
      { error: "Star cannot be edited as a specialist agent. Use Star Config instead." },
      { status: 403 }
    );
  }

  // Lifecycle actions (allowed on any agent including Star for status management)
  if (action === "activate") {
    const { data, error } = await supabase
      .from("agents")
      .update({ status: "active", updated_at: now })
      .eq("id", id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (action === "idle") {
    const { data, error } = await supabase
      .from("agents")
      .update({ status: "idle", updated_at: now })
      .eq("id", id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (action === "retire") {
    const { data, error } = await supabase
      .from("agents")
      .update({ status: "retired", updated_at: now })
      .eq("id", id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (action === "archive") {
    const { data, error } = await supabase
      .from("agents")
      .update({ is_archived: true, is_visible_in_ui: false, updated_at: now })
      .eq("id", id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (action === "unarchive") {
    const { data, error } = await supabase
      .from("agents")
      .update({ is_archived: false, is_visible_in_ui: true, updated_at: now })
      .eq("id", id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (action === "clone") {
    // Cannot clone Star
    if (await isStarAgent(supabase, id)) {
      return NextResponse.json(
        { error: "Star cannot be cloned. It is a unique orchestrator." },
        { status: 403 }
      );
    }

    const { data: original, error: fetchErr } = await supabase
      .from("agents")
      .select("*")
      .eq("id", id)
      .single();
    if (fetchErr || !original) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const cloneName = `${original.name} (Copy)`;
    const cloneSlug = `${original.slug}-copy-${Date.now().toString(36)}`;

    const { data, error } = await supabase
      .from("agents")
      .insert({
        name: cloneName,
        slug: cloneSlug,
        role: original.role,
        purpose: original.purpose,
        instructions: original.instructions,
        system_prompt: original.system_prompt,
        mode: original.mode,
        owner_type: "user",
        color: original.color,
        usage_triggers: original.usage_triggers,
        auto_use_by_ziro: original.auto_use_by_ziro,
        profile_summary: original.profile_summary,
        business_context: original.business_context,
        template_id: original.template_id,
        zirorb_id: original.zirorb_id ?? null,
        zirorb_sort: original.zirorb_sort ?? 0,
        status: "active",
        is_visible_in_ui: true,
        is_archived: false,
        created_by: "admin",
      })
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Copy attached skills from original to clone
    if (data) {
      const { data: originalSkills } = await supabase
        .from("agent_skills")
        .select("skill_id, priority")
        .eq("agent_id", id);

      if (originalSkills && originalSkills.length > 0) {
        await supabase.from("agent_skills").insert(
          originalSkills.map((s: { skill_id: string; priority: number }) => ({
            agent_id: data.id,
            skill_id: s.skill_id,
            priority: s.priority,
          }))
        );
      }
    }

    return NextResponse.json(data, { status: 201 });
  }

  // General field update (already blocked Star above for non-action updates)
  const BLOCKED_FIELDS = ["id", "created_at", "created_by", "slug"];
  for (const key of BLOCKED_FIELDS) {
    delete updates[key];
  }

  updates.updated_at = now;

  const { data, error } = await supabase
    .from("agents")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/agents — permanently delete a specialist agent (cannot delete Star)
export async function DELETE(req: NextRequest) {
  const supabase = getServiceClient();
  const body = await req.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // Block deleting Star
  if (await isStarAgent(supabase, id)) {
    return NextResponse.json(
      { error: "Star cannot be deleted." },
      { status: 403 }
    );
  }

  const { error } = await supabase.from("agents").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
