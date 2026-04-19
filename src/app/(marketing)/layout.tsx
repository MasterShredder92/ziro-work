import type { Metadata } from "next";
import { defaultSiteMetadata } from "@/lib/seo/metadata";
import { MarketingShell } from "./MarketingShell";

export const metadata: Metadata = defaultSiteMetadata;

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <MarketingShell>{children}</MarketingShell>;
}
