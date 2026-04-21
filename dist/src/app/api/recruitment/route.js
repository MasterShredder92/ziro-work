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
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    const url = new URL(req.url);
    const tenantId = url.searchParams.get("tenantId") || DEFAULT_TENANT_ID;
    const status = url.searchParams.get("status") || null;
    const supabase = getServiceClient();
    let query = supabase
        .from("recruitment_prospects")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });
    if (status)
        query = query.eq("status", status);
    const { data, error } = await query;
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: data !== null && data !== void 0 ? data : [] });
}
export async function POST(req) {
    const tenantId = DEFAULT_TENANT_ID;
    const body = await req.json();
    const supabase = getServiceClient();
    const { data, error } = await supabase
        .from("recruitment_prospects")
        .insert(Object.assign(Object.assign({}, body), { tenant_id: tenantId }))
        .select()
        .single();
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
}
export async function PATCH(req) {
    const body = await req.json();
    const { id } = body, updates = __rest(body, ["id"]);
    if (!id)
        return NextResponse.json({ error: "id required" }, { status: 400 });
    const supabase = getServiceClient();
    const { data, error } = await supabase
        .from("recruitment_prospects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
}
export async function DELETE(req) {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id)
        return NextResponse.json({ error: "id required" }, { status: 400 });
    const supabase = getServiceClient();
    const { error } = await supabase.from("recruitment_prospects").delete().eq("id", id);
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}
