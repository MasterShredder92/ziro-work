import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/guards";
import {
  getFamilyProfile,
  resolveCurrentFamilyId,
} from "@/lib/family/queries";
import { getFamilyDashboard } from "@/lib/family/service";
import { badRequest, ok, serverError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole("family")();
    const url = new URL(req.url);
    let familyId = url.searchParams.get("familyId")?.trim() ?? "";

    if (!familyId) {
      const resolved = await resolveCurrentFamilyId(
        session.userId,
        session.tenantId,
      );
      if (!resolved) {
        const fallback = await getFamilyProfile(session.userId);
        familyId = fallback?.id ?? "";
      } else {
        familyId = resolved;
      }
    }

    if (!familyId) {
      return badRequest("No family id available for current session");
    }

    const data = await getFamilyDashboard(familyId);
    return ok({ data });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return badRequest("Forbidden");
    }
    return serverError(err);
  }
}
