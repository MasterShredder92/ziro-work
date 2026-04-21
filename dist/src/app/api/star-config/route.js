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
// GET /api/star-config — fetch Star config for a business context
export async function GET(req) {
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
export async function PATCH(req) {
    const supabase = getServiceClient();
    const body = await req.json();
    const { business_context = "music_school" } = body, updates = __rest(body, ["business_context"]);
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
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}
