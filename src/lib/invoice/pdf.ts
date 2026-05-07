/**
 * Premium white-theme invoice PDF generator.
 *
 * Single immutable template — used for every invoice across every tenant.
 * Brand colors pulled from tenants.primary_color / accent_color.
 *
 * Layout (612x792 US Letter):
 *   ┌─ Brand color band (40px tall) ─ logo  | INVOICE wordmark
 *   │
 *   │  BILL TO              ISSUED    DUE         STATUS
 *   │  Family Name          ───────   ───────     [pill]
 *   │  email                location  invoice #
 *   │
 *   │  ╔══ Items table (header tinted) ════════════════════╗
 *   │  ║ Description                Qty    Unit    Amount ║
 *   │  ║ ───────────                                       ║
 *   │  ║ row 1                                             ║
 *   │  ╚═══════════════════════════════════════════════════╝
 *   │
 *   │             ┌──────────────────────┐
 *   │             │ Subtotal      $X.XX  │
 *   │             │ Total         $X.XX  │
 *   │             ├──────────────────────┤  ← brand primary_color
 *   │             │ BALANCE DUE   $X.XX  │
 *   │             └──────────────────────┘
 *   │
 *   │  ┌─ Google Review CTA (brand accent_color) ─────────┐
 *   │  │ ★★★★★  Loved your lessons? Leave a review →     │
 *   │  └──────────────────────────────────────────────────┘
 *   │
 *   └─ Footer band ─ tenant name | location phone · email
 */
import { PDFArray, PDFDocument, PDFFont, PDFName, PDFPage, StandardFonts, rgb, type RGB } from "pdf-lib";

export type InvoicePdfInput = {
  invoice: {
    id: string;
    number: string | null;
    issued_at: string | null;
    due_date: string | null;
    total_cents: number;
    subtotal_cents: number;
    balance_cents: number;
    notes: string | null;
    google_review_enabled: boolean;
    is_recurring: boolean;
    status?: string | null;
  };
  customer: {
    name: string;
    email: string | null;
  };
  tenant: {
    name: string;
    logo_url: string | null;
    primary_color?: string | null;
    accent_color?: string | null;
  };
  location: {
    name: string | null;
    address_line1: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    phone?: string | null;
    email?: string | null;
    google_review_url?: string | null;
  } | null;
  lineItems: Array<{
    description: string;
    quantity: number;
    unit_price: number;
  }>;
};

// ── Color helpers ──
const FALLBACK_PRIMARY = "#0a0a0c";
const FALLBACK_ACCENT = "#c4f036";

function hexToRgb(hex: string | null | undefined, fallback: string): RGB {
  const h = (hex && hex.startsWith("#") ? hex : fallback).replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  if ([r, g, b].some((v) => Number.isNaN(v))) return hexToRgb(fallback, fallback);
  return rgb(r, g, b);
}

function relativeLuminance(c: RGB): number {
  // sRGB luminance approximation
  return 0.2126 * c.red + 0.7152 * c.green + 0.0722 * c.blue;
}
function readableOn(c: RGB): RGB {
  return relativeLuminance(c) > 0.55 ? rgb(0.07, 0.07, 0.09) : rgb(1, 1, 1);
}

// ── Format helpers ──
const fmtCents = (cents: number): string =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDollars = (n: number): string =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (s: string | null): string => {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return s;
  }
};

// ── Logo loader ──
async function fetchLogo(doc: PDFDocument, url: string | null): Promise<{ image: import("pdf-lib").PDFImage; w: number; h: number } | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    const image = ct.includes("jpeg") || ct.includes("jpg")
      ? await doc.embedJpg(buf)
      : await doc.embedPng(buf);
    return { image, w: image.width, h: image.height };
  } catch {
    return null;
  }
}

// ── Text helpers ──
function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  size: number,
  font: PDFFont,
  color: RGB,
  maxWidth?: number
) {
  let s = text ?? "";
  if (maxWidth) {
    while (font.widthOfTextAtSize(s, size) > maxWidth && s.length > 1) {
      s = s.slice(0, -1);
    }
    if (s !== text) s = s.slice(0, -1) + "…";
  }
  page.drawText(s, { x, y, size, font, color });
}

function rightAlignText(
  page: PDFPage,
  text: string,
  rightX: number,
  y: number,
  size: number,
  font: PDFFont,
  color: RGB
) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: rightX - w, y, size, font, color });
}

