'use client';

import React from 'react';
import { useNavigation } from '@/lib/navigation/navigationContext';

interface SmartBackButtonProps {
  variant?: 'mobile' | 'desktop' | 'auto';
  className?: string;
}

export function SmartBackButton({ variant = 'auto', className = '' }: SmartBackButtonProps) {
  const { canGoBack, goBack } = useNavigation();
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const shouldShow = variant === 'auto' ? (isMobile ? true : true) : true;

  if (!canGoBack || !shouldShow) return null;

  const isMobileView = variant === 'auto' ? isMobile : variant === 'mobile';

  return (
    <button
      onClick={goBack}
      className={`flex items-center justify-center transition-all ${
        isMobileView
          ? 'h-10 w-10 rounded-lg border border-[var(--z-border)] text-[var(--z-fg)] hover:bg-white/5'
          : 'px-3 py-2 rounded-lg border border-[var(--z-border)] text-[var(--z-fg)] hover:bg-white/5 text-sm font-semibold'
      } ${className}`}
      title="Go back to previous page"
      aria-label="Go back"
    >
      {isMobileView ? (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      ) : (
        <span className="flex items-center gap-1">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </span>
      )}
    </button>
  );
}
