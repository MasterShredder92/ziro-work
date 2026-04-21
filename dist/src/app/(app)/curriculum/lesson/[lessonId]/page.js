import { jsx as _jsx } from "react/jsx-runtime";
import { notFound } from "next/navigation";
import { logAudit } from "@/lib/audit/log";
import { getLessonSurface } from "@/lib/curriculum";
import { LessonDetail } from "../../components";
import { resolveCurriculumContext } from "../../guard";
export const dynamic = "force-dynamic";
export default async function CurriculumLessonPage({ params, }) {
    var _a, _b;
    let ctx;
    try {
        ctx = await resolveCurriculumContext();
    }
    catch (_c) {
        return (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: _jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }) }));
    }
    const { lessonId } = await params;
    const surface = await getLessonSurface(lessonId, ctx.tenantId);
    if (!surface)
        notFound();
    await logAudit("curriculum.lesson.view", {
        tenantId: ctx.tenantId,
        profileId: ctx.session.userId,
        role: ctx.session.role,
        lessonId,
        programId: (_b = (_a = surface.program) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null,
    });
    return _jsx(LessonDetail, { surface: surface });
}
