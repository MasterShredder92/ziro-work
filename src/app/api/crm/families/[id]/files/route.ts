import { NextRequest } from "next/server";
import { clientFor } from "@data/_client";
import { ok, notFound, serverError } from "@/lib/http";
import { resolveCRMContext } from "../../../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

/* ── GET /api/crm/families/[id]/files ─────────────────────
   Returns all family_files for a family ordered by created_at desc.
──────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.read"],
    minRole: "teacher",
  });
  if ("response" in resolved) return resolved.response;
  try {
    const { id: familyId } = await ctx.params;
    const { tenantId, session } = resolved.context;
    const supabase = clientFor(tenantId);

    // Verify family exists
    const { data: family, error: famErr } = await supabase
      .from("families")
      .select("id")
      .eq("id", familyId)
      .maybeSingle();
    if (famErr) throw famErr;
    if (!family) return notFound("Family not found");

    const { data, error } = await supabase
      .from("family_files")
      .select(
        "id, file_name, file_url, file_type, file_size_bytes, signwell_status, signwell_document_id, notes, source, uploaded_by, created_at"
      )
      .eq("family_id", familyId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return ok({ items: data ?? [] });
  } catch (err) {
    return serverError(err instanceof Error ? err.message : "Internal error");
  }
}

/* ── POST /api/crm/families/[id]/files ────────────────────
   Uploads a file for a family (storage stub — wires record only).
──────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.write"],
    minRole: "director",
  });
  if ("response" in resolved) return resolved.response;
  try {
    const { id: familyId } = await ctx.params;
    const { tenantId, session } = resolved.context;
    const supabase = clientFor(tenantId);

    // Verify family exists
    const { data: family, error: famErr } = await supabase
      .from("families")
      .select("id")
      .eq("id", familyId)
      .maybeSingle();
    if (famErr) throw famErr;
    if (!family) return notFound("Family not found");

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // TODO: Upload to Supabase Storage when bucket is configured
    // const { data: storageData, error: storageErr } = await supabase.storage
    //   .from("family-files")
    //   .upload(`${tenantId}/${familyId}/${Date.now()}_${file.name}`, file);

    const { data, error } = await supabase
      .from("family_files")
      .insert({
        family_id: familyId,
        tenant_id: tenantId,
        file_name: file.name,
        file_url: `stub://${file.name}`,
        file_type: file.type || "application/octet-stream",
        file_size_bytes: file.size,
        uploaded_by: session.userId ?? null,
        source: "manual_upload",
      })
      .select()
      .single();

    if (error) throw error;
    return new Response(JSON.stringify({ data }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return serverError(err instanceof Error ? err.message : "Internal error");
  }
}
