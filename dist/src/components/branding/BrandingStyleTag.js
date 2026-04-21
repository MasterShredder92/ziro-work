import { jsx as _jsx } from "react/jsx-runtime";
export function BrandingStyleTag({ runtime }) {
    if (!runtime.cssText)
        return null;
    return (_jsx("style", { "data-branding-runtime": runtime.tenantId, dangerouslySetInnerHTML: { __html: runtime.cssText } }));
}
