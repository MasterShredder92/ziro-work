"use server";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { buildLifecycleContext } from "@/lib/lifecycle/buildContext";
import { computeStage } from "@/lib/lifecycle/computeStage";
import { buildTimeline } from "@/lib/lifecycle/buildTimeline";
import { summarizeBlockers } from "@/lib/lifecycle/helpers";
import { getServiceClient } from "@/lib/supabase";
function formatAgentDisplayName(raw) {
    var _a;
    const table = {
        star: "STAR",
        ziro: "Ziro",
        ruby: "Ruby",
        stewie: "Stewie",
        vader: "Vader",
        bub: "Bub",
        sid: "Sid",
    };
    return (_a = table[raw]) !== null && _a !== void 0 ? _a : raw.replace(/-/g, " ");
}
function nextStepLabel(computed) {
    var _a, _b;
    if (computed.blockers.length > 0) {
        return (_b = (_a = computed.blockers[0]) === null || _a === void 0 ? void 0 : _a.message) !== null && _b !== void 0 ? _b : "Resolve blockers";
    }
    if (computed.next)
        return `Advance to ${computed.next.name}`;
    return `Complete ${computed.stage.name}`;
}
export async function loadStudentSurface(studentId, tenantId) {
    try {
        await requirePermission("students.read")();
        if (!tenantId.trim()) {
            return { ok: false, error: "Missing tenant id (set ZIRO_DEV_TENANT_ID or NEXT_PUBLIC_ZIRO_DEV_TENANT_ID)." };
        }
        await assertTenantAccess(tenantId.trim());
        await logAudit("students.surface.load", {
            studentId,
            tenantId: tenantId.trim(),
        });
        const supabase = getServiceClient();
        const { data: student, error } = await supabase.from("students").select("*").eq("id", studentId).maybeSingle();
        if (error)
            return { ok: false, error: error.message };
        if (!student)
            return { ok: false, error: "Student not found" };
        if (student.tenant_id !== tenantId.trim()) {
            return { ok: false, error: "Tenant mismatch" };
        }
        const ctx = await buildLifecycleContext(studentId);
        const computed = computeStage(ctx);
        const timeline = await buildTimeline(studentId);
        const def = computed.stage;
        const agentDisplayName = formatAgentDisplayName(def.agent);
        const blockers = summarizeBlockers(computed.blockers);
        const nextStep = nextStepLabel(computed);
        const nextActions = [];
        for (const b of computed.blockers) {
            nextActions.push(b.message);
        }
        if (computed.next && computed.blockers.length === 0) {
            nextActions.push(`Move forward to ${computed.next.name}`);
        }
        if (nextActions.length === 0) {
            nextActions.push(`Align work with ${def.name} exit criteria.`);
        }
        const rawStudent = student;
        const studentName = [rawStudent.first_name, rawStudent.last_name].filter(Boolean).join(" ") || rawStudent.name || "Student";
        const agentSummary = `${studentName} is in ${def.name}. Risk band is ${ctx.riskBand}.`;
        return {
            ok: true,
            data: {
                studentId,
                studentName,
                stageName: def.name,
                stageDescription: def.description,
                agentKey: def.agent,
                agentDisplayName,
                blockers,
                nextStep,
                riskBand: ctx.riskBand,
                agentSummary,
                nextActions,
                timeline,
            },
        };
    }
    catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Failed to load student" };
    }
}
