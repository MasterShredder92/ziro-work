import "server-only";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import {
  getThreadDetail,
  markThreadRead,
} from "@/lib/messaging/service";
import { listTemplatesForTenant } from "@/lib/templates/service";
import { ThreadDetailClient } from "../../components/ThreadDetailClient";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

const MERGE_FIELDS = [
  "firstName",
  "lastName",
  "studentName",
  "tenantName",
  "lessonDate",
  "lessonTime",
];

export default async function ThreadDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/messages");
  }

  const { id } = await params;
  if (!id) notFound();

  const detail = await getThreadDetail(session.tenantId, id, session.userId);
  if (!detail) notFound();

  const isMember =
    session.role === "admin" ||
    session.role === "director" ||
    detail.thread.participantIds.includes(session.userId);
  if (!isMember) notFound();

  await markThreadRead(session.tenantId, id, session.userId);

  const canWrite = can(session.role, "messages.write");
  const templates = canWrite
    ? await listTemplatesForTenant(session.tenantId).catch(() => [])
    : [];

  const templateOptions = templates.map((t) => ({
    id: t.id,
    name: t.name,
    subject: t.subject ?? null,
    body: t.body,
    bodyHtml: null,
  }));

  const senderNameLookup = Object.fromEntries(
    detail.participants.map((p) => [
      p.profileId,
      (p.display?.fullName ?? "").trim() || p.profileId.slice(0, 8),
    ]),
  );

  return (
    <ThreadDetailClient
      thread={detail.thread}
      participants={detail.participants}
      messages={detail.messages}
      currentProfileId={session.userId}
      senderNameLookup={senderNameLookup}
      templateOptions={templateOptions}
      mergeFields={MERGE_FIELDS}
      canWrite={canWrite}
    />
  );
}
