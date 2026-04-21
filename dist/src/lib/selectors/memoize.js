/**
 * Tiny memoized-selector primitive for heavy UI components.
 *
 * This is NOT a Redux/Reselect clone — it's a minimal last-input cache that
 * re-runs when any dependency's reference changes. Use for computed
 * derivations (e.g., sorting, grouping, filtering) that are stable between
 * renders but expensive to recompute.
 *
 * Usage:
 *   const selectStudentsByGrade = createMemoSelector(
 *     (students: Student[], grade: string) => [students, grade] as const,
 *     ([students, grade]) => students.filter((s) => s.grade === grade),
 *   );
 *
 *   const byGrade = selectStudentsByGrade(students, grade);
 */
export function createMemoSelector(depsOf, compute) {
    let lastDeps = null;
    let lastResult;
    return (...args) => {
        const deps = depsOf(...args);
        if (lastDeps && sameDeps(lastDeps, deps))
            return lastResult;
        lastDeps = deps;
        lastResult = compute(deps);
        return lastResult;
    };
}
function sameDeps(a, b) {
    if (a.length !== b.length)
        return false;
    for (let i = 0; i < a.length; i++) {
        if (!Object.is(a[i], b[i]))
            return false;
    }
    return true;
}
/**
 * Equality-aware memo — recomputes when any dep fails the provided comparator.
 * Useful when deps are deeply equal but not reference-equal (e.g., parsed JSON).
 */
export function createDeepMemoSelector(depsOf, compute, isEqual) {
    let lastDeps = null;
    let lastResult;
    return (...args) => {
        const deps = depsOf(...args);
        if (lastDeps && lastDeps.length === deps.length && lastDeps.every((d, i) => isEqual(d, deps[i]))) {
            return lastResult;
        }
        lastDeps = deps;
        lastResult = compute(deps);
        return lastResult;
    };
}
