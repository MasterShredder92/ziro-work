"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
/**
 * URL: ?sort=<columnKey>&dir=asc|desc
 * Toggle: none → asc → desc → none (removes sort params).
 */
export function useCrmSort(tableId) {
    void tableId;
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const sortKey = useMemo(() => {
        const s = searchParams.get("sort");
        return s && s.length > 0 ? s : null;
    }, [searchParams]);
    const sortDir = useMemo(() => {
        const d = searchParams.get("dir");
        return d === "asc" || d === "desc" ? d : null;
    }, [searchParams]);
    const applySortToUrl = useCallback((nextSort, nextDir) => {
        const next = new URLSearchParams(searchParams.toString());
        if (nextSort && nextDir) {
            next.set("sort", nextSort);
            next.set("dir", nextDir);
        }
        else {
            next.delete("sort");
            next.delete("dir");
        }
        const q = next.toString();
        router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    }, [pathname, router, searchParams]);
    const toggleSort = useCallback((columnKey) => {
        const currentKey = searchParams.get("sort");
        const currentDir = searchParams.get("dir");
        if (currentKey !== columnKey) {
            applySortToUrl(columnKey, "asc");
            return;
        }
        if (currentDir === "asc") {
            applySortToUrl(columnKey, "desc");
            return;
        }
        if (currentDir === "desc") {
            applySortToUrl(null, null);
            return;
        }
        applySortToUrl(columnKey, "asc");
    }, [applySortToUrl, searchParams]);
    return {
        sortKey,
        sortDir,
        toggleSort,
        applySortToUrl,
    };
}
