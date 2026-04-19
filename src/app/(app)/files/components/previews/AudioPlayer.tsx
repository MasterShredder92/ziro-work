"use client";

import { useEffect, useRef, useState } from "react";

export function AudioPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [slow, setSlow] = useState(false);
  const connected = useRef(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onWaiting = () => setSlow(true);
    const onPlaying = () => setSlow(false);
    a.addEventListener("waiting", onWaiting);
    a.addEventListener("playing", onPlaying);
    return () => {
      a.removeEventListener("waiting", onWaiting);
      a.removeEventListener("playing", onPlaying);
    };
  }, [url]);

  useEffect(() => {
    const audio = audioRef.current;
    const canvas = canvasRef.current;
    if (!audio || !canvas) return;
    let ctx: AudioContext | undefined;
    let raf = 0;
    let analyser: AnalyserNode | undefined;
    const data = new Uint8Array(128);

    const draw = () => {
      const c2d = canvas.getContext("2d");
      if (!c2d || !analyser) return;
      analyser.getByteTimeDomainData(data);
      c2d.fillStyle = "rgba(0,0,0,0.2)";
      c2d.fillRect(0, 0, canvas.width, canvas.height);
      c2d.strokeStyle = "rgba(120,200,255,0.85)";
      c2d.lineWidth = 1;
      c2d.beginPath();
      const w = canvas.width;
      const h = canvas.height;
      const mid = h / 2;
      for (let i = 0; i < data.length; i++) {
        const x = (i / (data.length - 1)) * w;
        const v = (data[i]! - 128) / 128;
        const y = mid + v * (mid - 4);
        if (i === 0) c2d.moveTo(x, y);
        else c2d.lineTo(x, y);
      }
      c2d.stroke();
      raf = requestAnimationFrame(draw);
    };

    const onPlay = () => {
      if (connected.current) {
        if (!raf) raf = requestAnimationFrame(draw);
        return;
      }
      try {
        ctx = new AudioContext();
        const src = ctx.createMediaElementSource(audio);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        analyser.connect(ctx.destination);
        connected.current = true;
        raf = requestAnimationFrame(draw);
      } catch {
        connected.current = true;
      }
    };

    const onPause = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      cancelAnimationFrame(raf);
      void ctx?.close();
    };
  }, [url]);

  if (!url) return null;
  return (
    <div className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
      {slow ? (
        <p className="mb-2 text-xs text-amber-100/90">
          Buffering… If playback stutters, wait a moment or check your network.
        </p>
      ) : null}
      <canvas
        ref={canvasRef}
        width={640}
        height={72}
        className="mb-2 w-full max-w-full rounded border border-[var(--z-border)] bg-black/30"
        aria-hidden
      />
      <audio ref={audioRef} controls preload="metadata" className="w-full">
        <source src={url} />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
