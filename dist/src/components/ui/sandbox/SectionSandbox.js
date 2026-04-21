import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Section } from "../Section";
import { Card } from "../Card";
import { Body, Caption, H3 } from "../../premium/Typography";
export function SectionSandbox() {
    return (_jsxs("div", { className: "flex flex-col gap-10", children: [_jsx(Section, { title: "Section (accent)", description: "Vertical stack wrapper to group blocks. Optional title + description. Spacing tokens.", accent: true, children: _jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2", children: [_jsxs(Card, { children: [_jsx(Body, { className: "font-medium", children: "Group A" }), _jsx(Caption, { className: "mt-2", children: "A logical cluster of UI elements." })] }), _jsxs(Card, { variant: "outline", children: [_jsx(Body, { className: "font-medium", children: "Group B" }), _jsx(Caption, { className: "mt-2", children: "Outline variant inside a section." })] })] }) }), _jsx(Section, { title: "Section (tight)", description: "A denser stack for compact pages.", spacing: "tight", children: _jsxs(Card, { padding: "sm", children: [_jsx(H3, { className: "text-base", children: "Compact block" }), _jsx(Caption, { className: "mt-2", children: "Use when screen real estate is tight." })] }) })] }));
}
