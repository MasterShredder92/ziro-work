import type { BrandingRuntime } from "@/lib/branding";

export function BrandingStyleTag({ runtime }: { runtime: BrandingRuntime }) {
  if (!runtime.cssText) return null;
  return (
    <style
      data-branding-runtime={runtime.tenantId}
      dangerouslySetInnerHTML={{ __html: runtime.cssText }}
    />
  );
}
