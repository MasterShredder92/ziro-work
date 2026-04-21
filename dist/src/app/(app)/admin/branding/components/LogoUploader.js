"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from "react";
async function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => { var _a; return resolve(String((_a = reader.result) !== null && _a !== void 0 ? _a : "")); };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}
export function LogoUploader({ label, value, onChange, disabled, backgroundStyle = "dark", accept = "image/png,image/jpeg,image/svg+xml,image/webp", description, }) {
    const inputRef = useRef(null);
    const [urlInput, setUrlInput] = useState(value !== null && value !== void 0 ? value : "");
    const [busy, setBusy] = useState(false);
    const previewBg = backgroundStyle === "light"
        ? "bg-white text-black"
        : "bg-[#0b0b0d] text-white";
    const handleFile = async (file) => {
        if (!file)
            return;
        setBusy(true);
        try {
            const dataUrl = await fileToDataUrl(file);
            onChange(dataUrl);
            setUrlInput(dataUrl.startsWith("data:") ? "" : dataUrl);
        }
        finally {
            setBusy(false);
        }
    };
    return (_jsxs("div", { className: "flex flex-col gap-2 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: label }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { type: "button", disabled: disabled || busy, onClick: () => { var _a; return (_a = inputRef.current) === null || _a === void 0 ? void 0 : _a.click(); }, className: "h-8 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 text-xs text-[var(--z-fg)] hover:bg-white/5 disabled:opacity-50", children: busy ? "Uploading…" : "Upload" }), value ? (_jsx("button", { type: "button", disabled: disabled, onClick: () => {
                                    onChange(null);
                                    setUrlInput("");
                                }, className: "h-8 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)] disabled:opacity-50", children: "Clear" })) : null] })] }), _jsx("input", { ref: inputRef, type: "file", accept: accept, className: "hidden", onChange: (e) => { var _a, _b; return handleFile((_b = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : null); } }), _jsx("div", { className: `flex items-center justify-center rounded-[var(--z-radius-sm)] h-28 ${previewBg}`, children: value ? (_jsx("img", { src: value, alt: label, className: "max-h-20 max-w-[80%] object-contain" })) : (_jsx("div", { className: "text-xs text-[var(--z-muted)]", children: "No image" })) }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: "or paste URL" }), _jsx("input", { type: "url", value: urlInput, onChange: (e) => setUrlInput(e.target.value), onBlur: () => {
                            if (urlInput.trim() !== (value !== null && value !== void 0 ? value : "")) {
                                onChange(urlInput.trim() || null);
                            }
                        }, placeholder: "https://\u2026", disabled: disabled, className: "h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]" })] }), description ? (_jsx("div", { className: "text-[11px] text-[var(--z-muted)]", children: description })) : null] }));
}
