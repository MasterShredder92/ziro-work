"use client";

import { useEffect } from "react";
import { RouteStatusScreen } from "@/components/system/RouteStatusScreen";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[app.global_error]", {
      name: error.name,
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--z-bg)] text-[var(--z-fg)]">
        <main className="min-h-screen">
          <RouteStatusScreen
            code="500"
            title="Unexpected application failure"
            message="The app hit an unrecoverable error. Retry to restore the latest state."
            actions={[
              { href: "/dashboard", label: "Go to dashboard", kind: "secondary" },
            ]}
          />
          <div className="mx-auto -mt-8 flex w-full max-w-xl justify-center px-4 pb-10">
            <button
              type="button"
              onClick={() => unstable_retry()}
              className="rounded-[var(--z-radius-md)] bg-[var(--z-accent)] px-4 py-2 text-sm font-semibold text-[var(--z-on-accent,white)] transition hover:opacity-90"
            >
              Retry
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
