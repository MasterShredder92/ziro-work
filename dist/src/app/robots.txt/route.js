import { siteBaseUrl } from "@/lib/seo/metadata";
export function GET() {
    const base = siteBaseUrl();
    const body = [
        "User-agent: *",
        "Allow: /",
        "Disallow: /app/",
        "",
        `Sitemap: ${base}/sitemap.xml`,
        "",
    ].join("\n");
    return new Response(body, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
    });
}
