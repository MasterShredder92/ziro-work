import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
function formatBytes(bytes) {
    if (!bytes || bytes <= 0)
        return null;
    const kb = bytes / 1024;
    if (kb < 1024)
        return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024)
        return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
}
export function ContentDetail({ surface, canWrite }) {
    var _a, _b;
    const { item, file, tags, collections, embedding, related } = surface;
    const size = formatBytes(item.file_size_bytes);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("header", { className: "space-y-2", children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Content item" }), _jsx("h1", { className: "text-xl sm:text-2xl font-semibold text-[var(--z-fg)]", children: item.title }), _jsxs("div", { className: "flex flex-wrap items-center gap-2 text-xs text-[var(--z-muted)]", children: [_jsx("span", { className: "rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider", children: item.kind }), _jsx("span", { className: "rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider", children: item.visibility }), item.file_name ? _jsxs("span", { children: ["\u00B7 ", item.file_name] }) : null, size ? _jsxs("span", { children: ["\u00B7 ", size] }) : null, _jsxs("span", { children: ["\u00B7 Viewed ", item.access_count] })] })] }), item.description ? (_jsx("p", { className: "text-sm leading-relaxed text-[var(--z-fg)]/80", children: item.description })) : null, file ? (_jsxs("section", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Preview" }), _jsx(FilePreview, { mime: file.mimeType, url: (_b = (_a = file.fileUrl) !== null && _a !== void 0 ? _a : file.sourceUrl) !== null && _b !== void 0 ? _b : null, thumbnail: file.thumbnailUrl, title: item.title }), _jsxs("div", { className: "mt-3 flex flex-wrap gap-2 text-xs", children: [file.fileUrl ? (_jsx("a", { href: file.fileUrl, target: "_blank", rel: "noreferrer", className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1 text-[var(--z-fg)] hover:text-[#00ff88]", children: "Download / open" })) : null, file.sourceUrl ? (_jsx("a", { href: file.sourceUrl, target: "_blank", rel: "noreferrer", className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1 text-[var(--z-fg)] hover:text-[#00ff88]", children: "Source" })) : null] })] })) : null, _jsxs("section", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsx(MetadataCard, { title: "Tags", empty: "No tags", body: tags.length === 0 ? null : (_jsx("div", { className: "flex flex-wrap gap-1.5", children: tags.map((t) => (_jsx("span", { className: "rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-0.5 text-[11px] text-[var(--z-fg)]", children: t.label }, t.id))) })) }), _jsx(MetadataCard, { title: "Collections", empty: "Not in any collections", body: collections.length === 0 ? null : (_jsx("ul", { className: "space-y-1 text-sm", children: collections.map((c) => (_jsx("li", { children: _jsx(Link, { href: `/content/collections/${c.id}`, className: "text-[var(--z-fg)] hover:text-[#00ff88]", children: c.title }) }, c.id))) })) }), _jsx(MetadataCard, { title: "Embedding", empty: "Not indexed", body: embedding ? (_jsxs("div", { className: "text-xs text-[var(--z-muted)] space-y-0.5", children: [_jsxs("div", { children: ["Model:", " ", _jsx("span", { className: "text-[var(--z-fg)]", children: embedding.model })] }), _jsxs("div", { children: ["Dimensions:", " ", _jsx("span", { className: "text-[var(--z-fg)]", children: embedding.dimensions })] }), _jsxs("div", { children: ["Updated", " ", _jsx("span", { className: "text-[var(--z-fg)]", children: new Date(embedding.updated_at).toLocaleString() })] })] })) : null }), _jsx(MetadataCard, { title: "Author", empty: "No author recorded", body: item.author_id ? (_jsx("div", { className: "text-sm text-[var(--z-fg)]", children: item.author_id })) : null })] }), _jsxs("section", { className: "space-y-2", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Related" }), related.length === 0 ? (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-6 text-center text-xs text-[var(--z-muted)]", children: "No related items yet." })) : (_jsx("ul", { className: "grid gap-1.5 md:grid-cols-2", children: related.map((r) => (_jsxs("li", { className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-sm", children: [_jsx(Link, { href: `/content/${r.id}`, className: "text-[var(--z-fg)] hover:text-[#00ff88]", children: r.title }), _jsxs("div", { className: "text-[11px] text-[var(--z-muted)]", children: [r.kind, r.tags.length > 0 ? ` · ${r.tags.slice(0, 3).join(", ")}` : ""] })] }, r.id))) }))] }), canWrite ? (_jsx("section", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-3 text-xs text-[var(--z-muted)]", children: "You have write access. Use the API to rename, retag, or move this item." })) : null] }));
}
function MetadataCard({ title, empty, body, }) {
    return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: title }), _jsx("div", { className: "mt-2", children: body !== null && body !== void 0 ? body : (_jsx("div", { className: "text-xs text-[var(--z-muted)]", children: empty })) })] }));
}
function FilePreview({ mime, url, thumbnail, title, }) {
    if (!url) {
        return (_jsx("div", { className: "mt-3 flex h-40 items-center justify-center rounded-md border border-dashed border-[var(--z-border)] bg-[var(--z-surface-2)] text-xs text-[var(--z-muted)]", children: "No preview available" }));
    }
    if (mime === null || mime === void 0 ? void 0 : mime.startsWith("image/")) {
        return (_jsx("img", { src: url, alt: title, className: "mt-3 max-h-[400px] w-full rounded-md border border-[var(--z-border)] object-contain bg-[var(--z-surface-2)]" }));
    }
    if (mime === null || mime === void 0 ? void 0 : mime.startsWith("video/")) {
        return (_jsx("video", { controls: true, className: "mt-3 w-full rounded-md border border-[var(--z-border)] bg-black", children: _jsx("source", { src: url, type: mime }) }));
    }
    if (mime === null || mime === void 0 ? void 0 : mime.startsWith("audio/")) {
        return (_jsx("audio", { controls: true, className: "mt-3 w-full", children: _jsx("source", { src: url, type: mime }) }));
    }
    if (mime === "application/pdf") {
        return (_jsx("iframe", { src: url, title: title, className: "mt-3 h-[520px] w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)]" }));
    }
    if (thumbnail) {
        return (_jsx("img", { src: thumbnail, alt: title, className: "mt-3 max-h-[320px] w-full rounded-md border border-[var(--z-border)] object-contain bg-[var(--z-surface-2)]" }));
    }
    return (_jsx("div", { className: "mt-3 flex h-40 items-center justify-center rounded-md border border-dashed border-[var(--z-border)] bg-[var(--z-surface-2)] text-xs text-[var(--z-muted)]", children: "Preview unavailable \u00B7 open in new tab" }));
}
