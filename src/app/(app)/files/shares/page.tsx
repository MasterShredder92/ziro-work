import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { listShareLinks } from "@/lib/files/queries";

export const dynamic = "force-dynamic";

export default async function ShareLinksPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/files/shares");
  const tenantId = session.tenantId?.trim() || DEFAULT_TENANT_ID;
  const links = await listShareLinks(tenantId);

  return (
    <div className="space-y-5">
      <header>
        <div className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
          Files &amp; Documents
        </div>
        <h1 className="text-2xl font-semibold text-[var(--z-fg)]">Share links</h1>
      </header>
      <div className="overflow-hidden rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.02] text-left text-xs uppercase tracking-wider text-[var(--z-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Target</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Views</th>
              <th className="px-4 py-3 font-medium">Expires</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--z-border)]">
            {links.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-[var(--z-muted)]">
                  No share links yet.
                </td>
              </tr>
            ) : null}
            {links.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3 text-xs text-[var(--z-fg)]">
                  {l.fileId ? (
                    <Link
                      href={`/files/${l.fileId}`}
                      className="hover:text-[var(--z-accent)]"
                    >
                      File {l.fileId.slice(0, 8)}
                    </Link>
                  ) : (
                    <span>Folder {l.folderId?.slice(0, 8) ?? "—"}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--z-muted)]">{l.status}</td>
                <td className="px-4 py-3 text-xs text-[var(--z-muted)]">
                  {l.viewCount}
                  {l.maxViews ? `/${l.maxViews}` : ""}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--z-muted)]">
                  {l.expiresAt ? new Date(l.expiresAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--z-muted)]">
                  {new Date(l.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
