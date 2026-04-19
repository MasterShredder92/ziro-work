"use client";

import { useEffect } from "react";
import { PageErrorState } from "./_components";

export default function CRMError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageErrorState
      title="CRM couldn’t load"
      message={error.message || "Something went wrong loading this page."}
      onRetry={reset}
    />
  );
}
