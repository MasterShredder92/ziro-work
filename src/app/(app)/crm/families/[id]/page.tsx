import { FamilyAccountHeader } from "./_header";
import { FamilyAccountContent } from "./_content";
import { OBSIDIAN_DARK_BACKDROP } from "@/lib/ui/obsidianShellBackdrop";

export default function FamilyAccountPage() {
  return (
    <div className="relative z-10 mx-auto min-h-[72vh] max-w-6xl px-4 pb-20 pt-4 sm:px-8 lg:px-12">
      {/* Dashboard-matched deep shell (dark only) */}
      <div
        aria-hidden
        className="light-theme:hidden pointer-events-none absolute inset-0 -z-0"
        style={OBSIDIAN_DARK_BACKDROP}
      />
      {/* Light: subtle paper grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0 hidden bg-[var(--z-bg)] light-theme:block"
        style={{
          backgroundImage: "radial-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />
      {/* Lime bloom — same accent family as dashboard orb */}
      <div
        className="pointer-events-none absolute -right-16 -top-24 h-[min(460px,48vh)] w-[min(100vw,520px)] rounded-full opacity-[0.16] blur-3xl light-theme:opacity-[0.09]"
        style={{
          background: "radial-gradient(circle at center, rgba(180,255,0,0.5), transparent 70%)",
        }}
        aria-hidden
      />
      <div className="relative">
        <FamilyAccountHeader />
        <div className="mt-10 lg:mt-14">
          <FamilyAccountContent />
        </div>
      </div>
    </div>
  );
}
