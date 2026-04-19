"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { GlobalLoader } from "@/components/system/GlobalLoader";

export function NavigationProgress() {
  const pathname = usePathname();
  const [active, setActive] = React.useState(false);
  const prevRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (prevRef.current === null) {
      prevRef.current = pathname;
      return;
    }
    if (prevRef.current === pathname) return;
    prevRef.current = pathname;
    queueMicrotask(() => setActive(true));
    const t = window.setTimeout(() => setActive(false), 240);
    return () => window.clearTimeout(t);
  }, [pathname]);

  return <GlobalLoader visible={active} />;
}
