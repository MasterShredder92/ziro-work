import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  created,
  ok,
  readJson,
  resolveTenantId,
  serverError,
} from "@/lib/http";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import {
  createAutomationRule,
  listAutomationRules,
} from "@/lib/automation/queries";
import type { AutomationRuleInput } from "@/lib/automation/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function GET(req: NextRequest) {
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

    const rules = await listAutomationRules(tenantId);
    await logAudit("automation.api.rules.list", {
      tenantId,
      profileId: session.userId,
      count: rules.length,
    });
    return ok({ data: rules });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
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

    const body = await readJson<AutomationRuleInput>(req);
    if (!body || typeof body.name !== "string" || !body.name.trim()) {
      return badRequest("Automation rule 'name' is required.");
    }
    if (!body.trigger || typeof body.trigger.event !== "string") {
      return badRequest("Automation rule 'trigger.event' is required.");
    }

    const rule = await createAutomationRule(tenantId, {
      ...body,
      createdBy: session.userId,
    });

    await logAudit("automation.api.rules.create", {
      tenantId,
      profileId: session.userId,
      ruleId: rule.id,
      name: rule.name,
      trigger: rule.trigger?.event,
    });

    return created({ data: rule });
  } catch (err) {
    return serverError(err);
  }
}
