import { jsx as _jsx } from "react/jsx-runtime";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import defaultSiteMetadata, { mergePageMetadata } from "@/lib/seo/metadata";
import { SeoSandboxContent } from "./SeoSandboxContent";
export const metadata = mergePageMetadata({
    title: "SEO sandbox",
    description: "QA lane for default metadata, cookie banner, and mock analytics logging.",
});
function serializeDefaultMetadata() {
    const m = defaultSiteMetadata;
    return JSON.stringify({
        metadataBase: m.metadataBase ? String(m.metadataBase) : null,
        title: m.title,
        description: m.description,
        applicationName: m.applicationName,
        openGraph: m.openGraph,
        twitter: m.twitter,
    }, null, 2);
}
export default function SandboxSeoPage() {
    return (_jsx(AnalyticsProvider, { children: _jsx(SeoSandboxContent, { metadataJson: serializeDefaultMetadata() }) }));
}
