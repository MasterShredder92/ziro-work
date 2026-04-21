var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
function slugify(input) {
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
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(zirorbs !== null && zirorbs !== void 0 ? zirorbs : []);
}
// POST /api/zirorbs — create
export async function POST(req) {
    const supabase = getServiceClient();
    const body = await req.json();
    const { name, slug, description, family = "vertical", accent_color = "#00ff88", sort_order = 100, board_x, board_y, is_active = true, } = body;
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
        board_x: board_x != null && Number.isFinite(Number(board_x)) ? Number(board_x) : null,
        board_y: board_y != null && Number.isFinite(Number(board_y)) ? Number(board_y) : null,
        is_active: Boolean(is_active),
        created_at: now,
        updated_at: now,
    })
        .select("*")
        .single();
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(Object.assign(Object.assign({}, data), { agent_count: 0 }), { status: 201 });
}
// PATCH /api/zirorbs — update (slug immutable to keep FK references stable)
export async function PATCH(req) {
    const supabase = getServiceClient();
    const body = await req.json();
    const { id } = body, updates = __rest(body, ["id"]);
    if (!id) {
        return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    delete updates.slug;
    delete updates.id;
    delete updates.created_at;
    if (updates.family && updates.family !== "core" && updates.family !== "vertical") {
        return NextResponse.json({ error: "family must be core or vertical" }, { status: 400 });
    }
    if (updates.is_active !== undefined) {
        updates.is_active = Boolean(updates.is_active);
    }
    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase.from("zirorbs").update(updates).eq("id", id).select("*").single();
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}
// DELETE /api/zirorbs — delete (agents.zirorb_id nulls via FK)
export async function DELETE(req) {
    const supabase = getServiceClient();
    const body = await req.json();
    const { id } = body;
    if (!id) {
        return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const { error } = await supabase.from("zirorbs").delete().eq("id", id);
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
