'use client';

import React, { useEffect, useRef } from 'react';
import { initGlobalVFX } from '@/lib/vfx/vfxSystem';

/**
 * VFX Canvas Overlay Component
 * Renders particle effects across the entire viewport
 * Positioned as a fixed overlay that doesn't interfere with interactions
 */
export function VFXCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Set canvas size to viewport
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Initialize VFX system
    initGlobalVFX(canvasRef.current);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[9999]"
      style={{
        mixBlendMode: 'screen',
        opacity: 0.9,
      }}
    />
  );
}
