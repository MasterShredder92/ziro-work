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

type DependencyTuple = readonly unknown[];

export function createMemoSelector<TArgs extends unknown[], TDeps extends DependencyTuple, TResult>(
  depsOf: (...args: TArgs) => TDeps,
  compute: (deps: TDeps) => TResult,
): (...args: TArgs) => TResult {
  let lastDeps: TDeps | null = null;
  let lastResult: TResult;
  return (...args: TArgs): TResult => {
    const deps = depsOf(...args);
    if (lastDeps && sameDeps(lastDeps, deps)) return lastResult;
    lastDeps = deps;
    lastResult = compute(deps);
    return lastResult;
  };
}

function sameDeps(a: DependencyTuple, b: DependencyTuple): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
}

/**
 * Equality-aware memo — recomputes when any dep fails the provided comparator.
 * Useful when deps are deeply equal but not reference-equal (e.g., parsed JSON).
 */
export function createDeepMemoSelector<TArgs extends unknown[], TDeps extends DependencyTuple, TResult>(
  depsOf: (...args: TArgs) => TDeps,
  compute: (deps: TDeps) => TResult,
  isEqual: (a: unknown, b: unknown) => boolean,
): (...args: TArgs) => TResult {
  let lastDeps: TDeps | null = null;
  let lastResult: TResult;
  return (...args: TArgs): TResult => {
    const deps = depsOf(...args);
    if (lastDeps && lastDeps.length === deps.length && lastDeps.every((d, i) => isEqual(d, deps[i]))) {
      return lastResult;
    }
    lastDeps = deps;
    lastResult = compute(deps);
    return lastResult;
  };
}
