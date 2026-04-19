import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { isTenantOnboarded } from "@/lib/onboarding/gate";

const OnboardingClient = dynamic(() => import("./_client").then((m) => m.OnboardingClient), {
  loading: () => <PageShell title="Onboarding" />,
});

export default async function OnboardingPage() {
  const tenantId = DEFAULT_TENANT_ID;
  const onboarded = await isTenantOnboarded(tenantId);
  const isDevelopment = process.env.NODE_ENV === "development";

  if (!isDevelopment && onboarded) {
    redirect("/dashboard");
  }

  return <OnboardingClient />;
}
