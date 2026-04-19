import "server-only";
import { renderTemplate } from "@/lib/templates/renderer";
import type { TemplateContext } from "@/lib/templates/types";
import type { ContentItemRow } from "@data/contentItems";
import type { ContentAssetRow } from "@data/contentAssets";
import { listAssets } from "./assets";

export type ContentRenderOptions = {
  tenantId: string;
  mergeContext?: TemplateContext;
  assets?: ContentAssetRow[];
  assetBaseUrl?: string | null;
};

export type RenderedContent = {
  itemId: string;
  contentType: string;
  html: string;
  text: string;
  embeddedAssetIds: string[];
  missingMergeFields: string[];
  renderedAt: string;
};

const ASSET_REF_RE = /\{\{\s*asset:([a-zA-Z0-9_-]+)\s*\}\}/g;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}

function markdownToHtml(input: string): string {
  const lines = input.split(/\r?\n/);
  const html: string[] = [];
  let inList: "ul" | "ol" | null = null;
  let inCode = false;
  let codeBuffer: string[] = [];

  function flushList() {
    if (inList) {
      html.push(`</${inList}>`);
      inList = null;
    }
  }

  function flushCode() {
    if (inCode) {
      html.push(
        `<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`,
      );
      codeBuffer = [];
      inCode = false;
    }
  }

  function inline(s: string): string {
    let out = escapeHtml(s);
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
    out = out.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_m, text, href) =>
        `<a href="${escapeAttr(href)}" target="_blank" rel="noreferrer">${text}</a>`,
    );
    return out;
  }

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) {
        flushCode();
      } else {
        flushList();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuffer.push(line);
      continue;
    }
    if (/^\s*$/.test(line)) {
      flushList();
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      flushList();
      const level = h[1].length;
      html.push(`<h${level}>${inline(h[2])}</h${level}>`);
      continue;
    }
    if (/^\s*[-*+]\s+/.test(line)) {
      if (inList !== "ul") {
        flushList();
        inList = "ul";
        html.push("<ul>");
      }
      html.push(`<li>${inline(line.replace(/^\s*[-*+]\s+/, ""))}</li>`);
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      if (inList !== "ol") {
        flushList();
        inList = "ol";
        html.push("<ol>");
      }
      html.push(`<li>${inline(line.replace(/^\s*\d+\.\s+/, ""))}</li>`);
      continue;
    }
    if (/^\s*>\s+/.test(line)) {
      flushList();
      html.push(`<blockquote>${inline(line.replace(/^\s*>\s+/, ""))}</blockquote>`);
      continue;
    }
    flushList();
    html.push(`<p>${inline(line)}</p>`);
  }
  flushCode();
  flushList();
  return html.join("\n");
}

function renderAssetReference(asset: ContentAssetRow): string {
  const url = escapeAttr(asset.url);
  const name = escapeHtml(asset.name);
  const alt = escapeAttr(asset.alt_text ?? asset.name);
  if (asset.kind === "image") {
    return `<figure class="z-content-asset z-content-asset--image"><img src="${url}" alt="${alt}" loading="lazy" /><figcaption>${name}</figcaption></figure>`;
  }
  if (asset.kind === "video") {
    return `<figure class="z-content-asset z-content-asset--video"><video src="${url}" controls preload="metadata"></video><figcaption>${name}</figcaption></figure>`;
  }
  if (asset.kind === "audio") {
    return `<figure class="z-content-asset z-content-asset--audio"><audio src="${url}" controls></audio><figcaption>${name}</figcaption></figure>`;
  }
  return `<a class="z-content-asset z-content-asset--link" href="${url}" target="_blank" rel="noreferrer">${name}</a>`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export async function renderContentItem(
  item: ContentItemRow,
  options: ContentRenderOptions,
): Promise<RenderedContent> {
  const assets = options.assets
    ? options.assets
    : await listAssets(options.tenantId, { itemId: item.id });

  const assetById = new Map(assets.map((a) => [a.id, a]));
  const missingMergeFields: string[] = [];
  const embeddedAssetIds: string[] = [];

  let working = item.body ?? "";

  if (options.mergeContext) {
    const rendered = renderTemplate(working, options.mergeContext, {
      templateId: item.id,
      version: item.current_version,
    });
    working = rendered.body;
    missingMergeFields.push(...rendered.missingMergeFields);
  }

  working = working.replace(ASSET_REF_RE, (_match, ref: string) => {
    const asset = assetById.get(ref);
    if (!asset) return "";
    embeddedAssetIds.push(asset.id);
    return renderAssetReference(asset);
  });

  const contentType = item.content_type || "markdown";
  let html: string;
  switch (contentType) {
    case "markdown":
    case "snippet":
    case "note":
      html = markdownToHtml(working);
      break;
    case "rich_text":
    case "page":
      html = working;
      break;
    case "plain":
    default:
      html = `<pre class="z-content-plain">${escapeHtml(working)}</pre>`;
      break;
  }

  // Append any assets attached to the item but not referenced inline.
  const inlineRefs = new Set(embeddedAssetIds);
  const extras = assets.filter((a) => !inlineRefs.has(a.id));
  if (extras.length > 0) {
    html += `\n<aside class="z-content-attachments">\n`;
    for (const a of extras) {
      html += renderAssetReference(a) + "\n";
    }
    html += `</aside>`;
  }

  const text = stripHtml(html);

  return {
    itemId: item.id,
    contentType,
    html,
    text,
    embeddedAssetIds,
    missingMergeFields: Array.from(new Set(missingMergeFields)),
    renderedAt: new Date().toISOString(),
  };
}
