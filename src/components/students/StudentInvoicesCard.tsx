"use client";

import type { Invoice } from "@/lib/data/models";
import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { Table, type TableColumn } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/utils/cn";

export type StudentInvoicesCardProps = {
  invoices: Invoice[];
  className?: string;
};

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(
    cents / 100,
  );
}

export function StudentInvoicesCard({ invoices, className }: StudentInvoicesCardProps) {
  const columns: TableColumn[] = [
    { id: "status", header: "Status", width: 120 },
    { id: "amount", header: "Amount", width: 120 },
    { id: "due", header: "Due", width: 140 },
    { id: "desc", header: "Description" },
  ];

  return (
    <Card variant="elevated" padding="lg" radius="lg" shadow="sm" className={cn(className)}>
      <Section title="Invoices" description="Ledger activity for this student." spacing="tight">
        {invoices.length === 0 ? (
          <p className="text-sm text-[var(--z-muted)]">No invoices yet.</p>
        ) : (
          <Table<Invoice>
            height={360}
            rowHeight={44}
            columns={columns}
            data={invoices}
            getRowKey={(row) => row.id}
            renderCell={(row, columnId) => {
              if (columnId === "status") {
                const overdue = row.status === "overdue";
                return (
                  <Badge variant={overdue ? "danger" : row.status === "paid" ? "success" : "neutral"} active={overdue}>
                    {row.status}
                  </Badge>
                );
              }
              if (columnId === "amount") return formatMoney(row.amount_cents, row.currency);
              if (columnId === "due")
                return row.due_at
                  ? new Date(row.due_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                  : "—";
              if (columnId === "desc") return row.description ?? "—";
              return null;
            }}
          />
        )}
      </Section>
    </Card>
  );
}
