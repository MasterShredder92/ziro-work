"use client";
import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageTransition } from "@/components/system/PageTransition";
import { PageHeader } from "@/components/ui/PageHeader";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

type TeacherRaw = {
  id: string; tenant_id: string; name?: string | null; first_name?: string | null;
  last_name?: string | null; display_name?: string | null; email?: string | null;
  phone?: string | null; status?: string | null; bio?: string | null;
  instruments?: string[] | null; primary_instruments?: string | null;
  secondary_instruments?: string | null; rate_per_block?: number | null;
  pay_rate_per_half_hour?: number | null; max_students?: number | null;
  needs_1099?: boolean; is_active?: boolean; is_sub_available?: boolean;
  sub_available?: boolean | null; teacher_role?: string | null;
  hire_date?: string | null; photo_url?: string | null;
  director_notes?: string | null; lesson_style?: string | null;
  teaching_strengths?: string | null; musical_strengths_background?: string | null;
  w9_status?: string | null; w9_completed_at?: string | null;
  contract_status?: string | null; contract_pdf_url?: string | null;
  // Matching & placement fields
  personality?: string | null;
  style_genre_strengths?: string | null;
  preferred_age_range?: string | null;
  acceptable_age_range?: string | null;
  skill_levels_by_instrument?: string | null;
  best_first_lesson_fit?: string | null;
  best_match_students?: string | null;
  use_caution_internal_placement_notes?: string | null;
  meet_and_greet_fit?: string | null;
  substitute_coverage?: string | null;
  customer_facing_match_summary?: string | null;
  internal_matching_tags?: string | null;
  internal_match_notes?: string | null;
};
type Location = { id: string; name: string };
type Tab = "profile" | "contract_w9" | "students" | "availability";
type AvailabilitySlot = { start_time: string; end_time: string; is_active?: boolean };
type W9Record = {
  id: string; legal_name: string; business_name?: string | null;
  tax_classification: string; address: string; city: string; state: string; zip: string;
  tin_type: string; tin_last_four: string; signature_name: string;
  signed_at: string; status: string; pdf_url?: string | null;
};

const inputCls = "w-full rounded-xl border border-[var(--z-border)] bg-[var(--z-surface-2,#0a0a0c)] px-3 py-2.5 text-sm text-[var(--z-fg)] placeholder-[var(--z-muted)] focus:border-[#00ff88]/40 focus:outline-none transition-colors";
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)] mb-1";
const sectionCls = "rounded-xl border border-[var(--z-border)] bg-[var(--z-surface,#101012)] p-4 space-y-3";
// Premium card with Ziro Green left-edge highlight
const premiumCardCls = "rounded-xl border border-[var(--z-border)] bg-[var(--z-surface,#101012)] overflow-hidden";
const premiumCardStyle = { borderLeftColor: "#00ff88", borderLeftWidth: 3 } as React.CSSProperties;

/** Parse "HH:MM:SS" or "HH:MM" into total minutes */
function timeToMinutes(t: string): number {
  const parts = t.split(":").map(Number);
  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
}

/** Calculate total 30-min slots from availability records */
function calcCapacitySlots(slots: AvailabilitySlot[]): number {
  return slots
    .filter(s => s.is_active !== false)
    .reduce((sum, s) => {
      const mins = timeToMinutes(s.end_time) - timeToMinutes(s.start_time);
      return sum + Math.floor(mins / 30);
    }, 0);
}

