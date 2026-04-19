"use client";

import * as React from "react";
import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useTenantSettings } from "@/hooks/data/useTenantSettings";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

export function BillingSettingsClient() {
  const settings = useTenantSettings(DEFAULT_TENANT_ID);
  const kpi = React.useMemo(() => asRecord(settings.data?.kpi_settings), [settings.data?.kpi_settings]);

  const [invoiceDefault, setInvoiceDefault] = React.useState("12000");
  const [payRate, setPayRate] = React.useState("45");
  const [latePercent, setLatePercent] = React.useState("5");
  const [lateGraceDays, setLateGraceDays] = React.useState("3");

  React.useEffect(() => {
    if (kpi.default_invoice_cents != null) setInvoiceDefault(String(kpi.default_invoice_cents));
    if (kpi.default_teacher_hourly_cents != null) setPayRate(String(Math.round(Number(kpi.default_teacher_hourly_cents) / 100)));
    if (kpi.late_fee_percent != null) setLatePercent(String(kpi.late_fee_percent));
    if (kpi.late_fee_grace_days != null) setLateGraceDays(String(kpi.late_fee_grace_days));
  }, [kpi]);

  return (
    <PageShell title="Billing">
      <div className="mb-[var(--z-space-4)] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]">
        <Link className="text-[var(--z-accent)] hover:underline" href="/settings">
          ← All settings
        </Link>
      </div>
      <SettingsSection
        title="Billing defaults"
        description="Numbers hydrate from tenant KPI JSON when present—saving is UI-only for now."
      >
        {settings.error ? (
          <p className="text-sm text-[var(--z-danger)]">{settings.error.message}</p>
        ) : null}

        <div className="grid grid-cols-1 gap-[var(--z-space-4)] lg:grid-cols-2">
          <Card variant="elevated" padding="md" radius="lg" shadow="sm" className="space-y-[var(--z-space-4)]">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-[var(--z-fg)]">Default invoice amount</div>
              <Badge variant="neutral">cents</Badge>
            </div>
            <Input
              label="Amount (cents)"
              inputMode="numeric"
              value={invoiceDefault}
              onChange={(e) => setInvoiceDefault(e.target.value)}
              hint="Example: 12000 → $120.00 invoices."
            />
          </Card>

          <Card variant="elevated" padding="md" radius="lg" shadow="sm" className="space-y-[var(--z-space-4)]">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-[var(--z-fg)]">Default teacher pay</div>
              <Badge variant="success">USD / hr</Badge>
            </div>
            <Input
              label="Hourly rate"
              inputMode="decimal"
              value={payRate}
              onChange={(e) => setPayRate(e.target.value)}
              hint="Whole dollars for quick modeling."
            />
          </Card>
        </div>

        <Card variant="elevated" padding="md" radius="lg" shadow="sm" className="space-y-[var(--z-space-4)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold text-[var(--z-fg)]">Late fee rules</div>
            <Badge variant="warning">UI only</Badge>
          </div>
          <div className="grid grid-cols-1 gap-[var(--z-space-4)] sm:grid-cols-2">
            <Input
              label="Penalty %"
              inputMode="numeric"
              value={latePercent}
              onChange={(e) => setLatePercent(e.target.value)}
            />
            <Input
              label="Grace period (days)"
              inputMode="numeric"
              value={lateGraceDays}
              onChange={(e) => setLateGraceDays(e.target.value)}
            />
          </div>
          <p className="text-xs text-[var(--z-muted)]">
            Enforcement stays in your billing engine—this card is a visual contract for staff.
          </p>
        </Card>
      </SettingsSection>
    </PageShell>
  );
}
