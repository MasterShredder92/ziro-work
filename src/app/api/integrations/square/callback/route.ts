import { NextRequest, NextResponse } from "next/server";

/**
 * Square OAuth callback
 * Square redirects here after the merchant authorizes the app.
 * URL: https://ziro-work.vercel.app/api/integrations/square/callback
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings/integrations?square_error=${encodeURIComponent(error)}`, req.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/settings/integrations?square_error=no_code", req.url)
    );
  }

  try {
    // Exchange authorization code for access token
    const tokenRes = await fetch("https://connect.squareup.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Square-Version": "2024-01-17" },
      body: JSON.stringify({
        client_id: process.env.SQUARE_APP_ID,
        client_secret: process.env.SQUARE_APP_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://ziro-work.vercel.app"}/api/integrations/square/callback`,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || tokenData.errors) {
      console.error("[Square OAuth] Token exchange failed:", tokenData);
      return NextResponse.redirect(
        new URL("/settings/integrations?square_error=token_exchange_failed", req.url)
      );
    }

    // TODO: persist tokenData.access_token and tokenData.merchant_id to the tenant's settings
    // For now, log success and redirect
    console.log("[Square OAuth] Token exchange successful for merchant:", tokenData.merchant_id);

    return NextResponse.redirect(
      new URL("/settings/integrations?square_connected=1", req.url)
    );
  } catch (err) {
    console.error("[Square OAuth] Unexpected error:", err);
    return NextResponse.redirect(
      new URL("/settings/integrations?square_error=unexpected", req.url)
    );
  }
}
