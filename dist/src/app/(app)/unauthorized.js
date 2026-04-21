import { jsx as _jsx } from "react/jsx-runtime";
import { RouteStatusScreen } from "@/components/system/RouteStatusScreen";
export default function Unauthorized() {
    return (_jsx(RouteStatusScreen, { code: "401", title: "Sign in required", message: "Your session has expired or is missing. Sign in again to continue.", actions: [
            { href: "/login", label: "Go to login" },
            { href: "/dashboard", label: "Back to dashboard", kind: "secondary" },
        ] }));
}
