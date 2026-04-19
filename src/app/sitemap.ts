import type { MetadataRoute } from "next";
import { siteBaseUrl } from "@/lib/seo/metadata";

const STATIC_PATHS = [
  "/",
  "/features",
  "/pricing",
  "/about",
  "/help",
  "/onboarding",
  "/demo",
  "/sandbox/seo",
  "/signup",
  "/docs",
  "/docs/getting-started",
  "/docs/lifecycle",
  "/docs/dashboard",
  "/docs/studio-map",
  "/docs/students",
  "/docs/settings",
  "/docs/changelog",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteBaseUrl();
  const now = new Date();
  return STATIC_PATHS.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path.startsWith("/docs") ? 0.8 : 0.7,
  }));
}
