import { lifecycleStages } from "./stages";
export function isLifecycleStageId(x) {
    return lifecycleStages.some((s) => s.id === x);
}
export function assertValidStageId(id) {
    if (!isLifecycleStageId(id))
        throw new Error(`Invalid lifecycle stage id: ${id}`);
}
export function listStageIds() {
    return lifecycleStages.map((s) => s.id);
}
export function getNextStageId(id) {
    var _a, _b;
    const idx = lifecycleStages.findIndex((s) => s.id === id);
    if (idx < 0)
        return null;
    return ((_b = (_a = lifecycleStages[idx + 1]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null);
}
export function summarizeBlockers(blockers) {
    return blockers.map((b) => b.message);
}
