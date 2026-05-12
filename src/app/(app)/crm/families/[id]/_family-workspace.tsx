"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useFamilyAccountSummary } from "./_header";
import { FamilyHubCanvas } from "./_family-hub-canvas";
import { FamilySectionPanel, locationBrandColor, parseTabParam, type FamilyWorkspaceTab } from "./_content";

function WorkspaceSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 w-48 rounded-full bg-[var(--z-border)]" />
      <div className="mx-auto h-[min(400px,55vh)] max-w-[920px] rounded-3xl bg-[var(--z-surface-2)]" />
      <div className="h-64 rounded-2xl bg-[var(--z-surface-2)]" />
    </div>
  );
}

export function FamilyWorkspace() {
  const params = useParams<{ id: string }>();
  const familyId = params?.id ?? "";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { loading, error, family, locationName, derived } = useFamilyAccountSummary(familyId);

  const activeTab = useMemo(() => parseTabParam(searchParams.get("tab")), [searchParams]);

  const setTab = (t: FamilyWorkspaceTab) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", t);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (searchParams.get("addStudent") !== "1") return;
    if (parseTabParam(searchParams.get("tab")) === "overview") return;
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", "overview");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);

  const brandColor = locationBrandColor(locationName);

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

  const { displayName, initialsStr, shortId, locC, avatarBg, avatarFg, accent } = derived;
  const locationShort = locationName ? locationName.replace(" Music Lessons", "") : null;
  const locChip = locC && locationShort ? { text: locationShort, bg: locC.bg, fg: locC.text } : null;

  return (
    <div className="relative flex flex-col gap-8 lg:gap-10">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[13px] font-medium">
        <Link
          href="/crm/families"
          className="rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-1 text-[var(--z-muted)] transition hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] hover:text-[var(--z-fg)]"
        >
          ← Families
        </Link>
        <span className="text-[var(--z-border)]">/</span>
        <span className="rounded-full border border-[color-mix(in_oklab,var(--z-accent),transparent_70%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_88%)] px-3 py-1 font-semibold text-[var(--z-fg)]">
          {family.name}
        </span>
      </nav>

      <FamilyHubCanvas
        displayName={displayName}
        initialsStr={initialsStr}
        shortId={shortId}
        status={family.status}
        balance={family.balance}
        locationShort={locationShort}
        isMilitary={!!family.is_military}
        locChip={locChip}
        avatarBg={avatarBg}
        avatarFg={avatarFg}
        accent={accent}
        brandColor={brandColor}
        activeTab={activeTab}
        onSelectTab={setTab}
      />

      <section
        aria-labelledby="family-section-heading"
        className="rounded-[1.35rem] border border-white/[0.06] bg-black/[0.12] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.25)] backdrop-blur-md light-theme:border-[var(--z-border)] light-theme:bg-[color-mix(in_oklab,var(--z-surface),transparent_8%)] light-theme:shadow-md sm:p-6"
      >
        <h2 id="family-section-heading" className="sr-only">
          {activeTab} workspace panel
        </h2>
        <FamilySectionPanel tab={activeTab} familyId={familyId} brandColor={brandColor} />
      </section>
    </div>
  );
}
