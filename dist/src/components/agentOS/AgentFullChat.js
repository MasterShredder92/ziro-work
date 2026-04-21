"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { X, Send, Loader2 } from "lucide-react";
import { cn, focusRingClassName } from "@/components/ui/utils";
import { useAgentOS } from "./AgentOSContext";
import { AgentAvatarImage } from "./AgentAvatarImage";
export function AgentFullChat() {
    var _a;
    const { fullChatOpen, closeFullChat, meta, agentId, setState } = useAgentOS();
    const [messages, setMessages] = React.useState([]);
    const [input, setInput] = React.useState("");
    const [streaming, setStreaming] = React.useState(false);
    const scrollRef = React.useRef(null);
    const abortRef = React.useRef(null);
    // Pick up a "seed" message from AgentBubble on open.
    React.useEffect(() => {
        if (!fullChatOpen)
            return;
        const handler = (e) => {
            const detail = e.detail;
            if (!(detail === null || detail === void 0 ? void 0 : detail.text))
                return;
            void send(detail.text);
        };
        window.addEventListener("ziro:agent-chat-seed", handler);
        return () => window.removeEventListener("ziro:agent-chat-seed", handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fullChatOpen, agentId]);
    // Reset on close.
    React.useEffect(() => {
        var _a;
        if (fullChatOpen)
            return;
        (_a = abortRef.current) === null || _a === void 0 ? void 0 : _a.abort();
        abortRef.current = null;
        setStreaming(false);
    }, [fullChatOpen]);
    // Auto-scroll to bottom on new content.
    React.useEffect(() => {
        const el = scrollRef.current;
        if (!el)
            return;
        el.scrollTop = el.scrollHeight;
    }, [messages]);
    const appendAssistantDelta = React.useCallback((delta) => {
        setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.role === "assistant") {
                const next = prev.slice(0, -1);
                next.push(Object.assign(Object.assign({}, last), { text: last.text + delta }));
                return next;
            }
            return [...prev, { id: cryptoId(), role: "assistant", text: delta }];
        });
    }, []);
    const send = React.useCallback(async (text) => {
        var _a;
        const trimmed = text.trim();
        if (!trimmed || streaming)
            return;
        setInput("");
        setMessages((prev) => [...prev, { id: cryptoId(), role: "user", text: trimmed }]);
        setStreaming(true);
        setState("thinking");
        const controller = new AbortController();
        abortRef.current = controller;
        try {
            // Build history from current messages (exclude the user msg we just added)
            const history = messages.map((m) => ({
                role: m.role === "user" ? "user" : "assistant",
                content: m.text,
            }));
            const res = await fetch("/api/agent/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    agentId,
                    message: trimmed,
                    context: {},
                    history,
                }),
                signal: controller.signal,
            });
            if (!res.ok) {
                const body = await res.text().catch(() => "");
                throw new Error(`${res.status} ${body || "request failed"}`);
            }
            setState("speaking");
            const j = await res.json().catch(() => null);
            const replyText = (_a = j === null || j === void 0 ? void 0 : j.reply) !== null && _a !== void 0 ? _a : "Got it.";
            appendAssistantDelta(replyText);
        }
        catch (err) {
            if ((err === null || err === void 0 ? void 0 : err.name) === "AbortError") {
                setMessages((prev) => [
                    ...prev,
                    { id: cryptoId(), role: "system", text: "Stopped." },
                ]);
            }
            else {
                const msg = err instanceof Error ? err.message : String(err);
                setMessages((prev) => [
                    ...prev,
                    { id: cryptoId(), role: "system", text: `Couldn’t reach ${meta.displayName}: ${msg}` },
                ]);
            }
        }
        finally {
            abortRef.current = null;
            setStreaming(false);
            setState("idle");
        }
    }, [agentId, appendAssistantDelta, meta.displayName, setState, streaming]);
    if (!fullChatOpen)
        return null;
    const style = {
        "--z-agent-accent": meta.accent,
        "--z-agent-glow": meta.glow,
    };
    return (_jsxs("div", { role: "dialog", "aria-modal": "true", "aria-label": `Chat with ${meta.displayName}`, className: "fixed inset-0 z-[80] flex flex-col bg-[var(--z-bg)]/95 backdrop-blur-md", style: style, children: [_jsxs("header", { className: "flex shrink-0 items-center gap-3 border-b border-[var(--z-border)] px-4 py-3 sm:px-6", children: [_jsx("div", { className: "h-10 w-10 shrink-0 overflow-hidden rounded-full border", style: { borderColor: "color-mix(in oklab, var(--z-agent-accent), transparent 35%)" }, children: _jsx(AgentAvatarImage, { src: meta.imagePath, name: meta.displayName, accent: meta.accent, className: "h-full w-full" }) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("div", { className: "truncate text-[10px] font-extrabold uppercase tracking-[0.16em]", style: { color: "var(--z-agent-accent)" }, children: "ZiroWork \u00B7 Full Chat" }), _jsx("h2", { className: "truncate text-lg font-bold tracking-tight text-[var(--z-fg)]", children: meta.displayName })] }), _jsx("button", { type: "button", onClick: closeFullChat, "aria-label": "Close", className: cn("grid h-9 w-9 place-items-center rounded-full text-[var(--z-muted)] transition-colors hover:bg-white/5 hover:text-[var(--z-fg)]", focusRingClassName()), children: _jsx(X, { size: 18, "aria-hidden": "true" }) })] }), _jsx("div", { ref: scrollRef, className: "min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-8", children: _jsxs("div", { className: "mx-auto flex max-w-3xl flex-col gap-3", children: [messages.length === 0 ? (_jsxs("div", { className: "mt-8 rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_25%)]", children: [_jsx("div", { className: "mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em]", style: { color: "var(--z-agent-accent)" }, children: meta.tagline }), "Start a conversation. Ask anything or try a quick action from the bubble."] })) : null, messages.map((m) => (_jsx(MessageBubble, { message: m }, m.id))), streaming && ((_a = messages[messages.length - 1]) === null || _a === void 0 ? void 0 : _a.role) !== "assistant" ? (_jsxs("div", { className: "flex items-center gap-2 text-xs text-[var(--z-muted)]", children: [_jsx(Loader2, { size: 12, className: "animate-spin", "aria-hidden": "true" }), _jsx("span", { children: "Thinking\u2026" })] })) : null] }) }), _jsx("form", { onSubmit: (e) => {
                    e.preventDefault();
                    void send(input);
                }, className: "shrink-0 border-t border-[var(--z-border)] bg-[var(--z-surface-2)] px-4 py-3 sm:px-8", children: _jsxs("div", { className: "mx-auto flex max-w-3xl items-end gap-2 rounded-[var(--z-radius-lg)] border bg-[var(--z-surface)] px-3 py-2 focus-within:border-[color-mix(in_oklab,var(--z-agent-accent),transparent_45%)]", style: { borderColor: "var(--z-border)" }, children: [_jsx("textarea", { value: input, onChange: (e) => setInput(e.target.value), onKeyDown: (e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    void send(input);
                                }
                            }, rows: 1, placeholder: `Message ${meta.displayName}…`, className: "min-h-[36px] max-h-40 w-full resize-none bg-transparent text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none", disabled: streaming }), streaming ? (_jsx("button", { type: "button", onClick: () => { var _a; return (_a = abortRef.current) === null || _a === void 0 ? void 0 : _a.abort(); }, className: cn("h-9 rounded-[var(--z-radius-md)] border px-3 text-xs font-semibold text-[var(--z-fg)] hover:bg-white/5", focusRingClassName()), style: { borderColor: "var(--z-border)" }, children: "Stop" })) : (_jsx("button", { type: "submit", disabled: !input.trim(), "aria-label": "Send", className: cn("grid h-9 w-9 shrink-0 place-items-center rounded-[var(--z-radius-md)] text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-50", focusRingClassName()), style: { background: "var(--z-agent-accent)" }, children: _jsx(Send, { size: 14, "aria-hidden": "true" }) }))] }) })] }));
}
function MessageBubble({ message }) {
    const isUser = message.role === "user";
    const isSystem = message.role === "system";
    return (_jsx("div", { className: cn("max-w-[85%] whitespace-pre-wrap rounded-[var(--z-radius-lg)] border px-4 py-2.5 text-sm leading-relaxed", isUser && "ml-auto", isSystem && "mx-auto text-center text-xs italic"), style: {
            borderColor: isUser
                ? "color-mix(in oklab, var(--z-agent-accent), transparent 55%)"
                : "var(--z-border)",
            background: isUser
                ? "color-mix(in oklab, var(--z-agent-accent), transparent 88%)"
                : isSystem
                    ? "transparent"
                    : "var(--z-surface)",
            color: isSystem ? "var(--z-muted)" : "var(--z-fg)",
        }, children: message.text }));
}
function cryptoId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
