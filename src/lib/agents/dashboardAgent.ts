import { AgentContext, AgentDefinition } from "./types";
import { registerAgent } from "./registry";
import { subscribe } from "./eventBus";

async function dashLog(ctx: AgentContext, type: string, payload: Record<string, unknown>) {
  await ctx.tools.log_tenant_event({
    event: { type, payload, tenantId: ctx.tenantId },
  });
}

export const dashboardAgent: AgentDefinition = {
  id: "dashboard",
  name: "Dashboard Agent",
  description: "Top-level orchestrator that monitors KPIs, detects issues, and delegates tasks.",

  async run(ctx: AgentContext) {
    // eslint-disable-next-line no-console
    console.log("Dashboard Agent heartbeat:", Date.now());

    const settings = await ctx.tools.get_tenant_settings({});
    const pipelines = settings.pipelines ?? {};

    const kpis = await ctx.tools.compute_tenant_kpis({});

    await dashLog(ctx, "kpi_snapshot", kpis as unknown as Record<string, unknown>);

    if (pipelines.lead !== false) {
      if (kpis.leadsThisWeek > 5) {
        await ctx.tools.enqueue_task({
          agent: "enrollmentCoordinator",
          payload: { type: "high_lead_volume" },
        });
      }

      const leads = await ctx.tools.get_leads({ tenantId: ctx.tenantId });

      const scored = await Promise.all(
        leads.map((lead: any) => ctx.tools.score_lead({ lead }))
      );

      const highQuality = scored.filter((l: any) => l.score >= 50);

      if (highQuality.length > 0) {
        await ctx.tools.enqueue_task({
          agent: "enrollmentCoordinator",
          payload: { type: "high_quality_leads", leads: highQuality },
        });
      }

      const stale = scored.filter((l: any) => l.status === "new" && l.score < 30);

      if (stale.length > 0) {
        await ctx.tools.enqueue_task({
          agent: "enrollmentCoordinator",
          payload: { type: "stale_leads", leads: stale },
        });
      }

      const inactiveLeads = await ctx.tools.detect_inactive_leads({});
      for (const item of inactiveLeads) {
        await ctx.tools.enqueue_task({
          agent: "enrollmentCoordinator",
          payload: {
            type: "inactive_lead",
            lead_id: item.lead_id,
            inactivity_bucket: item.inactivity_bucket,
            days_since_last_contact: item.days_since_last_contact,
          },
        });

        await dashLog(ctx, "lead_inactivity_detected", {
          lead_id: item.lead_id,
          inactivity_bucket: item.inactivity_bucket,
          days_since_last_contact: item.days_since_last_contact,
        });
      }

      await ctx.tools.enqueue_task({
        agent: "enrollmentCoordinator",
        payload: { type: "check_leads" },
      });

      const issues: string[] = [];
      if (kpis?.activeStudents != null && kpis.activeStudents < 100) {
        issues.push("Low enrollment");
      }

      if (issues.length > 0) {
        await ctx.tools.enqueue_task({
          agent: "enrollmentCoordinator",
          payload: { type: "issues_detected", issues },
        });
      }
    }

    if (pipelines.trial !== false) {
      if (kpis.trialsScheduled < 2) {
        await ctx.tools.enqueue_task({
          agent: "enrollmentCoordinator",
          payload: { type: "low_trial_volume" },
        });
      }

      const inactiveTrials = await ctx.tools.detect_inactive_trials({});
      for (const item of inactiveTrials) {
        await ctx.tools.enqueue_task({
          agent: "enrollmentCoordinator",
          payload: {
            type: "inactive_trial",
            trial_id: item.trial_id,
            lead_id: item.lead_id,
            inactivity_bucket: item.inactivity_bucket,
            days_since_trial: item.days_since_trial,
          },
        });

        await dashLog(ctx, "trial_inactivity_detected", item as unknown as Record<string, unknown>);
      }
    }

    if (pipelines.enrollment !== false) {
      const readyForEnrollment = await ctx.tools.detect_trial_to_enrollment({});
      for (const item of readyForEnrollment) {
        await ctx.tools.enqueue_task({
          agent: "enrollmentCoordinator",
          payload: {
            type: "trial_to_enrollment",
            trial_id: item.trial_id,
            lead_id: item.lead_id,
          },
        });

        await dashLog(ctx, "trial_ready_for_enrollment", item as unknown as Record<string, unknown>);
      }
    }

    if (pipelines.retention !== false) {
      const atRiskStudents = await ctx.tools.detect_at_risk_students({});
      for (const item of atRiskStudents) {
        await ctx.tools.enqueue_task({
          agent: "enrollmentCoordinator",
          payload: {
            type: "at_risk_student",
            student_id: item.student_id,
            missed_in_last_30_days: item.missed_in_last_30_days,
          },
        });

        await dashLog(ctx, "student_at_risk_detected", item as unknown as Record<string, unknown>);
      }
    }
  },

  async onEvent(event, _ctx) {
    if (event.name === "task_completed") {
      // eslint-disable-next-line no-console
      console.log("Dashboard noticed task completion:", event.payload);
    }
  },

  async onTask(task, ctx) {
    // eslint-disable-next-line no-console
    console.log("Dashboard Agent received task:", task);

    if (task.payload?.type === "heartbeat") {
      // eslint-disable-next-line no-console
      console.log("Dashboard Agent acknowledges heartbeat task");
    }

    if (task.payload?.type === "dashboard_tick") {
      await dashboardAgent.run(ctx);
      const settings = await ctx.tools.get_tenant_settings({});
      const fromSettings = settings.schedule?.dashboard_tick_ms;
      const fromPayload = task.payload.intervalMs;
      const intervalMs =
        typeof fromSettings === "number" && fromSettings >= 5_000
          ? fromSettings
          : typeof fromPayload === "number" && fromPayload >= 5_000
            ? fromPayload
            : 60_000;
      globalThis.setTimeout(() => {
        void ctx.tools.enqueue_task({
          agent: "dashboard",
          payload: { type: "dashboard_tick", intervalMs },
        });
      }, intervalMs);
      return;
    }

    if (task.payload?.type === "refresh_dashboard") {
      await dashboardAgent.run(ctx);
    }
  },
};

registerAgent(dashboardAgent);

subscribe("task_processed", async (event) => {
  // eslint-disable-next-line no-console
  console.log("Dashboard Agent saw task processed:", event.payload?.task);
});
