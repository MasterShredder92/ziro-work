import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import {
  buildContextFromSession,
  getSignatureRequestDetail,
} from "@/lib/files/service";

export const dynamic = "force-dynamic";

type PageParams = { params: Promise<{ id: string }> };

export default async function SignatureRequestDetailPage({ params }: PageParams) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(`/login?next=/files/signatures/${id}`);

  const tenantId = session.tenantId?.trim() || DEFAULT_TENANT_ID;
  const ctx = buildContextFromSession({
    role: session.role,
    userId: session.userId,
    tenantId,
  });

  let detail;
  try {
    detail = await getSignatureRequestDetail(id, tenantId, ctx);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === "NOT_FOUND") notFound();
    if (message.startsWith("FORBIDDEN")) redirect("/files?error=forbidden");
    throw err;
  }

  const { request, file } = detail;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
          Signature request
        </div>
        <h1 className="text-2xl font-semibold text-[var(--z-fg)]">{request.title}</h1>
        <p className="text-sm text-[var(--z-muted)]">
          File:{" "}
          <Link href={`/files/${file.id}`} className="text-[var(--z-accent)] hover:underline">
            {file.name}
          </Link>
        </p>
        {request.message ? (
          <p className="text-sm text-[var(--z-fg)]/90">{request.message}</p>
        ) : null}
        <div className="flex flex-wrap gap-3 text-xs text-[var(--z-muted)]">
          <span>Status: {request.status}</span>
          {request.expiresAt ? (
            <span>Expires: {new Date(request.expiresAt).toLocaleString()}</span>
          ) : null}
        </div>
      </header>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Signers
        </h2>
        <div className="overflow-hidden rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02] text-left text-xs uppercase tracking-wider text-[var(--z-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--z-border)]">
              {request.signers.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 text-[var(--z-fg)]">{s.name}</td>
                  <td className="px-4 py-3 text-xs text-[var(--z-muted)]">{s.email}</td>
                  <td className="px-4 py-3 text-xs text-[var(--z-muted)]">{s.status}</td>
                  <td className="px-4 py-3 text-xs text-[var(--z-muted)]">{s.order}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Audit trail
        </h2>
        {request.audit.length === 0 ? (
          <p className="text-sm text-[var(--z-muted)]">No audit events yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02] text-left text-xs uppercase tracking-wider text-[var(--z-muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--z-border)]">
                {[...request.audit]
                  .sort((a, b) => b.at.localeCompare(a.at))
                  .map((a, i) => (
                    <tr key={`${a.at}-${i}`}>
                      <td className="px-4 py-3 text-xs text-[var(--z-muted)]">
                        {new Date(a.at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-[var(--z-fg)]">{a.event}</td>
                      <td className="px-4 py-3 text-xs text-[var(--z-muted)]">{a.actor}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div>
        <Link
          href="/files/signatures"
          className="text-sm text-[var(--z-accent)] hover:underline"
        >
          ← All signature requests
        </Link>
      </div>
    </div>
  );
}
