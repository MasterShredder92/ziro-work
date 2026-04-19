import { NextRequest } from "next/server";
import { badRequest, ok, serverError } from "@/lib/http";
import { assertTenantAccess, requireRole } from "@/lib/auth/guards";
import { getStudentDashboard } from "@/lib/student/service";
import {
  getStudentByProfileId,
  getStudentProfile,
} from "@/lib/student/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole("student")();
    const url = new URL(req.url);
    const explicitId = url.searchParams.get("studentId")?.trim() ?? "";

    let studentId = explicitId;
    let student = null;
    if (studentId) {
      student = await getStudentProfile(studentId);
    } else {
      student = await getStudentByProfileId(session.userId);
      if (student) studentId = student.id;
    }

    if (!student || !studentId) {
      return badRequest("No student record available for the current session.");
    }

    const tenantId =
      ((student as unknown as Record<string, unknown>)["tenant_id"] as
        | string
        | undefined) ?? "";
    await assertTenantAccess(tenantId);

    if (
      session.role === "student" &&
      (student as unknown as Record<string, unknown>)["profile_id"] &&
      (student as unknown as Record<string, unknown>)["profile_id"] !==
        session.userId
    ) {
      return badRequest("Session user cannot access this student record.");
    }

    const data = await getStudentDashboard(studentId);
    return ok({ data });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unable to load student dashboard.";
    if (message === "FORBIDDEN" || message === "UNAUTHENTICATED") {
      return badRequest(message);
    }
    return serverError(err);
  }
}
