"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from "react";
import { AgentAvatarImage } from "@/components/agentOS/AgentAvatarImage";
const RUBY_IMAGE = "/static/agents/ruby.png";
const RUBY_ACCENT = "#fb923c";
const RUBY_GLOW = "rgba(251,146,60,0.35)";
const IDLE_LINES = [
    "Ready when you are.",
    "All clear — schedule looks good.",
    "I'm watching everything. You're good.",
    "Nothing to flag right now.",
    "Tap me if you need anything.",
];
function randomIdle() {
    return IDLE_LINES[Math.floor(Math.random() * IDLE_LINES.length)];
}
export function RubyScheduleBar({ locationName, selectedDate, event }) {
    var _a;
    const [chatOpen, setChatOpen] = React.useState(false);
    const [chatInput, setChatInput] = React.useState("");
    const [messages, setMessages] = React.useState([
        {
            role: "ruby",
            text: `Hey — I'm Ruby, your scheduling assistant for ${locationName}. I can move students, change block types, flag conflicts, or answer questions. What do you need?`,
        },
    ]);
    const [chatLoading, setChatLoading] = React.useState(false);
    const [idleLine] = React.useState(randomIdle);
    const messagesEndRef = React.useRef(null);
    React.useEffect(() => {
        var _a;
        (_a = messagesEndRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    const isConflict = (event === null || event === void 0 ? void 0 : event.type) === "conflict" || (event === null || event === void 0 ? void 0 : event.type) === "error";
    const isSuccess = (event === null || event === void 0 ? void 0 : event.type) === "book_student" || (event === null || event === void 0 ? void 0 : event.type) === "check_in" || (event === null || event === void 0 ? void 0 : event.type) === "sub_added";
    const isAction = (event === null || event === void 0 ? void 0 : event.type) === "call_out" || (event === null || event === void 0 ? void 0 : event.type) === "go_virtual" || (event === null || event === void 0 ? void 0 : event.type) === "move_student";
    const glowColor = isConflict ? "#ef4444" : isSuccess ? "#22c55e" : isAction ? "#f59e0b" : RUBY_ACCENT;
    const statusText = (_a = event === null || event === void 0 ? void 0 : event.message) !== null && _a !== void 0 ? _a : idleLine;
    const statusTextColor = isConflict ? "#fca5a5" : isSuccess ? "#86efac" : isAction ? "#fde68a" : "#94a3b8";
    async function sendChat() {
        const text = chatInput.trim();
        if (!text || chatLoading)
            return;
        setChatInput("");
        const newMessages = [...messages, { role: "user", text }];
        setMessages(newMessages);
        setChatLoading(true);
        try {
            // Build history for the API (exclude the initial greeting)
            const history = newMessages.slice(1).map((m) => ({
                role: m.role === "ruby" ? "assistant" : "user",
                content: m.text,
            }));
            const res = await fetch("/api/ruby/chat", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    message: text,
                    context: { locationName, selectedDate, recentEvent: event },
                    history: history.slice(0, -1), // exclude the message we just added
                }),
            });
            if (res.ok) {
                const j = await res.json().catch(() => null);
                setMessages((prev) => { var _a; return [...prev, { role: "ruby", text: (_a = j === null || j === void 0 ? void 0 : j.reply) !== null && _a !== void 0 ? _a : "Got it." }]; });
            }
            else {
                setMessages((prev) => [...prev, { role: "ruby", text: "Hit a snag — try again in a second." }]);
            }
        }
        catch (_a) {
            setMessages((prev) => [...prev, { role: "ruby", text: "Can't reach the server right now. Try again in a sec." }]);
        }
        finally {
            setChatLoading(false);
        }
    }
    return (_jsxs(_Fragment, { children: [_jsxs("button", { type: "button", onClick: () => setChatOpen(true), className: "flex sm:hidden items-center gap-2 rounded-xl px-2.5 py-1.5 transition-all hover:bg-white/5", style: {
                    background: `linear-gradient(135deg, ${RUBY_ACCENT}10 0%, transparent 60%)`,
                    border: `1px solid ${glowColor}35`,
                }, "aria-label": "Open Ruby chat", children: [_jsxs("div", { className: "relative shrink-0", children: [_jsx("div", { className: "absolute inset-0 rounded-full animate-ping opacity-20", style: { backgroundColor: glowColor, animationDuration: "3s" } }), _jsx("div", { className: "relative h-8 w-8 overflow-hidden rounded-full", style: { border: `2px solid ${glowColor}80` }, children: _jsx(AgentAvatarImage, { src: RUBY_IMAGE, name: "Ruby", accent: RUBY_ACCENT, className: "h-full w-full object-cover" }) })] }), _jsx("span", { className: "text-xs font-black tracking-tight", style: { color: RUBY_ACCENT }, children: "Ruby" }), isConflict && _jsx("span", { className: "h-2 w-2 rounded-full bg-red-400 animate-pulse" })] }), _jsxs("button", { type: "button", onClick: () => setChatOpen(true), className: "hidden sm:flex items-center gap-3 rounded-2xl px-4 py-2 transition-all hover:bg-white/5 group", style: {
                    background: `linear-gradient(135deg, ${RUBY_ACCENT}10 0%, transparent 60%)`,
                    border: `1px solid ${glowColor}35`,
                    boxShadow: `0 0 24px ${glowColor}20`,
                    minWidth: 220,
                }, "aria-label": "Open Ruby chat", title: "Ask Ruby", children: [_jsxs("div", { className: "relative shrink-0", children: [_jsx("div", { className: "absolute inset-0 rounded-full animate-ping opacity-25", style: { backgroundColor: glowColor, animationDuration: "3s" } }), _jsx("div", { className: "relative h-14 w-14 overflow-hidden rounded-full", style: {
                                    boxShadow: `0 0 22px ${glowColor}70`,
                                    border: `2.5px solid ${glowColor}80`,
                                }, children: _jsx(AgentAvatarImage, { src: RUBY_IMAGE, name: "Ruby", accent: RUBY_ACCENT, className: "h-full w-full object-cover" }) })] }), _jsxs("div", { className: "text-left min-w-0 flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-base font-black tracking-tight", style: { color: RUBY_ACCENT }, children: "Ruby" }), _jsx("span", { className: "rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest", style: { borderColor: `${RUBY_ACCENT}40`, color: RUBY_ACCENT, backgroundColor: `${RUBY_ACCENT}10` }, children: "AI" }), isConflict && (_jsx("span", { className: "rounded-full bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-300 animate-pulse", children: "\u26A0 Alert" }))] }), _jsx("p", { className: "text-[11px] leading-snug truncate max-w-[200px] transition-all duration-500 mt-0.5", style: { color: statusTextColor }, children: statusText }), _jsx("p", { className: "text-[9px] mt-0.5 opacity-50", style: { color: RUBY_ACCENT }, children: "Tap to chat" })] })] }), chatOpen && (_jsxs(_Fragment, { children: [_jsx("div", { className: "fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm", onClick: () => setChatOpen(false), "aria-hidden": true }), _jsxs("div", { className: "fixed left-1/2 top-1/2 z-[10001] flex w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border shadow-2xl", style: {
                            borderColor: `${RUBY_ACCENT}55`,
                            backgroundColor: "#0a0a0e",
                            height: "min(600px, 85vh)",
                        }, role: "dialog", "aria-modal": "true", "aria-label": "Ruby chat", children: [_jsxs("div", { className: "flex items-center gap-3 border-b border-[var(--z-border)] px-5 py-4", children: [_jsx("div", { className: "h-10 w-10 shrink-0 overflow-hidden rounded-full", style: { border: `1.5px solid ${RUBY_ACCENT}60`, boxShadow: `0 0 16px ${RUBY_GLOW}` }, children: _jsx(AgentAvatarImage, { src: RUBY_IMAGE, name: "Ruby", accent: RUBY_ACCENT, className: "h-full w-full" }) }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-black text-[var(--z-fg)]", children: "Ruby" }), _jsxs("div", { className: "text-[10px] text-[var(--z-muted)]", children: ["Schedule AI \u00B7 ", locationName, " \u00B7 ", selectedDate] })] }), _jsx("button", { type: "button", onClick: () => setChatOpen(false), className: "ml-auto rounded-lg p-1.5 text-[var(--z-muted)] hover:bg-white/5 hover:text-[var(--z-fg)] transition-colors", "aria-label": "Close", children: _jsx("svg", { viewBox: "0 0 16 16", fill: "none", className: "h-4 w-4", "aria-hidden": true, children: _jsx("path", { d: "M4 4l8 8M12 4l-8 8", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }) }) })] }), _jsxs("div", { className: "flex-1 overflow-y-auto px-5 py-4 space-y-3", children: [messages.map((msg, i) => (_jsxs("div", { className: `flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`, children: [msg.role === "ruby" && (_jsx("div", { className: "h-7 w-7 shrink-0 overflow-hidden rounded-full", style: { border: `1px solid ${RUBY_ACCENT}60`, boxShadow: `0 0 8px ${RUBY_GLOW}` }, children: _jsx(AgentAvatarImage, { src: RUBY_IMAGE, name: "Ruby", accent: RUBY_ACCENT, className: "h-full w-full" }) })), _jsx("div", { className: `max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user"
                                                    ? "rounded-tr-sm bg-[var(--z-surface-2)] text-[var(--z-fg)]"
                                                    : "rounded-tl-sm text-[var(--z-fg)]"}`, style: msg.role === "ruby"
                                                    ? { backgroundColor: `${RUBY_ACCENT}12`, border: `1px solid ${RUBY_ACCENT}25` }
                                                    : {}, children: msg.text })] }, i))), chatLoading && (_jsxs("div", { className: "flex gap-2", children: [_jsx("div", { className: "h-7 w-7 shrink-0 overflow-hidden rounded-full", style: { border: `1px solid ${RUBY_ACCENT}60` }, children: _jsx(AgentAvatarImage, { src: RUBY_IMAGE, name: "Ruby", accent: RUBY_ACCENT, className: "h-full w-full" }) }), _jsx("div", { className: "rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm", style: { backgroundColor: `${RUBY_ACCENT}12`, border: `1px solid ${RUBY_ACCENT}25` }, children: _jsxs("span", { className: "inline-flex gap-1", children: [_jsx("span", { className: "animate-bounce", style: { animationDelay: "0ms" }, children: "\u00B7" }), _jsx("span", { className: "animate-bounce", style: { animationDelay: "150ms" }, children: "\u00B7" }), _jsx("span", { className: "animate-bounce", style: { animationDelay: "300ms" }, children: "\u00B7" })] }) })] })), _jsx("div", { ref: messagesEndRef })] }), _jsx("div", { className: "border-t border-[var(--z-border)] px-4 py-3", children: _jsxs("form", { onSubmit: (e) => { e.preventDefault(); sendChat(); }, className: "flex items-center gap-2", children: [_jsx("input", { type: "text", value: chatInput, onChange: (e) => setChatInput(e.target.value), placeholder: "Ask Ruby anything about the schedule\u2026", className: "flex-1 rounded-xl border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3.5 py-2.5 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none transition-colors", autoFocus: true }), _jsx("button", { type: "submit", disabled: !chatInput.trim() || chatLoading, className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border disabled:opacity-40 transition-colors", style: { borderColor: `${RUBY_ACCENT}40`, backgroundColor: `${RUBY_ACCENT}15`, color: RUBY_ACCENT }, "aria-label": "Send", children: _jsx("svg", { viewBox: "0 0 16 16", fill: "none", className: "h-4 w-4", "aria-hidden": true, children: _jsx("path", { d: "M2 8l12-6-6 12V8H2z", fill: "currentColor" }) }) })] }) })] })] }))] }));
}
