import "server-only";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { getConversation } from "@/lib/messaging/service";
import { badRequest, notFound, ok, serverError } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_req, { params }) {
    void _req;
    try {
        const session = await requirePermission("messages.read")();
        await assertTenantAccess(session.tenantId);
        const { id } = await params;
        const threadId = id === null || id === void 0 ? void 0 : id.trim();
        if (!threadId)
            return badRequest("Missing thread id");
        const detail = await getConversation(threadId);
        if (!detail)
            return notFound("Thread not found");
        if (detail.thread.tenantId !== session.tenantId && session.role !== "admin") {
            return badRequest("Forbidden");
        }
        const isParticipant = detail.thread.participantIds.includes(session.userId);
        if (!isParticipant && session.role !== "admin") {
            return badRequest("Forbidden");
        }
        return ok({ data: detail });
    }
    catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN") {
            return badRequest("Forbidden");
        }
        return serverError(err);
    }
}
