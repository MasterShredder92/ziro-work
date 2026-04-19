"use client";

import { LoginForm } from "./LoginForm";

export function LoginPageClient({
  accent,
  nextHref,
}: {
  accent: string;
  nextHref: string;
}) {
  return <LoginForm accent={accent} nextHref={nextHref} />;
}
