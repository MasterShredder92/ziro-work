import { SurfaceSkeleton } from "@/components/system/SurfaceStates";

export default function AppLoading() {
  return (
    <div
      className="mx-auto flex w-full max-w-[var(--z-content-max)] flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="h-8 w-52 animate-pulse rounded-md bg-[var(--z-surface-2)]" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SurfaceSkeleton lines={2} className="h-28" />
        <SurfaceSkeleton lines={2} className="h-28" />
        <SurfaceSkeleton lines={2} className="h-28" />
        <SurfaceSkeleton lines={2} className="h-28" />
      </div>
      <SurfaceSkeleton lines={6} className="h-80" />
    </div>
  );
}
