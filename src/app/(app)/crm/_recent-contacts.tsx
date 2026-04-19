import Link from "next/link";
import { listContacts } from "@data/contacts";
import { crmProfileHref } from "@/lib/crm";
import { EmptyState, TableShell } from "./_components";

export async function CRMRecentContacts({ tenantId }: { tenantId: string }) {
  let recent;
  try {
    recent = await listContacts(tenantId, undefined, 10);
  } catch (err) {
    return (
      <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 p-4 text-sm text-amber-100">
        <div className="font-semibold">Could not load recent contacts</div>
        <div className="mt-1 text-xs text-amber-200/90">
          {err instanceof Error ? err.message : "Unexpected error"}
        </div>
      </div>
    );
  }

  if (recent.length === 0) {
    return (
      <EmptyState
        title="No recent contacts"
        body="New leads, students, and families will appear here."
      />
    );
  }

  return (
    <TableShell
      tableId="dashboard-recent-contacts"
      headers={["Name", "Kind", "Email", "Phone", "Status"]}
    >
      {recent.map((c) => (
        <tr
          key={c.id}
          className="border-b border-[#1c1c1e] last:border-0 hover:bg-white/5"
        >
          <td className="px-4 py-2 font-semibold text-[#f0f0f0]">
            <Link
              href={crmProfileHref(c.kind, c.sourceId)}
              className="hover:text-[#00ff88]"
            >
              {c.fullName}
            </Link>
          </td>
          <td className="px-4 py-2 text-[#909098]">{c.kind}</td>
          <td className="px-4 py-2 text-[#909098]">{c.email ?? "—"}</td>
          <td className="px-4 py-2 text-[#909098]">{c.phone ?? "—"}</td>
          <td className="px-4 py-2 text-[#909098]">{c.status ?? "—"}</td>
        </tr>
      ))}
    </TableShell>
  );
}
