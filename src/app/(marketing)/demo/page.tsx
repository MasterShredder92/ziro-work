import type { Metadata } from "next";
import { mergePageMetadata, siteBaseUrl } from "@/lib/seo/metadata";
import { DemoWalkthrough } from "@/components/marketing/DemoWalkthrough";

const desc = "Interactive demo lane for ZiroWork marketing—signals analytics and cookie-less exploration.";

export const metadata: Metadata = mergePageMetadata({
  title: "Demo",
  description: desc,
  openGraph: { title: "Demo · ZiroWork", description: desc, url: `${siteBaseUrl()}/demo` },
  twitter: { title: "Demo · ZiroWork", description: desc },
});

export default function MarketingDemoPage() {
  return <DemoWalkthrough />;
}
