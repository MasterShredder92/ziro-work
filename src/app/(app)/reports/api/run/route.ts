import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  ok,
  readJson,
  resolveTenantId,
  serverError,
} from "@/lib/http";
import {
  assertTenantAccess,
  requirePermission,
} from "@/lib/auth/guards";
import { runReport } from "@/lib/reports/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RunPayload = {
  reportId?: string;
  params?: Record<string, unknown>;
};

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    let session;
    try {
      session = await requirePermission("reports.read")();
    } catch {
      return forbidden();
    }

    const tenantId = session?.tenantId ?? resolveTenantId(req);

    try {
      await assertTenantAccess(tenantId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "TENANT_MISMATCH";
      return forbidden(message);
    }

    const body = await readJson<RunPayload>(req);
    if (!body || typeof body.reportId !== "string" || body.reportId.trim().length === 0) {
      return badRequest("reportId is required");
    }

    const outcome = await runReport(body.reportId.trim(), body.params ?? {}, {
      tenantId,
      profileId: session?.userId ?? null,
      role: session?.role ?? null,
    });

    if (!outcome.ok) {
      const code = outcome.error?.code ?? "ERROR";
      const message = outcome.error?.message ?? "Report run failed";
      if (code === "FORBIDDEN") return forbidden(message);
      if (code === "NOT_FOUND") {
        return NextResponse.json({ error: message }, { status: 404 });
      }
      return NextResponse.json(
        { error: message, execution: outcome.execution },
        { status: 400 },
      );
    }

    return ok({ data: outcome.result, execution: outcome.execution });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return forbidden();
    }
    return serverError(err);
  }
}
