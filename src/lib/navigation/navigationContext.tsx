'use client';

import React, { createContext, useContext, useCallback, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface NavigationState {
  path: string;
  scrollY: number;
  modalState?: Record<string, unknown>;
  timestamp: number;
}

interface NavigationContextType {
  canGoBack: boolean;
  goBack: () => void;
  pushState: (state: Partial<NavigationState>) => void;
  currentPath: string;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [stack, setStack] = React.useState<NavigationState[]>([]);
  const [currentPath, setCurrentPath] = React.useState(pathname);

  // Initialize stack with current path
  useEffect(() => {
    if (currentPath !== pathname) {
      setCurrentPath(pathname);
      setStack((prev) => [
        ...prev,
        {
          path: pathname,
          scrollY: 0,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [pathname, currentPath]);

  const canGoBack = stack.length > 1;

  const goBack = useCallback(() => {
    if (stack.length > 1) {
      const newStack = [...stack];
      newStack.pop(); // Remove current
      const previous = newStack[newStack.length - 1];

      if (previous) {
        setStack(newStack);
        router.push(previous.path);

        // Restore scroll position after navigation
        setTimeout(() => {
          window.scrollTo(0, previous.scrollY);
        }, 100);
      }
    }
  }, [stack, router]);

  const pushState = useCallback(
    (state: Partial<NavigationState>) => {
      setStack((prev) => [
        ...prev,
        {
          path: currentPath,
          scrollY: window.scrollY || 0,
          ...state,
          timestamp: Date.now(),
        },
      ]);
    },
    [currentPath]
  );

  // Save scroll position before navigation
  useEffect(() => {
    const handleScroll = () => {
      setStack((prev) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          scrollY: window.scrollY || 0,
        };
        return updated;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        canGoBack,
        goBack,
        pushState,
        currentPath,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}
