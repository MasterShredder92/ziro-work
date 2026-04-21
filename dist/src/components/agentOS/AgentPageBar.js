"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from "react";
import { AgentAvatarImage } from "./AgentAvatarImage";
import { AGENT_METADATA } from "@/lib/agents/agentMetadata";
const IDLE_LINES_BY_AGENT = {
    ruby: [
        "Ready when you are.",
        "All clear — schedule looks good.",
        "I'm watching everything.",
        "Nothing to flag right now.",
    ],
    bub: [
        "Money in, money out — I'm on it.",
        "Watching your revenue.",
        "Ready to pull the numbers.",
        "Ask me about any invoice.",
    ],
    star: [
        "Your leads are ready.",
        "I know who to call first.",
        "Watching your pipeline.",
        "Ready to prioritize.",
    ],
    stewie: [
        "Watching retention signals.",
        "I know who needs a follow-up.",
        "Ready to flag churn risks.",
        "No one slips through.",
    ],
    vader: [
        "Ready to manage teachers.",
        "Watching your staff.",
        "I'll handle the profiles.",
        "Who do you need to find?",
    ],
    ziro: [
        "How can I help?",
        "Ask me anything.",
        "I know this system inside out.",
        "Ready.",
    ],
    sid: [
        "I know your families.",
        "Ready to update student profiles.",
        "Watching the roster.",
        "Ask me about any student.",
    ],
};
function randomIdle(agentId) {
    var _a;
    const lines = (_a = IDLE_LINES_BY_AGENT[agentId]) !== null && _a !== void 0 ? _a : ["Ready."];
    return lines[Math.floor(Math.random() * lines.length)];
}
export function AgentPageBar({ agentId, pageContext = {}, statusLine, chatPlaceholder, systemPrompt, chatRoute = "/api/agent/chat", }) {
    var _a;
    const meta = (_a = AGENT_METADATA[agentId]) !== null && _a !== void 0 ? _a : AGENT_METADATA["ziro"];
    const [chatOpen, setChatOpen] = React.useState(false);
    const [chatInput, setChatInput] = React.useState("");
    const [messages, setMessages] = React.useState([
        {
            role: "agent",
            text: `Hey — I'm ${meta.displayName}. ${meta.tagline} What do you need?`,
        },
    ]);
    const [chatLoading, setChatLoading] = React.useState(false);
    const [idleLine] = React.useState(() => statusLine !== null && statusLine !== void 0 ? statusLine : randomIdle(agentId));
    const messagesEndRef = React.useRef(null);
    const chatModalRef = React.useRef(null);
    const fileInputRef = React.useRef(null);
    React.useEffect(() => {
        var _a;
        (_a = messagesEndRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    // On desktop (md+) center the modal; on mobile keep it anchored to bottom
    React.useEffect(() => {
        if (!chatOpen)
            return;
        function reposition() {
            const el = chatModalRef.current;
            if (!el)
                return;
            if (window.innerWidth >= 768) {
                el.style.bottom = "auto";
                el.style.top = "50%";
                el.style.transform = "translate(-50%, -50%)";
                el.style.borderRadius = "1rem";
            }
            else {
                el.style.bottom = "0";
                el.style.top = "auto";
                el.style.transform = "translateX(-50%)";
                el.style.borderRadius = "1rem 1rem 0 0";
            }
        }
        reposition();
        window.addEventListener("resize", reposition);
        return () => window.removeEventListener("resize", reposition);
    }, [chatOpen]);
    const accent = meta.accent;
    const glow = meta.glow;
    const image = meta.imagePath;
    const name = meta.displayName;
    async function sendChat() {
        const text = chatInput.trim();
        if (!text || chatLoading)
            return;
        setChatInput("");
        const newMessages = [...messages, { role: "user", text }];
        setMessages(newMessages);
        setChatLoading(true);
        try {
            const history = newMessages.slice(1).map((m) => ({
                role: m.role === "agent" ? "assistant" : "user",
                content: m.text,
            }));
            const res = await fetch(chatRoute, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    message: text,
                    agentId,
                    context: pageContext,
                    history: history.slice(0, -1),
                    systemPrompt,
                }),
            });
            if (res.ok) {
                const j = await res.json().catch(() => null);
                setMessages((prev) => { var _a; return [...prev, { role: "agent", text: (_a = j === null || j === void 0 ? void 0 : j.reply) !== null && _a !== void 0 ? _a : "Got it." }]; });
            }
            else {
                setMessages((prev) => [...prev, { role: "agent", text: "Hit a snag — try again in a second." }]);
            }
        }
        catch (_a) {
            setMessages((prev) => [...prev, { role: "agent", text: "Can't reach the server right now." }]);
        }
        finally {
            setChatLoading(false);
        }
    }
    async function handleFileUpload(e) {
        var _a;
        const file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!file || chatLoading)
            return;
        const userMsg = `Processing bulk student data from file: ${file.name}`;
        const newMessages = [...messages, { role: "user", text: userMsg }];
        setMessages(newMessages);
        setChatLoading(true);
        try {
            const fileContent = await file.text();
            const formData = new FormData();
            formData.append("file", file);
            formData.append("content", fileContent);
            formData.append("agentId", agentId);
            formData.append("context", JSON.stringify(pageContext));
            const res = await fetch("/api/agent/upload-process", {
                method: "POST",
                body: formData,
            });
            if (res.ok) {
                const j = await res.json().catch(() => null);
                setMessages((prev) => { var _a; return [...prev, { role: "agent", text: (_a = j === null || j === void 0 ? void 0 : j.reply) !== null && _a !== void 0 ? _a : "File processed successfully." }]; });
            }
            else {
                setMessages((prev) => [...prev, { role: "agent", text: "File upload failed. Please try again." }]);
            }
        }
        catch (err) {
            setMessages((prev) => [...prev, { role: "agent", text: "Error processing file. Please try again." }]);
        }
        finally {
            setChatLoading(false);
            if (fileInputRef.current)
                fileInputRef.current.value = "";
        }
    }
    return (_jsxs(_Fragment, { children: [_jsxs("button", { type: "button", onClick: () => setChatOpen(true), className: "flex items-center gap-3 rounded-2xl px-4 py-2 transition-all hover:bg-white/5 group w-full", style: {
                    background: `linear-gradient(135deg, ${accent}10 0%, transparent 60%)`,
                    border: `1px solid ${accent}35`,
                    boxShadow: `0 0 24px ${accent}18`,
                }, "aria-label": `Open ${name} chat`, children: [_jsxs("div", { className: "relative shrink-0", children: [_jsx("div", { className: "absolute inset-0 rounded-full animate-ping opacity-20", style: { backgroundColor: accent, animationDuration: "3s" } }), _jsx("div", { className: "relative h-14 w-14 overflow-hidden rounded-full", style: {
                                    boxShadow: `0 0 22px ${glow}`,
                                    border: `2.5px solid ${accent}80`,
                                }, children: _jsx(AgentAvatarImage, { src: image, name: name, accent: accent, className: "h-full w-full object-cover" }) })] }), _jsxs("div", { className: "text-left min-w-0 flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-base font-black tracking-tight", style: { color: accent }, children: name }), _jsx("span", { className: "rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest", style: { borderColor: `${accent}40`, color: accent, backgroundColor: `${accent}10` }, children: "AI" })] }), _jsx("p", { className: "text-[11px] leading-snug truncate max-w-[260px] mt-0.5 text-[#94a3b8]", children: idleLine }), _jsx("p", { className: "text-[9px] mt-0.5 opacity-50", style: { color: accent }, children: "Tap to chat" })] })] }), chatOpen && (_jsxs(_Fragment, { children: [_jsx("div", { className: "fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm", onClick: () => setChatOpen(false), "aria-hidden": true }), _jsxs("div", { className: "fixed z-[9999] flex w-full max-w-lg flex-col rounded-2xl border shadow-2xl", style: {
                            borderColor: `${accent}55`,
                            backgroundColor: "#0a0a0e",
                            /* Mobile: anchor to bottom so keyboard pushes it up naturally */
                            bottom: 0,
                            left: "50%",
                            transform: "translateX(-50%)",
                            /* On larger screens: center vertically */
                            height: "min(600px, 85dvh)",
                            /* Prevent iOS bounce from shrinking the panel */
                            maxHeight: "100dvh",
                        }, 
                        // On md+ screens, switch to centered modal
                        ref: chatModalRef, role: "dialog", "aria-modal": "true", "aria-label": `${name} chat`, children: [_jsxs("div", { className: "flex items-center gap-3 border-b border-[var(--z-border)] px-5 py-4", children: [_jsx("div", { className: "h-10 w-10 shrink-0 overflow-hidden rounded-full", style: { border: `1.5px solid ${accent}60`, boxShadow: `0 0 16px ${glow}` }, children: _jsx(AgentAvatarImage, { src: image, name: name, accent: accent, className: "h-full w-full" }) }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-black text-[var(--z-fg)]", children: name }), _jsx("div", { className: "text-[10px] text-[var(--z-muted)]", children: meta.tagline })] }), _jsx("button", { type: "button", onClick: () => setChatOpen(false), className: "ml-auto rounded-lg p-1.5 text-[var(--z-muted)] hover:bg-white/5 hover:text-[var(--z-fg)] transition-colors", "aria-label": "Close", children: _jsx("svg", { viewBox: "0 0 16 16", fill: "none", className: "h-4 w-4", "aria-hidden": true, children: _jsx("path", { d: "M4 4l8 8M12 4l-8 8", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }) }) })] }), _jsxs("div", { className: "flex-1 overflow-y-auto px-5 py-4 space-y-3", children: [messages.map((msg, i) => (_jsxs("div", { className: `flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`, children: [msg.role === "agent" && (_jsx("div", { className: "h-7 w-7 shrink-0 overflow-hidden rounded-full", style: { border: `1px solid ${accent}60`, boxShadow: `0 0 8px ${glow}` }, children: _jsx(AgentAvatarImage, { src: image, name: name, accent: accent, className: "h-full w-full" }) })), _jsx("div", { className: `max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user"
                                                    ? "rounded-tr-sm bg-[var(--z-surface-2)] text-[var(--z-fg)]"
                                                    : "rounded-tl-sm text-[var(--z-fg)]"}`, style: msg.role === "agent"
                                                    ? { backgroundColor: `${accent}12`, border: `1px solid ${accent}25` }
                                                    : {}, children: msg.text })] }, i))), chatLoading && (_jsxs("div", { className: "flex gap-2", children: [_jsx("div", { className: "h-7 w-7 shrink-0 overflow-hidden rounded-full", style: { border: `1px solid ${accent}60` }, children: _jsx(AgentAvatarImage, { src: image, name: name, accent: accent, className: "h-full w-full" }) }), _jsx("div", { className: "rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm", style: { backgroundColor: `${accent}12`, border: `1px solid ${accent}25` }, children: _jsxs("span", { className: "inline-flex gap-1", children: [_jsx("span", { className: "animate-bounce", style: { animationDelay: "0ms" }, children: "\u00B7" }), _jsx("span", { className: "animate-bounce", style: { animationDelay: "150ms" }, children: "\u00B7" }), _jsx("span", { className: "animate-bounce", style: { animationDelay: "300ms" }, children: "\u00B7" })] }) })] })), _jsx("div", { ref: messagesEndRef })] }), _jsx("div", { className: "border-t border-[var(--z-border)] px-4 py-3", children: _jsxs("form", { onSubmit: (e) => { e.preventDefault(); sendChat(); }, className: "flex items-center gap-2", children: [_jsx("input", { type: "text", inputMode: "text", value: chatInput, onChange: (e) => setChatInput(e.target.value), placeholder: chatPlaceholder !== null && chatPlaceholder !== void 0 ? chatPlaceholder : `Ask ${name} anything…`, className: "flex-1 rounded-xl border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3.5 py-2.5 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none transition-colors", style: { fontSize: "16px" }, autoFocus: true }), _jsx("input", { ref: fileInputRef, type: "file", accept: ".txt,.csv", onChange: handleFileUpload, className: "hidden", "aria-label": "Upload file" }), _jsx("button", { type: "button", onClick: () => { var _a; return (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click(); }, disabled: chatLoading, className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border disabled:opacity-40 transition-colors", style: { borderColor: `${accent}40`, backgroundColor: `${accent}15`, color: accent }, title: "Upload file for bulk processing", "aria-label": "Upload file", children: _jsx("svg", { viewBox: "0 0 16 16", fill: "none", className: "h-4 w-4", "aria-hidden": true, children: _jsx("path", { d: "M8 2v8m-4-2l4 4 4-4M2 14h12", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) }) }), _jsx("button", { type: "submit", disabled: !chatInput.trim() || chatLoading, className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border disabled:opacity-40 transition-colors", style: { borderColor: `${accent}40`, backgroundColor: `${accent}15`, color: accent }, "aria-label": "Send", children: _jsx("svg", { viewBox: "0 0 16 16", fill: "none", className: "h-4 w-4", "aria-hidden": true, children: _jsx("path", { d: "M2 8l12-6-6 12V8H2z", fill: "currentColor" }) }) })] }) })] })] }))] }));
}
