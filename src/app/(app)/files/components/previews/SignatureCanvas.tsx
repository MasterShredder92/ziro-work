"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface SignatureCanvasProps {
  width?: number;
  height?: number;
  onChange?: (dataUrl: string | null) => void;
  disabled?: boolean;
  initialDataUrl?: string | null;
}

export function SignatureCanvas({
  width = 480,
  height = 160,
  onChange,
  disabled = false,
  initialDataUrl = null,
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const [empty, setEmpty] = useState(!initialDataUrl);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111111";

    if (initialDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setEmpty(false);
      };
      img.src = initialDataUrl;
    }
  }, [initialDataUrl]);

  const getPos = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const handleDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    drawingRef.current = true;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    lastRef.current = { x, y };
    ctx.beginPath();
    ctx.moveTo(x, y);
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const handleMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled || !drawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    const last = lastRef.current;
    if (!last) {
      lastRef.current = { x, y };
      return;
    }
    const midX = (last.x + x) / 2;
    const midY = (last.y + y) / 2;
    ctx.quadraticCurveTo(last.x, last.y, midX, midY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    lastRef.current = { x, y };
    if (empty) setEmpty(false);
  };

  const handleUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    try {
      canvasRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    lastRef.current = null;
    const data = canvasRef.current?.toDataURL("image/png") ?? null;
    onChange?.(data);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    lastRef.current = null;
    setEmpty(true);
    onChange?.(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        style={{ touchAction: "none" }}
        className="w-full max-w-full cursor-crosshair rounded-md border border-[var(--z-border)] bg-white"
      />
      <div className="flex items-center justify-between text-xs text-[var(--z-muted)]">
        <span>{empty ? "Sign above" : "Signature captured"}</span>
        <button
          type="button"
          onClick={clear}
          disabled={disabled}
          className="rounded border border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-fg)] hover:bg-white/[0.04] disabled:opacity-50"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
