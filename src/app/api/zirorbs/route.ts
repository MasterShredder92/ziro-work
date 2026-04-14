import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// GET /api/zirorbs — list Zirorbs (agent counts are derived client-side from /api/agents for active filters)
export async function GET() {
  const supabase = getServiceClient();

  const { data: zirorbs, error } = await supabase
    .from("zirorbs")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(zirorbs ?? []);
}

// POST /api/zirorbs — create
export async function POST(req: NextRequest) {
  const supabase = getServiceClient();
  const body = await req.json();
  const { name, slug, description, family = "vertical", accent_color = "#00ff88", sort_order = 100 } = body;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const finalSlug = slugify(slug || name);
  if (!finalSlug) {
    return NextResponse.json({ error: "Could not derive slug from name" }, { status: 400 });
  }

  if (family !== "core" && family !== "vertical") {
    return NextResponse.json({ error: "family must be core or vertical" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("zirorbs")
    .insert({
      slug: finalSlug,
      name: String(name).trim(),
      description: description ? String(description).trim() : null,
      family,
      accent_color,
      sort_order: Number.isFinite(Number(sort_order)) ? Number(sort_order) : 100,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...data, agent_count: 0 }, { status: 201 });
}

// PATCH /api/zirorbs — update (slug immutable to keep FK references stable)
export async function PATCH(req: NextRequest) {
  const supabase = getServiceClient();
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  delete updates.slug;
  delete updates.id;
  delete updates.created_at;

  if (updates.family && updates.family !== "core" && updates.family !== "vertical") {
    return NextResponse.json({ error: "family must be core or vertical" }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from("zirorbs").update(updates).eq("id", id).select("*").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

// DELETE /api/zirorbs — delete (agents.zirorb_id nulls via FK)
export async function DELETE(req: NextRequest) {
  const supabase = getServiceClient();
  const body = await req.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { error } = await supabase.from("zirorbs").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
