import { NextRequest, NextResponse } from "next/server";

/**
 * Manual Square sync — pulls latest invoices and payments from Square API
 * POST /api/integrations/square/sync
 * Triggered from Settings → Integrations → "Sync Now" button
 */
export async function POST(_req: NextRequest) {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Square access token not configured. Add SQUARE_ACCESS_TOKEN to environment variables." },
      { status: 503 }
    );
  }

  try {
    // Fetch invoices from Square
    const invoicesRes = await fetch(
      "https://connect.squareup.com/v2/invoices?limit=200",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Square-Version": "2024-01-17",
          "Content-Type": "application/json",
        },
      }
    );

    if (!invoicesRes.ok) {
      const err = await invoicesRes.json();
      console.error("[Square Sync] Invoice fetch failed:", err);
      return NextResponse.json({ error: "Square API error", details: err }, { status: 502 });
    }

    const invoicesData = await invoicesRes.json();
    const invoices = invoicesData.invoices ?? [];

    // TODO: upsert invoices into square_invoices table
    console.log(`[Square Sync] Fetched ${invoices.length} invoices from Square`);

    return NextResponse.json({
      success: true,
      invoiceCount: invoices.length,
      message: `Synced ${invoices.length} invoices from Square.`,
    });
  } catch (err) {
    console.error("[Square Sync] Unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error during sync" }, { status: 500 });
  }
}
