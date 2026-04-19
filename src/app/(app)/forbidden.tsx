import { RouteStatusScreen } from "@/components/system/RouteStatusScreen";

export default function Forbidden() {
  return (
    <RouteStatusScreen
      code="403"
      title="Access denied"
      message="Your account is signed in, but it does not have permission to open this area."
      actions={[
        { href: "/dashboard", label: "Go to dashboard" },
        { href: "/help", label: "Contact support", kind: "secondary" },
      ]}
    />
  );
}
