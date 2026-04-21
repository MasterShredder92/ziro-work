import { jsx as _jsx } from "react/jsx-runtime";
import { ensureAdminAccess } from "../guard";
import { listDeadLetter, listJobs } from "@/lib/queue/queries";
import { runHealthChecks } from "@/lib/observability/health";
import { SystemView } from "./SystemView";
export const dynamic = "force-dynamic";
export default async function AdminSystemPage() {
    await ensureAdminAccess();
    const [activeJobs, recentJobs, deadLetter, health] = await Promise.all([
        listJobs({ statuses: ["pending", "running"], limit: 50 }),
        listJobs({ statuses: ["succeeded", "failed", "dead"], limit: 50 }),
        listDeadLetter({ limit: 50 }),
        runHealthChecks(),
    ]);
    return (_jsx(SystemView, { activeJobs: activeJobs, recentJobs: recentJobs, deadLetter: deadLetter, health: health }));
}
