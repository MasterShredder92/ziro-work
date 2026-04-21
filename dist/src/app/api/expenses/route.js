import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getCRMTenantId } from "@/app/(app)/crm/_tenant";
export const dynamic = "force-dynamic";
export async function GET(req) {
    try {
        const tenantId = await getCRMTenantId();
        const db = getServiceClient();
        const url = new URL(req.url);
        const month = url.searchParams.get("month"); // YYYY-MM
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = db
            .from("expenses")
            .select("id,amount_cents,category,description,effective_date,end_date,frequency,is_recurring,location_id,created_at")
            .eq("tenant_id", tenantId)
            .order("effective_date", { ascending: false });
        if (month) {
            const start = `${month}-01`;
            const end = new Date(parseInt(month.split("-")[0]), parseInt(month.split("-")[1]), 0).toISOString().split("T")[0];
            query = query.gte("effective_date", start).lte("effective_date", end);
        }
        const { data, error } = await query;
        if (error)
            throw error;
        return NextResponse.json({ data: data !== null && data !== void 0 ? data : [] });
    }
    catch (err) {
        console.error("[expenses GET]", err);
        return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
    }
}
export async function POST(req) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    try {
        const tenantId = await getCRMTenantId();
        const db = getServiceClient();
        const body = await req.json();
        const row = {
            tenant_id: tenantId,
            amount_cents: (_a = body.amount_cents) !== null && _a !== void 0 ? _a : Math.round(((_b = body.amount) !== null && _b !== void 0 ? _b : 0) * 100),
            category: (_c = body.category) !== null && _c !== void 0 ? _c : "Other",
            description: (_e = (_d = body.label) !== null && _d !== void 0 ? _d : body.description) !== null && _e !== void 0 ? _e : "",
            effective_date: (_g = (_f = body.date) !== null && _f !== void 0 ? _f : body.effective_date) !== null && _g !== void 0 ? _g : new Date().toISOString().split("T")[0],
            is_recurring: (_j = (_h = body.recurring) !== null && _h !== void 0 ? _h : body.is_recurring) !== null && _j !== void 0 ? _j : false,
            frequency: (_k = body.frequency) !== null && _k !== void 0 ? _k : null,
            location_id: (_l = body.location_id) !== null && _l !== void 0 ? _l : null,
            end_date: (_m = body.end_date) !== null && _m !== void 0 ? _m : null,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await db
            .from("expenses")
            .insert(row)
            .select()
            .single();
        if (error)
            throw error;
        return NextResponse.json({ data }, { status: 201 });
    }
    catch (err) {
        console.error("[expenses POST]", err);
        return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
    }
}
