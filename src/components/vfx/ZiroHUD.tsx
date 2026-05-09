'use client';

import React, { useEffect, useState } from 'react';

/**
 * Ziro HUD (Heads-Up Display)
 * Creates an "inside the machine" atmosphere with:
 * - CRT scanlines and flicker (BACKGROUND LAYER)
 * - Corner targeting brackets (SUBTLE)
 * - System status indicators (MUTED)
 * - Data stream visualization (BACKGROUND)
 * - Boot sequence on dashboard load
 */
export function ZiroHUD() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const [showBootSequence, setShowBootSequence] = useState(true);
  const [bootProgress, setBootProgress] = useState(0);

  // Boot sequence on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowBootSequence(false);
      setIsActive(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Boot progress animation
  useEffect(() => {
    if (!showBootSequence) return;
    const interval = setInterval(() => {
      setBootProgress((p) => (p < 100 ? p + Math.random() * 30 : 100));
    }, 200);
    return () => clearInterval(interval);
  }, [showBootSequence]);

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
      {/* BOOT SEQUENCE OVERLAY */}
      {showBootSequence && (
        <div
          className="pointer-events-none fixed inset-0 z-[9998] flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(15,15,18,0.95))',
            backdropFilter: 'blur(2px)',
          }}
        >
          <div className="text-center space-y-6">
            {/* ZIRO Logo */}
            <div
              style={{
                fontSize: '48px',
                fontWeight: 900,
                letterSpacing: '0.15em',
                background: 'linear-gradient(135deg, #c4f036, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 0 20px rgba(196, 240, 54, 0.3)',
                animation: 'bootGlow 1.5s ease-in-out infinite',
              }}
            >
              ZIRO
            </div>

            {/* Status text */}
            <div
              style={{
                fontSize: '12px',
                fontFamily: 'monospace',
                color: 'rgba(196, 240, 54, 0.8)',
                textShadow: '0 0 10px rgba(196, 240, 54, 0.4)',
                letterSpacing: '0.1em',
              }}
            >
              SYSTEM INITIALIZING...
            </div>

            {/* Progress bar */}
            <div
              style={{
                width: '200px',
                height: '2px',
                background: 'rgba(196, 240, 54, 0.2)',
                borderRadius: '1px',
                overflow: 'hidden',
                boxShadow: '0 0 10px rgba(196, 240, 54, 0.2)',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${bootProgress}%`,
                  background: 'linear-gradient(90deg, #c4f036, #a855f7)',
                  transition: 'width 0.1s ease-out',
                  boxShadow: '0 0 10px rgba(196, 240, 54, 0.6)',
                }}
              />
            </div>

            {/* Boot messages */}
            <div
              style={{
                fontSize: '10px',
                color: 'rgba(168, 85, 247, 0.6)',
                fontFamily: 'monospace',
                minHeight: '20px',
                animation: 'bootFlicker 0.5s ease-in-out infinite',
              }}
            >
              {bootProgress < 30 && '> LOADING AGENTS...'}
              {bootProgress >= 30 && bootProgress < 60 && '> INITIALIZING HUD...'}
              {bootProgress >= 60 && bootProgress < 90 && '> ACTIVATING SYSTEMS...'}
              {bootProgress >= 90 && '> READY FOR OPERATIONS'}
            </div>
          </div>
        </div>
      )}

      {/* BACKGROUND VFX LAYER (z-[9000] - behind all UI) */}
      <div className="pointer-events-none fixed inset-0 z-[9000]" style={{ opacity: isActive ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        {/* CRT Scanlines - SUBTLE */}
        <div
          className="fixed inset-0"
          style={{
            backgroundImage: `
              linear-gradient(
                0deg,
                rgba(0, 0, 0, 0.05) 1px,
                transparent 1px
              )
            `,
            backgroundSize: '100% 2px',
            animation: 'scanlineFlicker 0.15s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />

        {/* Vignette Effect */}
        <div
          className="fixed inset-0"
          style={{
            background: `radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.25) 100%)`,
            pointerEvents: 'none',
          }}
        />

        {/* System Status Bar - Top */}
        <div
          className="fixed top-0 left-0 right-0"
          style={{
            height: '2px',
            background: 'linear-gradient(90deg, rgba(196, 240, 54, 0.2), rgba(168, 85, 247, 0.2), rgba(196, 240, 54, 0.2))',
            boxShadow: '0 0 10px rgba(196, 240, 54, 0.1)',
            animation: 'statusPulse 2s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />

        {/* System Status Bar - Bottom */}
        <div
          className="fixed bottom-0 left-0 right-0"
          style={{
            height: '2px',
            background: 'linear-gradient(90deg, rgba(168, 85, 247, 0.2), rgba(196, 240, 54, 0.2), rgba(168, 85, 247, 0.2))',
            boxShadow: '0 0 10px rgba(168, 85, 247, 0.1)',
            animation: 'statusPulse 2s ease-in-out infinite 0.5s',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* CORNER BRACKETS (z-[9001] - just above background) */}
      <div className="pointer-events-none fixed top-4 left-4 z-[9001]" style={{ opacity: isActive ? 0.4 : 0.2, transition: 'opacity 0.3s ease' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '2px solid rgba(196, 240, 54, 0.4)',
            borderRight: 'none',
            borderBottom: 'none',
            boxShadow: 'inset 0 0 8px rgba(196, 240, 54, 0.1)',
          }}
        />
      </div>

      <div className="pointer-events-none fixed top-4 right-4 z-[9001]" style={{ opacity: isActive ? 0.4 : 0.2, transition: 'opacity 0.3s ease' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '2px solid rgba(168, 85, 247, 0.4)',
            borderLeft: 'none',
            borderBottom: 'none',
            boxShadow: 'inset 0 0 8px rgba(168, 85, 247, 0.1)',
          }}
        />
      </div>

      <div className="pointer-events-none fixed bottom-4 left-4 z-[9001]" style={{ opacity: isActive ? 0.4 : 0.2, transition: 'opacity 0.3s ease' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '2px solid rgba(168, 85, 247, 0.4)',
            borderRight: 'none',
            borderTop: 'none',
            boxShadow: 'inset 0 0 8px rgba(168, 85, 247, 0.1)',
          }}
        />
      </div>

      <div className="pointer-events-none fixed bottom-4 right-4 z-[9001]" style={{ opacity: isActive ? 0.4 : 0.2, transition: 'opacity 0.3s ease' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '2px solid rgba(196, 240, 54, 0.4)',
            borderLeft: 'none',
            borderTop: 'none',
            boxShadow: 'inset 0 0 8px rgba(196, 240, 54, 0.1)',
          }}
        />
      </div>

      {/* RETICLE (z-[9002] - subtle, behind most UI) */}
      {isActive && (
        <>
          <div
            className="pointer-events-none fixed z-[9002]"
            style={{
              left: `${mousePos.x}px`,
              top: `${mousePos.y}px`,
              transform: 'translate(-50%, -50%)',
              width: '24px',
              height: '24px',
              border: '1.5px solid rgba(196, 240, 54, 0.3)',
              borderRadius: '50%',
              boxShadow: '0 0 8px rgba(196, 240, 54, 0.2)',
              animation: 'reticleRotate 3s linear infinite',
            }}
          />

          {/* Targeting Lines */}
          <div
            className="pointer-events-none fixed z-[9002]"
            style={{
              left: `${mousePos.x}px`,
              top: `${mousePos.y}px`,
              transform: 'translate(-50%, -50%)',
              width: '50px',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(196, 240, 54, 0.2), transparent)',
              opacity: 0.4,
            }}
          />
          <div
            className="pointer-events-none fixed z-[9002]"
            style={{
              left: `${mousePos.x}px`,
              top: `${mousePos.y}px`,
              transform: 'translate(-50%, -50%)',
              width: '1px',
              height: '50px',
              background: 'linear-gradient(180deg, transparent, rgba(196, 240, 54, 0.2), transparent)',
              opacity: 0.4,
            }}
          />
        </>
      )}

      {/* SYSTEM STATUS INDICATORS (z-[9001] - subtle background text) */}
      <div
        className="pointer-events-none fixed top-2 left-6 z-[9001] text-xs font-mono"
        style={{
          color: 'rgba(196, 240, 54, 0.25)',
          textShadow: '0 0 8px rgba(196, 240, 54, 0.15)',
          animation: isActive ? 'dataStreamFlicker 0.5s ease-in-out infinite' : 'none',
          opacity: isActive ? 0.8 : 0.4,
          transition: 'opacity 0.3s ease',
        }}
      >
        ZIRO_ACTIVE
      </div>

      <div
        className="pointer-events-none fixed top-2 right-6 z-[9001] text-xs font-mono"
        style={{
          color: 'rgba(168, 85, 247, 0.25)',
          textShadow: '0 0 8px rgba(168, 85, 247, 0.15)',
          animation: isActive ? 'dataStreamFlicker 0.5s ease-in-out infinite 0.25s' : 'none',
          opacity: isActive ? 0.8 : 0.4,
          transition: 'opacity 0.3s ease',
        }}
      >
        SYS_ONLINE
      </div>

      {/* GLOBAL CSS FOR ALL ANIMATIONS */}
      <style>{`
        @keyframes scanlineFlicker {
          0% { opacity: 0.08; }
          50% { opacity: 0.12; }
          100% { opacity: 0.08; }
        }
        @keyframes reticleRotate {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes statusPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes dataStreamFlicker {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes bootGlow {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        @keyframes bootFlicker {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </>
  );
}
