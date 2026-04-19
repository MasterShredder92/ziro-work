"use client";

import * as React from "react";
import Link from "next/link";
import { Table, type TableColumn } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type Row = {
  id: string;
  name: string;
  status: "Active" | "At Risk" | "New";
  mrr: number;
};

function makeRows(count: number): Row[] {
  return Array.from({ length: count }).map((_, i) => ({
    id: `row-${i + 1}`,
    name: `Account ${String(i + 1).padStart(3, "0")}`,
    status: i % 9 === 0 ? "At Risk" : i % 4 === 0 ? "New" : "Active",
    mrr: 250 + (i % 37) * 25,
  }));
}

export default function SandboxTablePage() {
  const data = React.useMemo(() => makeRows(2000), []);

  const columns = React.useMemo<Array<TableColumn>>(
    () => [
      { id: "name", header: "Name", width: "1fr" },
      { id: "status", header: "Status", width: 160 },
      { id: "mrr", header: "MRR", width: 120, align: "right" },
      { id: "action", header: "", width: 120, align: "right" },
    ],
    []
  );

  return (
    <div className="space-y-[var(--z-space-6)]">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Table</h1>
        <Link className="text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]" href="/sandbox">
          Back
        </Link>
      </div>

      <div className="text-sm text-[var(--z-muted)]">
        Virtualized (windowed) rendering + sticky header. Try scrolling fast.
      </div>

      <Table<Row>
        columns={columns}
        data={data}
        height={560}
        getRowKey={(r) => r.id}
        renderCell={(row, col) => {
          if (col === "name") return row.name;
          if (col === "mrr") return `$${row.mrr.toLocaleString()}`;
          if (col === "status") {
            const variant =
              row.status === "Active"
                ? "success"
                : row.status === "At Risk"
                  ? "danger"
                  : "warning";
            return (
              <Badge variant={variant} active={row.status === "Active"}>
                {row.status}
              </Badge>
            );
          }
          if (col === "action") return <Button size="sm" variant="ghost">Open</Button>;
          return null;
        }}
      />
    </div>
  );
}