export async function renderInvoicePdf(input: InvoicePdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const W = 612;
  const H = 792;
  const M = 48;

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const primary = hexToRgb(input.tenant.primary_color, FALLBACK_PRIMARY);
  const accent = hexToRgb(input.tenant.accent_color, FALLBACK_ACCENT);
  const onPrimary = readableOn(primary);
  const onAccent = readableOn(accent);
  const ink = rgb(0.07, 0.07, 0.09);
  const muted = rgb(0.45, 0.45, 0.5);
  const hairline = rgb(0.88, 0.88, 0.91);
  const tint = rgb(0.97, 0.97, 0.985);

  // ── 1. Brand header band ──
  const headerH = 84;
  page.drawRectangle({ x: 0, y: H - headerH, width: W, height: headerH, color: primary });

  // Logo (or wordmark fallback)
  const logo = await fetchLogo(doc, input.tenant.logo_url ?? null);
  if (logo) {
    const targetH = 48;
    const ratio = targetH / logo.h;
    const targetW = logo.w * ratio;
    page.drawImage(logo.image, {
      x: M,
      y: H - headerH + (headerH - targetH) / 2,
      width: targetW,
      height: targetH,
    });
    drawText(page, input.tenant.name, M + targetW + 14, H - headerH / 2 - 4, 14, bold, onPrimary);
  } else {
    drawText(page, input.tenant.name.toUpperCase(), M, H - headerH / 2 - 6, 18, bold, onPrimary);
  }

  // INVOICE wordmark right-aligned
  rightAlignText(page, "INVOICE", W - M, H - headerH / 2 + 6, 28, bold, onPrimary);
  if (input.invoice.number) {
    rightAlignText(page, `# ${input.invoice.number}`, W - M, H - headerH / 2 - 14, 10, font, onPrimary);
  } else {
    rightAlignText(page, `# ${input.invoice.id.slice(0, 8).toUpperCase()}`, W - M, H - headerH / 2 - 14, 10, font, onPrimary);
  }

  // ── 2. Bill To + Meta row ──
  let y = H - headerH - 36;

  const labelSize = 7.5;
  drawText(page, "BILLED TO", M, y, labelSize, bold, muted);
  drawText(page, "ISSUED", 320, y, labelSize, bold, muted);
  drawText(page, "DUE", 410, y, labelSize, bold, muted);
  drawText(page, "STATUS", 500, y, labelSize, bold, muted);

  y -= 16;
  drawText(page, input.customer.name || "Customer", M, y, 12, bold, ink, 250);
  drawText(page, fmtDate(input.invoice.issued_at), 320, y, 11, font, ink);
  drawText(page, fmtDate(input.invoice.due_date), 410, y, 11, bold, ink);

  // Status pill
  const status = (input.invoice.status || "OPEN").toUpperCase();
  const pillW = font.widthOfTextAtSize(status, 9) + 14;
  page.drawRectangle({
    x: 500,
    y: y - 4,
    width: pillW,
    height: 18,
    color: accent,
  });
  drawText(page, status, 500 + 7, y, 9, bold, onAccent);

  y -= 16;
  if (input.customer.email) {
    drawText(page, input.customer.email, M, y, 9.5, font, muted, 250);
  }

  if (input.location?.name) {
    y -= 12;
    drawText(page, input.location.name, M, y, 9.5, font, muted, 250);
  }

  // ── 3. Items table ──
  y -= 28;
  const colDesc = M;
  const colQty = 360;
  const colUnit = 420;
  const colAmt = W - M; // right-aligned

  // Tinted header
  page.drawRectangle({
    x: M,
    y: y - 6,
    width: W - M * 2,
    height: 22,
    color: tint,
  });
  drawText(page, "DESCRIPTION", colDesc + 8, y, labelSize, bold, muted);
  drawText(page, "QTY", colQty, y, labelSize, bold, muted);
  drawText(page, "UNIT", colUnit, y, labelSize, bold, muted);
  rightAlignText(page, "AMOUNT", colAmt - 8, y, labelSize, bold, muted);

  y -= 24;

  for (let i = 0; i < input.lineItems.length; i++) {
    const li = input.lineItems[i];
    const total = (li.quantity || 0) * (li.unit_price || 0);

    // alternating row tint
    if (i % 2 === 1) {
      page.drawRectangle({
        x: M,
        y: y - 6,
        width: W - M * 2,
        height: 20,
        color: rgb(0.985, 0.985, 0.99),
      });
    }

    drawText(page, li.description, colDesc + 8, y, 10.5, font, ink, 290);
    drawText(page, String(li.quantity), colQty, y, 10.5, font, ink);
    drawText(page, fmtDollars(li.unit_price), colUnit, y, 10.5, font, ink);
    rightAlignText(page, fmtDollars(total), colAmt - 8, y, 10.5, bold, ink);

    y -= 20;
  }

  // bottom line under items
  page.drawLine({
    start: { x: M, y: y + 6 },
    end: { x: W - M, y: y + 6 },
    thickness: 0.75,
    color: hairline,
  });

  y -= 22;

  // ── 4. Totals card (right-aligned) ──
  const cardW = 240;
  const cardX = W - M - cardW;

  // Subtotal
  drawText(page, "Subtotal", cardX + 14, y, 10, font, muted);
  rightAlignText(page, fmtCents(input.invoice.subtotal_cents), cardX + cardW - 14, y, 10, font, ink);
  y -= 16;

  // Total
  drawText(page, "Total", cardX + 14, y, 11, bold, ink);
  rightAlignText(page, fmtCents(input.invoice.total_cents), cardX + cardW - 14, y, 11, bold, ink);
  y -= 22;

  // Balance Due brand bar
  page.drawRectangle({
    x: cardX,
    y: y - 8,
    width: cardW,
    height: 30,
    color: primary,
  });
  drawText(page, "BALANCE DUE", cardX + 14, y, 11, bold, onPrimary);
  rightAlignText(page, fmtCents(input.invoice.balance_cents), cardX + cardW - 14, y, 13, bold, onPrimary);
  y -= 32;

  // ── 5. Notes / Recurring strip ──
  if (input.invoice.notes || input.invoice.is_recurring) {
    y -= 10;
    drawText(page, "NOTES", M, y, labelSize, bold, muted);
    y -= 14;
    if (input.invoice.notes) {
      drawText(page, input.invoice.notes, M, y, 10, font, ink, W - M * 2);
      y -= 14;
    }
    if (input.invoice.is_recurring) {
      drawText(page, "Recurring billing — sends on the 1st of each month.", M, y, 9.5, font, muted, W - M * 2);
      y -= 14;
    }
  }

  // ── 6. Google Review CTA card ──
  if (input.invoice.google_review_enabled) {
    y -= 12;
    const ctaH = 56;
    page.drawRectangle({
      x: M,
      y: y - ctaH + 14,
      width: W - M * 2,
      height: ctaH,
      color: accent,
    });

    drawText(page, "★★★★★", M + 18, y - 4, 18, bold, onAccent);
    drawText(
      page,
      "Loved your lessons?",
      M + 92,
      y,
      12,
      bold,
      onAccent
    );
    drawText(
      page,
      "Leave us a Google review — it helps the studio more than you know.",
      M + 92,
      y - 14,
      9.5,
      font,
      onAccent
    );

    if (input.location?.google_review_url) {
      const linkY = y - 30;
      const btnText = "Leave a review →";
      const btnW = font.widthOfTextAtSize(btnText, 10) + 24;
      const btnX = W - M - btnW - 18;
      const btnY = linkY - 6;
      page.drawRectangle({
        x: btnX,
        y: btnY,
        width: btnW,
        height: 22,
        color: rgb(1, 1, 1),
      });
      drawText(page, btnText, btnX + 12, linkY, 10, bold, ink);
      // Add clickable link annotation directly on page
      const linkAnnotation = doc.context.obj({
        Type: "Annot",
        Subtype: "Link",
        Rect: [btnX, btnY, btnX + btnW, btnY + 22],
        Border: [0, 0, 0],
        A: { Type: "Action", S: "URI", URI: input.location.google_review_url },
      });
      const linkRef = doc.context.register(linkAnnotation);
      const existing = page.node.lookupMaybe(PDFName.of("Annots"), PDFArray);
      if (existing) {
        existing.push(linkRef);
      } else {
        const arr = PDFArray.withContext(doc.context);
        arr.push(linkRef);
        page.node.set(PDFName.of("Annots"), arr);
      }
    }
    y -= ctaH + 4;
  }

  // ── 7. Footer band ──
  const footerH = 36;
  page.drawRectangle({ x: 0, y: 0, width: W, height: footerH, color: tint });
  drawText(page, `${input.tenant.name}  •  Thank you for your business`, M, footerH / 2 - 4, 9, font, muted);

  const contactBits: string[] = [];
  if (input.location?.phone) contactBits.push(input.location.phone);
  if (input.location?.email) contactBits.push(input.location.email);
  const contact = contactBits.join("  ·  ");
  if (contact) {
    rightAlignText(page, contact, W - M, footerH / 2 - 4, 9, font, muted);
  }

  return await doc.save();
}
