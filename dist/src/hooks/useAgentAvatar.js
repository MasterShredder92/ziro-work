import { useCallback, useEffect, useRef, useState } from "react";
import { getAgentAvatarFilenameByAgentId as getAgentAvatarFilename, getAgentAvatarUrlByAgentId as getAgentAvatarUrl, } from "@/lib/agents/avatars";
export function useAgentAvatar({ agentId }) {
    const [state, setState] = useState({
        src: null,
        status: "missing",
    });
    const didRetryOnVisibleRef = useRef(false);
    const lastAttemptKeyRef = useRef(null);
    const attemptLoad = useCallback(async () => {
        const filename = getAgentAvatarFilename(agentId);
        const url = getAgentAvatarUrl(agentId);
        // If we can't even resolve an asset, treat as missing (fallback stays intact).
        if (!filename || !url) {
            setState({ src: null, status: "missing" });
            return;
        }
        const attemptKey = `${agentId}::${filename}`;
        lastAttemptKeyRef.current = attemptKey;
        // SSR guard: image probing is browser-only.
        if (typeof window === "undefined") {
            setState({ src: null, status: "missing" });
            return;
        }
        // Probe load via Image() so it uses the browser cache semantics.
        await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                if (lastAttemptKeyRef.current === attemptKey) {
                    setState({ src: url, status: "ok" });
                }
                resolve();
            };
            img.onerror = () => {
                if (lastAttemptKeyRef.current === attemptKey) {
                    setState({ src: null, status: "missing" });
                }
                resolve();
            };
            img.src = url;
        });
    }, [agentId]);
    useEffect(() => {
        didRetryOnVisibleRef.current = false;
        const id = window.setTimeout(() => {
            void attemptLoad();
        }, 0);
        return () => window.clearTimeout(id);
    }, [attemptLoad]);
    useEffect(() => {
        if (typeof document === "undefined")
            return;
        const onVisibility = () => {
            if (document.visibilityState !== "visible")
                return;
            if (didRetryOnVisibleRef.current)
                return;
            didRetryOnVisibleRef.current = true;
            void attemptLoad();
        };
        document.addEventListener("visibilitychange", onVisibility);
        return () => document.removeEventListener("visibilitychange", onVisibility);
    }, [attemptLoad]);
    return state;
}
