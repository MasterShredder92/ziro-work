import { NextRequest } from "next/server";
import { clientFor } from "@data/_client";
import { ok, serverError } from "@/lib/http";
import { resolveCRMContext } from "../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ── GET /api/crm/search?q=<term>&limit=<n> ─────────────────
   Queries vw_student_family_search using ILIKE on search_terms.
   Returns up to `limit` (default 10, max 25) results.
──────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.read"],
    minRole: "teacher",
  });
  if ("response" in resolved) return resolved.response;
  try {
    const { tenantId } = resolved.context;
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const limitParam = Number(url.searchParams.get("limit") ?? "10");
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), 25)
      : 10;

    if (!q) return ok({ items: [] });

    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
      .from("vw_student_family_search")
      .select(
        "student_id, student_first_name, student_last_name, student_status, student_instrument, family_id, family_name, family_primary_email, family_primary_phone, family_status"
      )
      .eq("tenant_id", tenantId)
      .ilike("search_terms", `%${q.toLowerCase()}%`)
      .limit(limit);

    if (error) throw error;
    return ok({ items: data ?? [], query: q });
  } catch (err) {
    return serverError(err instanceof Error ? err.message : "Internal error");
  }
}
