"use client";

import { useEffect, useRef, useState } from "react";

export function VideoPlayer({ url }: { url: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stalled, setStalled] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onStall = () => setStalled(true);
    const onPlaying = () => {
      setStalled(false);
      setReady(true);
    };
    const onCanPlay = () => setReady(true);
    const onWaiting = () => setStalled(true);
    v.addEventListener("stalled", onStall);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("canplay", onCanPlay);
    return () => {
      v.removeEventListener("stalled", onStall);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("canplay", onCanPlay);
    };
  }, [url]);

  if (!url) return null;
  return (
    <div className="relative rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-2">
      {!ready ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 p-4 text-sm text-white/90">
          Buffering video…
        </div>
      ) : null}
      {stalled ? (
        <div className="mb-2 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-center text-xs text-amber-100">
          Connection is slow — playback will resume when enough data arrives.
        </div>
      ) : null}
      <video
        ref={videoRef}
        controls
        playsInline
        preload="metadata"
        className="max-h-[70vh] w-full rounded"
      >
        <source src={url} />
        Your browser does not support the video element.
      </video>
    </div>
  );
}
