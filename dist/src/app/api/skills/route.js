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
// GET /api/skills — list skills with optional filters
export async function GET(req) {
    const supabase = getServiceClient();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // active | inactive | draft | pending | all
    const context = searchParams.get("context"); // music_school | all
    const runtime = searchParams.get("runtime");
    let query = supabase
        .from("skills")
        .select("*")
        .order("name", { ascending: true });
    if (status === "active") {
        query = query.eq("is_active", true).eq("approval_status", "approved");
    }
    else if (status === "inactive") {
        query = query.eq("is_active", false).eq("approval_status", "approved");
    }
    else if (status === "draft") {
        query = query.eq("approval_status", "draft");
    }
    else if (status === "pending") {
        query = query.eq("approval_status", "pending_approval");
    }
    // "all" = no filter
    if (context && context !== "all") {
        query = query.eq("business_context", context);
    }
    if (runtime && runtime !== "all") {
        query = query.eq("preferred_runtime", runtime);
    }
    const { data, error } = await query;
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}
// POST /api/skills — create a new skill
export async function POST(req) {
    const supabase = getServiceClient();
    const body = await req.json();
    const { key, name, description, category = "operations", system_prompt_fragment, preferred_runtime = "claude_code", allowed_tools = [], cost_tier = 1, risk_tier = 1, business_context = "music_school", tags = [], is_active = false, approval_status = "draft", proposed_by = "admin", } = body;
    if (!key || !name || !description || !system_prompt_fragment) {
        return NextResponse.json({ error: "key, name, description, and system_prompt_fragment are required" }, { status: 400 });
    }
    // Draft/pending skills are always inactive until approved
    const finalActive = approval_status === "approved" ? is_active : false;
    const { data, error } = await supabase
        .from("skills")
        .insert({
        key,
        name,
        description,
        category,
        system_prompt_fragment,
        preferred_runtime,
        allowed_tools,
        cost_tier,
        risk_tier,
        business_context,
        tags,
        is_active: finalActive,
        approval_status,
        proposed_by,
        // Sync alias columns
        slug: key,
        prompt_fragment: system_prompt_fragment,
        runtime: preferred_runtime,
    })
        .select("*")
        .single();
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
}
// PATCH /api/skills — update a skill or perform an action
export async function PATCH(req) {
    const supabase = getServiceClient();
    const body = await req.json();
    const { id, action } = body, updates = __rest(body, ["id", "action"]);
    if (!id) {
        return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    // Action-based operations
    if (action === "approve") {
        const { data, error } = await supabase
            .from("skills")
            .update({
            approval_status: "approved",
            is_active: true,
            approved_by: "admin",
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
            .eq("id", id)
            .select("*")
            .single();
        if (error)
            return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    }
    if (action === "reject") {
        const { data, error } = await supabase
            .from("skills")
            .update({
            approval_status: "rejected",
            is_active: false,
            approved_by: "admin",
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
            .eq("id", id)
            .select("*")
            .single();
        if (error)
            return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    }
    if (action === "submit_for_approval") {
        const { data, error } = await supabase
            .from("skills")
            .update({
            approval_status: "pending_approval",
            updated_at: new Date().toISOString(),
        })
            .eq("id", id)
            .select("*")
            .single();
        if (error)
            return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    }
    if (action === "activate") {
        // Only approved skills can be activated
        const { data: existing } = await supabase.from("skills").select("approval_status").eq("id", id).single();
        if ((existing === null || existing === void 0 ? void 0 : existing.approval_status) !== "approved") {
            return NextResponse.json({ error: "Only approved skills can be activated" }, { status: 400 });
        }
        const { data, error } = await supabase
            .from("skills")
            .update({ is_active: true, updated_at: new Date().toISOString() })
            .eq("id", id)
            .select("*")
            .single();
        if (error)
            return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    }
    if (action === "deactivate") {
        const { data, error } = await supabase
            .from("skills")
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq("id", id)
            .select("*")
            .single();
        if (error)
            return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    }
    // General field update — block protected fields
    const BLOCKED_FIELDS = ["id", "created_at", "approved_by", "approved_at", "approval_status"];
    for (const key of BLOCKED_FIELDS) {
        delete updates[key];
    }
    // Sync alias columns if primary columns change
    if (updates.key)
        updates.slug = updates.key;
    if (updates.system_prompt_fragment)
        updates.prompt_fragment = updates.system_prompt_fragment;
    if (updates.preferred_runtime)
        updates.runtime = updates.preferred_runtime;
    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase
        .from("skills")
        .update(updates)
        .eq("id", id)
        .select("*")
        .single();
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}
