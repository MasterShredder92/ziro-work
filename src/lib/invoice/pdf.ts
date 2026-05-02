/**
 * Locked white-theme invoice PDF generator.
 *
 * Single, immutable template used for every invoice in every tenant.
 * No theme toggle. No per-family layout drift.
 *
 * Layout:
 *   Header  : Tenant name + logo placeholder | Invoice # + dates
 *   Bill To : Family name, email, location
 *   Items   : description / qty / unit / total table
 *   Totals  : subtotal, total, balance due
 *   Footer  : tenant address + Square pay link (if present) + Google review tag
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

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
  };
  customer: {
    name: string;
    email: string | null;
  };
  tenant: {
    name: string;
    logo_url: string | null;
  };
  location: {
    name: string | null;
    address_line1: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
  } | null;
  lineItems: Array<{
    description: string;
    quantity: number;
    unit_price: number; // dollars
  }>;
};

const ZIRO_GREEN = rgb(0, 1, 136 / 255); // approximation
const BLACK = rgb(0.05, 0.05, 0.05);
const GREY = rgb(0.45, 0.45, 0.5);
const LIGHT_GREY = rgb(0.86, 0.86, 0.88);

function fmt(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
function fmtDollars(amount: number): string {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
function fmtDate(s: string | null): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return s;
  }
}

export async function renderInvoicePdf(input: InvoicePdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]); // US Letter
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const W = 612;
  const margin = 48;
  let y = 792 - margin;

  // ── Header strip (tenant) ──
  page.drawText(input.tenant.name, {
    x: margin,
    y,
    size: 22,
    font: bold,
    color: BLACK,
  });
  // Right column: INVOICE label + number
  page.drawText("INVOICE", {
    x: W - margin - 90,
    y,
    size: 22,
    font: bold,
    color: BLACK,
  });
  y -= 22;
  if (input.invoice.number) {
    page.drawText(`# ${input.invoice.number}`, {
      x: W - margin - 90,
      y,
      size: 10,
      font,
      color: GREY,
    });
  }

  y -= 28;
  // separator
  page.drawLine({
    start: { x: margin, y },
    end: { x: W - margin, y },
    thickness: 1,
    color: LIGHT_GREY,
  });

  y -= 24;

  // ── Bill To & Dates ──
  page.drawText("BILL TO", {
    x: margin,
    y,
    size: 8,
    font: bold,
    color: GREY,
  });
  page.drawText("ISSUED", {
    x: 320,
    y,
    size: 8,
    font: bold,
    color: GREY,
  });
  page.drawText("DUE", {
    x: 460,
    y,
    size: 8,
    font: bold,
    color: GREY,
  });

  y -= 14;
  page.drawText(input.customer.name || "—", {
    x: margin,
    y,
    size: 11,
    font: bold,
    color: BLACK,
  });
  page.drawText(fmtDate(input.invoice.issued_at), {
    x: 320,
    y,
    size: 11,
    font,
    color: BLACK,
  });
  page.drawText(fmtDate(input.invoice.due_date), {
    x: 460,
    y,
    size: 11,
    font: bold,
    color: BLACK,
  });

  y -= 14;
  if (input.customer.email) {
    page.drawText(input.customer.email, {
      x: margin,
      y,
      size: 9,
      font,
      color: GREY,
    });
  }
  if (input.location?.name) {
    y -= 12;
    page.drawText(input.location.name, {
      x: margin,
      y,
      size: 9,
      font,
      color: GREY,
    });
  }

  y -= 36;

  // ── Line items table header ──
  const colDesc = margin;
  const colQty = 360;
  const colUnit = 420;
  const colTotal = 510;

  page.drawRectangle({
    x: margin,
    y: y - 4,
    width: W - margin * 2,
    height: 22,
    color: rgb(0.96, 0.96, 0.97),
  });
  const headerY = y + 4;
  page.drawText("DESCRIPTION", {
    x: colDesc + 6,
    y: headerY,
    size: 8,
    font: bold,
    color: GREY,
  });
  page.drawText("QTY", { x: colQty, y: headerY, size: 8, font: bold, color: GREY });
  page.drawText("UNIT", { x: colUnit, y: headerY, size: 8, font: bold, color: GREY });
  page.drawText("AMOUNT", { x: colTotal, y: headerY, size: 8, font: bold, color: GREY });

  y -= 24;

  for (const li of input.lineItems) {
    const lineTotal = (li.quantity || 0) * (li.unit_price || 0);
    page.drawText(li.description.slice(0, 60), {
      x: colDesc + 6,
      y,
      size: 10,
      font,
      color: BLACK,
    });
    page.drawText(String(li.quantity), {
      x: colQty,
      y,
      size: 10,
      font,
      color: BLACK,
    });
    page.drawText(fmtDollars(li.unit_price), {
      x: colUnit,
      y,
      size: 10,
      font,
      color: BLACK,
    });
    page.drawText(fmtDollars(lineTotal), {
      x: colTotal,
      y,
      size: 10,
      font: bold,
      color: BLACK,
    });
    y -= 18;
    page.drawLine({
      start: { x: margin, y: y + 6 },
      end: { x: W - margin, y: y + 6 },
      thickness: 0.5,
      color: LIGHT_GREY,
    });
  }

  y -= 14;

  // ── Totals block ──
  const totalsX = 380;
  page.drawText("Subtotal", { x: totalsX, y, size: 10, font, color: GREY });
  page.drawText(fmt(input.invoice.subtotal_cents), {
    x: colTotal,
    y,
    size: 10,
    font,
    color: BLACK,
  });
  y -= 16;
  page.drawText("Total", { x: totalsX, y, size: 11, font: bold, color: BLACK });
  page.drawText(fmt(input.invoice.total_cents), {
    x: colTotal,
    y,
    size: 11,
    font: bold,
    color: BLACK,
  });
  y -= 22;
  page.drawRectangle({
    x: totalsX - 8,
    y: y - 4,
    width: W - margin - totalsX + 8,
    height: 22,
    color: ZIRO_GREEN,
  });
  page.drawText("Balance Due", {
    x: totalsX,
    y: y + 4,
    size: 11,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText(fmt(input.invoice.balance_cents), {
    x: colTotal,
    y: y + 4,
    size: 11,
    font: bold,
    color: rgb(1, 1, 1),
  });
  y -= 36;

  // ── Notes ──
  if (input.invoice.notes) {
    page.drawText("NOTES", { x: margin, y, size: 8, font: bold, color: GREY });
    y -= 14;
    page.drawText(input.invoice.notes.slice(0, 240), {
      x: margin,
      y,
      size: 9,
      font,
      color: BLACK,
      maxWidth: W - margin * 2,
    });
    y -= 24;
  }

  if (input.invoice.is_recurring) {
    page.drawText("Recurring billing — sends 1st of each month.", {
      x: margin,
      y,
      size: 9,
      font,
      color: GREY,
    });
    y -= 14;
  }

  // ── Footer ──
  const footerY = margin;
  page.drawLine({
    start: { x: margin, y: footerY + 30 },
    end: { x: W - margin, y: footerY + 30 },
    thickness: 1,
    color: LIGHT_GREY,
  });
  page.drawText(`${input.tenant.name} — Thank you for your business.`, {
    x: margin,
    y: footerY + 12,
    size: 9,
    font,
    color: GREY,
  });
  if (input.invoice.google_review_enabled) {
    page.drawText("Loved your lessons? Leave us a Google review.", {
      x: W - margin - 240,
      y: footerY + 12,
      size: 9,
      font,
      color: GREY,
    });
  }

  return await doc.save();
}
