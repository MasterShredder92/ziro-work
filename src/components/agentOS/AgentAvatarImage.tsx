"use client";

import * as React from "react";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (a + b).toUpperCase();
}

type Props = {
  src?: string | null;
  name: string;
  className?: string;
  accent?: string;
};

/** Avatar image with fallback to initials. Uses <img> (no Next image config needed). */
export function AgentAvatarImage({ src, name, className, accent }: Props) {
  const [ok, setOk] = React.useState(true);
  const showImg = !!src && ok;
  return (
    <div className={className} style={accent ? ({ color: accent } as React.CSSProperties) : undefined}>
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src ?? ""}
          alt=""
          className="h-full w-full rounded-full object-cover"
          onError={() => setOk(false)}
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center rounded-full text-sm font-extrabold"
          style={accent ? { color: accent } : undefined}
        >
          {initials(name)}
        </div>
      )}
    </div>
  );
}
