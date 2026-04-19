import type { Metadata } from "next";
import { mergePageMetadata, siteBaseUrl } from "@/lib/seo/metadata";
import { PricingPageClient } from "./PricingPageClient";

const desc =
  "Transparent tiers for studios that want signal without bloat—Launch, Scale, and Command with a neon seat calculator.";

export const metadata: Metadata = mergePageMetadata({
  title: "Pricing",
  description: desc,
  openGraph: {
    title: "Pricing · ZiroWork",
    description: desc,
    url: `${siteBaseUrl()}/pricing`,
  },
  twitter: { title: "Pricing · ZiroWork", description: desc },
});

export default function PricingPage() {
  return <PricingPageClient />;
}
