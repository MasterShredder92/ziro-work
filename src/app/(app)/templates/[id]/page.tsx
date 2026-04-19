import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { logAudit } from "@/lib/audit/log";
import { requirePermission } from "@/lib/auth/guards";
import {
  createTemplateForTenant,
  getTemplateSurface,
  listMergeFields,
} from "@/lib/templates/service";
import { TemplateEditor } from "../components/TemplateEditor";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function TemplateEditorPage({
  params,
}: {
  params: Params;
}) {
  try {
    await requirePermission("templates.read")();
  } catch {
    redirect("/");
  }

  const { id } = await params;

  if (id === "new") {
    try {
      await requirePermission("templates.write")();
    } catch {
      redirect("/templates");
    }
    const created = await createTemplateForTenant({
      name: "Untitled template",
      description: null,
      category: "general",
      channel: "email",
      subject: null,
      body: "Hello {{student.firstName}},\n\n",
    });
    redirect(`/templates/${created.id}`);
  }

  const [surface, mergeFields] = await Promise.all([
    getTemplateSurface(id),
    listMergeFields(),
  ]);

  if (!surface) {
    notFound();
  }

  await logAudit("templates.editor.view", {
    tenantId: surface.template.tenantId,
    templateId: surface.template.id,
    versionCount: surface.versions.length,
    source: "templates_os",
  });

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-[var(--z-muted)]">
            <Link
              href="/templates"
              className="hover:text-[var(--z-accent)]"
            >
              ← All templates
            </Link>
          </div>
          <h1 className="truncate text-xl font-semibold text-[var(--z-fg)]">
            {surface.template.name}
          </h1>
          <p className="text-sm text-[var(--z-muted)]">
            {surface.template.category} · {surface.template.channel} · v
            {surface.template.currentVersion}
          </p>
        </div>
      </header>

      <TemplateEditor
        template={surface.template}
        mergeFields={mergeFields.length > 0 ? mergeFields : surface.mergeFields}
        versions={surface.versions}
      />
    </div>
  );
}
