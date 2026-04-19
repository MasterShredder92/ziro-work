import { NextRequest, NextResponse } from "next/server";
import {
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
  deleteForm,
  deleteFormField,
  getFormWithFields,
  listFormFields,
  updateForm,
  upsertFormField,
} from "@/lib/forms/queries";
import type { FormFieldInput, FormInput, FormStatus } from "@/lib/forms/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

type UpdateBody = Partial<FormInput> & {
  fields?: FormFieldInput[];
  form?: Partial<FormInput>;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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

    const bundle = await getFormWithFields(id, tenantId);
    if (!bundle) return notFound("Form not found");

    await logAudit("forms.api.get", {
      tenantId,
      profileId: session.userId,
      formId: id,
    });
    return ok({ data: bundle });
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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

    const body = await readJson<UpdateBody>(req);
    if (!body) return ok({ data: null });

    const existing = await getFormWithFields(id, tenantId);
    if (!existing) return notFound("Form not found");

    const formInput: Partial<FormInput> = body.form ? body.form : body;

    const updated = await updateForm(id, tenantId, {
      name: formInput.name ?? existing.form.name,
      slug: formInput.slug,
      description: formInput.description,
      status: (formInput.status as FormStatus) ?? existing.form.status,
      isPublic: formInput.isPublic,
      submitLabel: formInput.submitLabel,
      successMessage: formInput.successMessage,
      successRedirectUrl: formInput.successRedirectUrl,
      settings: formInput.settings,
      updatedBy: session.userId ?? null,
    });

    if (Array.isArray(body.fields)) {
      const existingIds = new Set(existing.fields.map((f) => f.id));
      const keepIds = new Set<string>();
      for (let i = 0; i < body.fields.length; i += 1) {
        const f = body.fields[i]!;
        const isExisting = f.id && existingIds.has(f.id);
        const saved = await upsertFormField(id, tenantId, {
          id: isExisting ? f.id : undefined,
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
        keepIds.add(saved.id);
      }
      for (const f of existing.fields) {
        if (!keepIds.has(f.id)) {
          await deleteFormField(f.id, tenantId);
        }
      }
    }

    const refreshed = await getFormWithFields(id, tenantId);
    const fields = refreshed?.fields ?? (await listFormFields(id, tenantId));

    await logAudit("forms.api.update", {
      tenantId,
      profileId: session.userId,
      formId: id,
      fieldCount: fields.length,
    });

    return ok({ data: { form: updated, fields } });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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

    const existing = await getFormWithFields(id, tenantId);
    if (!existing) return notFound("Form not found");

    for (const f of existing.fields) {
      await deleteFormField(f.id, tenantId);
    }
    await deleteForm(id, tenantId);

    await logAudit("forms.api.delete", {
      tenantId,
      profileId: session.userId,
      formId: id,
    });

    return noContent();
  } catch (err) {
    return serverError(err);
  }
}
