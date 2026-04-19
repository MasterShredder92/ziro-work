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
  createForm,
  listForms,
  upsertFormField,
} from "@/lib/forms/queries";
import type {
  FormFieldInput,
  FormInput,
  FormStatus,
} from "@/lib/forms/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

type CreateBody = Partial<FormInput> & {
  fields?: FormFieldInput[];
  form?: Partial<FormInput>;
};

export async function GET(req: NextRequest) {
  try {
    let session;
    try {
      session = await requirePermission("forms.read")();
    } catch {
      return forbidden();
    }

    const tenantId = session.tenantId || resolveTenantId(req);
    try {
      await assertTenantAccess(tenantId);
    } catch {
      return forbidden("TENANT_MISMATCH");
    }

    const forms = await listForms(tenantId);
    await logAudit("forms.api.list", {
      tenantId,
      profileId: session.userId,
      count: forms.length,
    });
    return ok({ data: forms });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    let session;
    try {
      session = await requirePermission("forms.write")();
    } catch {
      return forbidden();
    }

    const tenantId = session.tenantId || resolveTenantId(req);
    try {
      await assertTenantAccess(tenantId);
    } catch {
      return forbidden("TENANT_MISMATCH");
    }

    const body = await readJson<CreateBody>(req);
    const formInput: Partial<FormInput> = {
      ...(body?.form ?? {}),
      ...(body && !body.form
        ? {
            name: body.name,
            slug: body.slug,
            description: body.description,
            status: body.status,
            isPublic: body.isPublic,
            submitLabel: body.submitLabel,
            successMessage: body.successMessage,
            successRedirectUrl: body.successRedirectUrl,
            settings: body.settings,
          }
        : {}),
    };
    if (
      !formInput ||
      typeof formInput.name !== "string" ||
      !formInput.name.trim()
    ) {
      return badRequest("Form 'name' is required.");
    }

    const form = await createForm(tenantId, {
      name: formInput.name,
      slug: formInput.slug ?? null,
      description: formInput.description ?? null,
      status: (formInput.status as FormStatus) ?? "draft",
      isPublic: formInput.isPublic === true,
      submitLabel: formInput.submitLabel ?? null,
      successMessage: formInput.successMessage ?? null,
      successRedirectUrl: formInput.successRedirectUrl ?? null,
      settings: formInput.settings ?? {},
      createdBy: session.userId ?? null,
      updatedBy: session.userId ?? null,
    });

    if (body && Array.isArray(body.fields)) {
      for (let i = 0; i < body.fields.length; i += 1) {
        const f = body.fields[i]!;
        await upsertFormField(form.id, tenantId, {
          fieldKey: f.fieldKey,
          label: f.label,
          fieldType: f.fieldType,
          placeholder: f.placeholder ?? null,
          helpText: f.helpText ?? null,
          required: f.required === true,
          position: typeof f.position === "number" ? f.position : i,
          options: f.options ?? [],
          validationRules: f.validationRules ?? [],
          defaultValue: f.defaultValue ?? null,
          metadata: f.metadata ?? {},
          sectionId: f.sectionId ?? null,
          sectionTitle: f.sectionTitle ?? null,
        });
      }
    }

    await logAudit("forms.api.create", {
      tenantId,
      profileId: session.userId,
      formId: form.id,
      fieldCount: body?.fields?.length ?? 0,
    });

    return created({ data: form });
  } catch (err) {
    return serverError(err);
  }
}
