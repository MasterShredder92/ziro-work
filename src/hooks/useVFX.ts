import { useCallback } from 'react';
import { getGlobalVFX } from '@/lib/vfx/vfxSystem';

/**
 * Hook for triggering VFX effects on user interactions
 */
export function useVFX() {
  const vfx = getGlobalVFX();

  const triggerClickFlare = useCallback((e: React.MouseEvent) => {
    if (!vfx) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    vfx.triggerCodeFlare(x, y, '#c4f036');
    vfx.triggerSparks(x, y, 6, '#a855f7');
  }, [vfx]);

  const triggerHoverElectricity = useCallback((e: React.MouseEvent) => {
    if (!vfx) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    vfx.triggerElectricity(e.clientX, e.clientY, centerX, centerY);
  }, [vfx]);

  const triggerRobotEye = useCallback((x: number, y: number) => {
    if (!vfx) return;
    vfx.triggerRobotEye(x, y, Math.random() > 0.5 ? '#c4f036' : '#a855f7');
  }, [vfx]);

  const triggerSparks = useCallback((x: number, y: number, count?: number, color?: string) => {
    if (!vfx) return;
    vfx.triggerSparks(x, y, count, color);
  }, [vfx]);

  return {
    triggerClickFlare,
    triggerHoverElectricity,
    triggerRobotEye,
    triggerSparks,
  };
}
