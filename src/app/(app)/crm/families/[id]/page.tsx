import { FamilyAccountHeader } from "./_header";
import { FamilyAccountContent } from "./_content";

export default function FamilyAccountPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <FamilyAccountHeader />
      <div className="mt-8">
        <FamilyAccountContent />
      </div>
    </div>
  );
}
