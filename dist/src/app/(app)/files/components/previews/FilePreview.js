"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { AudioPlayer } from "./AudioPlayer";
import { ImageViewer } from "./ImageViewer";
import { PDFViewer } from "./PDFViewer";
import { TextViewer } from "./TextViewer";
import { UnknownBinaryPreview } from "./UnknownBinaryPreview";
import { VideoPlayer } from "./VideoPlayer";
export function FilePreview({ url, mimeType, name, }) {
    if (!url) {
        return (_jsx("div", { className: "rounded-md border border-dashed border-[var(--z-border)] p-6 text-center text-sm text-[var(--z-muted)]", children: "Preview unavailable." }));
    }
    const mt = (mimeType !== null && mimeType !== void 0 ? mimeType : "").toLowerCase();
    if (mt.startsWith("image/"))
        return _jsx(ImageViewer, { url: url, name: name !== null && name !== void 0 ? name : undefined });
    if (mt === "application/pdf")
        return _jsx(PDFViewer, { url: url, name: name !== null && name !== void 0 ? name : undefined });
    if (mt.startsWith("video/"))
        return _jsx(VideoPlayer, { url: url });
    if (mt.startsWith("audio/"))
        return _jsx(AudioPlayer, { url: url });
    if (mt.startsWith("text/") || mt === "application/json" || mt === "application/xml") {
        return _jsx(TextViewer, { url: url });
    }
    if (mt === "application/octet-stream" ||
        mt === "" ||
        mt === "application/x-msdownload" ||
        mt.startsWith("application/vnd.")) {
        return _jsx(UnknownBinaryPreview, { url: url, mimeType: mimeType, name: name });
    }
    return _jsx(UnknownBinaryPreview, { url: url, mimeType: mimeType, name: name });
}
