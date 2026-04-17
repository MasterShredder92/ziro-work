/**
 * Image optimization pipeline for uploaded assets.
 *
 * Uses Supabase Storage's image transformation API when the asset lives in
 * a Supabase bucket, and falls back to Next's own `/_next/image` loader for
 * external URLs. Callers should pass an already-public URL; we never sign
 * URLs here (that belongs to the files facade).
 *
 * Supabase transform URL pattern:
 *   <url>/storage/v1/render/image/public/<bucket>/<path>?width=&height=&quality=&resize=
 * See: supabase.com/docs/guides/storage/serving/image-transformations
 */

export interface ImageVariantOptions {
  /** Target pixel width. Height is inferred unless `height` is also given. */
  width?: number;
  height?: number;
  /** 1–100; defaults to 80. */
  quality?: number;
  /** 'cover' | 'contain' | 'fill' — maps to Supabase's `resize` param. */
  resize?: "cover" | "contain" | "fill";
  /** Output format. Supabase supports `origin` + transform; Next's loader decides otherwise. */
  format?: "origin" | "webp";
}

const DEFAULT_QUALITY = 80;

function isSupabaseStorageUrl(url: string): { bucket: string; path: string; origin: string } | null {
  try {
    const u = new URL(url);
    // Matches both /storage/v1/object/public/... and /storage/v1/render/image/public/...
    const m = u.pathname.match(/^\/storage\/v1\/(?:object|render\/image)\/public\/([^/]+)\/(.+)$/);
    if (!m) return null;
    return { origin: u.origin, bucket: m[1], path: m[2] };
  } catch {
    return null;
  }
}

/**
 * Return a URL that renders `source` at the requested dimensions.
 * Returns `source` unchanged when we can't optimize it.
 */
export function optimizedImageUrl(source: string, options: ImageVariantOptions = {}): string {
  const parsed = isSupabaseStorageUrl(source);
  if (!parsed) return source;

  const params = new URLSearchParams();
  if (options.width) params.set("width", String(Math.max(1, Math.floor(options.width))));
  if (options.height) params.set("height", String(Math.max(1, Math.floor(options.height))));
  params.set("quality", String(Math.min(100, Math.max(1, options.quality ?? DEFAULT_QUALITY))));
  if (options.resize) params.set("resize", options.resize);

  const transformUrl = `${parsed.origin}/storage/v1/render/image/public/${parsed.bucket}/${parsed.path}`;
  const qs = params.toString();
  return qs ? `${transformUrl}?${qs}` : transformUrl;
}

/** Build a srcset string for responsive rendering. */
export function buildSrcSet(
  source: string,
  widths: number[],
  options: Omit<ImageVariantOptions, "width"> = {},
): string {
  return widths
    .map((w) => `${optimizedImageUrl(source, { ...options, width: w })} ${w}w`)
    .join(", ");
}

export const DEFAULT_RESPONSIVE_WIDTHS = [320, 640, 960, 1280, 1920] as const;
