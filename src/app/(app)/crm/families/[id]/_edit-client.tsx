"use client";

import { useState } from "react";
import Link from "next/link";
import { rewriteMigratedSupabaseFileUrl } from "@/lib/storage/rewriteMigratedSupabaseUrl";

type Props = {
  family: Record<string, unknown>;
  tenantId: string;
  students: Array<Record<string, unknown>>;
  locationNameById: Record<string, string>;
  familyFileRows: Array<Record<string, unknown>>;
  familyEnrollments: Array<Record<string, unknown>>;
};

type Tab = "view" | "edit";

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between border-b border-[#14141a] pb-1 last:border-0">
      <dt className="text-xs uppercase tracking-wider text-[#606068]">{label}</dt>
      <dd className="text-[#d4d4d4]">{value ?? "—"}</dd>
    </div>
  );
}

export function FamilyEditClient({ family, tenantId, students, locationNameById, familyFileRows, familyEnrollments }: Props) {
  const [tab, setTab] = useState<Tab>("view");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  // Edit form state — initialized from family prop
  const [name, setName] = useState(String(family.name ?? ""));
  const [parentFirstName, setParentFirstName] = useState(String(family.parent_first_name ?? ""));
  const [parentLastName, setParentLastName] = useState(String(family.parent_last_name ?? ""));
  const [primaryContactName, setPrimaryContactName] = useState(String(family.primary_contact_name ?? ""));
  const [primaryEmail, setPrimaryEmail] = useState(String(family.primary_email ?? ""));
  const [primaryPhone, setPrimaryPhone] = useState(String(family.primary_phone ?? ""));
  const [emergencyContactName, setEmergencyContactName] = useState(String(family.emergency_contact_name ?? ""));
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(String(family.emergency_contact_phone ?? ""));
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState(String(family.emergency_contact_relationship ?? ""));
  const [billingNotes, setBillingNotes] = useState(String(family.billing_notes ?? ""));
  const [schedulingNotes, setSchedulingNotes] = useState(String(family.scheduling_notes ?? ""));
  const [isMilitary, setIsMilitary] = useState(Boolean(family.is_military));
  const [autopayEnabled, setAutopayEnabled] = useState(Boolean(family.autopay_enabled));
  const [notifyViaEmail, setNotifyViaEmail] = useState(Boolean(family.notify_via_email));
  const [notifyViaSms, setNotifyViaSms] = useState(Boolean(family.notify_via_sms));
  const [reminder1hr, setReminder1hr] = useState(Boolean(family.reminder_1hr));
  const [reminder4hr, setReminder4hr] = useState(Boolean(family.reminder_4hr));
  const [billingStatus, setBillingStatus] = useState(String(family.billing_status ?? "active"));

  const inputCls = "w-full rounded-lg border border-[#1c1c1e] bg-[#111113] px-3 py-2 text-sm text-white placeholder-[#404048] focus:border-[#00ff88]/30 focus:outline-none";
  const labelCls = "block text-xs font-semibold uppercase tracking-wider text-[#505055] mb-1";
  const sectionCls = "rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] p-4 space-y-3";

  async function handleSave() {
    setSaving(true);
    setSaveStatus("idle");
    setSaveError(null);
    try {
      const patch: Record<string, unknown> = {
        name,
        parent_first_name: parentFirstName || null,
        parent_last_name: parentLastName || null,
        primary_contact_name: primaryContactName || null,
        primary_email: primaryEmail || null,
        primary_phone: primaryPhone || null,
        emergency_contact_name: emergencyContactName || null,
        emergency_contact_phone: emergencyContactPhone || null,
        emergency_contact_relationship: emergencyContactRelationship || null,
        billing_notes: billingNotes || null,
        scheduling_notes: schedulingNotes || null,
        is_military: isMilitary,
        autopay_enabled: autopayEnabled,
        notify_via_email: notifyViaEmail,
        notify_via_sms: notifyViaSms,
        reminder_1hr: reminder1hr,
        reminder_4hr: reminder4hr,
        billing_status: billingStatus,
      };
      const res = await fetch(`/api/families/${String(family.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-tenant-id": tenantId },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? `HTTP ${res.status}`);
      }
      setSaveStatus("success");
      setTimeout(() => { setSaveStatus("idle"); setTab("view"); }, 2000);
    } catch (err) {
      setSaveStatus("error");
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-[#1c1c1e]">
        {(["view", "edit"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors ${tab === t ? "border-b-2 border-[#00ff88] text-[#00ff88]" : "text-[#505055] hover:text-[#909098]"}`}>
            {t === "view" ? "Overview" : "Edit Family"}
          </button>
        ))}
      </div>

      {/* ── VIEW TAB ── */}
      {tab === "view" && (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-4">
              <h3 className="mb-3 text-sm font-semibold text-[#d4d4d4]">Primary guardian</h3>
              <dl className="space-y-2 text-sm">
                <Row label="Name" value={
                  (family.primary_contact_name as string | null) ??
                  (family.parent_name as string | null) ??
                  ([family.parent_first_name, family.parent_last_name].filter(Boolean).join(" ") || null)
                } />
                <Row label="Email" value={family.primary_email as string | null} />
                <Row label="Phone" value={family.primary_phone as string | null} />
                <Row label="Emergency contact" value={family.emergency_contact_name as string | null} />
              </dl>
            </div>

            <div className="rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-4">
              <h3 className="mb-3 text-sm font-semibold text-[#d4d4d4]">Emergency &amp; other</h3>
              {(family.emergency_contact_name || family.emergency_contact_phone) ? (
                <dl className="space-y-2 text-sm">
                  <Row label="Emergency contact" value={family.emergency_contact_name as string | null} />
                  <Row label="Emergency phone" value={family.emergency_contact_phone as string | null} />
                  <Row label="Relationship" value={family.emergency_contact_relationship as string | null} />
                </dl>
              ) : (
                <div className="text-xs text-[#707078]">No emergency contact on file.</div>
              )}
            </div>

            <div className="rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-4 lg:col-span-2">
              <h3 className="mb-3 text-sm font-semibold text-[#d4d4d4]">Students</h3>
              {students.length === 0 ? (
                <div className="text-xs text-[#707078]">No students linked.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1c1c1e]">
                        {["Student", "Studio", "Teacher", "Rate", "Paid", "Mil.", "Status"].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[#505055]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s) => (
                        <tr key={String(s.id)} className="border-b border-[#14141a] last:border-0">
                          <td className="px-3 py-2 font-semibold text-[#f0f0f0]">
                            <Link href={`/crm/students/${String(s.id)}`} className="hover:text-[#00ff88]">{String(s.name ?? "")}</Link>
                          </td>
                          <td className="px-3 py-2 text-[#909098]">
                            {s.location_id ? (locationNameById[String(s.location_id)] ?? String(s.location_id)) : "—"}
                          </td>
                          <td className="px-3 py-2 text-[#909098]">{String(s.teacher_label ?? "—")}</td>
                          <td className="px-3 py-2 text-[#909098]">
                            {typeof s.rate_per_session === "number" ? `$${(s.rate_per_session as number).toFixed(2)}` : "—"}
                          </td>
                          <td className="px-3 py-2 text-[#909098]">
                            {typeof s.total_paid === "number" ? `$${(s.total_paid as number).toFixed(2)}` : "—"}
                          </td>
                          <td className="px-3 py-2 text-[#909098]">{s.is_military ? "Yes" : "—"}</td>
                          <td className="px-3 py-2 text-[#909098]">{String(s.status ?? "—")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wider text-[#909098]">Family files</h2>
          {familyFileRows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#1c1c1e] bg-[#0a0a0c] p-4 text-sm text-[#707078]">No files linked to this family yet.</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[#1c1c1e]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1c1c1e]">
                    {["Type", "Name", "Status", "Link"].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[#505055]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {familyFileRows.map((f) => {
                    const href = rewriteMigratedSupabaseFileUrl(String(f.file_url ?? ""));
                    return (
                      <tr key={String(f.id)} className="border-b border-[#1c1c1e] last:border-0">
                        <td className="px-4 py-2 text-[#909098]">{String(f.file_type ?? "—")}</td>
                        <td className="px-4 py-2 text-[#d4d4d4]">{String(f.file_name ?? "—")}</td>
                        <td className="px-4 py-2 text-[#909098]">{String(f.signwell_status ?? "—")}</td>
                        <td className="px-4 py-2">
                          {href ? <a href={href} target="_blank" rel="noreferrer" className="text-sm text-[#00ff88] hover:underline">Open</a> : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wider text-[#909098]">Active enrollments</h2>
          {familyEnrollments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#1c1c1e] bg-[#0a0a0c] p-4 text-sm text-[#707078]">No enrollments linked to students in this family.</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[#1c1c1e]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1c1c1e]">
                    {["Student", "Teacher", "Status", "Start", "End"].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[#505055]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {familyEnrollments.map((e) => (
                    <tr key={String(e.id)} className="border-b border-[#1c1c1e] last:border-0">
                      <td className="px-4 py-2 text-[#909098]">
                        <Link href={`/crm/students/${String(e.student_id)}`} className="hover:text-[#00ff88]">{String(e.student_id)}</Link>
                      </td>
                      <td className="px-4 py-2 text-[#909098]">
                        <Link href={`/crm/teachers/${String(e.teacher_id)}`} className="hover:text-[#00ff88]">{String(e.teacher_id)}</Link>
                      </td>
                      <td className="px-4 py-2 text-[#909098]">{String(e.status)}</td>
                      <td className="px-4 py-2 text-[#909098]">{String(e.start_date ?? "—")}</td>
                      <td className="px-4 py-2 text-[#909098]">{String(e.end_date ?? "—")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wider text-[#909098]">Communication</h2>
          <div className="overflow-x-auto rounded-lg border border-[#1c1c1e]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1c1c1e]">
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[#505055]">Channel</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[#505055]">Address</th>
                </tr>
              </thead>
              <tbody>
                {family.primary_email ? (
                  <tr><td className="px-4 py-2 text-xs uppercase text-[#606068]">Email</td><td className="px-4 py-2 text-[#d4d4d4]">{String(family.primary_email)}</td></tr>
                ) : null}
                {family.primary_phone ? (
                  <>
                    <tr><td className="px-4 py-2 text-xs uppercase text-[#606068]">SMS</td><td className="px-4 py-2 text-[#d4d4d4]">{String(family.primary_phone)}</td></tr>
                    <tr><td className="px-4 py-2 text-xs uppercase text-[#606068]">Phone</td><td className="px-4 py-2 text-[#d4d4d4]">{String(family.primary_phone)}</td></tr>
                  </>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── EDIT TAB ── */}
      {tab === "edit" && (
        <div className="space-y-4">
          {/* Family name & billing status */}
          <div className={sectionCls}>
            <div className="text-xs font-bold uppercase tracking-widest text-[#303035]">Family Info</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Family Name</label>
                <input className={inputCls} value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Billing Status</label>
                <select className={inputCls} value={billingStatus} onChange={e => setBillingStatus(e.target.value)}>
                  <option value="active">Active</option>
                  <option value="overdue">Overdue</option>
                  <option value="paused">Paused</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Primary guardian */}
          <div className={sectionCls}>
            <div className="text-xs font-bold uppercase tracking-widest text-[#303035]">Primary Guardian</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>First Name</label>
                <input className={inputCls} value={parentFirstName} onChange={e => setParentFirstName(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Last Name</label>
                <input className={inputCls} value={parentLastName} onChange={e => setParentLastName(e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Contact Name (display)</label>
              <input className={inputCls} value={primaryContactName} onChange={e => setPrimaryContactName(e.target.value)} placeholder="Full name as displayed…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Email</label>
                <input className={inputCls} type="email" value={primaryEmail} onChange={e => setPrimaryEmail(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input className={inputCls} type="tel" value={primaryPhone} onChange={e => setPrimaryPhone(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Emergency contact */}
          <div className={sectionCls}>
            <div className="text-xs font-bold uppercase tracking-widest text-[#303035]">Emergency Contact</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Name</label>
                <input className={inputCls} value={emergencyContactName} onChange={e => setEmergencyContactName(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input className={inputCls} type="tel" value={emergencyContactPhone} onChange={e => setEmergencyContactPhone(e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Relationship</label>
              <input className={inputCls} value={emergencyContactRelationship} onChange={e => setEmergencyContactRelationship(e.target.value)} placeholder="Parent, Grandparent, Sibling…" />
            </div>
          </div>

          {/* Notes */}
          <div className={sectionCls}>
            <div className="text-xs font-bold uppercase tracking-widest text-[#303035]">Notes</div>
            <div>
              <label className={labelCls}>Billing Notes</label>
              <textarea className={inputCls} rows={2} value={billingNotes} onChange={e => setBillingNotes(e.target.value)} placeholder="Billing-specific notes…" />
            </div>
            <div>
              <label className={labelCls}>Scheduling Notes</label>
              <textarea className={inputCls} rows={2} value={schedulingNotes} onChange={e => setSchedulingNotes(e.target.value)} placeholder="Scheduling-specific notes…" />
            </div>
          </div>

          {/* Preferences */}
          <div className={sectionCls}>
            <div className="text-xs font-bold uppercase tracking-widest text-[#303035]">Preferences</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Military", value: isMilitary, set: setIsMilitary },
                { label: "Autopay", value: autopayEnabled, set: setAutopayEnabled },
                { label: "Email notifications", value: notifyViaEmail, set: setNotifyViaEmail },
                { label: "SMS notifications", value: notifyViaSms, set: setNotifyViaSms },
                { label: "1hr reminder", value: reminder1hr, set: setReminder1hr },
                { label: "4hr reminder", value: reminder4hr, set: setReminder4hr },
              ].map(({ label, value, set }) => (
                <button key={label} type="button" onClick={() => set(!value)}
                  className="flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition-colors"
                  style={{
                    borderColor: value ? "#00ff88" : "#1c1c1e",
                    background: value ? "rgba(0,255,136,0.08)" : "#0a0a0c",
                    color: value ? "#00ff88" : "#505055",
                  }}>
                  {label}
                  <div className={`h-5 w-9 rounded-full transition-colors ${value ? "bg-[#00ff88]" : "bg-[#1c1c1e]"}`}>
                    <div className={`mt-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${value ? "translate-x-4 ml-0.5" : "translate-x-0.5"}`} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Save */}
          {saveStatus === "success" && <p className="text-sm text-green-500">Family profile saved successfully.</p>}
          {saveStatus === "error" && saveError && <p className="text-sm text-red-400">Error: {saveError}</p>}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-xl bg-[#00ff88] py-3 text-sm font-bold text-black disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Family"}
            </button>
            <button
              onClick={() => setTab("view")}
              className="rounded-xl border border-[#1c1c1e] px-6 py-3 text-sm text-[#505055]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
