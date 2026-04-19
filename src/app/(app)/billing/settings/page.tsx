import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/guards";
import type { Session } from "@/lib/auth/session";
import { getBillingSettings } from "@data/billingSettings";
import { formatCents } from "../components/format";

export const dynamic = "force-dynamic";

async function resolveSession(): Promise<Session> {
  try {
    return await requirePermission("billing.read")();
  } catch {
    redirect("/dashboard");
  }
}

export default async function BillingSettingsPage() {
  const session = await resolveSession();
  const settings = await getBillingSettings(session.tenantId);

  const rows: Array<{ label: string; value: string }> = [
    {
      label: "Invoice prefix",
      value: settings?.invoice_prefix ?? "INV-",
    },
    {
      label: "Next invoice number",
      value: String(settings?.invoice_next_number ?? 1001),
    },
    {
      label: "Pad width",
      value: String(settings?.invoice_pad_width ?? 4),
    },
    {
      label: "Default terms",
      value: settings?.default_terms ?? "Net 15",
    },
    {
      label: "Default net days",
      value: String(settings?.default_net_days ?? 15),
    },
    {
      label: "Default tax rate",
      value: `${((settings?.default_tax_rate_bp ?? 0) / 100).toFixed(2)}%`,
    },
    {
      label: "Default currency",
      value: settings?.default_currency ?? "USD",
    },
    {
      label: "Late fee",
      value: formatCents(
        settings?.late_fee_cents ?? 0,
        settings?.default_currency ?? "USD",
      ),
    },
    {
      label: "Late fee grace days",
      value: String(settings?.late_fee_grace_days ?? 3),
    },
    {
      label: "Accepted payment methods",
      value: (settings?.payment_methods ?? ["card", "ach", "cash", "check", "manual"]).join(", "),
    },
  ];

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--z-fg)]">Billing settings</h1>
        <p className="text-sm text-[var(--z-muted)]">
          Tax rates, default terms, invoice numbering, and accepted payment methods.
        </p>
      </header>

      <div className="overflow-hidden rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex items-center justify-between px-4 py-3 text-sm ${
              i < rows.length - 1 ? "border-b border-[var(--z-border)]" : ""
            }`}
          >
            <div className="text-[var(--z-muted)]">{row.label}</div>
            <div className="font-medium text-[var(--z-fg)]">{row.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-[var(--z-radius-md)] border border-dashed border-[var(--z-border)] bg-[var(--z-bg)] p-4 text-xs text-[var(--z-muted)]">
        Settings are editable via <code>PATCH</code> on{" "}
        <code>/api/billing/settings</code> (coming soon) or directly via the
        <code> billing_settings</code> table.
      </div>
    </div>
  );
}
