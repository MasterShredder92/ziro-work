"use client";

import { useEffect, useState } from "react";
import { FILES_TOAST_EVENT, type FilesToastKind } from "./filesToast";

type Toast = { id: number; message: string; kind: FilesToastKind };

export function FilesToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let id = 0;
    const onToast = (e: Event) => {
      const ce = e as CustomEvent<{ message: string; kind: FilesToastKind }>;
      const tid = ++id;
      setToasts((prev) => [
        ...prev,
        { id: tid, message: ce.detail.message, kind: ce.detail.kind },
      ]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== tid));
      }, 4200);
    };
    window.addEventListener(FILES_TOAST_EVENT, onToast);
    return () => window.removeEventListener(FILES_TOAST_EVENT, onToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-md border px-3 py-2 text-xs shadow-lg ${
            t.kind === "success"
              ? "border-emerald-500/40 bg-emerald-950/90 text-emerald-100"
              : t.kind === "error"
                ? "border-red-500/50 bg-red-950/90 text-red-100"
                : "border-[var(--z-border)] bg-[var(--z-surface)] text-[var(--z-fg)]"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
