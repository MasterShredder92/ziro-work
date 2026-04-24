"use client";
import * as React from "react";
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
type Tab = "profile" | "edit" | "w9" | "contract" | "students";
type AvailabilitySlot = { start_time: string; end_time: string; is_active?: boolean };
type W9Record = {
  id: string; legal_name: string; business_name?: string | null;
  tax_classification: string; address: string; city: string; state: string; zip: string;
  tin_type: string; tin_last_four: string; signature_name: string;
  signed_at: string; status: string; pdf_url?: string | null;
};

const inputCls = "w-full rounded-xl border border-[#1c1c1e] bg-[#111113] px-3 py-2.5 text-sm text-white placeholder-[#404048] focus:border-[#00ff88]/40 focus:outline-none";
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-[#505055] mb-1";
const sectionCls = "rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] p-4 space-y-3";

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
      <div className="flex items-center gap-4 rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] p-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[#1a1a1e]">
          {teacher.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={teacher.photo_url} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl font-bold text-[#00ff88]">{displayName.charAt(0).toUpperCase()}</div>
          )}
        </div>
        <div>
          <div className="text-lg font-bold text-white">{displayName}</div>
          {teacher.teacher_role && <div className="text-sm text-[#505055]">{teacher.teacher_role}</div>}
          {locations.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {locations.map(l => <span key={l.id} className="rounded-full bg-[#00ff88]/10 px-2 py-0.5 text-xs font-semibold text-[#00ff88]">{l.name}</span>)}
            </div>
          )}
        </div>
      </div>
      <div className="rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] divide-y divide-[#1c1c1e]">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#505055]">{label}</span>
            <span className="text-sm text-white">{value ?? <span className="text-[#303035]">—</span>}</span>
          </div>
        ))}
      </div>
      {/* Instruments */}
      {(teacher.instruments?.length || teacher.primary_instruments || teacher.secondary_instruments) && (
        <div className={sectionCls}>
          <div className="text-xs font-bold uppercase tracking-widest text-[#303035]">Instruments</div>
          {(teacher.instruments?.length || teacher.primary_instruments) && (
            <div>
              <div className="text-xs text-[#505055] mb-1">Primary</div>
              <div className="flex flex-wrap gap-2">
                {(teacher.instruments ?? []).map(inst => <span key={inst} className="rounded-full border border-[#1c1c1e] bg-[#111113] px-3 py-1 text-xs text-white">{inst}</span>)}
                {teacher.primary_instruments && teacher.primary_instruments.split(',').map(i => i.trim()).filter(Boolean).map(i => <span key={i} className="rounded-full border border-[#00ff88]/30 bg-[#00ff88]/5 px-3 py-1 text-xs text-[#00ff88]">{i}</span>)}
              </div>
            </div>
          )}
          {teacher.secondary_instruments && (
            <div>
              <div className="text-xs text-[#505055] mb-1">Secondary / Can Cover</div>
              <div className="flex flex-wrap gap-2">
                {teacher.secondary_instruments.split(',').map(i => i.trim()).filter(Boolean).map(i => <span key={i} className="rounded-full border border-[#1c1c1e] bg-[#0a0a0c] px-3 py-1 text-xs text-[#a0a0aa]">{i}</span>)}
              </div>
            </div>
          )}
          {teacher.skill_levels_by_instrument && (
            <div><div className="text-xs text-[#505055] mb-0.5">Skill Levels</div><div className="text-sm text-white">{teacher.skill_levels_by_instrument}</div></div>
          )}
          {teacher.style_genre_strengths && (
            <div>
              <div className="text-xs text-[#505055] mb-1">Style / Genre Strengths</div>
              <div className="flex flex-wrap gap-2">
                {teacher.style_genre_strengths.split(',').map(s => s.trim()).filter(Boolean).map(s => <span key={s} className="rounded-full border border-[#1c1c1e] bg-[#111113] px-3 py-1 text-xs text-[#a0a0aa]">{s}</span>)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Teaching Profile */}
      {(teacher.bio || teacher.personality || teacher.lesson_style || teacher.teaching_strengths || teacher.musical_strengths_background) && (
        <div className={sectionCls}>
          <div className="text-xs font-bold uppercase tracking-widest text-[#303035]">Teaching Profile</div>
          {teacher.bio && <div><div className="text-xs text-[#505055] mb-0.5">Bio</div><div className="text-sm text-white">{teacher.bio}</div></div>}
          {teacher.personality && (
            <div>
              <div className="text-xs text-[#505055] mb-1">Personality</div>
              <div className="flex flex-wrap gap-2">
                {teacher.personality.split(',').map(p => p.trim()).filter(Boolean).map(p => <span key={p} className="rounded-full border border-[#505055]/40 bg-[#1a1a1e] px-3 py-1 text-xs text-white">{p}</span>)}
              </div>
            </div>
          )}
          {teacher.lesson_style && <div><div className="text-xs text-[#505055] mb-0.5">Lesson Style</div><div className="text-sm text-white">{teacher.lesson_style}</div></div>}
          {teacher.teaching_strengths && <div><div className="text-xs text-[#505055] mb-0.5">Teaching Strengths</div><div className="text-sm text-white">{teacher.teaching_strengths}</div></div>}
          {teacher.musical_strengths_background && <div><div className="text-xs text-[#505055] mb-0.5">Musical Background</div><div className="text-sm text-white">{teacher.musical_strengths_background}</div></div>}
        </div>
      )}

      {/* Student Matching */}
      {(teacher.preferred_age_range || teacher.acceptable_age_range || teacher.best_first_lesson_fit || teacher.best_match_students || teacher.customer_facing_match_summary) && (
        <div className={sectionCls}>
          <div className="text-xs font-bold uppercase tracking-widest text-[#303035]">Student Matching</div>
          {teacher.customer_facing_match_summary && <div><div className="text-xs text-[#505055] mb-0.5">Summary</div><div className="text-sm text-white">{teacher.customer_facing_match_summary}</div></div>}
          {teacher.preferred_age_range && <div><div className="text-xs text-[#505055] mb-0.5">Preferred Age Range</div><div className="text-sm text-white">{teacher.preferred_age_range}</div></div>}
          {teacher.acceptable_age_range && <div><div className="text-xs text-[#505055] mb-0.5">Acceptable Age Range</div><div className="text-sm text-white">{teacher.acceptable_age_range}</div></div>}
          {teacher.best_first_lesson_fit && <div><div className="text-xs text-[#505055] mb-0.5">Best First Lesson Fit</div><div className="text-sm text-white">{teacher.best_first_lesson_fit}</div></div>}
          {teacher.best_match_students && <div><div className="text-xs text-[#505055] mb-0.5">Best Match Students</div><div className="text-sm text-white">{teacher.best_match_students}</div></div>}
          {teacher.meet_and_greet_fit && <div><div className="text-xs text-[#505055] mb-0.5">Meet &amp; Greet Fit</div><div className="text-sm text-white">{teacher.meet_and_greet_fit}</div></div>}
          {teacher.substitute_coverage && <div><div className="text-xs text-[#505055] mb-0.5">Substitute Coverage</div><div className="text-sm text-white">{teacher.substitute_coverage}</div></div>}
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
      {teacher.contract_pdf_url && (
        <div className="rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] px-4 py-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#505055]">Contract PDF</span>
          <a href={teacher.contract_pdf_url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#00ff88] underline">View Contract →</a>
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
      <div className="rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] divide-y divide-[#1c1c1e]">
        {[
          { label: "Contract Status", value: teacher.contract_status ?? "Not on file" },
          { label: "Tax Classification", value: "1099 Independent Contractor" },
          { label: "W9 Status", value: teacher.w9_status ?? "Not submitted" },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#505055]">{label}</span>
            <span className="text-sm text-white">{value}</span>
          </div>
        ))}
      </div>
      {!teacher.contract_pdf_url && (
        <div className="rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] p-4">
          <p className="text-sm text-[#505055]">No contract PDF on file. Upload a signed contract to the teacher&apos;s record to store it here.</p>
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
        name: displayName || [firstName, lastName].filter(Boolean).join(" ") || null,
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
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch),
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
          <div><label className={labelCls}>Role</label><input className={inputCls} value={teacherRole} onChange={e => setTeacherRole(e.target.value)} placeholder="Music Teacher, Lead, etc." /></div>
        </div>
        <div><label className={labelCls}>Hire Date</label><input className={inputCls} type="date" value={hireDate} onChange={e => setHireDate(e.target.value)} /></div>
      </div>
      <div className={sectionCls}>
        <div className="text-xs font-bold uppercase tracking-widest text-[#303035]">Compensation</div>
        <div>
          <label className={labelCls}>Rate / Block ($)</label>
          <input className={inputCls} type="number" min="0" step="0.01" value={ratePerBlock} onChange={e => setRatePerBlock(e.target.value)} placeholder="0.00" />
        </div>
        <div className="rounded-lg border border-[#1c1c1e] bg-[#111113] px-3 py-2.5 text-xs text-[#505055]">
          All teachers are <span className="font-semibold text-[#00ff88]">1099 independent contractors</span>. Capacity is auto-calculated from their weekly availability schedule.
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isSubAvailable} onChange={e => setIsSubAvailable(e.target.checked)} className="h-4 w-4 accent-[#00ff88]" />
          <span className="text-sm text-white">Available for sub coverage</span>
        </label>
      </div>
      {allLocations.length > 0 && (
        <div className={sectionCls}>
          <div className="text-xs font-bold uppercase tracking-widest text-[#303035]">Locations</div>
          <div className="flex flex-wrap gap-2">
            {allLocations.map(loc => (
              <button key={loc.id} type="button" onClick={() => toggleLocation(loc.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${selectedLocations.includes(loc.id) ? "bg-[#00ff88] text-black" : "border border-[#1c1c1e] bg-[#111113] text-[#909098] hover:border-[#00ff88]/30"}`}>
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
        <div className="text-xs font-bold uppercase tracking-widest text-[#303035]">Meet Your Teacher — Family-Facing Profile</div>
        <p className="text-[10px] text-[#505055] leading-relaxed">This section is shown to families on their profile page. Write it like you&apos;re introducing the teacher to a new parent — warm, personal, confidence-building.</p>
        <div>
          <label className={labelCls}>Profile Photo</label>
          {/* Avatar upload zone */}
          <div
            className="relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#1c1c1e] bg-[#0a0a0c] p-5 transition-colors hover:border-[#00ff88]/40 cursor-pointer"
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
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#1a1a1e] border-2 border-[#1c1c1e]">
                <svg className="h-10 w-10 text-[#303035]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
            )}
            {uploading ? (
              <div className="text-xs text-[#00ff88] animate-pulse">Uploading…</div>
            ) : (
              <div className="text-center">
                <div className="text-xs font-semibold text-[#505055]">Drag & drop or click to upload</div>
                <div className="text-[10px] text-[#303035] mt-0.5">JPG, PNG, WebP, GIF · Max 5MB</div>
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
        <div className="text-xs font-bold uppercase tracking-widest text-[#303035]">Director Notes</div>
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
        <div className={sectionCls}>
          <div className="text-xs font-bold uppercase tracking-widest text-[#303035]">W-9 on File</div>
          <div className="divide-y divide-[#1c1c1e]">
            {[
              { label: "Legal Name", value: existingW9.legal_name },
              { label: "Business Name", value: existingW9.business_name },
              { label: "Tax Classification", value: taxClassificationLabel[existingW9.tax_classification] ?? existingW9.tax_classification },
              { label: "Address", value: `${existingW9.address}, ${existingW9.city}, ${existingW9.state} ${existingW9.zip}` },
              { label: "TIN Type", value: existingW9.tin_type === "ssn" ? "SSN" : "EIN" },
              { label: "TIN", value: `****${existingW9.tin_last_four}` },
              { label: "Signed By", value: existingW9.signature_name },
              { label: "Signed At", value: new Date(existingW9.signed_at).toLocaleDateString() },
            ].filter(r => r.value).map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2.5">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#505055]">{label}</span>
                <span className="text-sm text-white">{value}</span>
              </div>
            ))}
          </div>
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
              <p className="mt-1 text-xs text-[#505055]">Encrypted and stored securely. Never displayed in plain text.</p>
            </div>
          </div>
          <div className={sectionCls}>
            <div className="text-xs font-bold uppercase tracking-widest text-[#303035]">Certification & Signature</div>
            <p className="text-xs text-[#505055]">Under penalties of perjury, I certify that the TIN shown is my correct taxpayer identification number, I am not subject to backup withholding, and I am a U.S. citizen or other U.S. person.</p>
            <div><label className={labelCls}>Signature (type full legal name) *</label><input className={inputCls} value={signatureName} onChange={e => setSignatureName(e.target.value)} placeholder="Type your full legal name to sign" /></div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#00ff88]" />
              <span className="text-xs text-[#909098]">I certify under penalties of perjury that the information provided is true, correct, and complete.</span>
            </label>
          </div>
          {saveStatus === "success" && <p className="text-sm text-green-500">W9 submitted successfully.</p>}
          {saveStatus === "error" && saveError && <p className="text-sm text-red-400">Error: {saveError}</p>}
          <div className="flex gap-3">
            {existingW9 && (
              <button onClick={() => { setShowForm(false); setSaveStatus("idle"); setSaveError(null); }} className="flex-1 rounded-xl border border-[#1c1c1e] py-3 text-sm font-semibold text-[#909098] hover:text-white">
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
  type StudentRow = { id: string; first_name?: string | null; last_name?: string | null; display_name?: string | null; instrument?: string | null; status?: string | null };
  const [students, setStudents] = React.useState<StudentRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    // Use teacher_id (snake_case) — the correct param name — and request up to 500 to avoid the default 200 cap
    fetch(`/api/students?teacher_id=${teacherId}&limit=500`).then(r => r.json())
      .then(res => {
        const raw: StudentRow[] = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
        // Deduplicate by student id (a student assigned to this teacher is one student regardless of how many blocks they have)
        const seen = new Set<string>();
        const unique = raw.filter(s => { if (seen.has(s.id)) return false; seen.add(s.id); return true; });
        setStudents(unique);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [teacherId]);
  if (loading) return <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-white/5" />)}</div>;
  if (students.length === 0) return <div className="text-sm text-[#505055]">No students currently assigned to this teacher.</div>;
  return (
    <div className="space-y-2">
      <div className="text-xs text-[#505055] mb-2">{students.length} student{students.length !== 1 ? "s" : ""} assigned</div>
      {students.map(s => {
        const displayName = s.display_name ?? [s.first_name, s.last_name].filter(Boolean).join(" ") ?? "—";
        return (
          <div key={s.id} className="flex items-center justify-between rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] px-4 py-3">
            <div>
              <div className="text-sm font-medium text-white">{displayName}</div>
              {s.instrument && <div className="text-xs text-[#505055]">{s.instrument}</div>}
            </div>
            {s.status && <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.status?.toLowerCase() === "active" || s.status?.toLowerCase() === "enrolled" ? "bg-[#00ff88]/10 text-[#00ff88]" : "bg-white/5 text-[#909098]"}`}>{s.status}</span>}
          </div>
        );
      })}
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
      const avail = Array.isArray(availRes.data) ? availRes.data : [];
      setAvailabilitySlots(avail);
      const studsRaw: { id: string }[] = Array.isArray(studentsRes.data) ? studentsRes.data : Array.isArray(studentsRes) ? studentsRes : [];
      const uniqueStudentIds = new Set(studsRaw.map((s: { id: string }) => s.id));
      setStudentCount(uniqueStudentIds.size);
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed to load teacher"); }
    finally { setLoading(false); }
  }

  React.useEffect(() => { if (id) void load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!id) return <div className="p-6 text-sm text-[#505055]">Missing teacher id.</div>;

  const TABS: { id: Tab; label: string }[] = [
    { id: "profile", label: "Profile" }, { id: "edit", label: "Edit" },
    { id: "w9", label: "W9" }, { id: "contract", label: "Contract" }, { id: "students", label: "Students" },
  ];

  const displayName = teacher
    ? teacher.display_name ?? teacher.name ?? [teacher.first_name, teacher.last_name].filter(Boolean).join(" ") ?? "Teacher"
    : "Teacher";

  const capacitySlots = availabilitySlots.length > 0 ? calcCapacitySlots(availabilitySlots) : null;

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-[var(--z-space-6)]">
      <PageTransition>
        <div className="mx-auto max-w-6xl space-y-4">
          {loading && <div className="text-sm text-[#505055]">Loading…</div>}
          {err && <div className="text-sm text-red-400">{err}</div>}
          {teacher && (
            <>
              <PageHeader title={displayName} subtitle={teacher.status ?? (teacher.is_active ? "active" : "inactive")} />
              <div className="flex gap-1 border-b border-[#1c1c1e] overflow-x-auto">
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`shrink-0 px-4 py-2.5 text-sm font-semibold transition-colors ${tab === t.id ? "border-b-2 border-[#00ff88] text-[#00ff88]" : "text-[#505055] hover:text-[#909098]"}`}>
                    {t.label}
                    {t.id === "w9" && teacher.w9_status !== "complete" && teacher.w9_status !== "signed" && (
                      <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-400 align-middle" />
                    )}
                  </button>
                ))}
              </div>
              {tab === "profile" && <TeacherProfileView teacher={teacher} locations={allLocations.filter(l => assignedLocationIds.includes(l.id))} capacitySlots={capacitySlots} studentCount={studentCount} />}
              {tab === "edit" && <TeacherEditForm teacher={teacher} allLocations={allLocations} assignedLocationIds={assignedLocationIds} onSaved={() => { void load(); setTab("profile"); }} />}
              {tab === "w9" && <W9Module teacher={teacher} />}
              {tab === "contract" && <ContractModule teacher={teacher} />}
              {tab === "students" && <TeacherStudentsTab teacherId={id} />}
            </>
          )}
        </div>
      </PageTransition>
    </div>
  );
}
