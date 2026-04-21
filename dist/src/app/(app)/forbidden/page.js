import { jsx as _jsx } from "react/jsx-runtime";
import { RouteStatusScreen } from "@/components/system/RouteStatusScreen";
export const metadata = {
    title: "Access denied",
};
export default function ForbiddenPage() {
    return (_jsx(RouteStatusScreen, { code: "403", title: "You do not have access to this area", message: "If this looks wrong, ask a director or admin to review your role assignment.", actions: [
            { href: "/dashboard", label: "Go to dashboard" },
            { href: "/help", label: "Open help", kind: "secondary" },
        ] }));
}
