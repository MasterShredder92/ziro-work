import { NextRequest, NextResponse } from "next/server";
import { badRequest, readJson, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { getSession } from "@/lib/auth/session";
import { submitForm, submitPublicFormBySlug } from "@/lib/forms/service";
import { getForm, getPublicFormBySlug } from "@/lib/forms/queries";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import type { FormSubmissionAnswer } from "@/lib/forms/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RunBody = {
  formId?: string;
  slug?: string;
  tenantId?: string;
  answers?: FormSubmissionAnswer[] | Record<string, unknown>;
  startedAt?: string;
  durationMs?: number;
  source?: string;
  clientMetadata?: Record<string, unknown>;
  profileId?: string | null;
};

function normalizeAnswers(
  raw: FormSubmissionAnswer[] | Record<string, unknown> | undefined,
): FormSubmissionAnswer[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .filter((a): a is FormSubmissionAnswer =>
        Boolean(a && typeof a === "object" && "fieldKey" in a),
      )
      .map((a) => ({
        fieldId: a.fieldId ?? "",
        fieldKey: a.fieldKey ?? "",
        label: a.label ?? a.fieldKey ?? "",
        value: a.value,
        answeredAt: a.answeredAt,
      }));
  }
  return Object.entries(raw).map(([key, value]) => ({
    fieldId: "",
    fieldKey: key,
    label: key,
    value,
  }));
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await readJson<RunBody>(req);
    if (!body) return badRequest("Invalid JSON body.");
    const hasFormId = typeof body.formId === "string" && body.formId.trim();
    const hasSlug = typeof body.slug === "string" && body.slug.trim();
    if (!hasFormId && !hasSlug) {
      return badRequest("'formId' or 'slug' is required.");
    }
    if (!body.answers) {
      return badRequest("'answers' is required.");
    }

    const session = await getSession();
    const tenantId =
      session?.tenantId ||
      (typeof body.tenantId === "string" && body.tenantId.trim()) ||
      DEFAULT_TENANT_ID;

    const profileId = body.profileId ?? session?.userId ?? null;
    const answers = normalizeAnswers(body.answers);

    if (hasSlug) {
      const slug = body.slug!.trim();
      const form = await getPublicFormBySlug(slug, tenantId);
      if (!form) return badRequest("Form not found.");
      if (form.status === "archived") {
        return badRequest("This form is no longer accepting responses.");
      }
      const result = await submitPublicFormBySlug(slug, tenantId, answers, {
        profileId,
        submittedBy: profileId,
        startedAt: body.startedAt ?? null,
        metadata: body.clientMetadata ?? undefined,
      });
      await logAudit("forms.api.run.completed", {
        tenantId,
        profileId,
        formId: form.id,
        submissionId: result.submission.id,
        ok: result.validation.valid,
        issueCount: result.validation.issues.length,
      });
      return NextResponse.json(
        {
          ok: result.validation.valid,
          submission: result.submission,
          validation: result.validation,
          redirectUrl: form.successRedirectUrl ?? null,
          message: form.successMessage ?? null,
          automationsDispatched: result.automationsDispatched,
        },
        { status: result.validation.valid ? 200 : 422 },
      );
    }

    const formId = body.formId!.trim();
    const form = await getForm(formId, tenantId);
    if (!form) return badRequest("Form not found.");
    if (form.status === "archived") {
      return badRequest("This form is no longer accepting responses.");
    }

    await logAudit("forms.api.run.received", {
      tenantId,
      profileId,
      formId: form.id,
      source: body.source ?? null,
    });

    const result = await submitForm(form.id, answers, {
      tenantId,
      profileId,
      submittedBy: profileId,
      startedAt: body.startedAt ?? null,
      metadata: body.clientMetadata ?? undefined,
    });

    await logAudit("forms.api.run.completed", {
      tenantId,
      profileId,
      formId: form.id,
      submissionId: result.submission.id,
      ok: result.validation.valid,
      issueCount: result.validation.issues.length,
    });

    return NextResponse.json(
      {
        ok: result.validation.valid,
        submission: result.submission,
        validation: result.validation,
        redirectUrl: form.successRedirectUrl ?? null,
        message: form.successMessage ?? null,
        automationsDispatched: result.automationsDispatched,
      },
      { status: result.validation.valid ? 200 : 422 },
    );
  } catch (err) {
    return serverError(err);
  }
}
