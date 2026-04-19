"use client";

import Link from "next/link";
import { Table, type TableColumn } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/utils";

export type BillingHistoryInvoice = {
  id: string;
  date: string;
  amountLabel: string;
  status: "paid" | "open" | "void" | "uncollectible";
  downloadHref: string;
};

export type BillingHistoryTableProps = {
  invoices: BillingHistoryInvoice[];
  className?: string;
};

function statusVariant(s: BillingHistoryInvoice["status"]): "success" | "warning" | "danger" | "neutral" {
  if (s === "paid") return "success";
  if (s === "open") return "warning";
  if (s === "uncollectible") return "danger";
  return "neutral";
}

const columns: Array<TableColumn> = [
  { id: "date", header: "Date", width: "1.1fr" },
  { id: "amount", header: "Amount", width: "0.9fr" },
  { id: "status", header: "Status", width: "0.8fr" },
  { id: "download", header: "", width: "120px", align: "right" },
];

export function BillingHistoryTable({ invoices, className }: BillingHistoryTableProps) {
  if (invoices.length === 0) {
    return (
      <div className={cn("min-w-0", className)}>
        <div className="mb-[var(--z-space-3)] text-sm font-extrabold text-[var(--z-fg)]">Invoice history</div>
        <p className="text-sm text-[var(--z-muted)]">No invoices to display.</p>
      </div>
    );
  }

  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-[var(--z-space-3)] text-sm font-extrabold text-[var(--z-fg)]">Invoice history</div>
      <Table<BillingHistoryInvoice>
        columns={columns}
        data={invoices}
        getRowKey={(row) => row.id}
        rowHeight={48}
        height={Math.min(420, 56 + invoices.length * 48)}
        className="border-[var(--z-border)]"
        renderCell={(row, columnId) => {
          if (columnId === "date") return <span className="text-sm text-[var(--z-fg)]">{row.date}</span>;
          if (columnId === "amount") return <span className="font-mono text-sm text-[var(--z-fg)]">{row.amountLabel}</span>;
          if (columnId === "status")
            return (
              <Badge variant={statusVariant(row.status)} active={row.status === "open"}>
                {row.status}
              </Badge>
            );
          if (columnId === "download")
            return (
              <Link
                href={row.downloadHref}
                className="text-xs font-semibold text-[var(--z-accent-color)] hover:underline"
                onClick={(e) => e.preventDefault()}
              >
                Download (UI)
              </Link>
            );
          return null;
        }}
      />
    </div>
  );
}
