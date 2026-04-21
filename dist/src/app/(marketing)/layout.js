import { jsx as _jsx } from "react/jsx-runtime";
import { defaultSiteMetadata } from "@/lib/seo/metadata";
import { MarketingShell } from "./MarketingShell";
export const metadata = defaultSiteMetadata;
export default function MarketingLayout({ children }) {
    return _jsx(MarketingShell, { children: children });
}
