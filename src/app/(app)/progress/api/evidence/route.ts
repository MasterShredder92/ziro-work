import { NextRequest, NextResponse } from "next/server";
import { badRequest, ok, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { addProgressEvidence } from "@/lib/progress/service";
import type { ProgressEvidenceKind } from "@/lib/progress/types";
import { resolveProgressContext } from "../../guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

const EVIDENCE_KINDS: ProgressEvidenceKind[] = [
  "note",
  "image",
  "video",
  "audio",
  "document",
  "link",
];

function parseKind(value: unknown): ProgressEvidenceKind {
  if (typeof value === "string" && (EVIDENCE_KINDS as string[]).includes(value)) {
    return value as ProgressEvidenceKind;
  }
  return "note";
}

export async function POST(req: NextRequest) {
  try {
    let payload: Record<string, unknown>;
    try {
      payload = (await req.json()) as Record<string, unknown>;
    } catch {
      return badRequest("Invalid JSON body.");
    }

    const checkpointId =
      typeof payload.checkpointId === "string"
        ? payload.checkpointId.trim()
        : "";
    if (!checkpointId) return badRequest("checkpointId is required.");

    const tenantParam =
      typeof payload.tenantId === "string" ? payload.tenantId.trim() : "";

    let ctx;
    try {
      ctx = await resolveProgressContext({
        tenantId: tenantParam || null,
        requireWrite: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "FORBIDDEN";
      return forbidden(message);
    }

    const result = await addProgressEvidence(checkpointId, {
      tenantId: ctx.tenantId,
      body: typeof payload.body === "string" ? payload.body : null,
      kind: parseKind(payload.kind),
      fileUrl: typeof payload.fileUrl === "string" ? payload.fileUrl : null,
      fileName: typeof payload.fileName === "string" ? payload.fileName : null,
      fileMime: typeof payload.fileMime === "string" ? payload.fileMime : null,
      fileSizeBytes:
        typeof payload.fileSizeBytes === "number"
          ? payload.fileSizeBytes
          : null,
      submittedBy: ctx.session.userId,
      submitterRole: ctx.session.role,
      teacherId:
        ctx.session.role === "teacher" ? ctx.session.userId : null,
      teacherFeedback:
        typeof payload.teacherFeedback === "string"
          ? payload.teacherFeedback
          : null,
      score:
        typeof payload.score === "number" && Number.isFinite(payload.score)
          ? payload.score
          : null,
    });

    await logAudit("progress.evidence.add", {
      tenantId: ctx.tenantId,
      profileId: ctx.session.userId,
      role: ctx.session.role,
      checkpointId,
      evidenceId: result.evidence.id,
      studentId: result.surface.studentId,
      source: "api",
    });

    return ok({
      evidence: result.evidence,
      surface: result.surface,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "CHECKPOINT_NOT_FOUND") {
      return NextResponse.json(
        { error: "CHECKPOINT_NOT_FOUND" },
        { status: 404 },
      );
    }
    return serverError(err);
  }
}
