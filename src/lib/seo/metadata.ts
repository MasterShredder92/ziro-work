import type { Metadata } from "next";

export function siteBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

const base = siteBaseUrl();

/** Default SEO + OpenGraph + Twitter for ZiroWork marketing surfaces. */
const defaultSiteMetadata: Metadata = {
  metadataBase: new URL(base),
  title: {
    default: "ZiroWork",
    template: "%s · ZiroWork",
  },
  description:
    "The operating system for serious music studios—lifecycle, billing, agents, and studio map in a charcoal console with neon signal.",
  applicationName: "ZiroWork",
  icons: {
    icon: [
      { url: '/brand/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/brand/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/favicon.ico' },
    ],
    apple: [{ url: '/brand/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/brand/favicon.ico',
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: base,
    siteName: "ZiroWork",
    title: "ZiroWork",
    description:
      "Lifecycle, billing, agents, and studio map—unified for operators who live in the console daily.",
    images: [
      {
        url: `${base}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "ZiroWork",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZiroWork",
    description:
      "Charcoal-grade console for studios: lifecycle spine, neon-grade UI, and agent-native automations.",
    images: [`${base}/opengraph-image`],
  },
};

export { defaultSiteMetadata };

/** Default export matches launch checklist naming (`metadata.ts` default). */
export default defaultSiteMetadata;

export function mergePageMetadata(partial: Metadata): Metadata {
  return {
    ...defaultSiteMetadata,
    ...partial,
    openGraph: { ...defaultSiteMetadata.openGraph, ...partial.openGraph },
    twitter: { ...defaultSiteMetadata.twitter, ...partial.twitter },
  };
}

/** @param docPath segment after `/docs` (e.g. `getting-started`), or omit for `/docs` index */
export function docsPageMetadata(title: string, description: string, docPath?: string): Metadata {
  const path = docPath ? `/docs/${docPath.replace(/^\/+/, "")}` : "/docs";
  const url = `${base}${path}`;
  return mergePageMetadata({
    title,
    description,
    openGraph: { title: `${title} · ZiroWork Docs`, description, url },
    twitter: { title: `${title} · Docs`, description },
  });
}
