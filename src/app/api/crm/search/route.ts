import { NextRequest } from "next/server";
import { searchCRM } from "@/lib/crm";
import { ok, serverError } from "@/lib/http";
import { resolveCRMContext } from "../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.read"],
    minRole: "student",
  });
  if ("response" in resolved) return resolved.response;
  try {
    const url = new URL(req.url);
    const term = url.searchParams.get("q") ?? "";
    const includeArchived =
      url.searchParams.get("includeArchived") === "true";
    const limitParam = Number(url.searchParams.get("limit") ?? "50");
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), 200)
      : 50;
    const type = url.searchParams.get("type");
    const result = await searchCRM(resolved.context.tenantId, term, {
      includeArchived,
      limit,
    });
    if (type === "contact") {
      return ok({ contacts: result.contacts });
    }
    return ok(result);
  } catch (err) {
    return serverError(err);
  }
}
