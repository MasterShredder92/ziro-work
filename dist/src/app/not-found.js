import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
export default function NotFound() {
    return (_jsx("div", { className: "h-screen flex items-center justify-center bg-[#080808] text-[#d4d4d4]", children: _jsxs("div", { className: "max-w-md w-full px-6", children: [_jsx("div", { className: "text-xs text-[#606068] mb-2", children: "404" }), _jsx("h1", { className: "text-2xl font-extrabold text-[#f0f0f0] mb-3", children: "Page not found" }), _jsx("p", { className: "text-sm text-[#707078] mb-6", children: "This route doesn\u2019t exist yet." }), _jsx(Link, { href: "/dashboard", className: "inline-flex items-center px-4 py-2 rounded-lg bg-[#00ff88] text-black text-sm font-semibold", children: "Go to Dashboard" })] }) }));
}
