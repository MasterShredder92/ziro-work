import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { logAudit } from "@/lib/audit/log";
import { requirePermission } from "@/lib/auth/guards";
import { createTemplateForTenant, getTemplateSurface, listMergeFields, } from "@/lib/templates/service";
import { TemplateEditor } from "../components/TemplateEditor";
export const dynamic = "force-dynamic";
export default async function TemplateEditorPage({ params, }) {
    try {
        await requirePermission("templates.read")();
    }
    catch (_a) {
        redirect("/");
    }
    const { id } = await params;
    if (id === "new") {
        try {
            await requirePermission("templates.write")();
        }
        catch (_b) {
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
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("header", { className: "flex flex-wrap items-end justify-between gap-3", children: _jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-xs text-[var(--z-muted)]", children: _jsx(Link, { href: "/templates", className: "hover:text-[var(--z-accent)]", children: "\u2190 All templates" }) }), _jsx("h1", { className: "truncate text-xl font-semibold text-[var(--z-fg)]", children: surface.template.name }), _jsxs("p", { className: "text-sm text-[var(--z-muted)]", children: [surface.template.category, " \u00B7 ", surface.template.channel, " \u00B7 v", surface.template.currentVersion] })] }) }), _jsx(TemplateEditor, { template: surface.template, mergeFields: mergeFields.length > 0 ? mergeFields : surface.mergeFields, versions: surface.versions })] }));
}
