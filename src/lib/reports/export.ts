/**
 * Reporting OS — export engine.
 *
 * Serializes a ReportResult (or any tabular result) into CSV, XLSX, or a
 * simple text-mode PDF. The output is encoded as base64 and handed off to
 * the export job store so clients can poll status and download via the
 * API.
 *
 * The XLSX and PDF encoders here are intentionally minimal — they produce
 * valid files without external dependencies so the pipeline works in dev
 * and test. Real Excel/PDF tooling can be introduced later without
 * changing the engine contract.
 */

import "server-only";

import type {
  ExportFormat,
  ReportColumn,
  ReportResult,
  ReportSummaryMetric,
} from "./types";

export type ExportPayload = {
  filename: string;
  contentType: string;
  base64: string;
  sizeBytes: number;
};

const CSV_CONTENT = "text/csv; charset=utf-8";
const XLSX_CONTENT =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const PDF_CONTENT = "application/pdf";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toBase64(bytes: Uint8Array | string): string {
  if (typeof bytes === "string") {
    return Buffer.from(bytes, "utf-8").toString("base64");
  }
  return Buffer.from(bytes).toString("base64");
}

function formatCell(
  value: unknown,
  column: ReportColumn | undefined,
): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") {
    if (column?.format === "currency") {
      return (value / 100).toFixed(2);
    }
    if (column?.format === "percent") {
      return `${value}%`;
    }
    return String(value);
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function escapeCsv(cell: string): string {
  if (/[",\n\r]/.test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

function safeFilename(name: string, format: ExportFormat): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/gi, "_")
    .replace(/^_+|_+$/g, "") || "report";
  const stamp = new Date().toISOString().slice(0, 10);
  return `${slug}_${stamp}.${format}`;
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

export function toCsv(
  columns: ReportColumn[],
  rows: Array<Record<string, unknown>>,
): string {
  const lines: string[] = [];
  const header = columns.map((c) => escapeCsv(c.label ?? c.key)).join(",");
  lines.push(header);
  for (const row of rows) {
    const cells = columns.map((c) => escapeCsv(formatCell(row[c.key], c)));
    lines.push(cells.join(","));
  }
  return lines.join("\r\n");
}

// ---------------------------------------------------------------------------
// XLSX (minimal, dependency-free)
// ---------------------------------------------------------------------------

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function colLetter(index: number): string {
  let n = index;
  let out = "";
  while (n >= 0) {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  }
  return out;
}

/**
 * Produce a simple UTF-8 XLSX file as raw bytes. Uses the Office Open XML
 * SpreadsheetML flat-file layout with a single sheet. Compression is not
 * applied — the zip uses STORE mode — because recent Excel versions accept
 * uncompressed containers and we want to avoid native deps.
 */
function toXlsxBytes(
  columns: ReportColumn[],
  rows: Array<Record<string, unknown>>,
): Uint8Array {
  const cells: string[] = [];
  cells.push('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
  cells.push(
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
  );
  cells.push('<sheets><sheet name="Sheet1" sheetId="1" r:id="rId1" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/></sheets>');
  cells.push("</workbook>");
  const workbookXml = cells.join("");

  const sheet: string[] = [];
  sheet.push('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
  sheet.push(
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>',
  );
  sheet.push("<row>");
  columns.forEach((c, i) => {
    sheet.push(
      `<c r="${colLetter(i)}1" t="inlineStr"><is><t>${xmlEscape(c.label ?? c.key)}</t></is></c>`,
    );
  });
  sheet.push("</row>");
  rows.forEach((row, r) => {
    sheet.push(`<row>`);
    columns.forEach((c, i) => {
      const v = row[c.key];
      const formatted = formatCell(v, c);
      if (typeof v === "number" && Number.isFinite(v)) {
        sheet.push(`<c r="${colLetter(i)}${r + 2}"><v>${v}</v></c>`);
      } else {
        sheet.push(
          `<c r="${colLetter(i)}${r + 2}" t="inlineStr"><is><t>${xmlEscape(formatted)}</t></is></c>`,
        );
      }
    });
    sheet.push("</row>");
  });
  sheet.push("</sheetData></worksheet>");
  const sheetXml = sheet.join("");

  const contentTypes =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
    "</Types>";

  const rootRels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    "</Relationships>";

  const workbookRels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
    "</Relationships>";

  return zipStore([
    { name: "[Content_Types].xml", data: contentTypes },
    { name: "_rels/.rels", data: rootRels },
    { name: "xl/workbook.xml", data: workbookXml },
    { name: "xl/_rels/workbook.xml.rels", data: workbookRels },
    { name: "xl/worksheets/sheet1.xml", data: sheetXml },
  ]);
}

// ---------------------------------------------------------------------------
// Minimal ZIP (STORE mode) — no compression, no external deps.
// ---------------------------------------------------------------------------

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC32_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

type ZipEntry = { name: string; data: string | Uint8Array };

function dosTimeNow(): { time: number; date: number } {
  const d = new Date();
  const time =
    ((d.getHours() & 0x1f) << 11) |
    ((d.getMinutes() & 0x3f) << 5) |
    ((Math.floor(d.getSeconds() / 2)) & 0x1f);
  const date =
    (((d.getFullYear() - 1980) & 0x7f) << 9) |
    (((d.getMonth() + 1) & 0x0f) << 5) |
    (d.getDate() & 0x1f);
  return { time, date };
}

function writeUInt16LE(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true);
}
function writeUInt32LE(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value, true);
}

function zipStore(entries: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const { time, date } = dosTimeNow();

  const fileChunks: Uint8Array[] = [];
  const centralChunks: Uint8Array[] = [];
  let offset = 0;
  let totalSize = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const dataBytes =
      typeof entry.data === "string" ? encoder.encode(entry.data) : entry.data;
    const crc = crc32(dataBytes);
    const localHeader = new Uint8Array(30);
    const lv = new DataView(localHeader.buffer);
    writeUInt32LE(lv, 0, 0x04034b50);
    writeUInt16LE(lv, 4, 20);
    writeUInt16LE(lv, 6, 0);
    writeUInt16LE(lv, 8, 0);
    writeUInt16LE(lv, 10, time);
    writeUInt16LE(lv, 12, date);
    writeUInt32LE(lv, 14, crc);
    writeUInt32LE(lv, 18, dataBytes.length);
    writeUInt32LE(lv, 22, dataBytes.length);
    writeUInt16LE(lv, 26, nameBytes.length);
    writeUInt16LE(lv, 28, 0);

    fileChunks.push(localHeader, nameBytes, dataBytes);
    totalSize += localHeader.length + nameBytes.length + dataBytes.length;

    const centralHeader = new Uint8Array(46);
    const cv = new DataView(centralHeader.buffer);
    writeUInt32LE(cv, 0, 0x02014b50);
    writeUInt16LE(cv, 4, 20);
    writeUInt16LE(cv, 6, 20);
    writeUInt16LE(cv, 8, 0);
    writeUInt16LE(cv, 10, 0);
    writeUInt16LE(cv, 12, time);
    writeUInt16LE(cv, 14, date);
    writeUInt32LE(cv, 16, crc);
    writeUInt32LE(cv, 20, dataBytes.length);
    writeUInt32LE(cv, 24, dataBytes.length);
    writeUInt16LE(cv, 28, nameBytes.length);
    writeUInt16LE(cv, 30, 0);
    writeUInt16LE(cv, 32, 0);
    writeUInt16LE(cv, 34, 0);
    writeUInt16LE(cv, 36, 0);
    writeUInt32LE(cv, 38, 0);
    writeUInt32LE(cv, 42, offset);

    centralChunks.push(centralHeader, nameBytes);
    offset += localHeader.length + nameBytes.length + dataBytes.length;
  }

  let centralSize = 0;
  for (const c of centralChunks) centralSize += c.length;

  const endRecord = new Uint8Array(22);
  const ev = new DataView(endRecord.buffer);
  writeUInt32LE(ev, 0, 0x06054b50);
  writeUInt16LE(ev, 4, 0);
  writeUInt16LE(ev, 6, 0);
  writeUInt16LE(ev, 8, entries.length);
  writeUInt16LE(ev, 10, entries.length);
  writeUInt32LE(ev, 12, centralSize);
  writeUInt32LE(ev, 16, totalSize);
  writeUInt16LE(ev, 20, 0);

  const parts = [...fileChunks, ...centralChunks, endRecord];
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let cursor = 0;
  for (const p of parts) {
    out.set(p, cursor);
    cursor += p.length;
  }
  return out;
}

// ---------------------------------------------------------------------------
// PDF (minimal, text-only)
// ---------------------------------------------------------------------------

function toPdfBytes(
  title: string,
  summary: ReportSummaryMetric[],
  columns: ReportColumn[],
  rows: Array<Record<string, unknown>>,
  branding?: { footerText?: string | null; watermark?: string | null },
): Uint8Array {
  const lines: string[] = [];
  lines.push(title);
  lines.push(new Date().toISOString());
  if (summary.length > 0) {
    lines.push("");
    lines.push("Summary");
    for (const m of summary) {
      lines.push(`  ${m.label}: ${String(m.value)}`);
    }
  }
  if (columns.length > 0) {
    lines.push("");
    const header = columns.map((c) => c.label ?? c.key).join(" | ");
    lines.push(header);
    lines.push("-".repeat(Math.min(header.length, 90)));
    for (const row of rows.slice(0, 200)) {
      const cells = columns.map((c) => formatCell(row[c.key], c));
      lines.push(cells.join(" | "));
    }
    if (rows.length > 200) lines.push(`... and ${rows.length - 200} more rows`);
  }

  if (branding?.footerText) {
    lines.push("");
    lines.push(String(branding.footerText));
  }
  if (branding?.watermark) {
    lines.push("");
    lines.push(`[${String(branding.watermark)}]`);
  }

  const escape = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

  const content: string[] = [];
  content.push("BT /F1 11 Tf 72 760 Td");
  let first = true;
  for (const line of lines) {
    if (first) {
      content.push(`(${escape(line)}) Tj`);
      first = false;
    } else {
      content.push("0 -14 Td");
      content.push(`(${escape(line)}) Tj`);
    }
  }
  content.push("ET");
  const stream = content.join("\n");
  const streamBytes = Buffer.from(stream, "utf-8");

  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  objects.push(
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
  );
  objects.push(
    `<< /Length ${streamBytes.length} >>\nstream\n${stream}\nendstream`,
  );
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const off of offsets) {
    pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------

export function exportResult(
  result: ReportResult,
  format: ExportFormat,
): ExportPayload {
  const name = result.name ?? "report";
  const filename = safeFilename(name, format);
  switch (format) {
    case "csv": {
      const csv = toCsv(result.columns, result.rows);
      const bytes = new TextEncoder().encode(csv);
      return {
        filename,
        contentType: CSV_CONTENT,
        base64: toBase64(bytes),
        sizeBytes: bytes.byteLength,
      };
    }
    case "xlsx": {
      const bytes = toXlsxBytes(result.columns, result.rows);
      return {
        filename,
        contentType: XLSX_CONTENT,
        base64: toBase64(bytes),
        sizeBytes: bytes.byteLength,
      };
    }
    case "pdf":
    default: {
      const bytes = toPdfBytes(
        name,
        result.summary,
        result.columns,
        result.rows,
        result.pdfExportBranding,
      );
      return {
        filename,
        contentType: PDF_CONTENT,
        base64: toBase64(bytes),
        sizeBytes: bytes.byteLength,
      };
    }
  }
}

export function exportTable(
  name: string,
  columns: ReportColumn[],
  rows: Array<Record<string, unknown>>,
  format: ExportFormat,
): ExportPayload {
  return exportResult(
    {
      reportId: "custom",
      reportKind: "custom" as never,
      name,
      generatedAt: new Date().toISOString(),
      range: { from: "", to: "" },
      tenantId: "",
      summary: [],
      columns,
      rows,
    },
    format,
  );
}
