import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getFilesDashboard } from "@/lib/files/service";
import { FileList } from "./components";

export const dynamic = "force-dynamic";

function formatBytes(n: number): string {
  if (!n) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let idx = 0;
  let v = n;
  while (v >= 1024 && idx < units.length - 1) {
    v /= 1024;
    idx += 1;
  }
  return `${v.toFixed(v >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}

export default async function FilesDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/files");
  const tenantId = session.tenantId?.trim() || DEFAULT_TENANT_ID;
  const dashboard = await getFilesDashboard(tenantId);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
            Files &amp; Documents
          </div>
          <h1 className="text-2xl font-semibold text-[var(--z-fg)]">
            Files dashboard
          </h1>
          <p className="text-sm text-[var(--z-muted)]">
            Upload, organize, share, and sign documents.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/files/explorer"
            className="rounded-md border border-[var(--z-border)] px-3 py-1.5 text-xs text-[var(--z-fg)] hover:bg-white/[0.04]"
          >
            Open explorer
          </Link>
          <Link
            href="/files/explorer?upload=1"
            className="rounded-md bg-[var(--z-accent)] px-3 py-1.5 text-xs font-semibold text-black hover:opacity-90"
          >
            Upload
          </Link>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total files" value={dashboard.kpis.totalFiles} />
        <KpiCard label="Storage used" value={formatBytes(dashboard.kpis.storageBytes)} />
        <KpiCard label="Active share links" value={dashboard.kpis.activeShareLinks} />
        <KpiCard label="Pending signatures" value={dashboard.kpis.pendingSignatures} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Recent files
        </h2>
        <FileList files={dashboard.recent} />
      </section>

      {dashboard.signatureRequests.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Signature requests
          </h2>
          <div className="overflow-hidden rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02] text-left text-xs uppercase tracking-wider text-[var(--z-muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Signers</th>
                  <th className="px-4 py-3 font-medium">Expires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--z-border)]">
                {dashboard.signatureRequests.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 text-[var(--z-fg)]">{r.title}</td>
                    <td className="px-4 py-3 text-xs text-[var(--z-muted)]">{r.status}</td>
                    <td className="px-4 py-3 text-xs text-[var(--z-muted)]">
                      {r.signers.length}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--z-muted)]">
                      {r.expiresAt ? new Date(r.expiresAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
      <div className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-[var(--z-fg)]">
        {value}
      </div>
    </div>
  );
}
