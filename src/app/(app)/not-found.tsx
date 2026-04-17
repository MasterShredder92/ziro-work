import Link from "next/link";

export default function AppNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full">
        <div className="text-xs uppercase tracking-wider text-[#606068] mb-2">404</div>
        <h1 className="text-2xl font-extrabold text-[#f0f0f0] mb-3">
          This page isn't here
        </h1>
        <p className="text-sm text-[#8a8a92] mb-6">
          The route you requested doesn't exist or you don't have access to it.
        </p>
        <div className="flex gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-[#00ff88] text-black text-sm font-semibold"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
