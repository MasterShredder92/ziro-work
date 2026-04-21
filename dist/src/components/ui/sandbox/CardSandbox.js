import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "../Card";
import { H3, Caption, Body } from "../../premium/Typography";
export function CardSandbox() {
    return (_jsxs("div", { className: "flex flex-col gap-6", children: [_jsxs("div", { children: [_jsx(H3, { children: "Card" }), _jsx(Caption, { className: "mt-1", children: "Default / Elevated / Outline. Padding + radius + shadow tokens." })] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-3", children: [_jsxs(Card, { children: [_jsx(Body, { className: "font-medium", children: "Default" }), _jsx(Caption, { className: "mt-2", children: "Surface + border. Neutral, composable." })] }), _jsxs(Card, { variant: "elevated", shadow: "sm", children: [_jsx(Body, { className: "font-medium", children: "Elevated" }), _jsx(Caption, { className: "mt-2", children: "Slightly lifted. Premium depth." })] }), _jsxs(Card, { variant: "outline", padding: "lg", radius: "lg", children: [_jsx(Body, { className: "font-medium", children: "Outline" }), _jsx(Caption, { className: "mt-2", children: "Transparent body. Strong boundary." })] })] })] }));
}
