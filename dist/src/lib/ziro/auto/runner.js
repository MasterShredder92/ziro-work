import { autoActionPacks } from "./actions";
function resolvePacks(packKeys) {
    if (!packKeys || packKeys.length === 0) {
        return Object.values(autoActionPacks);
    }
    const requested = new Set(packKeys);
    return Object.values(autoActionPacks).filter((pack) => requested.has(pack.key));
}
function toErrorMessage(error) {
    if (error instanceof Error)
        return error.message;
    if (typeof error === "string")
        return error;
    try {
        return JSON.stringify(error);
    }
    catch (_a) {
        return "Unknown error";
    }
}
export async function runAutoActions(input) {
    var _a, _b;
    const tenantId = ((_a = input.tenantId) !== null && _a !== void 0 ? _a : "").trim();
    if (!tenantId) {
        throw new Error("runAutoActions: tenantId is required");
    }
    const now = (_b = input.now) !== null && _b !== void 0 ? _b : new Date();
    const profileId = typeof input.profileId === "string" && input.profileId.trim().length > 0
        ? input.profileId
        : null;
    const ctx = { tenantId, profileId, now };
    const packs = resolvePacks(input.packKeys);
    const summaryStart = new Date();
    const results = [];
    for (const pack of packs) {
        for (const action of pack.actions) {
            const startedAt = new Date();
            try {
                const result = await action.handler(ctx);
                const endedAt = new Date();
                results.push({
                    pack: pack.key,
                    key: action.key,
                    triggered: Boolean(result === null || result === void 0 ? void 0 : result.triggered),
                    details: result === null || result === void 0 ? void 0 : result.details,
                    startedAt: startedAt.toISOString(),
                    endedAt: endedAt.toISOString(),
                    durationMs: endedAt.getTime() - startedAt.getTime(),
                });
            }
            catch (error) {
                const endedAt = new Date();
                results.push({
                    pack: pack.key,
                    key: action.key,
                    triggered: false,
                    error: toErrorMessage(error),
                    startedAt: startedAt.toISOString(),
                    endedAt: endedAt.toISOString(),
                    durationMs: endedAt.getTime() - startedAt.getTime(),
                });
            }
        }
    }
    const summaryEnd = new Date();
    return {
        tenantId,
        profileId,
        startedAt: summaryStart.toISOString(),
        endedAt: summaryEnd.toISOString(),
        durationMs: summaryEnd.getTime() - summaryStart.getTime(),
        results,
    };
}
