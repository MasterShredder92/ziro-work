"use client";

import { AudioPlayer } from "./AudioPlayer";
import { ImageViewer } from "./ImageViewer";
import { PDFViewer } from "./PDFViewer";
import { TextViewer } from "./TextViewer";
import { UnknownBinaryPreview } from "./UnknownBinaryPreview";
import { VideoPlayer } from "./VideoPlayer";

export function FilePreview({
  url,
  mimeType,
  name,
}: {
  url: string | null;
  mimeType?: string | null;
  name?: string | null;
}) {
  if (!url) {
    return (
      <div className="rounded-md border border-dashed border-[var(--z-border)] p-6 text-center text-sm text-[var(--z-muted)]">
        Preview unavailable.
      </div>
    );
  }
  const mt = (mimeType ?? "").toLowerCase();
  if (mt.startsWith("image/")) return <ImageViewer url={url} name={name ?? undefined} />;
  if (mt === "application/pdf") return <PDFViewer url={url} name={name ?? undefined} />;
  if (mt.startsWith("video/")) return <VideoPlayer url={url} />;
  if (mt.startsWith("audio/")) return <AudioPlayer url={url} />;
  if (mt.startsWith("text/") || mt === "application/json" || mt === "application/xml") {
    return <TextViewer url={url} />;
  }
  if (
    mt === "application/octet-stream" ||
    mt === "" ||
    mt === "application/x-msdownload" ||
    mt.startsWith("application/vnd.")
  ) {
    return <UnknownBinaryPreview url={url} mimeType={mimeType} name={name} />;
  }
  return <UnknownBinaryPreview url={url} mimeType={mimeType} name={name} />;
}
