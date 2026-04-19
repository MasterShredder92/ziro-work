import { RouteStatusScreen } from "@/components/system/RouteStatusScreen";

export default function AppNotFound() {
  return (
    <RouteStatusScreen
      code="404"
      title="This page is not available"
      message="The route you requested does not exist, or your account does not have access to it."
      actions={[
        { href: "/dashboard", label: "Go to dashboard" },
        { href: "/help", label: "Open help", kind: "secondary" },
      ]}
    />
  );
}
