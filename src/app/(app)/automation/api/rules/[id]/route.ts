import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  noContent,
  notFound,
  ok,
  readJson,
  resolveTenantId,
  serverError,
} from "@/lib/http";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import {
  deleteAutomationRule,
  getAutomationRule,
  updateAutomationRule,
} from "@/lib/automation/queries";
import type { AutomationRuleInput } from "@/lib/automation/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

type Params = { id: string };

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<Params> },
) {
  try {
    let session;
    try {
      session = await requirePermission("automation.read")();
    } catch {
      return forbidden();
    }

    const tenantId = session.tenantId || resolveTenantId(req);
    try {
      await assertTenantAccess(tenantId);
    } catch {
      return forbidden("TENANT_MISMATCH");
    }

    const { id } = await params;
    const rule = await getAutomationRule(id, tenantId);
    if (!rule) return notFound("Automation rule not found.");

    return ok({ data: rule });
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<Params> },
) {
  try {
    let session;
    try {
      session = await requirePermission("automation.write")();
    } catch {
      return forbidden();
    }

    const tenantId = session.tenantId || resolveTenantId(req);
    try {
      await assertTenantAccess(tenantId);
    } catch {
      return forbidden("TENANT_MISMATCH");
    }

    const { id } = await params;
    const body = await readJson<Partial<AutomationRuleInput>>(req);
    if (!body) return badRequest("Request body is required.");

    const rule = await updateAutomationRule(id, tenantId, body);

    await logAudit("automation.api.rules.update", {
      tenantId,
      profileId: session.userId,
      ruleId: rule.id,
      name: rule.name,
    });

    return ok({ data: rule });
  } catch (err) {
    if (err instanceof Error && err.message === "AUTOMATION_RULE_NOT_FOUND") {
      return notFound("Automation rule not found.");
    }
    return serverError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<Params> },
) {
  try {
    let session;
    try {
      session = await requirePermission("automation.write")();
    } catch {
      return forbidden();
    }

    const tenantId = session.tenantId || resolveTenantId(req);
    try {
      await assertTenantAccess(tenantId);
    } catch {
      return forbidden("TENANT_MISMATCH");
    }

    const { id } = await params;
    await deleteAutomationRule(id, tenantId);

    await logAudit("automation.api.rules.delete", {
      tenantId,
      profileId: session.userId,
      ruleId: id,
    });

    return noContent();
  } catch (err) {
    return serverError(err);
  }
}
