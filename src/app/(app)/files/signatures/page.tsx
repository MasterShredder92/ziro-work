import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { listSignatureRequests } from "@/lib/files/queries";

export const dynamic = "force-dynamic";

export default async function SignaturesPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/files/signatures");
  const tenantId = session.tenantId?.trim() || DEFAULT_TENANT_ID;
  const requests = await listSignatureRequests(tenantId);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
            Files &amp; Documents
          </div>
          <h1 className="text-2xl font-semibold text-[var(--z-fg)]">
            Signature requests
          </h1>
        </div>
        <Link
          href="/files/explorer"
          className="rounded-md border border-[var(--z-border)] px-3 py-1.5 text-xs text-[var(--z-fg)] hover:bg-white/[0.04]"
        >
          Browse files to sign
        </Link>
      </header>

      <div className="overflow-hidden rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.02] text-left text-xs uppercase tracking-wider text-[var(--z-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Signers</th>
              <th className="px-4 py-3 font-medium">Expires</th>
              <th className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--z-border)]">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-[var(--z-muted)]">
                  No signature requests yet.
                </td>
              </tr>
            ) : null}
            {requests.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">
                  <Link
                    href={`/files/signatures/${r.id}`}
                    className="font-medium text-[var(--z-fg)] hover:text-[var(--z-accent)]"
                  >
                    {r.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-xs text-[var(--z-muted)]">{r.status}</td>
                <td className="px-4 py-3 text-xs text-[var(--z-muted)]">
                  {r.signers.length}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--z-muted)]">
                  {r.expiresAt ? new Date(r.expiresAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--z-muted)]">
                  {new Date(r.updatedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
