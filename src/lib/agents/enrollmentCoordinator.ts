import { AgentContext, AgentDefinition } from "./types";
import { registerAgent } from "./registry";
import type { Lead } from "../types/leads";
import type { Student } from "../types/students";
import type { Trial } from "../types/trials";

async function tenantLog(ctx: AgentContext, type: string, payload: Record<string, unknown>) {
  await ctx.tools.log_tenant_event({
    event: { type, payload, tenantId: ctx.tenantId },
  });
}

export const enrollmentCoordinator: AgentDefinition = {
  id: "enrollmentCoordinator",
  name: "Enrollment Coordinator",
  description: "Handles lead follow-up, trial scheduling, and enrollment tasks.",

  async run(ctx: AgentContext) {
    void ctx;
    // eslint-disable-next-line no-console
    console.log("Enrollment Coordinator heartbeat:", Date.now());
  },

  async onTask(task, ctx) {
    // eslint-disable-next-line no-console
    console.log("Enrollment Coordinator received task:", task);

    if (task.payload?.type === "at_risk_student") {
      const students = (await ctx.tools.get_students({
        tenantId: ctx.tenantId,
        filter: { id: task.payload.student_id },
      })) as Student[];

      const student = students[0];
      if (!student) return;

      const missed = task.payload.missed_in_last_30_days as number | undefined;
      const plan = await ctx.tools.plan_retention_sequence({ student, missed_in_last_30_days: missed });

      if (plan.next_action_type === "retention_nudge") {
        await ctx.tools.send_onboarding_message({
          student_id: student.id,
          template_id: plan.template_id,
        });

        await ctx.tools.update_student({
          studentId: student.id,
          tenantId: ctx.tenantId,
          onboarding_stage: "at_risk",
          churn_risk: "high",
        });

        await tenantLog(ctx, "retention_nudge_sent", { student_id: student.id });
      }

      if (plan.next_action_type === "check_in") {
        await ctx.tools.send_onboarding_message({
          student_id: student.id,
          template_id: plan.template_id,
        });

        await tenantLog(ctx, "attendance_checkin_sent", { student_id: student.id });
      }

      return;
    }

    if (task.payload?.type === "trial_to_enrollment") {
      const leadId = task.payload.lead_id as string | undefined;
      const trialId = task.payload.trial_id as string | undefined;
      if (!leadId || !trialId) return;

      const student = (await ctx.tools.create_enrollment({
        lead_id: leadId,
      })) as Student;

      await tenantLog(ctx, "student_enrolled", { student_id: student.id, lead_id: leadId });

      const plan = await ctx.tools.plan_onboarding_sequence({ student });

      if (plan.next_action_type === "welcome") {
        await ctx.tools.send_onboarding_message({
          student_id: student.id,
          template_id: plan.template_id,
        });

        await ctx.tools.update_student({
          studentId: student.id,
          tenantId: ctx.tenantId,
          onboarding_stage: "first_week",
        });

        await tenantLog(ctx, "onboarding_welcome_sent", { student_id: student.id });
      }

      if (plan.next_action_type === "check_in") {
        await ctx.tools.send_onboarding_message({
          student_id: student.id,
          template_id: plan.template_id,
        });

        await tenantLog(ctx, "onboarding_checkin_sent", { student_id: student.id });
      }

      if (plan.next_action_type === "retention_nudge") {
        await ctx.tools.send_onboarding_message({
          student_id: student.id,
          template_id: plan.template_id,
        });

        await tenantLog(ctx, "retention_nudge_sent", { student_id: student.id });
      }

      await ctx.tools.update_trial_status({
        trialId,
        tenantId: ctx.tenantId,
        status: "enrolled",
      });

      return;
    }

    if (task.payload?.type === "inactive_trial") {
      const trials = (await ctx.tools.get_trials({
        tenantId: ctx.tenantId,
        filter: { id: task.payload.trial_id },
      })) as Trial[];

      const trial = trials[0];
      if (!trial) return;

      const aging = await ctx.tools.compute_trial_aging({ trial });
      await ctx.tools.update_trial_status({
        trialId: trial.id,
        tenantId: ctx.tenantId,
        inactivity_bucket: aging.inactivity_bucket,
      });

      const plan = await ctx.tools.plan_trial_sequence({ trial });

      if (plan.next_action_type === "confirm") {
        await ctx.tools.send_trial_reminder({
          trial_id: trial.id,
          template_id: plan.template_id,
        });

        await ctx.tools.update_trial_status({
          trialId: trial.id,
          tenantId: ctx.tenantId,
          status: "confirmed",
          last_reminded_at: new Date().toISOString(),
        });

        await tenantLog(ctx, "trial_confirmed", { trial_id: trial.id });
      }

      if (plan.next_action_type === "follow_up") {
        await ctx.tools.send_trial_reminder({
          trial_id: trial.id,
          template_id: plan.template_id,
        });

        await tenantLog(ctx, "trial_follow_up", { trial_id: trial.id });
      }

      if (plan.next_action_type === "final_nudge") {
        await ctx.tools.send_trial_reminder({
          trial_id: trial.id,
          template_id: plan.template_id,
        });

        await tenantLog(ctx, "trial_final_nudge", { trial_id: trial.id });
      }

      if (plan.next_action_type === "mark_lost") {
        await ctx.tools.update_trial_status({
          trialId: trial.id,
          tenantId: ctx.tenantId,
          status: "lost",
        });

        await tenantLog(ctx, "trial_marked_lost", { trial_id: trial.id });
      }

      return;
    }

    if (task.payload?.type === "inactive_lead") {
      const leads = (await ctx.tools.get_leads({
        tenantId: ctx.tenantId,
        filter: { id: task.payload.lead_id },
      })) as Lead[];

      const lead = leads[0];
      if (!lead) return;

      const aging = await ctx.tools.compute_lead_aging({ lead });
      await ctx.tools.update_lead_status({
        leadId: lead.id,
        status: lead.status,
        tenantId: ctx.tenantId,
        inactivity_bucket: aging.inactivity_bucket,
      });

      const plan = await ctx.tools.plan_outreach_sequence({ lead });

      if (plan.next_action_type === "follow_up" || plan.next_action_type === "final_nudge") {
        await ctx.tools.follow_up_lead({
          lead_id: lead.id,
          template_id: plan.template_id,
        });

        await ctx.tools.update_lead_status({
          leadId: lead.id,
          status: lead.status === "new" ? "contacted" : lead.status,
          tenantId: ctx.tenantId,
          last_contacted_at: new Date().toISOString(),
        });

        await ctx.tools.log_lead_follow_up({
          leadId: lead.id,
          reason: "inactive_lead",
          tenantId: ctx.tenantId,
        });

        await tenantLog(ctx, "lead_followed_up", { lead_id: lead.id });
      }

      if (plan.next_action_type === "mark_lost") {
        await ctx.tools.update_lead_status({
          leadId: lead.id,
          status: "lost",
          tenantId: ctx.tenantId,
        });

        await tenantLog(ctx, "lead_marked_lost", { lead_id: lead.id });
      }

      return;
    }

    if (task.payload?.type === "heartbeat") {
      // eslint-disable-next-line no-console
      console.log("Enrollment Coordinator responding to heartbeat task");
    }

    if (task.payload?.type === "high_lead_volume") {
      // eslint-disable-next-line no-console
      console.log("High lead volume detected — fetching leads…");

      const leads = await ctx.tools.get_leads({ tenantId: ctx.tenantId });

      // eslint-disable-next-line no-console
      console.log("Enrollment Coordinator reviewing leads:", leads);
    }

    if (task.payload?.type === "high_quality_leads") {
      // eslint-disable-next-line no-console
      console.log("High-quality leads detected:", task.payload.leads);

      // Placeholder for future automated outreach
      // eslint-disable-next-line no-console
      console.log("Enrollment Coordinator preparing outreach (mock)");
    }

    if (task.payload?.type === "stale_leads") {
      // eslint-disable-next-line no-console
      console.log("Stale leads detected:", task.payload.leads);

      for (const lead of task.payload.leads) {
        await ctx.tools.follow_up_lead({ lead });

        await ctx.tools.update_lead_status({
          leadId: lead.id,
          status: "contacted",
          tenantId: ctx.tenantId,
        });

        await ctx.tools.log_lead_follow_up({
          leadId: lead.id,
          tenantId: ctx.tenantId,
          reason: "stale_lead",
        });
      }

      // eslint-disable-next-line no-console
      console.log("Follow-up completed for stale leads (mock)");
    }

    if (task.payload?.type === "low_trial_volume") {
      // eslint-disable-next-line no-console
      console.log("Low trial volume detected — fetching upcoming trials…");

      const trials = await ctx.tools.get_trials({ tenantId: ctx.tenantId });

      // eslint-disable-next-line no-console
      console.log("Upcoming trials:", trials);
    }

    if (task.payload?.type === "schedule_trial") {
      await ctx.tools.schedule_trial({
        studentId: task.payload.studentId,
        time: task.payload.time,
        tenantId: ctx.tenantId,
      });

      await tenantLog(ctx, "trial_scheduled", task.payload as Record<string, unknown>);

      // eslint-disable-next-line no-console
      console.log("Trial scheduled (real)");
    }

    if (task.payload?.type === "check_leads") {
      // eslint-disable-next-line no-console
      console.log("Enrollment Coordinator checking leads…");

      // placeholder for future Supabase call
      const leads: any[] = [];

      // eslint-disable-next-line no-console
      console.log("Found leads:", leads.length);
    }
  },
};

registerAgent(enrollmentCoordinator);

