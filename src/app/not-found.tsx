import Link from "next/link";

export default function NotFound() {
  return (
    <div className="h-screen flex items-center justify-center bg-[#080808] text-[#d4d4d4]">
      <div className="max-w-md w-full px-6">
        <div className="text-xs text-[#606068] mb-2">404</div>
        <h1 className="text-2xl font-extrabold text-[#f0f0f0] mb-3">Page not found</h1>
        <p className="text-sm text-[#707078] mb-6">
          This route doesn’t exist yet.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-[#00ff88] text-black text-sm font-semibold"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

