import { jsx as _jsx } from "react/jsx-runtime";
import { notFound } from "next/navigation";
import { logAudit } from "@/lib/audit/log";
import { getProgramSurface } from "@/lib/curriculum";
import { ProgramDetail } from "../components";
import { resolveCurriculumContext } from "../guard";
export const dynamic = "force-dynamic";
export default async function CurriculumProgramPage({ params, }) {
    let ctx;
    try {
        ctx = await resolveCurriculumContext();
    }
    catch (_a) {
        return (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: _jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }) }));
    }
    const { programId } = await params;
    const surface = await getProgramSurface(programId, ctx.tenantId);
    if (!surface)
        notFound();
    await logAudit("curriculum.program.view", {
        tenantId: ctx.tenantId,
        profileId: ctx.session.userId,
        role: ctx.session.role,
        programId,
    });
    return _jsx(ProgramDetail, { surface: surface });
}
