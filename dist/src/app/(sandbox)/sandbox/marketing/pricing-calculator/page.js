import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PricingCalculator } from "@/components/pricing/PricingCalculator";
export default function SandboxPricingCalculatorPage() {
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-lg font-extrabold text-[var(--z-fg)]", children: "PricingCalculator" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Sliders + recommended plan highlight." }), _jsx(PricingCalculator, {})] }));
}
