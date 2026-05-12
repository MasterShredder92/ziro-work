import { FamilyAccountHeader } from "./_header";
import { FamilyAccountContent } from "./_content";

export default function FamilyAccountPage() {
  return (
    <div className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-4 sm:px-8 lg:px-12">
      <div
        className="pointer-events-none absolute -right-20 -top-32 h-[min(520px,55vh)] w-[min(100vw,640px)] rounded-full opacity-[0.12] blur-3xl dark:opacity-[0.2]"
        style={{ background: "radial-gradient(circle at center, var(--z-accent), transparent 70%)" }}
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
