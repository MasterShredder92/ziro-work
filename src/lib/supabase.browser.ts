"use client";

import { createBrowserClient } from "@supabase/ssr";
type BrowserClient = ReturnType<typeof createBrowserClient>;

type BrowserGlobal = typeof globalThis & {
  __ziro_browser_supabase_client?: BrowserClient;
};

const g = globalThis as BrowserGlobal;

export function getBrowserSupabaseClient(): BrowserClient {
  if (typeof window === "undefined") {
    throw new Error("getBrowserSupabaseClient must be used in a browser context");
  }
  if (g.__ziro_browser_supabase_client) return g.__ziro_browser_supabase_client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  g.__ziro_browser_supabase_client = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      db: { schema: "public" },
    },
  );

  return g.__ziro_browser_supabase_client;
}
