'use client';

import React, { useEffect, useState } from 'react';

/**
 * Ziro HUD (Heads-Up Display)
 * Creates an "inside the machine" atmosphere with:
 * - CRT scanlines and flicker
 * - Corner targeting brackets
 * - System status indicators
 * - Data stream visualization
 */
export function ZiroHUD() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      setIsActive(true);
    };

    const handleMouseLeave = () => {
      setIsActive(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <>
      {/* CRT Scanlines Overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-[9998]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.15),
            rgba(0, 0, 0, 0.15) 1px,
            transparent 1px,
            transparent 2px
          )`,
          animation: 'scanlineFlicker 0.15s infinite',
        }}
      />

      {/* CRT Flicker Effect */}
      <div
        className="pointer-events-none fixed inset-0 z-[9997]"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.05) 100%)',
          animation: 'crtFlicker 0.15s infinite',
          mixBlendMode: 'multiply',
        }}
      />

      {/* Corner Brackets - Top Left */}
      <div
        className="pointer-events-none fixed top-4 left-4 z-[9996]"
        style={{
          width: '40px',
          height: '40px',
          border: '2px solid rgba(196, 240, 54, 0.6)',
          borderRight: 'none',
          borderBottom: 'none',
          boxShadow: 'inset 0 0 10px rgba(196, 240, 54, 0.2)',
          opacity: isActive ? 1 : 0.5,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Corner Brackets - Top Right */}
      <div
        className="pointer-events-none fixed top-4 right-4 z-[9996]"
        style={{
          width: '40px',
          height: '40px',
          border: '2px solid rgba(168, 85, 247, 0.6)',
          borderLeft: 'none',
          borderBottom: 'none',
          boxShadow: 'inset 0 0 10px rgba(168, 85, 247, 0.2)',
          opacity: isActive ? 1 : 0.5,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Corner Brackets - Bottom Left */}
      <div
        className="pointer-events-none fixed bottom-4 left-4 z-[9996]"
        style={{
          width: '40px',
          height: '40px',
          border: '2px solid rgba(168, 85, 247, 0.6)',
          borderRight: 'none',
          borderTop: 'none',
          boxShadow: 'inset 0 0 10px rgba(168, 85, 247, 0.2)',
          opacity: isActive ? 1 : 0.5,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Corner Brackets - Bottom Right */}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[9996]"
        style={{
          width: '40px',
          height: '40px',
          border: '2px solid rgba(196, 240, 54, 0.6)',
          borderLeft: 'none',
          borderTop: 'none',
          boxShadow: 'inset 0 0 10px rgba(196, 240, 54, 0.2)',
          opacity: isActive ? 1 : 0.5,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Crosshair Reticle */}
      {isActive && (
        <div
          className="pointer-events-none fixed z-[9995]"
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
            transform: 'translate(-50%, -50%)',
            width: '30px',
            height: '30px',
            border: '2px solid rgba(196, 240, 54, 0.8)',
            borderRadius: '50%',
            boxShadow: '0 0 10px rgba(196, 240, 54, 0.6)',
            animation: 'reticleRotate 2s linear infinite',
          }}
        />
      )}

      {/* Targeting Lines */}
      {isActive && (
        <>
          <div
            className="pointer-events-none fixed z-[9995]"
            style={{
              left: `${mousePos.x}px`,
              top: `${mousePos.y}px`,
              transform: 'translate(-50%, -50%)',
              width: '60px',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, rgba(196, 240, 54, 0.6), transparent)',
              opacity: 0.7,
            }}
          />
          <div
            className="pointer-events-none fixed z-[9995]"
            style={{
              left: `${mousePos.x}px`,
              top: `${mousePos.y}px`,
              transform: 'translate(-50%, -50%)',
              width: '2px',
              height: '60px',
              background: 'linear-gradient(180deg, transparent, rgba(196, 240, 54, 0.6), transparent)',
              opacity: 0.7,
            }}
          />
        </>
      )}

      {/* System Status Bar - Top */}
      <div
        className="pointer-events-none fixed top-0 left-0 right-0 z-[9994]"
        style={{
          height: '2px',
          background: 'linear-gradient(90deg, rgba(196, 240, 54, 0.3), rgba(168, 85, 247, 0.3), rgba(196, 240, 54, 0.3))',
          boxShadow: '0 0 10px rgba(196, 240, 54, 0.2)',
          animation: 'statusPulse 2s ease-in-out infinite',
        }}
      />

      {/* System Status Bar - Bottom */}
      <div
        className="pointer-events-none fixed bottom-0 left-0 right-0 z-[9994]"
        style={{
          height: '2px',
          background: 'linear-gradient(90deg, rgba(168, 85, 247, 0.3), rgba(196, 240, 54, 0.3), rgba(168, 85, 247, 0.3))',
          boxShadow: '0 0 10px rgba(168, 85, 247, 0.2)',
          animation: 'statusPulse 2s ease-in-out infinite 0.5s',
        }}
      />

      {/* System Status Indicator - Top Left */}
      <div
        className="pointer-events-none fixed top-2 left-6 z-[9995] text-xs font-mono"
        style={{
          color: 'rgba(196, 240, 54, 0.6)',
          textShadow: '0 0 10px rgba(196, 240, 54, 0.4)',
          animation: 'dataStreamFlicker 0.5s ease-in-out infinite',
        }}
      >
        ZIRO_ACTIVE
      </div>

      {/* System Status Indicator - Top Right */}
      <div
        className="pointer-events-none fixed top-2 right-6 z-[9995] text-xs font-mono"
        style={{
          color: 'rgba(168, 85, 247, 0.6)',
          textShadow: '0 0 10px rgba(168, 85, 247, 0.4)',
          animation: 'dataStreamFlicker 0.5s ease-in-out infinite 0.25s',
        }}
      >
        SYS_ONLINE
      </div>

      {/* Vignette Effect */}
      <div
        className="pointer-events-none fixed inset-0 z-[9993]"
        style={{
          background: `radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.3) 100%)`,
        }}
      />

      {/* Global CSS for HUD animations */}
      <style>{`
        @keyframes scanlineFlicker {
          0% { opacity: 0.15; }
          50% { opacity: 0.2; }
          100% { opacity: 0.15; }
        }

        @keyframes crtFlicker {
          0% { opacity: 0.05; }
          50% { opacity: 0.08; }
          100% { opacity: 0.05; }
        }

        @keyframes reticleRotate {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes statusPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }

        @keyframes dataStreamFlicker {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </>
  );
}
