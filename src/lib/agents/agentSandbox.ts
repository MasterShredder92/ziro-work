export async function runSafe<T>(
  fn: () => Promise<T>
): Promise<{ ok: true; result: T } | { ok: false; error: unknown }> {
  try {
    const result = await fn();
    return { ok: true, result };
  } catch (error) {
    return { ok: false, error };
  }
}

