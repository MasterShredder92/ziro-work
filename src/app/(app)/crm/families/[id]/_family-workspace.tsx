"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useFamilyAccountSummary } from "./_header";
import { FamilyDashboardOrbit } from "./_family-dashboard-orbit";
import { FamilySectionExpandOverlay } from "./_family-section-overlay";
import { locationBrandColor, parseTabParam, type FamilyWorkspaceTab } from "./_content";

function WorkspaceSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 w-48 rounded-full bg-[var(--z-border)]" />
      <div className="mx-auto h-[min(400px,55vh)] max-w-[920px] rounded-3xl bg-[var(--z-surface-2)]" />
    </div>
  );
}

export function FamilyWorkspace() {
  const params = useParams<{ id: string }>();
  const familyId = params?.id ?? "";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [originRect, setOriginRect] = useState<DOMRect | null>(null);

  const { loading, error, family, locationName, derived } = useFamilyAccountSummary(familyId);

  const hasTabInUrl = useMemo(() => searchParams.has("tab"), [searchParams]);
  const activeTab = useMemo(() => parseTabParam(searchParams.get("tab")), [searchParams]);

  useEffect(() => {
    if (!hasTabInUrl) setOriginRect(null);
  }, [hasTabInUrl]);

  useEffect(() => {
    if (searchParams.get("addStudent") !== "1") return;
    if (parseTabParam(searchParams.get("tab")) === "overview") return;
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", "overview");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);

  const brandColor = locationBrandColor(locationName);

  const handleSelectTab = (t: FamilyWorkspaceTab, rect: DOMRect) => {
    setOriginRect(rect);
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", t);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const handleCloseOverlay = () => {
    setOriginRect(null);
    const next = new URLSearchParams(searchParams.toString());
    next.delete("tab");
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };

  if (loading) return <WorkspaceSkeleton />;

  if (error || !family || !derived) {
    return (
      <div
        className="rounded-2xl border px-5 py-4 text-sm"
        style={{
          background: "rgba(185,28,28,0.08)",
          color: "#b91c1c",
          borderColor: "rgba(185,28,28,0.25)",
        }}
      >
        {error ?? "Family not found."}
      </div>
    );
  }

  const { displayName } = derived;

  return (
    <>
      <FamilyDashboardOrbit
        familyId={familyId}
        focusLabel={displayName.toUpperCase()}
        familyOrbName={displayName}
        balance={family.balance}
        activeTab={hasTabInUrl ? activeTab : null}
        onOpenTab={handleSelectTab}
      />

      {hasTabInUrl && (
        <FamilySectionExpandOverlay
          open
          tab={activeTab}
          originRect={originRect}
          familyId={familyId}
          familyName={family.name}
          brandColor={brandColor}
          onRequestClose={handleCloseOverlay}
        />
      )}
    </>
  );
}
