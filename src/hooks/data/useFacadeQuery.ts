import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";

export type FacadeErrorInfo = { message: string; code?: string };

export type FacadeResult<T> =
  | { data: T; error: null }
  | { data: null; error: FacadeErrorInfo };

export interface UseFacadeQueryState<T> {
  data: T | null;
  error: FacadeErrorInfo | null;
  isLoading: boolean;
  reload: () => void;
}

export function useFacadeQuery<T>(
  key: unknown[],
  query: () => Promise<FacadeResult<T>>,
  options?: { enabled?: boolean }
): UseFacadeQueryState<T> {
  const enabled = options?.enabled !== false;
  const stableKey = useMemo(() => {
    try {
      return JSON.stringify(key);
    } catch {
      return String(key);
    }
  }, [key]);
  const queryRef = useRef(query);
  useEffect(() => {
    queryRef.current = query;
  }, [query]);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<FacadeErrorInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    if (!enabled) {
      queueMicrotask(() => {
        if (cancelled) return;
        setIsLoading(false);
        setData(null);
        setError(null);
      });
      return () => {
        cancelled = true;
      };
    }

    startTransition(() => {
      if (!cancelled) setIsLoading(true);
    });

    queryRef.current()
      .then((res) => {
        if (cancelled) return;
        if (res.error) {
          setError(res.error);
          setData(null);
          return;
        }
        setError(null);
        setData(res.data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setData(null);
        setError({
          message:
            err && typeof err === "object" && "message" in err
              ? String((err as { message?: unknown }).message)
              : "Unknown error",
        });
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, stableKey, nonce]);

  return { data, error, isLoading, reload };
}

