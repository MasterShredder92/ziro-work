"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from "react";
export function LogoUploader({ label = "Logo", value, onChange, disabled, }) {
    const [url, setUrl] = useState(value !== null && value !== void 0 ? value : "");
    const fileRef = useRef(null);
    const [error, setError] = useState(null);
    function onFileChange(e) {
        var _a;
        const file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!file)
            return;
        if (file.size > 2 * 1024 * 1024) {
            setError("File too large (max 2MB)");
            return;
        }
        setError(null);
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result === "string") {
                setUrl(result);
                onChange(result);
            }
        };
        reader.readAsDataURL(file);
    }
    return (_jsxs("div", { className: "flex flex-col gap-2", children: [_jsx("span", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: label }), _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "flex h-20 w-20 items-center justify-center overflow-hidden rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)]", children: url ? (_jsx("img", { src: url, alt: "Logo preview", className: "h-full w-full object-contain" })) : (_jsx("span", { className: "text-xs text-[var(--z-muted)]", children: "No logo" })) }), _jsxs("div", { className: "flex flex-1 flex-col gap-2", children: [_jsx("input", { type: "url", placeholder: "https://...", value: url, disabled: disabled, onChange: (e) => {
                                    setUrl(e.target.value);
                                    onChange(e.target.value || null);
                                }, className: "h-9 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { type: "button", disabled: disabled, onClick: () => { var _a; return (_a = fileRef.current) === null || _a === void 0 ? void 0 : _a.click(); }, className: "h-8 rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-3 text-xs text-[var(--z-fg)] hover:bg-white/5 disabled:opacity-50", children: "Upload file" }), url ? (_jsx("button", { type: "button", disabled: disabled, onClick: () => {
                                            setUrl("");
                                            onChange(null);
                                        }, className: "h-8 rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-3 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50", children: "Remove" })) : null, _jsx("input", { ref: fileRef, type: "file", accept: "image/*", className: "hidden", onChange: onFileChange, disabled: disabled })] }), error ? (_jsx("div", { className: "text-xs text-red-400", children: error })) : null] })] })] }));
}
