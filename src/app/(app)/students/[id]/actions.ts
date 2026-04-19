"use server";

import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { buildLifecycleContext } from "@/lib/lifecycle/buildContext";
import { computeStage } from "@/lib/lifecycle/computeStage";
import { buildTimeline, type TimelineItem } from "@/lib/lifecycle/buildTimeline";
import { summarizeBlockers } from "@/lib/lifecycle/helpers";
import { getServiceClient } from "@/lib/supabase";
import type { ComputedLifecycle } from "@/lib/lifecycle/types";

function formatAgentDisplayName(raw: string): string {
  const table: Record<string, string> = {
    star: "STAR",
    ziro: "Ziro",
    ruby: "Ruby",
    stewie: "Stewie",
    vader: "Vader",
    bub: "Bub",
    sid: "Sid",
  };
  return table[raw] ?? raw.replace(/-/g, " ");
}

function nextStepLabel(computed: ComputedLifecycle): string {
  if (computed.blockers.length > 0) {
    return computed.blockers[0]?.message ?? "Resolve blockers";
  }
  if (computed.next) return `Advance to ${computed.next.name}`;
  return `Complete ${computed.stage.name}`;
}

export type StudentSurfaceDTO = {
  studentId: string;
  studentName: string;
  stageName: string;
  stageDescription: string;
  agentKey: string;
  agentDisplayName: string;
  blockers: string[];
  nextStep: string;
  riskBand: "low" | "medium" | "high";
  agentSummary: string;
  nextActions: string[];
  timeline: TimelineItem[];
};

export async function loadStudentSurface(
  studentId: string,
  tenantId: string,
): Promise<{ ok: true; data: StudentSurfaceDTO } | { ok: false; error: string }> {
  try {
    await requirePermission("students.read")();
    if (!tenantId.trim()) {
      return { ok: false, error: "Missing tenant id (set ZIRO_DEV_TENANT_ID or NEXT_PUBLIC_ZIRO_DEV_TENANT_ID)." };
    }
    await assertTenantAccess(tenantId.trim());
    await logAudit("students.surface.load", {
      studentId,
      tenantId: tenantId.trim(),
    });
    const supabase = getServiceClient();
    const { data: student, error } = await supabase.from("students").select("*").eq("id", studentId).maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!student) return { ok: false, error: "Student not found" };
    if ((student.tenant_id as string) !== tenantId.trim()) {
      return { ok: false, error: "Tenant mismatch" };
    }

    const ctx = await buildLifecycleContext(studentId);
    const computed = computeStage(ctx);
    const timeline = await buildTimeline(studentId);
    const def = computed.stage;
    const agentDisplayName = formatAgentDisplayName(def.agent);
    const blockers = summarizeBlockers(computed.blockers);
    const nextStep = nextStepLabel(computed);

    const nextActions: string[] = [];
    for (const b of computed.blockers) {
      nextActions.push(b.message);
    }
    if (computed.next && computed.blockers.length === 0) {
      nextActions.push(`Move forward to ${computed.next.name}`);
    }
    if (nextActions.length === 0) {
      nextActions.push(`Align work with ${def.name} exit criteria.`);
    }

    const studentName = (student.name as string) ?? "Student";
    const agentSummary = `${studentName} is in ${def.name}. Risk band is ${ctx.riskBand}.`;

    return {
      ok: true,
      data: {
        studentId,
        studentName,
        stageName: def.name,
        stageDescription: def.description,
        agentKey: def.agent,
        agentDisplayName,
        blockers,
        nextStep,
        riskBand: ctx.riskBand,
        agentSummary,
        nextActions,
        timeline,
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to load student" };
  }
}