function TeacherProfileView({ teacher, locations, capacitySlots, studentCount }: {
  teacher: TeacherRaw; locations: Location[]; capacitySlots: number | null; studentCount: number | null;
}) {
  const displayName = teacher.display_name ?? teacher.name ?? [teacher.first_name, teacher.last_name].filter(Boolean).join(" ") ?? "—";
  const capacityStr = capacitySlots != null
    ? `${studentCount ?? "?"} / ${capacitySlots} slots`
    : teacher.max_students != null ? String(teacher.max_students) : null;
  const rows: { label: string; value: string | null | undefined }[] = [
    { label: "Status", value: teacher.status ?? (teacher.is_active ? "active" : "inactive") },
    { label: "Role", value: teacher.teacher_role },
    { label: "Email", value: teacher.email },
    { label: "Phone", value: teacher.phone },
    { label: "Hire Date", value: teacher.hire_date },
    { label: "Rate / Block", value: teacher.rate_per_block != null ? `$${teacher.rate_per_block}` : null },
    { label: "Capacity", value: capacityStr },
    { label: "Tax Form", value: "1099 / W-9" },
    { label: "W9 Status", value: teacher.w9_status },
    { label: "Contract Status", value: teacher.contract_status },
    { label: "Sub Available", value: (teacher.is_sub_available || teacher.sub_available) ? "Yes" : "No" },
  ];
  return (
    <div className="space-y-4">
      {/* Hero card: avatar + name + role + location pills */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16,
        borderRadius: 12, border: "1px solid var(--z-border)",
        borderLeft: "3px solid #00ff88",
        background: "var(--z-surface, #101012)",
        padding: 16,
        boxShadow: "0 4px 20px rgba(0,255,136,0.06)",
      }}>
        <div style={{
          position: "relative", width: 64, height: 64, flexShrink: 0,
          borderRadius: "50%", overflow: "hidden",
          background: "radial-gradient(circle at 35% 35%, rgba(0,255,136,0.25), rgba(0,255,136,0.08))",
          border: "1.5px solid rgba(0,255,136,0.3)",
          boxShadow: "0 2px 12px rgba(0,255,136,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {teacher.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={teacher.photo_url} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: 22, fontWeight: 800, color: "#00ff88" }}>{displayName.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "var(--z-fg)" }}>{displayName}</div>
          {teacher.teacher_role && <div style={{ fontSize: 12, color: "var(--z-muted)", marginTop: 2 }}>{teacher.teacher_role}</div>}
          {locations.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
              {locations.map(l => (
                <span key={l.id} style={{
                  fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                  background: "rgba(0,255,136,0.1)", color: "#00ff88",
                }}>{l.name.replace(/music lessons?/i, "").trim()}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Data rows */}
      <div style={{ borderRadius: 12, border: "1px solid var(--z-border)", borderLeft: "3px solid #00ff88", background: "var(--z-surface, #101012)", overflow: "hidden" }}>
        {rows.map(({ label, value }, i) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 16px",
            borderBottom: i < rows.length - 1 ? "1px solid var(--z-border)" : "none",
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--z-muted)" }}>{label}</span>
            <span style={{ fontSize: 13, color: value ? "var(--z-fg)" : "var(--z-border)" }}>{value ?? "—"}</span>
          </div>
        ))}
      </div>

      {/* Instruments */}
      {(teacher.instruments?.length || teacher.primary_instruments || teacher.secondary_instruments) && (
        <div style={{ borderRadius: 12, border: "1px solid var(--z-border)", borderLeft: "3px solid #00ff88", background: "var(--z-surface, #101012)", padding: 16 }} className="space-y-3">
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--z-muted)" }}>Instruments</div>
          {(teacher.instruments?.length || teacher.primary_instruments) && (
            <div>
              <div style={{ fontSize: 10, color: "var(--z-muted)", marginBottom: 6 }}>Primary</div>
              <div className="flex flex-wrap gap-2">
                {(teacher.instruments ?? []).map(inst => (
                  <span key={inst} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "rgba(0,255,136,0.1)", color: "#00ff88" }}>{inst}</span>
                ))}
                {teacher.primary_instruments && teacher.primary_instruments.split(',').map(i => i.trim()).filter(Boolean).map(i => (
                  <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "rgba(0,255,136,0.08)", color: "#00ff88" }}>{i}</span>
                ))}
              </div>
            </div>
          )}
          {teacher.secondary_instruments && (
            <div>
              <div style={{ fontSize: 10, color: "var(--z-muted)", marginBottom: 6 }}>Secondary / Can Cover</div>
              <div className="flex flex-wrap gap-2">
                {teacher.secondary_instruments.split(',').map(i => i.trim()).filter(Boolean).map(i => (
                  <span key={i} style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 20, background: "var(--z-border)", color: "var(--z-muted)" }}>{i}</span>
                ))}
              </div>
            </div>
          )}
          {teacher.skill_levels_by_instrument && (
            <div><div style={{ fontSize: 10, color: "var(--z-muted)", marginBottom: 4 }}>Skill Levels</div><div style={{ fontSize: 13, color: "var(--z-fg)" }}>{teacher.skill_levels_by_instrument}</div></div>
          )}
          {teacher.style_genre_strengths && (
            <div>
              <div style={{ fontSize: 10, color: "var(--z-muted)", marginBottom: 6 }}>Style / Genre Strengths</div>
              <div className="flex flex-wrap gap-2">
                {teacher.style_genre_strengths.split(',').map(s => s.trim()).filter(Boolean).map(s => (
                  <span key={s} style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 20, background: "var(--z-border)", color: "var(--z-muted)" }}>{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Teaching Profile */}
      {(teacher.bio || teacher.personality || teacher.lesson_style || teacher.teaching_strengths || teacher.musical_strengths_background) && (
        <div style={{ borderRadius: 12, border: "1px solid var(--z-border)", borderLeft: "3px solid #00ff88", background: "var(--z-surface, #101012)", padding: 16 }} className="space-y-3">
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--z-muted)" }}>Teaching Profile</div>
          {teacher.bio && <div><div style={{ fontSize: 10, color: "var(--z-muted)", marginBottom: 4 }}>Bio</div><div style={{ fontSize: 13, color: "var(--z-fg)", lineHeight: 1.55 }}>{teacher.bio}</div></div>}
          {teacher.personality && (
            <div>
              <div style={{ fontSize: 10, color: "var(--z-muted)", marginBottom: 6 }}>Personality</div>
              <div className="flex flex-wrap gap-2">
                {teacher.personality.split(',').map(p => p.trim()).filter(Boolean).map(p => (
                  <span key={p} style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 20, background: "var(--z-border)", color: "var(--z-fg)" }}>{p}</span>
                ))}
              </div>
            </div>
          )}
          {teacher.lesson_style && <div><div style={{ fontSize: 10, color: "var(--z-muted)", marginBottom: 4 }}>Lesson Style</div><div style={{ fontSize: 13, color: "var(--z-fg)" }}>{teacher.lesson_style}</div></div>}
          {teacher.teaching_strengths && <div><div style={{ fontSize: 10, color: "var(--z-muted)", marginBottom: 4 }}>Teaching Strengths</div><div style={{ fontSize: 13, color: "var(--z-fg)" }}>{teacher.teaching_strengths}</div></div>}
          {teacher.musical_strengths_background && <div><div style={{ fontSize: 10, color: "var(--z-muted)", marginBottom: 4 }}>Musical Background</div><div style={{ fontSize: 13, color: "var(--z-fg)" }}>{teacher.musical_strengths_background}</div></div>}
        </div>
      )}

      {/* Student Matching */}
      {(teacher.preferred_age_range || teacher.acceptable_age_range || teacher.best_first_lesson_fit || teacher.best_match_students || teacher.customer_facing_match_summary) && (
        <div style={{ borderRadius: 12, border: "1px solid var(--z-border)", borderLeft: "3px solid #00ff88", background: "var(--z-surface, #101012)", padding: 16 }} className="space-y-3">
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--z-muted)" }}>Student Matching</div>
          {teacher.customer_facing_match_summary && <div><div style={{ fontSize: 10, color: "var(--z-muted)", marginBottom: 4 }}>Summary</div><div style={{ fontSize: 13, color: "var(--z-fg)" }}>{teacher.customer_facing_match_summary}</div></div>}
          {teacher.preferred_age_range && <div><div style={{ fontSize: 10, color: "var(--z-muted)", marginBottom: 4 }}>Preferred Age Range</div><div style={{ fontSize: 13, color: "var(--z-fg)" }}>{teacher.preferred_age_range}</div></div>}
          {teacher.acceptable_age_range && <div><div style={{ fontSize: 10, color: "var(--z-muted)", marginBottom: 4 }}>Acceptable Age Range</div><div style={{ fontSize: 13, color: "var(--z-fg)" }}>{teacher.acceptable_age_range}</div></div>}
          {teacher.best_first_lesson_fit && <div><div style={{ fontSize: 10, color: "var(--z-muted)", marginBottom: 4 }}>Best First Lesson Fit</div><div style={{ fontSize: 13, color: "var(--z-fg)" }}>{teacher.best_first_lesson_fit}</div></div>}
          {teacher.best_match_students && <div><div style={{ fontSize: 10, color: "var(--z-muted)", marginBottom: 4 }}>Best Match Students</div><div style={{ fontSize: 13, color: "var(--z-fg)" }}>{teacher.best_match_students}</div></div>}
          {teacher.meet_and_greet_fit && <div><div style={{ fontSize: 10, color: "var(--z-muted)", marginBottom: 4 }}>Meet &amp; Greet Fit</div><div style={{ fontSize: 13, color: "var(--z-fg)" }}>{teacher.meet_and_greet_fit}</div></div>}
          {teacher.substitute_coverage && <div><div style={{ fontSize: 10, color: "var(--z-muted)", marginBottom: 4 }}>Substitute Coverage</div><div style={{ fontSize: 13, color: "var(--z-fg)" }}>{teacher.substitute_coverage}</div></div>}
        </div>
      )}

      {/* Internal / Director Only */}
      {(teacher.use_caution_internal_placement_notes || teacher.internal_matching_tags || teacher.internal_match_notes || teacher.director_notes) && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-widest text-amber-500/60">Internal — Director Only</div>
          {teacher.use_caution_internal_placement_notes && (
            <div>
              <div className="text-xs text-amber-400/70 mb-0.5">⚠ Use Caution</div>
              <div className="text-sm text-amber-100">{teacher.use_caution_internal_placement_notes}</div>
            </div>
          )}
          {teacher.director_notes && <div><div className="text-xs text-amber-400/70 mb-0.5">Director Notes</div><div className="text-sm text-amber-100">{teacher.director_notes}</div></div>}
          {teacher.internal_match_notes && <div><div className="text-xs text-amber-400/70 mb-0.5">Internal Match Notes</div><div className="text-sm text-amber-100">{teacher.internal_match_notes}</div></div>}
          {teacher.internal_matching_tags && (
            <div>
              <div className="text-xs text-amber-400/70 mb-1">Matching Tags</div>
              <div className="flex flex-wrap gap-2">
                {teacher.internal_matching_tags.split(',').map(t => t.trim()).filter(Boolean).map(t => <span key={t} className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">{t}</span>)}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

function ContractModule({ teacher }: { teacher: TeacherRaw }) {
  const contractSigned = teacher.contract_status === "signed" || teacher.contract_status === "complete";
  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div className={`rounded-xl border p-4 ${contractSigned ? "border-[#00ff88]/30 bg-[#00ff88]/5" : "border-amber-500/30 bg-amber-500/5"}`}>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${contractSigned ? "bg-[#00ff88]" : "bg-amber-400"}`} />
          <span className="text-sm font-semibold text-white">Contract Status: <span className={contractSigned ? "text-[#00ff88]" : "text-amber-400"}>{teacher.contract_status ?? "Not on file"}</span></span>
        </div>
        {teacher.contract_pdf_url && (
          <a href={teacher.contract_pdf_url} target="_blank" rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/20 px-4 py-2 text-sm font-semibold text-[#00ff88] hover:bg-[#00ff88]/20 transition-colors">
            View Contract PDF →
          </a>
        )}
      </div>
      {/* Info rows */}
      <div style={{ borderRadius: 12, border: "1px solid var(--z-border)", borderLeft: "3px solid #00ff88", background: "var(--z-surface, #101012)", overflow: "hidden" }}>
        {[
          { label: "Contract Status", value: teacher.contract_status ?? "Not on file" },
          { label: "Tax Classification", value: "1099 Independent Contractor" },
          { label: "W9 Status", value: teacher.w9_status ?? "Not submitted" },
        ].map(({ label, value }, i, arr) => (
          <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: i < arr.length - 1 ? "1px solid var(--z-border)" : "none" }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--z-muted)" }}>{label}</span>
            <span style={{ fontSize: 13, color: "var(--z-fg)" }}>{value}</span>
          </div>
        ))}
      </div>
      {!teacher.contract_pdf_url && (
        <div style={{ borderRadius: 12, border: "1px solid var(--z-border)", background: "var(--z-surface, #101012)", padding: 16 }}>
          <p style={{ fontSize: 13, color: "var(--z-muted)" }}>No contract PDF on file. Upload a signed contract to the teacher&apos;s record to store it here.</p>
        </div>
      )}
    </div>
  );
}

function TeacherEditForm({ teacher, allLocations, assignedLocationIds, onSaved }: {
  teacher: TeacherRaw; allLocations: Location[]; assignedLocationIds: string[]; onSaved: () => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [firstName, setFirstName] = React.useState(teacher.first_name ?? "");
  const [lastName, setLastName] = React.useState(teacher.last_name ?? "");
  const [displayName, setDisplayName] = React.useState(teacher.display_name ?? teacher.name ?? "");
  const [email, setEmail] = React.useState(teacher.email ?? "");
  const [phone, setPhone] = React.useState(teacher.phone ?? "");
  const [status, setStatus] = React.useState(teacher.status ?? "active");
  const [teacherRole, setTeacherRole] = React.useState(teacher.teacher_role ?? "");
  const [hireDate, setHireDate] = React.useState(teacher.hire_date ?? "");
  const [ratePerBlock, setRatePerBlock] = React.useState(teacher.rate_per_block != null ? String(teacher.rate_per_block) : "");
  const [isSubAvailable, setIsSubAvailable] = React.useState(teacher.is_sub_available ?? teacher.sub_available ?? false);
  const [bio, setBio] = React.useState(teacher.bio ?? "");
  const [photoUrl, setPhotoUrl] = React.useState(teacher.photo_url ?? "");
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [personality, setPersonality] = React.useState(teacher.personality ?? "");
  const [customerFacingSummary, setCustomerFacingSummary] = React.useState(teacher.customer_facing_match_summary ?? "");
  const [bestMatchStudents, setBestMatchStudents] = React.useState(teacher.best_match_students ?? "");
  const [lessonStyle, setLessonStyle] = React.useState(teacher.lesson_style ?? "");
  const [teachingStrengths, setTeachingStrengths] = React.useState(teacher.teaching_strengths ?? "");
  const [musicalBackground, setMusicalBackground] = React.useState(teacher.musical_strengths_background ?? "");
  const [directorNotes, setDirectorNotes] = React.useState(teacher.director_notes ?? "");
  const [instrumentsStr, setInstrumentsStr] = React.useState((teacher.instruments ?? []).join(", "));
  const [primaryInstruments, setPrimaryInstruments] = React.useState(teacher.primary_instruments ?? "");
  const [selectedLocations, setSelectedLocations] = React.useState<string[]>(assignedLocationIds);

  function toggleLocation(locId: string) {
    setSelectedLocations(prev => prev.includes(locId) ? prev.filter(l => l !== locId) : [...prev, locId]);
  }

  async function handleAvatarUpload(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/crm/teachers/${teacher.id}/avatar`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string; error?: string };
        throw new Error(body.message ?? body.error ?? `Upload failed (${res.status})`);
      }
      const json = await res.json() as { data: { photo_url: string } };
      setPhotoUrl(json.data.photo_url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true); setSaveStatus("idle"); setSaveError(null);
    try {
      const patch = {
        first_name: firstName || null, last_name: lastName || null,
        display_name: displayName || null,
        email: email || null, phone: phone || null, status: status || null,
        teacher_role: teacherRole || null, hire_date: hireDate || null,
        rate_per_block: ratePerBlock ? parseFloat(ratePerBlock) : undefined,
        needs_1099: true, // always 1099 contractor
        is_sub_available: isSubAvailable, sub_available: isSubAvailable,
        bio: bio || null, lesson_style: lessonStyle || null,
        teaching_strengths: teachingStrengths || null,
        musical_strengths_background: musicalBackground || null,
        director_notes: directorNotes || null,
        instruments: instrumentsStr ? instrumentsStr.split(",").map(s => s.trim()).filter(Boolean) : [],
        primary_instruments: primaryInstruments || null,
        photo_url: photoUrl || null,
        personality: personality || null,
        customer_facing_match_summary: customerFacingSummary || null,
        best_match_students: bestMatchStudents || null,
      };
      const res = await fetch(`/api/crm/teachers/${teacher.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-tenant-id": teacher.tenant_id },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string; error?: string };
        throw new Error(body.message ?? body.error ?? `HTTP ${res.status}`);
      }
      const toAdd = selectedLocations.filter(locId => !assignedLocationIds.includes(locId));
      const toRemove = assignedLocationIds.filter(locId => !selectedLocations.includes(locId));
      await Promise.all([
        ...toAdd.map(locationId => fetch(`/api/crm/teachers/${teacher.id}/locations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location_id: locationId }) }).catch(() => null)),
        ...toRemove.map(locationId => fetch(`/api/crm/teachers/${teacher.id}/locations/${locationId}`, { method: "DELETE" }).catch(() => null)),
      ]);
      setSaveStatus("success");
      setTimeout(() => { setSaveStatus("idle"); onSaved(); }, 1500);
    } catch (err) {
      setSaveStatus("error"); setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <div className={sectionCls}>
        <div className="text-xs font-bold uppercase tracking-widest text-[#303035]">Basic Info</div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>First Name</label><input className={inputCls} value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
          <div><label className={labelCls}>Last Name</label><input className={inputCls} value={lastName} onChange={e => setLastName(e.target.value)} /></div>
        </div>
        <div><label className={labelCls}>Display Name</label><input className={inputCls} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="How name appears in app" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Email</label><input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div><label className={labelCls}>Phone</label><input className={inputCls} type="tel" value={phone} onChange={e => setPhone(e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={status} onChange={e => setStatus(e.target.value)}>
              <option value="active">Active</option><option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option><option value="terminated">Terminated</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Role</label>
            <select className={inputCls} value={teacherRole} onChange={e => setTeacherRole(e.target.value)}>
              <option value="">— Select Role —</option>
              <option value="admin">Admin</option>
              <option value="company director">Company Director</option>
              <option value="studio director">Studio Director</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>
        </div>
        <div><label className={labelCls}>Hire Date</label><input className={inputCls} type="date" value={hireDate} onChange={e => setHireDate(e.target.value)} /></div>
      </div>
      <div className={sectionCls}>
        <div className="text-xs font-bold uppercase tracking-widest text-[var(--z-muted)]">Compensation</div>
        <div>
          <label className={labelCls}>Rate / Block ($)</label>
          <input className={inputCls} type="number" min="0" step="0.01" value={ratePerBlock} onChange={e => setRatePerBlock(e.target.value)} placeholder="0.00" />
        </div>
        <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2,#0a0a0c)] px-3 py-2.5 text-xs text-[var(--z-muted)]">
          All teachers are <span className="font-semibold text-[#00ff88]">1099 independent contractors</span>. Capacity is auto-calculated from their weekly availability schedule.
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isSubAvailable} onChange={e => setIsSubAvailable(e.target.checked)} className="h-4 w-4 accent-[#00ff88]" />
          <span className="text-sm text-white">Available for sub coverage</span>
        </label>
      </div>
      {allLocations.length > 0 && (
        <div className={sectionCls}>
          <div className="text-xs font-bold uppercase tracking-widest text-[var(--z-muted)]">Locations</div>
          <div className="flex flex-wrap gap-2">
            {allLocations.map(loc => (
              <button key={loc.id} type="button" onClick={() => toggleLocation(loc.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${selectedLocations.includes(loc.id) ? "bg-[#00ff88] text-black" : "border border-[var(--z-border)] bg-[var(--z-surface-2,#0a0a0c)] text-[var(--z-muted)] hover:border-[#00ff88]/30"}`}>
                {loc.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className={sectionCls}>
        <div className="text-xs font-bold uppercase tracking-widest text-[#303035]">Instruments</div>
        <div><label className={labelCls}>Instruments (comma separated)</label><input className={inputCls} value={instrumentsStr} onChange={e => setInstrumentsStr(e.target.value)} placeholder="Guitar, Piano, Drums…" /></div>
        <div><label className={labelCls}>Primary Instruments</label><input className={inputCls} value={primaryInstruments} onChange={e => setPrimaryInstruments(e.target.value)} placeholder="Guitar" /></div>
      </div>
      <div className={sectionCls}>
        <div className="text-xs font-bold uppercase tracking-widest text-[var(--z-muted)]">Meet Your Teacher — Family-Facing Profile</div>
        <p className="text-[10px] text-[var(--z-muted)] leading-relaxed">This section is shown to families on their profile page. Write it like you&apos;re introducing the teacher to a new parent — warm, personal, confidence-building.</p>
        <div>
          <label className={labelCls}>Profile Photo</label>
          {/* Avatar upload zone */}
          <div
            className="relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[var(--z-border)] bg-[var(--z-surface-2,#0a0a0c)] p-5 transition-colors hover:border-[#00ff88]/40 cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) handleAvatarUpload(file);
            }}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/jpeg,image/png,image/webp,image/gif";
              input.onchange = (ev) => {
                const f = (ev.target as HTMLInputElement).files?.[0];
                if (f) handleAvatarUpload(f);
              };
              input.click();
            }}
          >
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="Teacher avatar" className="h-24 w-24 rounded-full object-cover border-2 border-[#00ff88]/40" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--z-surface)] border-2 border-[var(--z-border)]">
                <svg className="h-10 w-10 text-[var(--z-border-2,#2a2a2e)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
            )}
            {uploading ? (
              <div className="text-xs text-[#00ff88] animate-pulse">Uploading…</div>
            ) : (
              <div className="text-center">
                <div className="text-xs font-semibold text-[var(--z-muted)]">Drag & drop or click to upload</div>
                <div className="text-[10px] text-[var(--z-border-2,#2a2a2e)] mt-0.5">JPG, PNG, WebP, GIF · Max 5MB</div>
              </div>
            )}
          </div>
          {uploadError && <p className="mt-1 text-xs text-red-400">{uploadError}</p>}
          {/* Keep URL field as fallback for existing URLs */}
          <input className={inputCls + " mt-2"} value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder="Or paste a direct image URL…" />
        </div>
        <div><label className={labelCls}>Bio (visible to families)</label><textarea className={inputCls} rows={4} value={bio} onChange={e => setBio(e.target.value)} placeholder="e.g. Meet Alex — a customer favorite and rising guitar pro! Alex has quickly become one of our most-requested teachers. His sharp ear, patient approach, and genuine love for music make every lesson an adventure…" /></div>
        <div><label className={labelCls}>Customer-Facing Summary</label><textarea className={inputCls} rows={2} value={customerFacingSummary} onChange={e => setCustomerFacingSummary(e.target.value)} placeholder="One-liner shown on the family profile card…" /></div>
        <div><label className={labelCls}>Best Match Students</label><input className={inputCls} value={bestMatchStudents} onChange={e => setBestMatchStudents(e.target.value)} placeholder="Beginners, kids 8-14, adults returning to music…" /></div>
        <div><label className={labelCls}>Personality Tags (comma separated)</label><input className={inputCls} value={personality} onChange={e => setPersonality(e.target.value)} placeholder="Patient, Energetic, Detail-oriented, Fun…" /></div>
        <div><label className={labelCls}>Lesson Style</label><input className={inputCls} value={lessonStyle} onChange={e => setLessonStyle(e.target.value)} placeholder="Structured, exploratory, etc." /></div>
        <div><label className={labelCls}>Teaching Strengths</label><textarea className={inputCls} rows={2} value={teachingStrengths} onChange={e => setTeachingStrengths(e.target.value)} /></div>
        <div><label className={labelCls}>Musical Background</label><textarea className={inputCls} rows={2} value={musicalBackground} onChange={e => setMusicalBackground(e.target.value)} /></div>
      </div>
      <div className={sectionCls}>
        <div className="text-xs font-bold uppercase tracking-widest text-[var(--z-muted)]">Director Notes</div>
        <textarea className={inputCls} rows={3} value={directorNotes} onChange={e => setDirectorNotes(e.target.value)} placeholder="Internal notes for directors only…" />
      </div>
      {saveStatus === "success" && <p className="text-sm text-green-500">Teacher profile saved successfully.</p>}
      {saveStatus === "error" && saveError && <p className="text-sm text-red-400">Error: {saveError}</p>}
      <button onClick={handleSave} disabled={saving} className="w-full rounded-xl bg-[#00ff88] py-3 text-sm font-bold text-black disabled:opacity-50">
        {saving ? "Saving…" : "Save Profile"}
      </button>
    </div>
  );
}

function W9Module({ teacher }: { teacher: TeacherRaw }) {
  const [saving, setSaving] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [existingW9, setExistingW9] = React.useState<W9Record | null>(null);
  const [loadingW9, setLoadingW9] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [legalName, setLegalName] = React.useState("");
  const [businessName, setBusinessName] = React.useState("");
  const [taxClassification, setTaxClassification] = React.useState("individual");
  const [taxClassificationOther, setTaxClassificationOther] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [city, setCity] = React.useState("");
  const [state, setState] = React.useState("");
  const [zip, setZip] = React.useState("");
  const [tinType, setTinType] = React.useState("ssn");
  const [tin, setTin] = React.useState("");
  const [signatureName, setSignatureName] = React.useState("");
  const [agreed, setAgreed] = React.useState(false);
  const w9Complete = teacher.w9_status === "complete" || teacher.w9_status === "signed";

  React.useEffect(() => {
    setLoadingW9(true);
    fetch(`/api/crm/teachers/${teacher.id}/w9`)
      .then(r => r.json())
      .then(res => {
        if (res.data) {
          setExistingW9(res.data as W9Record);
          // Pre-fill form fields from existing record
          setLegalName(res.data.legal_name ?? "");
          setBusinessName(res.data.business_name ?? "");
          setTaxClassification(res.data.tax_classification ?? "individual");
          setTaxClassificationOther(res.data.tax_classification_other ?? "");
          setAddress(res.data.address ?? "");
          setCity(res.data.city ?? "");
          setState(res.data.state ?? "");
          setZip(res.data.zip ?? "");
          setTinType(res.data.tin_type ?? "ssn");
          setSignatureName(res.data.signature_name ?? "");
        } else {
          // No existing W9 — show the form immediately
          setShowForm(true);
        }
      })
      .catch(() => { setShowForm(true); })
      .finally(() => setLoadingW9(false));
  }, [teacher.id]);

  async function handleSubmit() {
    if (!agreed) { setSaveError("You must certify the information is correct."); return; }
    if (!legalName || !address || !city || !state || !zip || !tin || !signatureName) {
      setSaveError("Please fill in all required fields."); return;
    }
    setSaving(true); setSaveStatus("idle"); setSaveError(null);
    try {
      const res = await fetch(`/api/crm/teachers/${teacher.id}/w9`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ legal_name: legalName, business_name: businessName || null, tax_classification: taxClassification, tax_classification_other: taxClassificationOther || null, address, city, state, zip, tin_type: tinType, tin, signature_name: signatureName, signed_at: new Date().toISOString() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string; error?: string };
        throw new Error(body.message ?? body.error ?? `HTTP ${res.status}`);
      }
      const result = await res.json() as { data?: W9Record };
      if (result.data) {
        setExistingW9(result.data);
        // Refresh form fields from saved data
        setLegalName(result.data.legal_name ?? "");
        setBusinessName(result.data.business_name ?? "");
        setTaxClassification(result.data.tax_classification ?? "individual");
        setAddress(result.data.address ?? "");
        setCity(result.data.city ?? "");
        setState(result.data.state ?? "");
        setZip(result.data.zip ?? "");
        setTinType(result.data.tin_type ?? "ssn");
        setSignatureName(result.data.signature_name ?? "");
        setTin(""); // clear TIN field after save
      }
      setSaveStatus("success");
      setTimeout(() => { setSaveStatus("idle"); setShowForm(false); setAgreed(false); }, 2000);
    } catch (err) {
      setSaveStatus("error"); setSaveError(err instanceof Error ? err.message : "Submission failed");
    } finally { setSaving(false); }
  }

  const taxClassificationLabel: Record<string, string> = {
    individual: "Individual / Sole Proprietor", c_corp: "C Corporation", s_corp: "S Corporation",
    partnership: "Partnership", trust: "Trust / Estate", llc: "LLC", other: "Other",
  };

  if (loadingW9) {
    return <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-white/5" />)}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div className={`rounded-xl border p-4 ${w9Complete ? "border-[#00ff88]/30 bg-[#00ff88]/5" : "border-amber-500/30 bg-amber-500/5"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${w9Complete ? "bg-[#00ff88]" : "bg-amber-400"}`} />
            <span className="text-sm font-semibold text-white">W9 Status: <span className={w9Complete ? "text-[#00ff88]" : "text-amber-400"}>{teacher.w9_status ?? "Not submitted"}</span></span>
          </div>
          {existingW9 && !showForm && (
            <button onClick={() => setShowForm(true)} className="text-xs text-[#505055] hover:text-white underline">Update W9</button>
          )}
        </div>
        {teacher.w9_completed_at && <div className="mt-1 text-xs text-[#505055]">Completed: {new Date(teacher.w9_completed_at).toLocaleDateString()}</div>}
        {existingW9?.pdf_url && <a href={existingW9.pdf_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-[#00ff88] underline">View W9 PDF →</a>}
      </div>

      {/* Existing W9 summary (read-only) */}
      {existingW9 && !showForm && (
        <div style={{ borderRadius: 12, border: "1px solid var(--z-border)", borderLeft: "3px solid #00ff88", background: "var(--z-surface, #101012)", overflow: "hidden" }}>
          <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--z-border)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--z-muted)" }}>W-9 on File</div>
          {[
            { label: "Legal Name", value: existingW9.legal_name },
            { label: "Business Name", value: existingW9.business_name },
            { label: "Tax Classification", value: taxClassificationLabel[existingW9.tax_classification] ?? existingW9.tax_classification },
            { label: "Address", value: `${existingW9.address}, ${existingW9.city}, ${existingW9.state} ${existingW9.zip}` },
            { label: "TIN Type", value: existingW9.tin_type === "ssn" ? "SSN" : "EIN" },
            { label: "TIN", value: `****${existingW9.tin_last_four}` },
            { label: "Signed By", value: existingW9.signature_name },
            { label: "Signed At", value: new Date(existingW9.signed_at).toLocaleDateString() },
          ].filter(r => r.value).map(({ label, value }, i, arr) => (
            <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: i < arr.length - 1 ? "1px solid var(--z-border)" : "none" }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--z-muted)" }}>{label}</span>
              <span style={{ fontSize: 13, color: "var(--z-fg)" }}>{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* W9 form — shown when no existing W9 or user clicks Update */}
      {showForm && (
        <>
          <div className={sectionCls}>
            <div className="text-xs font-bold uppercase tracking-widest text-[#303035]">W-9 — Request for Taxpayer Identification</div>
            <p className="text-xs text-[#505055]">All fields are required. Your TIN is encrypted and never shown in plain text.</p>
            <div><label className={labelCls}>Legal Name *</label><input className={inputCls} value={legalName} onChange={e => setLegalName(e.target.value)} placeholder="Full legal name as shown on tax return" /></div>
            <div><label className={labelCls}>Business Name (if different)</label><input className={inputCls} value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="DBA or business name" /></div>
            <div>
              <label className={labelCls}>Federal Tax Classification *</label>
              <select className={inputCls} value={taxClassification} onChange={e => setTaxClassification(e.target.value)}>
                <option value="individual">Individual / Sole Proprietor</option>
                <option value="c_corp">C Corporation</option><option value="s_corp">S Corporation</option>
                <option value="partnership">Partnership</option><option value="trust">Trust / Estate</option>
                <option value="llc">LLC</option><option value="other">Other</option>
              </select>
            </div>
            {taxClassification === "other" && <div><label className={labelCls}>Specify</label><input className={inputCls} value={taxClassificationOther} onChange={e => setTaxClassificationOther(e.target.value)} /></div>}
          </div>
          <div className={sectionCls}>
            <div className="text-xs font-bold uppercase tracking-widest text-[#303035]">Address</div>
            <div><label className={labelCls}>Street Address *</label><input className={inputCls} value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1"><label className={labelCls}>City *</label><input className={inputCls} value={city} onChange={e => setCity(e.target.value)} /></div>
              <div><label className={labelCls}>State *</label><input className={inputCls} value={state} onChange={e => setState(e.target.value)} placeholder="NE" maxLength={2} /></div>
              <div><label className={labelCls}>ZIP *</label><input className={inputCls} value={zip} onChange={e => setZip(e.target.value)} placeholder="68101" /></div>
            </div>
          </div>
          <div className={sectionCls}>
            <div className="text-xs font-bold uppercase tracking-widest text-[#303035]">Taxpayer Identification Number</div>
            <div>
              <label className={labelCls}>TIN Type *</label>
              <select className={inputCls} value={tinType} onChange={e => setTinType(e.target.value)}>
                <option value="ssn">Social Security Number (SSN)</option>
                <option value="ein">Employer Identification Number (EIN)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>{tinType === "ssn" ? "SSN" : "EIN"} *</label>
              <input className={inputCls} type="password" value={tin} onChange={e => setTin(e.target.value)} placeholder={tinType === "ssn" ? "XXX-XX-XXXX" : "XX-XXXXXXX"} autoComplete="off" />
              <p className="mt-1 text-xs text-[var(--z-muted)]">Encrypted and stored securely. Never displayed in plain text.</p>
            </div>
          </div>
          <div className={sectionCls}>
            <div className="text-xs font-bold uppercase tracking-widest text-[var(--z-muted)]">Certification & Signature</div>
            <p className="text-xs text-[var(--z-muted)]">Under penalties of perjury, I certify that the TIN shown is my correct taxpayer identification number, I am not subject to backup withholding, and I am a U.S. citizen or other U.S. person.</p>
            <div><label className={labelCls}>Signature (type full legal name) *</label><input className={inputCls} value={signatureName} onChange={e => setSignatureName(e.target.value)} placeholder="Type your full legal name to sign" /></div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#00ff88]" />
              <span className="text-xs text-[var(--z-muted)]">I certify under penalties of perjury that the information provided is true, correct, and complete.</span>
            </label>
          </div>
          {saveStatus === "success" && <p className="text-sm text-green-500">W9 submitted successfully.</p>}
          {saveStatus === "error" && saveError && <p className="text-sm text-red-400">Error: {saveError}</p>}
          <div className="flex gap-3">
            {existingW9 && (
              <button onClick={() => { setShowForm(false); setSaveStatus("idle"); setSaveError(null); }} className="flex-1 rounded-xl border border-[var(--z-border)] py-3 text-sm font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)]">
                Cancel
              </button>
            )}
            <button onClick={handleSubmit} disabled={saving || !agreed} className="flex-1 rounded-xl bg-[#00ff88] py-3 text-sm font-bold text-black disabled:opacity-50">
              {saving ? "Submitting…" : existingW9 ? "Update W9" : "Submit W9"}
            </button>
          </div>
        </>
      )}

      {/* No W9 yet and form not shown — shouldn't happen but fallback */}
      {!existingW9 && !showForm && (
        <button onClick={() => setShowForm(true)} className="w-full rounded-xl bg-[#00ff88] py-3 text-sm font-bold text-black">
          Complete W9
        </button>
      )}
    </div>
  );
}

function TeacherStudentsTab({ teacherId }: { teacherId: string }) {
  // Day-of-week label map (0=Sunday … 6=Saturday)
  const DOW_LABELS = ["Sundays","Mondays","Tuesdays","Wednesdays","Thursdays","Fridays","Saturdays"];
  type StudentRow = {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    display_name?: string | null;
    instrument?: string | null;
    student_status?: string | null;
    day_of_week?: number | null;
    start_time?: string | null;
    location_id?: string | null;
  };
  const [students, setStudents] = React.useState<StudentRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    // Pull from schedules SSOT via dedicated teacher/students route
    fetch(`/api/crm/teachers/${teacherId}/students`).then(r => r.json())
      .then(res => {
        const raw: StudentRow[] = Array.isArray(res.data) ? res.data : [];
        setStudents(raw);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [teacherId]);
  if (loading) return <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-white/5" />)}</div>;
  if (students.length === 0) return <div className="text-sm text-[var(--z-muted)]">No active students currently assigned to this teacher.</div>;
  return (
    <div className="space-y-2">
      <div className="text-xs text-[var(--z-muted)] mb-2">{students.length} active student{students.length !== 1 ? "s" : ""}</div>
      {students.map(s => {
        const displayName = s.display_name ?? [s.first_name, s.last_name].filter(Boolean).join(" ") ?? "—";
        const isActive = s.student_status?.toLowerCase() === "active" || s.student_status?.toLowerCase() === "enrolled";
        // day_of_week from schedules (0=Sun…6=Sat)
        const dayLabel = typeof s.day_of_week === "number" ? DOW_LABELS[s.day_of_week] : null;
        return (
          <Link
            key={s.id}
            href={`/crm/students/${s.id}`}
            className={`block transition-colors hover:bg-[var(--z-surface-2)] ${premiumCardCls}`}
            style={premiumCardStyle}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-[var(--z-fg)]">{displayName}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  {s.instrument && <span className="text-xs text-[var(--z-muted)]">{s.instrument}</span>}
                  {s.instrument && dayLabel && <span className="text-xs text-[var(--z-muted)]">·</span>}
                  {dayLabel && <span className="text-xs text-[var(--z-muted)]">{dayLabel}</span>}
                </div>
              </div>
              {s.student_status && (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  isActive ? "bg-[#00ff88]/10 text-[#00ff88]" : "bg-white/5 text-[var(--z-muted)]"
                }`}>{s.student_status}</span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Availability Tab ────────────────────────────────────────────────────────
const DAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"] as const;
type DayKey = typeof DAYS[number];
const DAY_LABELS: Record<DayKey, string> = { monday:"Monday", tuesday:"Tuesday", wednesday:"Wednesday", thursday:"Thursday", friday:"Friday", saturday:"Saturday", sunday:"Sunday" };

// Studio operating constraints — hardcoded, never editable via UI
// Friday: closed globally at all locations
// Sunday: closed at Gretna and Elkhorn only
const FRIDAY_LOCKED = true;
const SUNDAY_LOCKED_LOCATION_IDS = [
  "40c67ffc-91b5-46a9-94bd-6ddffdfb7638", // Gretna Music Lessons
  "cebd97d4-c241-4de2-8ade-49e5cc0070d5", // Elkhorn Music Lessons
];

function isDayLocked(day: DayKey, locationId: string): boolean {
  if (day === "friday" && FRIDAY_LOCKED) return true;
  if (day === "sunday" && SUNDAY_LOCKED_LOCATION_IDS.includes(locationId)) return true;
  return false;
}

// Ghost location ID from Square API sync — never render this
const GHOST_LOCATION_ID = "3a7a997c-7c93-44ef-aec5-a6d706967e5b";

type GlobalLocation = { id: string; name: string; color?: string | null };
type LocAssignment = {
  location_id: string;
  is_regular: boolean;
  can_sub: boolean;
  location: GlobalLocation | null;
};
type TimeBlock = { start_time: string; end_time: string };
type DaySlots = Record<DayKey, TimeBlock[]>;
type LocSchedule = Record<string, DaySlots>; // keyed by location_id
// Master toggle state: true = schedule editor open, false = dormant/grayed
type MasterToggles = Record<string, boolean>;

function emptyDaySlots(): DaySlots {
  return { monday:[], tuesday:[], wednesday:[], thursday:[], friday:[], saturday:[], sunday:[] };
}

// Premium toggle switch — smooth, no native browser chrome
function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        width: 44,
        height: 24,
        borderRadius: 12,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        background: checked
          ? "linear-gradient(135deg, #00ff88, #00cc6e)"
          : "var(--z-border-2, #2a2a2e)",
        boxShadow: checked ? "0 0 12px rgba(0,255,136,0.35)" : "none",
        transition: "background 0.2s ease, box-shadow 0.2s ease",
        flexShrink: 0,
        outline: "none",
        padding: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: checked ? "#001a0a" : "#909098",
          boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
          transition: "left 0.2s ease, background 0.2s ease",
        }}
      />
    </button>
  );
}

function AvailabilityTab({ teacherId }: { teacherId: string }) {
  // allLocations = global company locations (always 4, ghost filtered)
  const [allLocations, setAllLocations] = React.useState<GlobalLocation[]>([]);
  // assignmentMap = teacher's actual teacher_locations rows, keyed by location_id
  const [assignmentMap, setAssignmentMap] = React.useState<Record<string, LocAssignment>>({});
  const [schedule, setSchedule] = React.useState<LocSchedule>({});
  const [masterToggles, setMasterToggles] = React.useState<MasterToggles>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<"idle"|"success"|"error">("idle");
  const [saveError, setSaveError] = React.useState<string|null>(null);
  const [patchingLoc, setPatchingLoc] = React.useState<string|null>(null);

  React.useEffect(() => {
    setLoading(true);
    Promise.all([
      // Step 1: global company locations (source of truth for rendering)
      fetch(`/api/locations?tenantId=00000000-0000-0000-0000-000000000001`).then(r => r.json()).catch(() => ({ data: [] })),
      // Step 2: teacher's specific assignments
      fetch(`/api/crm/teachers/${teacherId}/locations`).then(r => r.json()).catch(() => ({ data: [] })),
      // Step 3: existing availability slots
      fetch(`/api/crm/teachers/${teacherId}/availability`).then(r => r.json()).catch(() => ({ data: { slots: [] } })),
    ]).then(([globalRes, assignedRes, availRes]) => {
      // Filter ghost and build global location list
      const globals: GlobalLocation[] = (Array.isArray(globalRes.data) ? globalRes.data : [])
        .filter((l: GlobalLocation) => l.id !== GHOST_LOCATION_ID);
      setAllLocations(globals);

      // Build assignment map keyed by location_id
      const assigned: LocAssignment[] = Array.isArray(assignedRes.data) ? assignedRes.data : [];
      const aMap: Record<string, LocAssignment> = {};
      for (const a of assigned) { aMap[a.location_id] = a; }
      setAssignmentMap(aMap);

      // Build schedule map — seed all global locations
      // The GET response shape: { data: { teacherId, tenantId, slots: TeacherAvailability[] } }
      // TeacherAvailability has no locationId field — locationId is piggybacked in the `notes` field
      type RawSlot = { dayOfWeek: string|number; startTime: string; endTime: string; locationId?: string|null; notes?: string|null };
      const rawSlots: RawSlot[] =
        Array.isArray(availRes.data?.slots) ? (availRes.data.slots as RawSlot[]) :
        Array.isArray(availRes.data) ? (availRes.data as RawSlot[]) : [];
      const sched: LocSchedule = {};
      for (const loc of globals) { sched[loc.id] = emptyDaySlots(); }
      for (const slot of rawSlots) {
        // locationId may come as slot.locationId (POST response) or slot.notes (GET response via rowTo piggybacking)
        const locId = slot.locationId ?? slot.notes ?? "";
        const dayRaw = String(slot.dayOfWeek);
        const dayStr: DayKey | undefined = DAYS.includes(dayRaw as DayKey)
          ? (dayRaw as DayKey)
          : (["sunday","monday","tuesday","wednesday","thursday","friday","saturday"] as DayKey[])[Number(dayRaw)];
        if (!dayStr || !locId) continue;
        if (!sched[locId]) sched[locId] = emptyDaySlots();
        sched[locId][dayStr].push({ start_time: slot.startTime?.slice(0,5) ?? "", end_time: slot.endTime?.slice(0,5) ?? "" });
      }
      setSchedule(sched);

      // Master toggle: ON if teacher has saved availability data for that location (with or without assignment row)
      const toggles: MasterToggles = {};
      for (const loc of globals) {
        const a = aMap[loc.id];
        // Check both locationId and notes fields since GET uses notes to carry locationId
        const hasData = rawSlots.some(s => (s.locationId ?? s.notes) === loc.id);
        toggles[loc.id] = !!(hasData || (a && (a.is_regular || a.can_sub)));
      }
      setMasterToggles(toggles);
    }).finally(() => setLoading(false));
  }, [teacherId]);

  async function patchLocToggle(locationId: string, field: "is_regular"|"can_sub", value: boolean) {
    setPatchingLoc(locationId);
    try {
      // If teacher not yet assigned to this location, POST first
      if (!assignmentMap[locationId]) {
        const postRes = await fetch(`/api/crm/teachers/${teacherId}/locations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ location_id: locationId, [field]: value }),
        });
        if (postRes.ok) {
          const body = await postRes.json() as { data?: LocAssignment };
          if (body.data) {
            setAssignmentMap(prev => ({ ...prev, [locationId]: body.data! }));
          }
        }
      } else {
        await fetch(`/api/crm/teachers/${teacherId}/locations`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ location_id: locationId, [field]: value }),
        });
        setAssignmentMap(prev => ({
          ...prev,
          [locationId]: { ...prev[locationId], [field]: value },
        }));
      }
      if (value && !schedule[locationId]) {
        setSchedule(prev => ({ ...prev, [locationId]: emptyDaySlots() }));
      }
    } finally { setPatchingLoc(null); }
  }

  async function toggleMaster(locId: string, value: boolean) {
    setMasterToggles(prev => ({ ...prev, [locId]: value }));
    if (value && !schedule[locId]) {
      setSchedule(prev => ({ ...prev, [locId]: emptyDaySlots() }));
    }
    // If toggling ON a location the teacher isn't assigned to yet, create the assignment
    if (value && !assignmentMap[locId]) {
      setPatchingLoc(locId);
      try {
        const postRes = await fetch(`/api/crm/teachers/${teacherId}/locations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ location_id: locId, is_regular: false, can_sub: false }),
        });
        if (postRes.ok) {
          const body = await postRes.json() as { data?: LocAssignment };
          if (body.data) {
            setAssignmentMap(prev => ({ ...prev, [locId]: body.data! }));
          }
        }
      } finally { setPatchingLoc(null); }
    }
  }

  function toggleDay(locId: string, day: DayKey, checked: boolean) {
    setSchedule(prev => ({
      ...prev,
      [locId]: {
        ...prev[locId],
        [day]: checked ? [{ start_time: "15:00", end_time: "21:00" }] : [],
      },
    }));
  }

  function addBlock(locId: string, day: DayKey) {
    setSchedule(prev => ({
      ...prev,
      [locId]: { ...prev[locId], [day]: [...(prev[locId]?.[day] ?? []), { start_time: "15:00", end_time: "21:00" }] },
    }));
  }

  function removeBlock(locId: string, day: DayKey, idx: number) {
    setSchedule(prev => ({
      ...prev,
      [locId]: { ...prev[locId], [day]: prev[locId][day].filter((_,i) => i !== idx) },
    }));
  }

  function updateBlock(locId: string, day: DayKey, idx: number, field: "start_time"|"end_time", val: string) {
    setSchedule(prev => {
      const blocks = [...(prev[locId]?.[day] ?? [])];
      blocks[idx] = { ...blocks[idx], [field]: val };
      return { ...prev, [locId]: { ...prev[locId], [day]: blocks } };
    });
  }

  async function handleSave() {
    setSaving(true); setSaveStatus("idle"); setSaveError(null);
    try {
      const slots: Array<{ dayOfWeek: string; startTime: string; endTime: string; locationId: string }> = [];
      for (const [locId, dayMap] of Object.entries(schedule)) {
        // Only save slots for locations with master toggle ON
        if (!masterToggles[locId]) continue;
        for (const day of DAYS) {
          // Never persist locked days
          if (isDayLocked(day, locId)) continue;
          for (const block of (dayMap[day] ?? [])) {
            if (block.start_time && block.end_time) {
              slots.push({ dayOfWeek: day, startTime: block.start_time, endTime: block.end_time, locationId: locId });
            }
          }
        }
      }
      const res = await fetch(`/api/crm/teachers/${teacherId}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string; error?: string };
        throw new Error(body.message ?? body.error ?? `HTTP ${res.status}`);
      }
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (err) {
      setSaveStatus("error"); setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally { setSaving(false); }
  }

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3,4].map(i => (
        <div key={i} style={{
          height: 56, borderRadius: 12,
          background: "linear-gradient(90deg, var(--z-surface) 25%, rgba(255,255,255,0.04) 50%, var(--z-surface) 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s infinite",
        }} />
      ))}
    </div>
  );
  if (allLocations.length === 0) return <div className="text-sm" style={{ color: "var(--z-muted)" }}>No company locations found.</div>;

  return (
    <div className="space-y-3">
      {/* Map over ALL global locations — assigned ones expanded, unassigned collapsed/dormant */}
      {allLocations.map(loc => {
        const assignment = assignmentMap[loc.id];
        const locName = loc.name;
        const locColor = loc.color ?? "#00ff88";
        const isPatching = patchingLoc === loc.id;
        const masterOn = masterToggles[loc.id] ?? false;
        const dayMap = schedule[loc.id] ?? emptyDaySlots();
        const isRegular = assignment?.is_regular ?? false;
        const canSub = assignment?.can_sub ?? false;
        // Short location label for dormant state
        const shortName = locName.replace(/music lessons?/i, "").trim();
        return (
          <div
            key={loc.id}
            style={{
              borderRadius: 12,
              border: masterOn ? `1px solid var(--z-border)` : `1px solid var(--z-border-2, #2a2a2e)`,
              borderLeft: `3px solid ${masterOn ? locColor : "var(--z-border-2, #2a2a2e)"}`,
              background: masterOn ? "var(--z-surface, #101012)" : "transparent",
              overflow: "hidden",
              opacity: masterOn ? 1 : 0.5,
              transition: "box-shadow 0.2s ease, opacity 0.25s ease, background 0.25s ease, border-color 0.25s ease",
              boxShadow: masterOn ? `0 4px 20px ${locColor}18` : "none",
            }}
          >
            {/* Card header: always visible */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderBottom: masterOn ? `1px solid var(--z-border)` : "none",
            }}>
              {/* Location dot */}
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: locColor, flexShrink: 0 }} />
              {/* Name + dormant badge */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--z-fg)" }}>{shortName}</span>
                {!masterOn && (
                  <span style={{
                    marginLeft: 8, fontSize: 10, fontWeight: 600, padding: "1px 7px",
                    borderRadius: 20, background: "var(--z-border)", color: "var(--z-muted)",
                    letterSpacing: "0.05em", textTransform: "uppercase",
                  }}>Dormant</span>
                )}
              </div>
              {/* is_regular / can_sub — only when active */}
              {masterOn && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginRight: 8 }}>
                  {/* Premium checkbox: Regular */}
                  <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: isPatching ? "not-allowed" : "pointer" }}>
                    <span
                      onClick={() => !isPatching && void patchLocToggle(loc.id, "is_regular", !isRegular)}
                      style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                        border: `1.5px solid ${isRegular ? "#00ff88" : "var(--z-border-2, #2a2a2e)"}`,
                        background: isRegular ? "#00ff88" : "transparent",
                        transition: "all 0.15s ease",
                        cursor: isPatching ? "not-allowed" : "pointer",
                      }}
                    >
                      {isRegular && <span style={{ fontSize: 10, color: "#001a0a", fontWeight: 900, lineHeight: 1 }}>✓</span>}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--z-muted)", fontWeight: 500 }}>Regular</span>
                  </label>
                  {/* Premium checkbox: Can Sub */}
                  <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: isPatching ? "not-allowed" : "pointer" }}>
                    <span
                      onClick={() => !isPatching && void patchLocToggle(loc.id, "can_sub", !canSub)}
                      style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                        border: `1.5px solid ${canSub ? "#00ff88" : "var(--z-border-2, #2a2a2e)"}`,
                        background: canSub ? "#00ff88" : "transparent",
                        transition: "all 0.15s ease",
                        cursor: isPatching ? "not-allowed" : "pointer",
                      }}
                    >
                      {canSub && <span style={{ fontSize: 10, color: "#001a0a", fontWeight: 900, lineHeight: 1 }}>✓</span>}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--z-muted)", fontWeight: 500 }}>Can Sub</span>
                  </label>
                </div>
              )}
              {/* Master toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {isPatching && <span style={{ fontSize: 10, color: "var(--z-muted)" }}>Saving…</span>}
                <ToggleSwitch checked={masterOn} onChange={v => void toggleMaster(loc.id, v)} disabled={isPatching} />
              </div>
            </div>

            {/* Schedule matrix — only rendered when master toggle is ON (collapsed when dormant) */}
            {masterOn && (
              <div>
                {DAYS.map((day, dayIdx) => {
                  const locked = isDayLocked(day, loc.id);
                  const blocks = dayMap[day] ?? [];
                  const dayOn = blocks.length > 0;
                  const isLast = dayIdx === DAYS.length - 1;
                  return (
                    <div
                      key={day}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 16,
                        padding: "10px 16px",
                        borderBottom: isLast ? "none" : `1px solid var(--z-border)`,
                        opacity: locked ? 0.35 : 1,
                      }}
                    >
                      {/* Premium day checkbox */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, width: 128, flexShrink: 0, paddingTop: 2 }}>
                        <span
                          onClick={() => !locked && toggleDay(loc.id, day, !dayOn)}
                          style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                            border: `1.5px solid ${dayOn && !locked ? "#00ff88" : "var(--z-border-2, #2a2a2e)"}`,
                            background: dayOn && !locked ? "#00ff88" : "transparent",
                            transition: "all 0.15s ease",
                            cursor: locked ? "not-allowed" : "pointer",
                          }}
                        >
                          {dayOn && !locked && <span style={{ fontSize: 10, color: "#001a0a", fontWeight: 900, lineHeight: 1 }}>✓</span>}
                        </span>
                        <span style={{
                          fontSize: 13, fontWeight: 500,
                          color: locked ? "var(--z-border)" : dayOn ? "var(--z-fg)" : "var(--z-muted)",
                        }}>{DAY_LABELS[day]}</span>
                        {locked && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: "var(--z-border)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Closed</span>
                        )}
                      </div>

                      {/* Time blocks or Closed label */}
                      <div style={{ flex: 1 }}>
                        {!dayOn && !locked && (
                          <span style={{ fontSize: 12, color: "var(--z-border)", fontStyle: "italic" }}>Closed</span>
                        )}
                        {dayOn && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {blocks.map((block, idx) => (
                              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <input
                                  type="time"
                                  value={block.start_time}
                                  onChange={e => updateBlock(loc.id, day, idx, "start_time", e.target.value)}
                                  style={{
                                    borderRadius: 8, border: "1px solid var(--z-border)",
                                    background: "var(--z-surface-2, #0a0a0c)",
                                    padding: "5px 10px", fontSize: 12,
                                    color: "var(--z-fg)", outline: "none",
                                  }}
                                />
                                <span style={{ fontSize: 11, color: "var(--z-muted)" }}>to</span>
                                <input
                                  type="time"
                                  value={block.end_time}
                                  onChange={e => updateBlock(loc.id, day, idx, "end_time", e.target.value)}
                                  style={{
                                    borderRadius: 8, border: "1px solid var(--z-border)",
                                    background: "var(--z-surface-2, #0a0a0c)",
                                    padding: "5px 10px", fontSize: 12,
                                    color: "var(--z-fg)", outline: "none",
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeBlock(loc.id, day, idx)}
                                  style={{ fontSize: 12, color: "var(--z-muted)", background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}
                                  onMouseEnter={e => (e.currentTarget.style.color = "#ff3b6b")}
                                  onMouseLeave={e => (e.currentTarget.style.color = "var(--z-muted)")}
                                >✕</button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => addBlock(loc.id, day)}
                              style={{ fontSize: 11, color: "#00ff88", background: "none", border: "none", cursor: "pointer", fontWeight: 700, textAlign: "left", padding: 0, marginTop: 2 }}
                            >+ Add Hours</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Save button */}
      <>
        {saveStatus === "success" && <p className="text-sm text-[#00ff88]">Schedule saved.</p>}
        {saveStatus === "error" && saveError && <p className="text-sm text-red-400">Error: {saveError}</p>}
        <button onClick={() => void handleSave()} disabled={saving}
          className="w-full rounded-xl bg-[#00ff88] py-3 text-sm font-bold text-black disabled:opacity-50">
          {saving ? "Saving…" : "Save Schedule"}
        </button>
      </>
    </div>
  );
}

/** Profile tab: shows TeacherProfileView with an inline Edit toggle */
function ProfileTabWithEdit({
  teacher, allLocations, assignedLocationIds, activeAvailabilityLocationIds, capacitySlots, studentCount, onSaved,
}: {
  teacher: TeacherRaw;
  allLocations: Location[];
  assignedLocationIds: string[];
  activeAvailabilityLocationIds: string[];
  capacitySlots: number | null;
  studentCount: number | null;
  onSaved: () => void;
}) {
  const [editing, setEditing] = React.useState(false);
  // Header pills: strictly driven by teacher_availability SSOT.
  // Only show a location if it has at least one active availability row.
  // No fallback — if availability is empty, no pills render (prevents false positives).
  const headerLocations = allLocations.filter(l => activeAvailabilityLocationIds.includes(l.id));
  return (
    <div className="space-y-4">
      {/* Edit / Cancel toggle */}
      <div className="flex justify-end">
        <button
          onClick={() => setEditing(e => !e)}
          className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
            editing
              ? "border border-[var(--z-border)] text-[var(--z-muted)] hover:text-[var(--z-fg)]"
              : "bg-[#00ff88]/10 text-[#00ff88] hover:bg-[#00ff88]/20"
          }`}
        >
          {editing ? "Cancel" : "Edit Profile"}
        </button>
      </div>
      {editing ? (
        <TeacherEditForm
          teacher={teacher}
          allLocations={allLocations}
          assignedLocationIds={assignedLocationIds}
          onSaved={() => { setEditing(false); onSaved(); }}
        />
      ) : (
        <TeacherProfileView
          teacher={teacher}
          locations={headerLocations}
          capacitySlots={capacitySlots}
          studentCount={studentCount}
        />
      )}
    </div>
  );
}

export function TeacherDetailClient() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const [teacher, setTeacher] = React.useState<TeacherRaw | null>(null);
  const [allLocations, setAllLocations] = React.useState<Location[]>([]);
  const [assignedLocationIds, setAssignedLocationIds] = React.useState<string[]>([]);
  const [availabilitySlots, setAvailabilitySlots] = React.useState<AvailabilitySlot[]>([]);
  // Location IDs that have at least one active availability row (drives header pills)
  const [activeAvailabilityLocationIds, setActiveAvailabilityLocationIds] = React.useState<string[]>([]);
  const [studentCount, setStudentCount] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<Tab>("profile");

  async function load() {
    setLoading(true);
    try {
      const [teacherRes, locationsRes, assignedRes, availRes, studentsRes] = await Promise.all([
        fetch(`/api/crm/teachers/${id}`).then(r => r.json()),
        fetch(`/api/locations?tenantId=${DEFAULT_TENANT_ID}`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`/api/crm/teachers/${id}/locations`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`/api/crm/teachers/${id}/availability`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`/api/students?teacher_id=${id}&limit=500`).then(r => r.json()).catch(() => ({ data: [] })),
      ]);
      if (teacherRes.data) { setTeacher(teacherRes.data); } else { setErr("Teacher not found."); }
      setAllLocations(Array.isArray(locationsRes.data) ? locationsRes.data : []);
      const assigned = Array.isArray(assignedRes.data) ? assignedRes.data : [];
      setAssignedLocationIds(assigned.map((a: { location_id?: string; id?: string }) => a.location_id ?? a.id ?? "").filter(Boolean));
      // GET /availability returns { data: { teacherId, tenantId, slots: [...] } } — must read .data.slots not .data
      const availSlots: AvailabilitySlot[] = Array.isArray(availRes.data?.slots)
        ? availRes.data.slots
        : Array.isArray(availRes.data)
          ? availRes.data
          : [];
      setAvailabilitySlots(availSlots);
      // Extract unique location IDs — locationId is piggybacked in the `notes` field by rowTo()
      type RawAvailSlot = { locationId?: string | null; notes?: string | null };
      const availLocIds = [...new Set(
        (availSlots as RawAvailSlot[]).map(s => s.locationId ?? s.notes ?? "").filter(Boolean)
      )];
      setActiveAvailabilityLocationIds(availLocIds);
      const studsRaw: { id: string }[] = Array.isArray(studentsRes.data) ? studentsRes.data : Array.isArray(studentsRes) ? studentsRes : [];
      const uniqueStudentIds = new Set(studsRaw.map((s: { id: string }) => s.id));
      setStudentCount(uniqueStudentIds.size);
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed to load teacher"); }
    finally { setLoading(false); }
  }

  React.useEffect(() => { if (id) void load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!id) return <div className="p-6 text-sm text-[#505055]">Missing teacher id.</div>;

  const TABS: { id: Tab; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "contract_w9", label: "Contract & W9" },
    { id: "students", label: "Students" },
    { id: "availability", label: "Availability" },
  ];

  const displayName = teacher
    ? teacher.display_name ?? teacher.name ?? [teacher.first_name, teacher.last_name].filter(Boolean).join(" ") ?? "Teacher"
    : "Teacher";

  const capacitySlots = availabilitySlots.length > 0 ? calcCapacitySlots(availabilitySlots) : null;

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-[var(--z-space-6)]">
      <PageTransition>
        <div className="mx-auto max-w-6xl space-y-4">
          {loading && <div className="text-sm text-[var(--z-muted)]">Loading…</div>}
          {err && <div className="text-sm text-red-400">{err}</div>}
          {teacher && (
            <>
              <PageHeader title={displayName} subtitle={teacher.status ?? (teacher.is_active ? "active" : "inactive")} />
              {/* Tab Nav */}
              <div className="flex gap-1 border-b border-[var(--z-border)] overflow-x-auto">
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setTab(t.id as Tab)}
                    className={`shrink-0 px-4 py-2.5 text-sm font-semibold transition-colors ${tab === t.id ? "border-b-2 border-[#00ff88] text-[#00ff88]" : "text-[var(--z-muted)] hover:text-[var(--z-fg)]"}`}>
                    {t.label}
                    {t.id === "contract_w9" && teacher.w9_status !== "complete" && teacher.w9_status !== "signed" && (
                      <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-400 align-middle" />
                    )}
                  </button>
                ))}
              </div>
              {/* Profile tab: view + inline edit toggle */}
              {tab === "profile" && (
                <ProfileTabWithEdit
                  teacher={teacher}
                  allLocations={allLocations}
                  assignedLocationIds={assignedLocationIds}
                  activeAvailabilityLocationIds={activeAvailabilityLocationIds}
                  capacitySlots={capacitySlots}
                  studentCount={studentCount}
                  onSaved={() => void load()}
                />
              )}
              {/* Contract & W9 tab: Contract on top, W9 below */}
              {tab === "contract_w9" && (
                <div className="space-y-4">
                  <ContractModule teacher={teacher} />
                  <W9Module teacher={teacher} />
                </div>
              )}
              {tab === "students" && <TeacherStudentsTab teacherId={id} />}
              {tab === "availability" && <AvailabilityTab teacherId={id} />}
            </>
          )}
        </div>
      </PageTransition>
    </div>
  );
}
