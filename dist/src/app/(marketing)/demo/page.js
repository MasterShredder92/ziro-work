import { jsx as _jsx } from "react/jsx-runtime";
import { mergePageMetadata, siteBaseUrl } from "@/lib/seo/metadata";
import { DemoWalkthrough } from "@/components/marketing/DemoWalkthrough";
const desc = "Interactive demo lane for ZiroWork marketing—signals analytics and cookie-less exploration.";
export const metadata = mergePageMetadata({
    title: "Demo",
    description: desc,
    openGraph: { title: "Demo · ZiroWork", description: desc, url: `${siteBaseUrl()}/demo` },
    twitter: { title: "Demo · ZiroWork", description: desc },
});
export default function MarketingDemoPage() {
    return _jsx(DemoWalkthrough, {});
}
