import "server-only";
import { invokeSkill, } from "./skillInvoker";
function mergeInput(step, opts) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    return {
        input: (_a = step.input) !== null && _a !== void 0 ? _a : "",
        tenantId: (_c = (_b = step.tenantId) !== null && _b !== void 0 ? _b : opts.tenantId) !== null && _c !== void 0 ? _c : null,
        profileId: (_e = (_d = step.profileId) !== null && _d !== void 0 ? _d : opts.profileId) !== null && _e !== void 0 ? _e : null,
        conversationId: (_g = (_f = step.conversationId) !== null && _f !== void 0 ? _f : opts.conversationId) !== null && _g !== void 0 ? _g : null,
        agent: (_h = step.agentId) !== null && _h !== void 0 ? _h : null,
    };
}
export async function runWorkflow(steps, opts = {}) {
    const results = [];
    const failures = [];
    if (!Array.isArray(steps) || steps.length === 0) {
        return { ok: true, results, failures };
    }
    for (const step of steps) {
        if (!step || typeof step.skillId !== "string" || step.skillId.length === 0) {
            const bad = {
                step: step !== null && step !== void 0 ? step : {},
                result: { ok: false, source: null, error: "STEP_SKILL_ID_REQUIRED" },
            };
            results.push(bad);
            failures.push(bad);
            if (opts.stopOnFailure)
                break;
            continue;
        }
        const args = mergeInput(step, opts);
        const result = await invokeSkill(step.skillId, args);
        const entry = { step, result };
        results.push(entry);
        if (!result.ok) {
            failures.push(entry);
            if (opts.stopOnFailure)
                break;
        }
    }
    return {
        ok: failures.length === 0,
        results,
        failures,
    };
}
export async function runWorkflowParallel(steps, opts = {}) {
    const results = [];
    const failures = [];
    if (!Array.isArray(steps) || steps.length === 0) {
        return { ok: true, results, failures };
    }
    const settled = await Promise.all(steps.map(async (step) => {
        if (!step || typeof step.skillId !== "string" || step.skillId.length === 0) {
            return {
                step: step !== null && step !== void 0 ? step : {},
                result: {
                    ok: false,
                    source: null,
                    error: "STEP_SKILL_ID_REQUIRED",
                },
            };
        }
        const args = mergeInput(step, opts);
        const result = await invokeSkill(step.skillId, args);
        return { step, result };
    }));
    for (const entry of settled) {
        results.push(entry);
        if (!entry.result.ok)
            failures.push(entry);
    }
    return {
        ok: failures.length === 0,
        results,
        failures,
    };
}
