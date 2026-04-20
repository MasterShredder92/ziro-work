"use client";

import * as React from "react";
import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: "connected" | "disconnected" | "stub" }) {
  const cfg = {
    connected:    { label: "Connected",    bg: "rgba(34,197,94,0.15)",  border: "rgba(34,197,94,0.4)",  text: "#86efac" },
    disconnected: { label: "Not set",      bg: "rgba(107,114,128,0.12)", border: "rgba(107,114,128,0.3)", text: "var(--z-muted)" },
    stub:         { label: "Stub / Ready", bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.35)", text: "#d8b4fe" },
  }[status];

  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.text }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Integration card ─────────────────────────────────────────────────────────
function IntegrationCard({
  name,
  description,
  icon,
  status,
  defaultOpen,
  children,
}: {
  name: string;
  description: string;
  icon: React.ReactNode;
  status: "connected" | "disconnected" | "stub";
  defaultOpen?: boolean;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen ?? false);

  return (
    <div
      className="rounded-xl border"
      style={{ borderColor: "var(--z-border)", background: "var(--z-surface)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg"
          style={{ borderColor: "var(--z-border)", background: "var(--z-surface-2)" }}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[var(--z-fg)]">{name}</span>
            <StatusBadge status={status} />
          </div>
          <div className="mt-0.5 text-xs text-[var(--z-muted)]">{description}</div>
        </div>
        <svg
          className={`h-4 w-4 shrink-0 text-[var(--z-muted)] transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {open && children && (
        <div
          className="border-t px-5 py-4"
          style={{ borderColor: "var(--z-border)", background: "var(--z-surface-2)" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Square sync card ─────────────────────────────────────────────────────────
type SyncStatus = "idle" | "running" | "success" | "error";

function SquareCard() {
  const [syncStatus, setSyncStatus] = React.useState<SyncStatus>("idle");
  const [syncResult, setSyncResult] = React.useState<string | null>(null);
  const [syncProgress, setSyncProgress] = React.useState<string | null>(null);
  const [since, setSince] = React.useState("");

  async function runSync() {
    setSyncStatus("running");
    setSyncResult(null);
    setSyncProgress("Connecting to Square…");
    try {
      const body = since.trim() ? JSON.stringify({ since: since.trim() }) : undefined;
      const res = await fetch("/api/integrations/square/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (!res.body) throw new Error("No response body from sync endpoint");

      // Consume the SSE stream for live progress updates
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6)) as {
              status: string; message?: string; error?: string;
              stats?: Record<string, number>;
            };
            if (event.status === "running") {
              setSyncProgress(event.message ?? "Syncing…");
            } else if (event.status === "success") {
              setSyncStatus("success");
              setSyncResult(event.message ?? "Sync complete.");
              setSyncProgress(null);
            } else if (event.status === "error") {
              setSyncStatus("error");
              setSyncResult(event.error ?? "Sync failed.");
              setSyncProgress(null);
            }
          } catch { /* ignore malformed events */ }
        }
      }

      // If stream ended without a final status event, treat as done
      setSyncStatus((prev) => prev === "running" ? "success" : prev);
      setSyncProgress(null);
    } catch (err) {
      setSyncStatus("error");
      setSyncResult(err instanceof Error ? err.message : "Network error");
      setSyncProgress(null);
    }
  }

  const statusColor = syncStatus === "success" ? "#86efac" : syncStatus === "error" ? "#fca5a5" : "var(--z-muted)";

  return (
    <IntegrationCard
      name="Square"
      description="Point-of-sale, invoices, payments, and customer records. Your primary billing source."
      icon="◼"
      status="connected"
      defaultOpen
    >
      <div className="space-y-4">

        {/* What Square syncs */}
        <div className="rounded-lg border px-4 py-3 text-xs" style={{ borderColor: "rgba(0,255,136,0.2)", background: "rgba(0,255,136,0.04)" }}>
          <p className="mb-1.5 font-bold text-[#00ff88]">What gets synced</p>
          <ul className="space-y-1 text-[var(--z-muted)]">
            <li>• All invoices — linked to student/family records by email</li>
            <li>• All payment history — full backfill, no date limit</li>
            <li>• Customer records — auto-matched to families and students</li>
            <li>• Real-time updates via webhook (invoice paid, refunds, etc.)</li>
          </ul>
        </div>

        {/* Sync Now */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--z-fg)]">Manual sync</p>
          <p className="text-xs text-[var(--z-muted)]">
            Hit <strong>Sync Now</strong> to pull all invoices and payments from Square into Ziro.
            Leave the date blank to pull your full history (recommended for first run).
            To only pull recent data, enter a start date like <code className="rounded bg-[var(--z-surface)] px-1">2026-01-01</code>.
          </p>
          <div className="flex items-end gap-3">
            <div className="w-44">
              <Input
                label="From date (optional)"
                value={since}
                onChange={(e) => setSince(e.target.value)}
                placeholder="YYYY-MM-DD"
              />
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={syncStatus === "running"}
              onClick={runSync}
            >
              {syncStatus === "running" ? "Syncing…" : "Sync Now"}
            </Button>
          </div>

          {syncStatus === "running" && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-[var(--z-muted)]">
                <svg className="h-3.5 w-3.5 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                {syncProgress ?? "Syncing…"}
              </div>
              <p className="text-[10px] text-[var(--z-muted)] opacity-60">Full history sync may take 2–5 minutes. Stay on this page.</p>
            </div>
          )}

          {syncResult && syncStatus !== "running" && (
            <div
              className="rounded-lg border px-3 py-2 text-xs"
              style={{
                borderColor: syncStatus === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
                background: syncStatus === "success" ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
                color: statusColor,
              }}
            >
              {syncResult}
            </div>
          )}
        </div>

        {/* Webhook info */}
        <div className="space-y-2 border-t pt-4" style={{ borderColor: "var(--z-border)" }}>
          <p className="text-xs font-semibold text-[var(--z-fg)]">Live webhook (real-time updates)</p>
          <p className="text-xs text-[var(--z-muted)]">
            Once synced, Square will push every new payment, invoice, and customer change to Ziro automatically.
            In your{" "}
            <a
              href="https://developer.squareup.com/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--z-accent)] underline"
            >
              Square Developer Dashboard
            </a>
            , add this webhook URL and subscribe to the events listed below.
          </p>
          <div
            className="rounded-lg border px-3 py-2 font-mono text-xs"
            style={{ borderColor: "var(--z-border)", background: "var(--z-surface)", color: "#00ff88" }}
          >
            https://ziro-work.vercel.app/api/integrations/square/webhook
          </div>
          <p className="text-[10px] text-[var(--z-muted)]">
            Subscribe to: <code className="rounded bg-[var(--z-surface)] px-1">invoice.*</code>{" "}
            <code className="rounded bg-[var(--z-surface)] px-1">payment.*</code>{" "}
            <code className="rounded bg-[var(--z-surface)] px-1">customer.*</code>{" "}
            <code className="rounded bg-[var(--z-surface)] px-1">refund.*</code>
          </p>
        </div>
      </div>
    </IntegrationCard>
  );
}

// ─── Main client ──────────────────────────────────────────────────────────────
export function IntegrationsSettingsClient() {
  // QUO fields
  const [quoApiKey, setQuoApiKey] = React.useState("");
  const [quoWebhookSecret, setQuoWebhookSecret] = React.useState("");

  // Gmail fields
  const [gmailClientId, setGmailClientId] = React.useState("");
  const [gmailClientSecret, setGmailClientSecret] = React.useState("");
  const [gmailRefreshToken, setGmailRefreshToken] = React.useState("");
  const [gmailSenderEmail, setGmailSenderEmail] = React.useState("");

  // Twilio fields
  const [twilioSid, setTwilioSid] = React.useState("");
  const [twilioToken, setTwilioToken] = React.useState("");
  const [twilioPhone, setTwilioPhone] = React.useState("");

  // Stripe fields
  const [stripePublishable, setStripePublishable] = React.useState("");
  const [stripeSecret, setStripeSecret] = React.useState("");
  const [stripeWebhook, setStripeWebhook] = React.useState("");

  function stubStatus(key: string): "connected" | "disconnected" | "stub" {
    if (!key.trim()) return "disconnected";
    if (key.startsWith("sk_live") || key.startsWith("pk_live")) return "connected";
    return "stub";
  }

  return (
    <PageShell title="Integrations">
      <div className="mb-[var(--z-space-4)] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]">
        <Link className="text-[var(--z-accent)] hover:underline" href="/settings">
          ← All settings
        </Link>
      </div>

      <SettingsSection
        title="Integrations"
        description="Connect external services. Keys are stored in your environment — never committed to source control."
      >
        {/* Notice */}
        <div
          className="rounded-xl border px-4 py-3 text-xs text-[var(--z-muted)]"
          style={{ borderColor: "rgba(168,85,247,0.3)", background: "rgba(168,85,247,0.06)" }}
        >
          <span className="font-bold text-purple-300">Stub mode:</span> Fields here are UI scaffolding only.
          No API calls are made until you wire the corresponding environment variables in your deployment.
          Save is intentionally disabled until the backend pipeline is connected.
        </div>

        <SettingsGroup title="Payments & billing">
          {/* Square — primary billing integration */}
          <SquareCard />

          {/* Stripe */}
          <IntegrationCard
            name="Stripe"
            description="Invoice payments, subscription billing, and payout management."
            icon="💳"
            status={stubStatus(stripePublishable)}
          >
            <div className="space-y-3">
              <Input
                label="Publishable Key"
                value={stripePublishable}
                onChange={(e) => setStripePublishable(e.target.value)}
                placeholder="pk_live_••••••••"
              />
              <Input
                label="Secret Key"
                value={stripeSecret}
                onChange={(e) => setStripeSecret(e.target.value)}
                placeholder="sk_live_••••••••"
                type="password"
              />
              <Input
                label="Webhook Signing Secret"
                value={stripeWebhook}
                onChange={(e) => setStripeWebhook(e.target.value)}
                placeholder="whsec_••••••••"
                type="password"
              />
              <p className="text-[10px] text-[var(--z-muted)]">
                Set <code className="rounded bg-[var(--z-surface)] px-1">STRIPE_PUBLISHABLE_KEY</code>,{" "}
                <code className="rounded bg-[var(--z-surface)] px-1">STRIPE_SECRET_KEY</code>, and{" "}
                <code className="rounded bg-[var(--z-surface)] px-1">STRIPE_WEBHOOK_SECRET</code> in Vercel.
              </p>
              <Button type="button" variant="secondary" size="sm" disabled>
                Save Stripe config
              </Button>
            </div>
          </IntegrationCard>
        </SettingsGroup>

        <SettingsGroup title="Email providers">
          {/* QUO */}
          <IntegrationCard
            name="QUO"
            description="Transactional email for invoices, receipts, and automated outreach."
            icon="✉️"
            status={stubStatus(quoApiKey)}
          >
            <div className="space-y-3">
              <Input
                label="QUO API Key"
                value={quoApiKey}
                onChange={(e) => setQuoApiKey(e.target.value)}
                placeholder="quo_live_••••••••"
                type="password"
              />
              <Input
                label="Webhook Secret"
                value={quoWebhookSecret}
                onChange={(e) => setQuoWebhookSecret(e.target.value)}
                placeholder="whsec_••••••••"
                type="password"
              />
              <p className="text-[10px] text-[var(--z-muted)]">
                Set <code className="rounded bg-[var(--z-surface)] px-1">QUO_API_KEY</code> and{" "}
                <code className="rounded bg-[var(--z-surface)] px-1">QUO_WEBHOOK_SECRET</code> in your
                Vercel environment variables. No emails are sent until these are live.
              </p>
              <Button type="button" variant="secondary" size="sm" disabled>
                Save QUO config
              </Button>
            </div>
          </IntegrationCard>

          {/* Gmail */}
          <IntegrationCard
            name="Gmail (OAuth)"
            description="Send emails from your studio Gmail account via OAuth2. No SMTP passwords."
            icon="📧"
            status={stubStatus(gmailClientId)}
          >
            <div className="space-y-3">
              <Input
                label="OAuth Client ID"
                value={gmailClientId}
                onChange={(e) => setGmailClientId(e.target.value)}
                placeholder="••••••••.apps.googleusercontent.com"
              />
              <Input
                label="OAuth Client Secret"
                value={gmailClientSecret}
                onChange={(e) => setGmailClientSecret(e.target.value)}
                placeholder="GOCSPX-••••••••"
                type="password"
              />
              <Input
                label="Refresh Token"
                value={gmailRefreshToken}
                onChange={(e) => setGmailRefreshToken(e.target.value)}
                placeholder="1//••••••••"
                type="password"
              />
              <Input
                label="Sender Email"
                value={gmailSenderEmail}
                onChange={(e) => setGmailSenderEmail(e.target.value)}
                placeholder="studio@yourdomain.com"
                type="email"
              />
              <p className="text-[10px] text-[var(--z-muted)]">
                Set <code className="rounded bg-[var(--z-surface)] px-1">GMAIL_CLIENT_ID</code>,{" "}
                <code className="rounded bg-[var(--z-surface)] px-1">GMAIL_CLIENT_SECRET</code>,{" "}
                <code className="rounded bg-[var(--z-surface)] px-1">GMAIL_REFRESH_TOKEN</code>, and{" "}
                <code className="rounded bg-[var(--z-surface)] px-1">GMAIL_SENDER_EMAIL</code> in Vercel.
                No emails are sent until all four are set.
              </p>
              <Button type="button" variant="secondary" size="sm" disabled>
                Save Gmail config
              </Button>
            </div>
          </IntegrationCard>
        </SettingsGroup>

        <SettingsGroup title="SMS">
          {/* Twilio */}
          <IntegrationCard
            name="Twilio"
            description="SMS reminders, callout notifications, and two-way parent messaging."
            icon="💬"
            status={stubStatus(twilioSid)}
          >
            <div className="space-y-3">
              <Input
                label="Account SID"
                value={twilioSid}
                onChange={(e) => setTwilioSid(e.target.value)}
                placeholder="AC••••••••"
              />
              <Input
                label="Auth Token"
                value={twilioToken}
                onChange={(e) => setTwilioToken(e.target.value)}
                placeholder="••••••••"
                type="password"
              />
              <Input
                label="From Phone Number"
                value={twilioPhone}
                onChange={(e) => setTwilioPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                type="tel"
              />
              <p className="text-[10px] text-[var(--z-muted)]">
                Set <code className="rounded bg-[var(--z-surface)] px-1">TWILIO_ACCOUNT_SID</code>,{" "}
                <code className="rounded bg-[var(--z-surface)] px-1">TWILIO_AUTH_TOKEN</code>, and{" "}
                <code className="rounded bg-[var(--z-surface)] px-1">TWILIO_PHONE_NUMBER</code> in Vercel.
              </p>
              <Button type="button" variant="secondary" size="sm" disabled>
                Save Twilio config
              </Button>
            </div>
          </IntegrationCard>
        </SettingsGroup>
      </SettingsSection>
    </PageShell>
  );
}
