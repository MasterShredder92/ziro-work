import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/star-config — fetch Star config for a business context
export async function GET(req: NextRequest) {
  const supabase = getServiceClient();
  const { searchParams } = new URL(req.url);
  const context = searchParams.get("context") || "music_school";

  const { data, error } = await supabase
    .from("star_config")
    .select("*")
    .eq("business_context", context)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || null);
}

// PATCH /api/star-config — update Star configuration
export async function PATCH(req: NextRequest) {
  const supabase = getServiceClient();
  const body = await req.json();

  const { business_context = "music_school", ...updates } = body;

  const BLOCKED = ["id", "created_at"];
  for (const key of BLOCKED) {
    delete updates[key];
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("star_config")
    .update(updates)
    .eq("business_context", business_context)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
