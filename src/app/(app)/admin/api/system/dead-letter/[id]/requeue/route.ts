import { NextResponse } from "next/server";
import { ensureAdminAccess } from "@/app/(app)/admin/guard";
import { requeueFromDeadLetter } from "@/lib/queue/queries";
import { withApi } from "@/lib/errors/handler";
import { AppError } from "@/lib/errors/AppError";

export const dynamic = "force-dynamic";

export const POST = withApi(
  { name: "admin.api.system.dead_letter.requeue.POST" },
  async (_req, context: { params: Promise<{ id: string }> } | undefined) => {
    await ensureAdminAccess();
    if (!context) throw AppError.badRequest("Missing id");
    const { id } = await context.params;
    const job = await requeueFromDeadLetter(id);
    if (!job) throw AppError.notFound("Dead-letter entry not found or requeue failed");
    return NextResponse.json({ ok: true, jobId: job.id });
  },
);
