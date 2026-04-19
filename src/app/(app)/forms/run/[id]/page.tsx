import { notFound } from "next/navigation";
import {
  getForm,
  getPublicFormBySlug,
  listFormFields,
} from "@/lib/forms/queries";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { FormRunner } from "../../components";

export const dynamic = "force-dynamic";

type PageParams = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tenantId?: string }>;
};

export default async function FormRunnerPage({
  params,
  searchParams,
}: PageParams) {
  const { id } = await params;
  const sp = await searchParams;
  const tenantId = (sp?.tenantId?.trim() as string) || DEFAULT_TENANT_ID;

  const form =
    (await getPublicFormBySlug(id, tenantId)) ??
    (await getForm(id, tenantId));
  if (!form || !form.isPublic) notFound();

  const fields = await listFormFields(form.id, form.tenantId);

  return <FormRunner form={form} fields={fields} />;
}
