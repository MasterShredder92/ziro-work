import type { Metadata } from "next";
import { mergePageMetadata, siteBaseUrl } from "@/lib/seo/metadata";
import { SignupSteps } from "@/components/marketing/SignupSteps";

const desc = "Start the ZiroWork trial—collect studio basics, invite operators, and land in onboarding.";

export const metadata: Metadata = mergePageMetadata({
  title: "Sign up",
  description: desc,
  openGraph: { title: "Sign up · ZiroWork", description: desc, url: `${siteBaseUrl()}/signup` },
  twitter: { title: "Sign up · ZiroWork", description: desc },
});

export default function MarketingSignupPage() {
  return <SignupSteps />;
}
