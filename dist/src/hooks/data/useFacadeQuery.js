import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
export function useFacadeQuery(key, query, options) {
    const enabled = (options === null || options === void 0 ? void 0 : options.enabled) !== false;
    const stableKey = useMemo(() => {
        try {
            return JSON.stringify(key);
        }
        catch (_a) {
            return String(key);
        }
    }, [key]);
    const queryRef = useRef(query);
    useEffect(() => {
        queryRef.current = query;
    }, [query]);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [nonce, setNonce] = useState(0);
    const reload = useCallback(() => setNonce((n) => n + 1), []);
    useEffect(() => {
        let cancelled = false;
        if (!enabled) {
            queueMicrotask(() => {
                if (cancelled)
                    return;
                setIsLoading(false);
                setData(null);
                setError(null);
            });
            return () => {
                cancelled = true;
            };
        }
        startTransition(() => {
            if (!cancelled)
                setIsLoading(true);
        });
        queryRef.current()
            .then((res) => {
            if (cancelled)
                return;
            if (res.error) {
                setError(res.error);
                setData(null);
                return;
            }
            setError(null);
            setData(res.data);
        })
            .catch((err) => {
            if (cancelled)
                return;
            setData(null);
            setError({
                message: err && typeof err === "object" && "message" in err
                    ? String(err.message)
                    : "Unknown error",
            });
        })
            .finally(() => {
            if (cancelled)
                return;
            setIsLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [enabled, stableKey, nonce]);
    return { data, error, isLoading, reload };
}
