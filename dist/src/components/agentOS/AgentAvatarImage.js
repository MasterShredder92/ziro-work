"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
function initials(name) {
    var _a, _b, _c, _d;
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const a = (_b = (_a = parts[0]) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : "?";
    const b = parts.length > 1 ? ((_d = (_c = parts[parts.length - 1]) === null || _c === void 0 ? void 0 : _c[0]) !== null && _d !== void 0 ? _d : "") : "";
    return (a + b).toUpperCase();
}
/** Avatar image with fallback to initials. Uses <img> (no Next image config needed). */
export function AgentAvatarImage({ src, name, className, accent }) {
    const [ok, setOk] = React.useState(true);
    const showImg = !!src && ok;
    return (_jsx("div", { className: className, style: accent ? { color: accent } : undefined, children: showImg ? (_jsx("img", { src: src !== null && src !== void 0 ? src : "", alt: "", className: "h-full w-full rounded-full object-cover", onError: () => setOk(false) })) : (_jsx("div", { className: "flex h-full w-full items-center justify-center rounded-full text-sm font-extrabold", style: accent ? { color: accent } : undefined, children: initials(name) })) }));
}
