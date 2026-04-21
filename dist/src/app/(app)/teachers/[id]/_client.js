"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from "react";
import { useParams } from "next/navigation";
import { AgentPageBar } from "@/components/agentOS/AgentPageBar";
import { PageTransition } from "@/components/system/PageTransition";
import { PageHeader } from "@/components/ui/PageHeader";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
const inputCls = "w-full rounded-xl border border-[#1c1c1e] bg-[#111113] px-3 py-2.5 text-sm text-white placeholder-[#404048] focus:border-[#00ff88]/40 focus:outline-none";
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-[#505055] mb-1";
const sectionCls = "rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] p-4 space-y-3";
/** Parse "HH:MM:SS" or "HH:MM" into total minutes */
function timeToMinutes(t) {
    var _a, _b;
    const parts = t.split(":").map(Number);
    return ((_a = parts[0]) !== null && _a !== void 0 ? _a : 0) * 60 + ((_b = parts[1]) !== null && _b !== void 0 ? _b : 0);
}
/** Calculate total 30-min slots from availability records */
function calcCapacitySlots(slots) {
    return slots
        .filter(s => s.is_active !== false)
        .reduce((sum, s) => {
        const mins = timeToMinutes(s.end_time) - timeToMinutes(s.start_time);
        return sum + Math.floor(mins / 30);
    }, 0);
}
function TeacherProfileView({ teacher, locations, capacitySlots, studentCount }) {
    var _a, _b, _c, _d, _e, _f, _g;
    const displayName = (_c = (_b = (_a = teacher.display_name) !== null && _a !== void 0 ? _a : teacher.name) !== null && _b !== void 0 ? _b : [teacher.first_name, teacher.last_name].filter(Boolean).join(" ")) !== null && _c !== void 0 ? _c : "—";
    const capacityStr = capacitySlots != null
        ? `${studentCount !== null && studentCount !== void 0 ? studentCount : "?"} / ${capacitySlots} slots`
        : teacher.max_students != null ? String(teacher.max_students) : null;
    const rows = [
        { label: "Status", value: (_d = teacher.status) !== null && _d !== void 0 ? _d : (teacher.is_active ? "active" : "inactive") },
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
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-4 rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] p-4", children: [_jsx("div", { className: "relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[#1a1a1e]", children: teacher.photo_url ? (_jsx("img", { src: teacher.photo_url, alt: displayName, className: "h-full w-full object-cover" })) : (_jsx("div", { className: "flex h-full w-full items-center justify-center text-xl font-bold text-[#00ff88]", children: displayName.charAt(0).toUpperCase() })) }), _jsxs("div", { children: [_jsx("div", { className: "text-lg font-bold text-white", children: displayName }), teacher.teacher_role && _jsx("div", { className: "text-sm text-[#505055]", children: teacher.teacher_role }), locations.length > 0 && (_jsx("div", { className: "mt-1 flex flex-wrap gap-1", children: locations.map(l => _jsx("span", { className: "rounded-full bg-[#00ff88]/10 px-2 py-0.5 text-xs font-semibold text-[#00ff88]", children: l.name }, l.id)) }))] })] }), _jsx("div", { className: "rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] divide-y divide-[#1c1c1e]", children: rows.map(({ label, value }) => (_jsxs("div", { className: "flex items-center justify-between px-4 py-3", children: [_jsx("span", { className: "text-xs font-semibold uppercase tracking-widest text-[#505055]", children: label }), _jsx("span", { className: "text-sm text-white", children: value !== null && value !== void 0 ? value : _jsx("span", { className: "text-[#303035]", children: "\u2014" }) })] }, label))) }), (((_e = teacher.instruments) === null || _e === void 0 ? void 0 : _e.length) || teacher.primary_instruments || teacher.secondary_instruments) && (_jsxs("div", { className: sectionCls, children: [_jsx("div", { className: "text-xs font-bold uppercase tracking-widest text-[#303035]", children: "Instruments" }), (((_f = teacher.instruments) === null || _f === void 0 ? void 0 : _f.length) || teacher.primary_instruments) && (_jsxs("div", { children: [_jsx("div", { className: "text-xs text-[#505055] mb-1", children: "Primary" }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [((_g = teacher.instruments) !== null && _g !== void 0 ? _g : []).map(inst => _jsx("span", { className: "rounded-full border border-[#1c1c1e] bg-[#111113] px-3 py-1 text-xs text-white", children: inst }, inst)), teacher.primary_instruments && teacher.primary_instruments.split(',').map(i => i.trim()).filter(Boolean).map(i => _jsx("span", { className: "rounded-full border border-[#00ff88]/30 bg-[#00ff88]/5 px-3 py-1 text-xs text-[#00ff88]", children: i }, i))] })] })), teacher.secondary_instruments && (_jsxs("div", { children: [_jsx("div", { className: "text-xs text-[#505055] mb-1", children: "Secondary / Can Cover" }), _jsx("div", { className: "flex flex-wrap gap-2", children: teacher.secondary_instruments.split(',').map(i => i.trim()).filter(Boolean).map(i => _jsx("span", { className: "rounded-full border border-[#1c1c1e] bg-[#0a0a0c] px-3 py-1 text-xs text-[#a0a0aa]", children: i }, i)) })] })), teacher.skill_levels_by_instrument && (_jsxs("div", { children: [_jsx("div", { className: "text-xs text-[#505055] mb-0.5", children: "Skill Levels" }), _jsx("div", { className: "text-sm text-white", children: teacher.skill_levels_by_instrument })] })), teacher.style_genre_strengths && (_jsxs("div", { children: [_jsx("div", { className: "text-xs text-[#505055] mb-1", children: "Style / Genre Strengths" }), _jsx("div", { className: "flex flex-wrap gap-2", children: teacher.style_genre_strengths.split(',').map(s => s.trim()).filter(Boolean).map(s => _jsx("span", { className: "rounded-full border border-[#1c1c1e] bg-[#111113] px-3 py-1 text-xs text-[#a0a0aa]", children: s }, s)) })] }))] })), (teacher.bio || teacher.personality || teacher.lesson_style || teacher.teaching_strengths || teacher.musical_strengths_background) && (_jsxs("div", { className: sectionCls, children: [_jsx("div", { className: "text-xs font-bold uppercase tracking-widest text-[#303035]", children: "Teaching Profile" }), teacher.bio && _jsxs("div", { children: [_jsx("div", { className: "text-xs text-[#505055] mb-0.5", children: "Bio" }), _jsx("div", { className: "text-sm text-white", children: teacher.bio })] }), teacher.personality && (_jsxs("div", { children: [_jsx("div", { className: "text-xs text-[#505055] mb-1", children: "Personality" }), _jsx("div", { className: "flex flex-wrap gap-2", children: teacher.personality.split(',').map(p => p.trim()).filter(Boolean).map(p => _jsx("span", { className: "rounded-full border border-[#505055]/40 bg-[#1a1a1e] px-3 py-1 text-xs text-white", children: p }, p)) })] })), teacher.lesson_style && _jsxs("div", { children: [_jsx("div", { className: "text-xs text-[#505055] mb-0.5", children: "Lesson Style" }), _jsx("div", { className: "text-sm text-white", children: teacher.lesson_style })] }), teacher.teaching_strengths && _jsxs("div", { children: [_jsx("div", { className: "text-xs text-[#505055] mb-0.5", children: "Teaching Strengths" }), _jsx("div", { className: "text-sm text-white", children: teacher.teaching_strengths })] }), teacher.musical_strengths_background && _jsxs("div", { children: [_jsx("div", { className: "text-xs text-[#505055] mb-0.5", children: "Musical Background" }), _jsx("div", { className: "text-sm text-white", children: teacher.musical_strengths_background })] })] })), (teacher.preferred_age_range || teacher.acceptable_age_range || teacher.best_first_lesson_fit || teacher.best_match_students || teacher.customer_facing_match_summary) && (_jsxs("div", { className: sectionCls, children: [_jsx("div", { className: "text-xs font-bold uppercase tracking-widest text-[#303035]", children: "Student Matching" }), teacher.customer_facing_match_summary && _jsxs("div", { children: [_jsx("div", { className: "text-xs text-[#505055] mb-0.5", children: "Summary" }), _jsx("div", { className: "text-sm text-white", children: teacher.customer_facing_match_summary })] }), teacher.preferred_age_range && _jsxs("div", { children: [_jsx("div", { className: "text-xs text-[#505055] mb-0.5", children: "Preferred Age Range" }), _jsx("div", { className: "text-sm text-white", children: teacher.preferred_age_range })] }), teacher.acceptable_age_range && _jsxs("div", { children: [_jsx("div", { className: "text-xs text-[#505055] mb-0.5", children: "Acceptable Age Range" }), _jsx("div", { className: "text-sm text-white", children: teacher.acceptable_age_range })] }), teacher.best_first_lesson_fit && _jsxs("div", { children: [_jsx("div", { className: "text-xs text-[#505055] mb-0.5", children: "Best First Lesson Fit" }), _jsx("div", { className: "text-sm text-white", children: teacher.best_first_lesson_fit })] }), teacher.best_match_students && _jsxs("div", { children: [_jsx("div", { className: "text-xs text-[#505055] mb-0.5", children: "Best Match Students" }), _jsx("div", { className: "text-sm text-white", children: teacher.best_match_students })] }), teacher.meet_and_greet_fit && _jsxs("div", { children: [_jsx("div", { className: "text-xs text-[#505055] mb-0.5", children: "Meet & Greet Fit" }), _jsx("div", { className: "text-sm text-white", children: teacher.meet_and_greet_fit })] }), teacher.substitute_coverage && _jsxs("div", { children: [_jsx("div", { className: "text-xs text-[#505055] mb-0.5", children: "Substitute Coverage" }), _jsx("div", { className: "text-sm text-white", children: teacher.substitute_coverage })] })] })), (teacher.use_caution_internal_placement_notes || teacher.internal_matching_tags || teacher.internal_match_notes || teacher.director_notes) && (_jsxs("div", { className: "rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3", children: [_jsx("div", { className: "text-xs font-bold uppercase tracking-widest text-amber-500/60", children: "Internal \u2014 Director Only" }), teacher.use_caution_internal_placement_notes && (_jsxs("div", { children: [_jsx("div", { className: "text-xs text-amber-400/70 mb-0.5", children: "\u26A0 Use Caution" }), _jsx("div", { className: "text-sm text-amber-100", children: teacher.use_caution_internal_placement_notes })] })), teacher.director_notes && _jsxs("div", { children: [_jsx("div", { className: "text-xs text-amber-400/70 mb-0.5", children: "Director Notes" }), _jsx("div", { className: "text-sm text-amber-100", children: teacher.director_notes })] }), teacher.internal_match_notes && _jsxs("div", { children: [_jsx("div", { className: "text-xs text-amber-400/70 mb-0.5", children: "Internal Match Notes" }), _jsx("div", { className: "text-sm text-amber-100", children: teacher.internal_match_notes })] }), teacher.internal_matching_tags && (_jsxs("div", { children: [_jsx("div", { className: "text-xs text-amber-400/70 mb-1", children: "Matching Tags" }), _jsx("div", { className: "flex flex-wrap gap-2", children: teacher.internal_matching_tags.split(',').map(t => t.trim()).filter(Boolean).map(t => _jsx("span", { className: "rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300", children: t }, t)) })] }))] })), teacher.contract_pdf_url && (_jsxs("div", { className: "rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] px-4 py-3 flex items-center justify-between", children: [_jsx("span", { className: "text-xs font-semibold uppercase tracking-widest text-[#505055]", children: "Contract PDF" }), _jsx("a", { href: teacher.contract_pdf_url, target: "_blank", rel: "noopener noreferrer", className: "text-sm text-[#00ff88] underline", children: "View Contract \u2192" })] }))] }));
}
function ContractModule({ teacher }) {
    var _a, _b, _c;
    const contractSigned = teacher.contract_status === "signed" || teacher.contract_status === "complete";
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: `rounded-xl border p-4 ${contractSigned ? "border-[#00ff88]/30 bg-[#00ff88]/5" : "border-amber-500/30 bg-amber-500/5"}`, children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `h-2 w-2 rounded-full ${contractSigned ? "bg-[#00ff88]" : "bg-amber-400"}` }), _jsxs("span", { className: "text-sm font-semibold text-white", children: ["Contract Status: ", _jsx("span", { className: contractSigned ? "text-[#00ff88]" : "text-amber-400", children: (_a = teacher.contract_status) !== null && _a !== void 0 ? _a : "Not on file" })] })] }), teacher.contract_pdf_url && (_jsx("a", { href: teacher.contract_pdf_url, target: "_blank", rel: "noopener noreferrer", className: "mt-3 inline-flex items-center gap-2 rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/20 px-4 py-2 text-sm font-semibold text-[#00ff88] hover:bg-[#00ff88]/20 transition-colors", children: "View Contract PDF \u2192" }))] }), _jsx("div", { className: "rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] divide-y divide-[#1c1c1e]", children: [
                    { label: "Contract Status", value: (_b = teacher.contract_status) !== null && _b !== void 0 ? _b : "Not on file" },
                    { label: "Tax Classification", value: "1099 Independent Contractor" },
                    { label: "W9 Status", value: (_c = teacher.w9_status) !== null && _c !== void 0 ? _c : "Not submitted" },
                ].map(({ label, value }) => (_jsxs("div", { className: "flex items-center justify-between px-4 py-3", children: [_jsx("span", { className: "text-xs font-semibold uppercase tracking-widest text-[#505055]", children: label }), _jsx("span", { className: "text-sm text-white", children: value })] }, label))) }), !teacher.contract_pdf_url && (_jsx("div", { className: "rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] p-4", children: _jsx("p", { className: "text-sm text-[#505055]", children: "No contract PDF on file. Upload a signed contract to the teacher's record to store it here." }) }))] }));
}
function TeacherEditForm({ teacher, allLocations, assignedLocationIds, onSaved }) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
    const [saving, setSaving] = React.useState(false);
    const [saveStatus, setSaveStatus] = React.useState("idle");
    const [saveError, setSaveError] = React.useState(null);
    const [firstName, setFirstName] = React.useState((_a = teacher.first_name) !== null && _a !== void 0 ? _a : "");
    const [lastName, setLastName] = React.useState((_b = teacher.last_name) !== null && _b !== void 0 ? _b : "");
    const [displayName, setDisplayName] = React.useState((_d = (_c = teacher.display_name) !== null && _c !== void 0 ? _c : teacher.name) !== null && _d !== void 0 ? _d : "");
    const [email, setEmail] = React.useState((_e = teacher.email) !== null && _e !== void 0 ? _e : "");
    const [phone, setPhone] = React.useState((_f = teacher.phone) !== null && _f !== void 0 ? _f : "");
    const [status, setStatus] = React.useState((_g = teacher.status) !== null && _g !== void 0 ? _g : "active");
    const [teacherRole, setTeacherRole] = React.useState((_h = teacher.teacher_role) !== null && _h !== void 0 ? _h : "");
    const [hireDate, setHireDate] = React.useState((_j = teacher.hire_date) !== null && _j !== void 0 ? _j : "");
    const [ratePerBlock, setRatePerBlock] = React.useState(teacher.rate_per_block != null ? String(teacher.rate_per_block) : "");
    const [isSubAvailable, setIsSubAvailable] = React.useState((_l = (_k = teacher.is_sub_available) !== null && _k !== void 0 ? _k : teacher.sub_available) !== null && _l !== void 0 ? _l : false);
    const [bio, setBio] = React.useState((_m = teacher.bio) !== null && _m !== void 0 ? _m : "");
    const [lessonStyle, setLessonStyle] = React.useState((_o = teacher.lesson_style) !== null && _o !== void 0 ? _o : "");
    const [teachingStrengths, setTeachingStrengths] = React.useState((_p = teacher.teaching_strengths) !== null && _p !== void 0 ? _p : "");
    const [musicalBackground, setMusicalBackground] = React.useState((_q = teacher.musical_strengths_background) !== null && _q !== void 0 ? _q : "");
    const [directorNotes, setDirectorNotes] = React.useState((_r = teacher.director_notes) !== null && _r !== void 0 ? _r : "");
    const [instrumentsStr, setInstrumentsStr] = React.useState(((_s = teacher.instruments) !== null && _s !== void 0 ? _s : []).join(", "));
    const [primaryInstruments, setPrimaryInstruments] = React.useState((_t = teacher.primary_instruments) !== null && _t !== void 0 ? _t : "");
    const [selectedLocations, setSelectedLocations] = React.useState(assignedLocationIds);
    function toggleLocation(locId) {
        setSelectedLocations(prev => prev.includes(locId) ? prev.filter(l => l !== locId) : [...prev, locId]);
    }
    async function handleSave() {
        var _a, _b;
        setSaving(true);
        setSaveStatus("idle");
        setSaveError(null);
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
            };
            const res = await fetch(`/api/crm/teachers/${teacher.id}`, {
                method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error((_b = (_a = body.message) !== null && _a !== void 0 ? _a : body.error) !== null && _b !== void 0 ? _b : `HTTP ${res.status}`);
            }
            const toAdd = selectedLocations.filter(locId => !assignedLocationIds.includes(locId));
            const toRemove = assignedLocationIds.filter(locId => !selectedLocations.includes(locId));
            await Promise.all([
                ...toAdd.map(locationId => fetch(`/api/crm/teachers/${teacher.id}/locations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location_id: locationId }) }).catch(() => null)),
                ...toRemove.map(locationId => fetch(`/api/crm/teachers/${teacher.id}/locations/${locationId}`, { method: "DELETE" }).catch(() => null)),
            ]);
            setSaveStatus("success");
            setTimeout(() => { setSaveStatus("idle"); onSaved(); }, 1500);
        }
        catch (err) {
            setSaveStatus("error");
            setSaveError(err instanceof Error ? err.message : "Save failed");
        }
        finally {
            setSaving(false);
        }
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: sectionCls, children: [_jsx("div", { className: "text-xs font-bold uppercase tracking-widest text-[#303035]", children: "Basic Info" }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: labelCls, children: "First Name" }), _jsx("input", { className: inputCls, value: firstName, onChange: e => setFirstName(e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Last Name" }), _jsx("input", { className: inputCls, value: lastName, onChange: e => setLastName(e.target.value) })] })] }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Display Name" }), _jsx("input", { className: inputCls, value: displayName, onChange: e => setDisplayName(e.target.value), placeholder: "How name appears in app" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Email" }), _jsx("input", { className: inputCls, type: "email", value: email, onChange: e => setEmail(e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Phone" }), _jsx("input", { className: inputCls, type: "tel", value: phone, onChange: e => setPhone(e.target.value) })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Status" }), _jsxs("select", { className: inputCls, value: status, onChange: e => setStatus(e.target.value), children: [_jsx("option", { value: "active", children: "Active" }), _jsx("option", { value: "inactive", children: "Inactive" }), _jsx("option", { value: "on_leave", children: "On Leave" }), _jsx("option", { value: "terminated", children: "Terminated" })] })] }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Role" }), _jsx("input", { className: inputCls, value: teacherRole, onChange: e => setTeacherRole(e.target.value), placeholder: "Music Teacher, Lead, etc." })] })] }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Hire Date" }), _jsx("input", { className: inputCls, type: "date", value: hireDate, onChange: e => setHireDate(e.target.value) })] })] }), _jsxs("div", { className: sectionCls, children: [_jsx("div", { className: "text-xs font-bold uppercase tracking-widest text-[#303035]", children: "Compensation" }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Rate / Block ($)" }), _jsx("input", { className: inputCls, type: "number", min: "0", step: "0.01", value: ratePerBlock, onChange: e => setRatePerBlock(e.target.value), placeholder: "0.00" })] }), _jsxs("div", { className: "rounded-lg border border-[#1c1c1e] bg-[#111113] px-3 py-2.5 text-xs text-[#505055]", children: ["All teachers are ", _jsx("span", { className: "font-semibold text-[#00ff88]", children: "1099 independent contractors" }), ". Capacity is auto-calculated from their weekly availability schedule."] }), _jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: isSubAvailable, onChange: e => setIsSubAvailable(e.target.checked), className: "h-4 w-4 accent-[#00ff88]" }), _jsx("span", { className: "text-sm text-white", children: "Available for sub coverage" })] })] }), allLocations.length > 0 && (_jsxs("div", { className: sectionCls, children: [_jsx("div", { className: "text-xs font-bold uppercase tracking-widest text-[#303035]", children: "Locations" }), _jsx("div", { className: "flex flex-wrap gap-2", children: allLocations.map(loc => (_jsx("button", { type: "button", onClick: () => toggleLocation(loc.id), className: `rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${selectedLocations.includes(loc.id) ? "bg-[#00ff88] text-black" : "border border-[#1c1c1e] bg-[#111113] text-[#909098] hover:border-[#00ff88]/30"}`, children: loc.name }, loc.id))) })] })), _jsxs("div", { className: sectionCls, children: [_jsx("div", { className: "text-xs font-bold uppercase tracking-widest text-[#303035]", children: "Instruments" }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Instruments (comma separated)" }), _jsx("input", { className: inputCls, value: instrumentsStr, onChange: e => setInstrumentsStr(e.target.value), placeholder: "Guitar, Piano, Drums\u2026" })] }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Primary Instruments" }), _jsx("input", { className: inputCls, value: primaryInstruments, onChange: e => setPrimaryInstruments(e.target.value), placeholder: "Guitar" })] })] }), _jsxs("div", { className: sectionCls, children: [_jsx("div", { className: "text-xs font-bold uppercase tracking-widest text-[#303035]", children: "Teaching Profile" }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Bio" }), _jsx("textarea", { className: inputCls, rows: 3, value: bio, onChange: e => setBio(e.target.value), placeholder: "Teacher bio visible to families\u2026" })] }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Lesson Style" }), _jsx("input", { className: inputCls, value: lessonStyle, onChange: e => setLessonStyle(e.target.value), placeholder: "Structured, exploratory, etc." })] }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Teaching Strengths" }), _jsx("textarea", { className: inputCls, rows: 2, value: teachingStrengths, onChange: e => setTeachingStrengths(e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Musical Background" }), _jsx("textarea", { className: inputCls, rows: 2, value: musicalBackground, onChange: e => setMusicalBackground(e.target.value) })] })] }), _jsxs("div", { className: sectionCls, children: [_jsx("div", { className: "text-xs font-bold uppercase tracking-widest text-[#303035]", children: "Director Notes" }), _jsx("textarea", { className: inputCls, rows: 3, value: directorNotes, onChange: e => setDirectorNotes(e.target.value), placeholder: "Internal notes for directors only\u2026" })] }), saveStatus === "success" && _jsx("p", { className: "text-sm text-green-500", children: "Teacher profile saved successfully." }), saveStatus === "error" && saveError && _jsxs("p", { className: "text-sm text-red-400", children: ["Error: ", saveError] }), _jsx("button", { onClick: handleSave, disabled: saving, className: "w-full rounded-xl bg-[#00ff88] py-3 text-sm font-bold text-black disabled:opacity-50", children: saving ? "Saving…" : "Save Profile" })] }));
}
function W9Module({ teacher }) {
    var _a, _b;
    const [saving, setSaving] = React.useState(false);
    const [saveStatus, setSaveStatus] = React.useState("idle");
    const [saveError, setSaveError] = React.useState(null);
    const [existingW9, setExistingW9] = React.useState(null);
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
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            if (res.data) {
                setExistingW9(res.data);
                // Pre-fill form fields from existing record
                setLegalName((_a = res.data.legal_name) !== null && _a !== void 0 ? _a : "");
                setBusinessName((_b = res.data.business_name) !== null && _b !== void 0 ? _b : "");
                setTaxClassification((_c = res.data.tax_classification) !== null && _c !== void 0 ? _c : "individual");
                setTaxClassificationOther((_d = res.data.tax_classification_other) !== null && _d !== void 0 ? _d : "");
                setAddress((_e = res.data.address) !== null && _e !== void 0 ? _e : "");
                setCity((_f = res.data.city) !== null && _f !== void 0 ? _f : "");
                setState((_g = res.data.state) !== null && _g !== void 0 ? _g : "");
                setZip((_h = res.data.zip) !== null && _h !== void 0 ? _h : "");
                setTinType((_j = res.data.tin_type) !== null && _j !== void 0 ? _j : "ssn");
                setSignatureName((_k = res.data.signature_name) !== null && _k !== void 0 ? _k : "");
            }
            else {
                // No existing W9 — show the form immediately
                setShowForm(true);
            }
        })
            .catch(() => { setShowForm(true); })
            .finally(() => setLoadingW9(false));
    }, [teacher.id]);
    async function handleSubmit() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        if (!agreed) {
            setSaveError("You must certify the information is correct.");
            return;
        }
        if (!legalName || !address || !city || !state || !zip || !tin || !signatureName) {
            setSaveError("Please fill in all required fields.");
            return;
        }
        setSaving(true);
        setSaveStatus("idle");
        setSaveError(null);
        try {
            const res = await fetch(`/api/crm/teachers/${teacher.id}/w9`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ legal_name: legalName, business_name: businessName || null, tax_classification: taxClassification, tax_classification_other: taxClassificationOther || null, address, city, state, zip, tin_type: tinType, tin, signature_name: signatureName, signed_at: new Date().toISOString() }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error((_b = (_a = body.message) !== null && _a !== void 0 ? _a : body.error) !== null && _b !== void 0 ? _b : `HTTP ${res.status}`);
            }
            const result = await res.json();
            if (result.data) {
                setExistingW9(result.data);
                // Refresh form fields from saved data
                setLegalName((_c = result.data.legal_name) !== null && _c !== void 0 ? _c : "");
                setBusinessName((_d = result.data.business_name) !== null && _d !== void 0 ? _d : "");
                setTaxClassification((_e = result.data.tax_classification) !== null && _e !== void 0 ? _e : "individual");
                setAddress((_f = result.data.address) !== null && _f !== void 0 ? _f : "");
                setCity((_g = result.data.city) !== null && _g !== void 0 ? _g : "");
                setState((_h = result.data.state) !== null && _h !== void 0 ? _h : "");
                setZip((_j = result.data.zip) !== null && _j !== void 0 ? _j : "");
                setTinType((_k = result.data.tin_type) !== null && _k !== void 0 ? _k : "ssn");
                setSignatureName((_l = result.data.signature_name) !== null && _l !== void 0 ? _l : "");
                setTin(""); // clear TIN field after save
            }
            setSaveStatus("success");
            setTimeout(() => { setSaveStatus("idle"); setShowForm(false); setAgreed(false); }, 2000);
        }
        catch (err) {
            setSaveStatus("error");
            setSaveError(err instanceof Error ? err.message : "Submission failed");
        }
        finally {
            setSaving(false);
        }
    }
    const taxClassificationLabel = {
        individual: "Individual / Sole Proprietor", c_corp: "C Corporation", s_corp: "S Corporation",
        partnership: "Partnership", trust: "Trust / Estate", llc: "LLC", other: "Other",
    };
    if (loadingW9) {
        return _jsx("div", { className: "space-y-2", children: [1, 2, 3].map(i => _jsx("div", { className: "h-12 animate-pulse rounded-lg bg-white/5" }, i)) });
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: `rounded-xl border p-4 ${w9Complete ? "border-[#00ff88]/30 bg-[#00ff88]/5" : "border-amber-500/30 bg-amber-500/5"}`, children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `h-2 w-2 rounded-full ${w9Complete ? "bg-[#00ff88]" : "bg-amber-400"}` }), _jsxs("span", { className: "text-sm font-semibold text-white", children: ["W9 Status: ", _jsx("span", { className: w9Complete ? "text-[#00ff88]" : "text-amber-400", children: (_a = teacher.w9_status) !== null && _a !== void 0 ? _a : "Not submitted" })] })] }), existingW9 && !showForm && (_jsx("button", { onClick: () => setShowForm(true), className: "text-xs text-[#505055] hover:text-white underline", children: "Update W9" }))] }), teacher.w9_completed_at && _jsxs("div", { className: "mt-1 text-xs text-[#505055]", children: ["Completed: ", new Date(teacher.w9_completed_at).toLocaleDateString()] }), (existingW9 === null || existingW9 === void 0 ? void 0 : existingW9.pdf_url) && _jsx("a", { href: existingW9.pdf_url, target: "_blank", rel: "noopener noreferrer", className: "mt-2 inline-block text-xs text-[#00ff88] underline", children: "View W9 PDF \u2192" })] }), existingW9 && !showForm && (_jsxs("div", { className: sectionCls, children: [_jsx("div", { className: "text-xs font-bold uppercase tracking-widest text-[#303035]", children: "W-9 on File" }), _jsx("div", { className: "divide-y divide-[#1c1c1e]", children: [
                            { label: "Legal Name", value: existingW9.legal_name },
                            { label: "Business Name", value: existingW9.business_name },
                            { label: "Tax Classification", value: (_b = taxClassificationLabel[existingW9.tax_classification]) !== null && _b !== void 0 ? _b : existingW9.tax_classification },
                            { label: "Address", value: `${existingW9.address}, ${existingW9.city}, ${existingW9.state} ${existingW9.zip}` },
                            { label: "TIN Type", value: existingW9.tin_type === "ssn" ? "SSN" : "EIN" },
                            { label: "TIN", value: `****${existingW9.tin_last_four}` },
                            { label: "Signed By", value: existingW9.signature_name },
                            { label: "Signed At", value: new Date(existingW9.signed_at).toLocaleDateString() },
                        ].filter(r => r.value).map(({ label, value }) => (_jsxs("div", { className: "flex items-center justify-between py-2.5", children: [_jsx("span", { className: "text-xs font-semibold uppercase tracking-widest text-[#505055]", children: label }), _jsx("span", { className: "text-sm text-white", children: value })] }, label))) })] })), showForm && (_jsxs(_Fragment, { children: [_jsxs("div", { className: sectionCls, children: [_jsx("div", { className: "text-xs font-bold uppercase tracking-widest text-[#303035]", children: "W-9 \u2014 Request for Taxpayer Identification" }), _jsx("p", { className: "text-xs text-[#505055]", children: "All fields are required. Your TIN is encrypted and never shown in plain text." }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Legal Name *" }), _jsx("input", { className: inputCls, value: legalName, onChange: e => setLegalName(e.target.value), placeholder: "Full legal name as shown on tax return" })] }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Business Name (if different)" }), _jsx("input", { className: inputCls, value: businessName, onChange: e => setBusinessName(e.target.value), placeholder: "DBA or business name" })] }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Federal Tax Classification *" }), _jsxs("select", { className: inputCls, value: taxClassification, onChange: e => setTaxClassification(e.target.value), children: [_jsx("option", { value: "individual", children: "Individual / Sole Proprietor" }), _jsx("option", { value: "c_corp", children: "C Corporation" }), _jsx("option", { value: "s_corp", children: "S Corporation" }), _jsx("option", { value: "partnership", children: "Partnership" }), _jsx("option", { value: "trust", children: "Trust / Estate" }), _jsx("option", { value: "llc", children: "LLC" }), _jsx("option", { value: "other", children: "Other" })] })] }), taxClassification === "other" && _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Specify" }), _jsx("input", { className: inputCls, value: taxClassificationOther, onChange: e => setTaxClassificationOther(e.target.value) })] })] }), _jsxs("div", { className: sectionCls, children: [_jsx("div", { className: "text-xs font-bold uppercase tracking-widest text-[#303035]", children: "Address" }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Street Address *" }), _jsx("input", { className: inputCls, value: address, onChange: e => setAddress(e.target.value), placeholder: "123 Main St" })] }), _jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsxs("div", { className: "col-span-1", children: [_jsx("label", { className: labelCls, children: "City *" }), _jsx("input", { className: inputCls, value: city, onChange: e => setCity(e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "State *" }), _jsx("input", { className: inputCls, value: state, onChange: e => setState(e.target.value), placeholder: "NE", maxLength: 2 })] }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "ZIP *" }), _jsx("input", { className: inputCls, value: zip, onChange: e => setZip(e.target.value), placeholder: "68101" })] })] })] }), _jsxs("div", { className: sectionCls, children: [_jsx("div", { className: "text-xs font-bold uppercase tracking-widest text-[#303035]", children: "Taxpayer Identification Number" }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "TIN Type *" }), _jsxs("select", { className: inputCls, value: tinType, onChange: e => setTinType(e.target.value), children: [_jsx("option", { value: "ssn", children: "Social Security Number (SSN)" }), _jsx("option", { value: "ein", children: "Employer Identification Number (EIN)" })] })] }), _jsxs("div", { children: [_jsxs("label", { className: labelCls, children: [tinType === "ssn" ? "SSN" : "EIN", " *"] }), _jsx("input", { className: inputCls, type: "password", value: tin, onChange: e => setTin(e.target.value), placeholder: tinType === "ssn" ? "XXX-XX-XXXX" : "XX-XXXXXXX", autoComplete: "off" }), _jsx("p", { className: "mt-1 text-xs text-[#505055]", children: "Encrypted and stored securely. Never displayed in plain text." })] })] }), _jsxs("div", { className: sectionCls, children: [_jsx("div", { className: "text-xs font-bold uppercase tracking-widest text-[#303035]", children: "Certification & Signature" }), _jsx("p", { className: "text-xs text-[#505055]", children: "Under penalties of perjury, I certify that the TIN shown is my correct taxpayer identification number, I am not subject to backup withholding, and I am a U.S. citizen or other U.S. person." }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Signature (type full legal name) *" }), _jsx("input", { className: inputCls, value: signatureName, onChange: e => setSignatureName(e.target.value), placeholder: "Type your full legal name to sign" })] }), _jsxs("label", { className: "flex items-start gap-2 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: agreed, onChange: e => setAgreed(e.target.checked), className: "mt-0.5 h-4 w-4 shrink-0 accent-[#00ff88]" }), _jsx("span", { className: "text-xs text-[#909098]", children: "I certify under penalties of perjury that the information provided is true, correct, and complete." })] })] }), saveStatus === "success" && _jsx("p", { className: "text-sm text-green-500", children: "W9 submitted successfully." }), saveStatus === "error" && saveError && _jsxs("p", { className: "text-sm text-red-400", children: ["Error: ", saveError] }), _jsxs("div", { className: "flex gap-3", children: [existingW9 && (_jsx("button", { onClick: () => { setShowForm(false); setSaveStatus("idle"); setSaveError(null); }, className: "flex-1 rounded-xl border border-[#1c1c1e] py-3 text-sm font-semibold text-[#909098] hover:text-white", children: "Cancel" })), _jsx("button", { onClick: handleSubmit, disabled: saving || !agreed, className: "flex-1 rounded-xl bg-[#00ff88] py-3 text-sm font-bold text-black disabled:opacity-50", children: saving ? "Submitting…" : existingW9 ? "Update W9" : "Submit W9" })] })] })), !existingW9 && !showForm && (_jsx("button", { onClick: () => setShowForm(true), className: "w-full rounded-xl bg-[#00ff88] py-3 text-sm font-bold text-black", children: "Complete W9" }))] }));
}
function TeacherStudentsTab({ teacherId }) {
    const [students, setStudents] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    React.useEffect(() => {
        // Use teacher_id (snake_case) — the correct param name — and request up to 500 to avoid the default 200 cap
        fetch(`/api/students?teacher_id=${teacherId}&limit=500`).then(r => r.json())
            .then(res => {
            const raw = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
            // Deduplicate by student id (a student assigned to this teacher is one student regardless of how many blocks they have)
            const seen = new Set();
            const unique = raw.filter(s => { if (seen.has(s.id))
                return false; seen.add(s.id); return true; });
            setStudents(unique);
            setLoading(false);
        })
            .catch(() => setLoading(false));
    }, [teacherId]);
    if (loading)
        return _jsx("div", { className: "space-y-2", children: [1, 2, 3].map(i => _jsx("div", { className: "h-12 animate-pulse rounded-lg bg-white/5" }, i)) });
    if (students.length === 0)
        return _jsx("div", { className: "text-sm text-[#505055]", children: "No students currently assigned to this teacher." });
    return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "text-xs text-[#505055] mb-2", children: [students.length, " student", students.length !== 1 ? "s" : "", " assigned"] }), students.map(s => {
                var _a, _b, _c, _d;
                const displayName = (_b = (_a = s.display_name) !== null && _a !== void 0 ? _a : [s.first_name, s.last_name].filter(Boolean).join(" ")) !== null && _b !== void 0 ? _b : "—";
                return (_jsxs("div", { className: "flex items-center justify-between rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] px-4 py-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-white", children: displayName }), s.instrument && _jsx("div", { className: "text-xs text-[#505055]", children: s.instrument })] }), s.status && _jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-semibold ${((_c = s.status) === null || _c === void 0 ? void 0 : _c.toLowerCase()) === "active" || ((_d = s.status) === null || _d === void 0 ? void 0 : _d.toLowerCase()) === "enrolled" ? "bg-[#00ff88]/10 text-[#00ff88]" : "bg-white/5 text-[#909098]"}`, children: s.status })] }, s.id));
            })] }));
}
export function TeacherDetailClient() {
    var _a, _b, _c, _d, _e;
    const params = useParams();
    const id = String((_a = params === null || params === void 0 ? void 0 : params.id) !== null && _a !== void 0 ? _a : "");
    const [teacher, setTeacher] = React.useState(null);
    const [allLocations, setAllLocations] = React.useState([]);
    const [assignedLocationIds, setAssignedLocationIds] = React.useState([]);
    const [availabilitySlots, setAvailabilitySlots] = React.useState([]);
    const [studentCount, setStudentCount] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [err, setErr] = React.useState(null);
    const [tab, setTab] = React.useState("profile");
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
            if (teacherRes.data) {
                setTeacher(teacherRes.data);
            }
            else {
                setErr("Teacher not found.");
            }
            setAllLocations(Array.isArray(locationsRes.data) ? locationsRes.data : []);
            const assigned = Array.isArray(assignedRes.data) ? assignedRes.data : [];
            setAssignedLocationIds(assigned.map((a) => { var _a, _b; return (_b = (_a = a.location_id) !== null && _a !== void 0 ? _a : a.id) !== null && _b !== void 0 ? _b : ""; }).filter(Boolean));
            const avail = Array.isArray(availRes.data) ? availRes.data : [];
            setAvailabilitySlots(avail);
            const studsRaw = Array.isArray(studentsRes.data) ? studentsRes.data : Array.isArray(studentsRes) ? studentsRes : [];
            const uniqueStudentIds = new Set(studsRaw.map((s) => s.id));
            setStudentCount(uniqueStudentIds.size);
        }
        catch (e) {
            setErr(e instanceof Error ? e.message : "Failed to load teacher");
        }
        finally {
            setLoading(false);
        }
    }
    React.useEffect(() => { if (id)
        void load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
    if (!id)
        return _jsx("div", { className: "p-6 text-sm text-[#505055]", children: "Missing teacher id." });
    const TABS = [
        { id: "profile", label: "Profile" }, { id: "edit", label: "Edit" },
        { id: "w9", label: "W9" }, { id: "contract", label: "Contract" }, { id: "students", label: "Students" },
    ];
    const displayName = teacher
        ? (_d = (_c = (_b = teacher.display_name) !== null && _b !== void 0 ? _b : teacher.name) !== null && _c !== void 0 ? _c : [teacher.first_name, teacher.last_name].filter(Boolean).join(" ")) !== null && _d !== void 0 ? _d : "Teacher"
        : "Teacher";
    const capacitySlots = availabilitySlots.length > 0 ? calcCapacitySlots(availabilitySlots) : null;
    return (_jsx("div", { className: "h-full overflow-y-auto overflow-x-hidden p-[var(--z-space-6)]", children: _jsx(PageTransition, { children: _jsxs("div", { className: "mx-auto max-w-6xl space-y-4", children: [loading && _jsx("div", { className: "text-sm text-[#505055]", children: "Loading\u2026" }), err && _jsx("div", { className: "text-sm text-red-400", children: err }), teacher && (_jsxs(_Fragment, { children: [_jsx(PageHeader, { title: displayName, subtitle: (_e = teacher.status) !== null && _e !== void 0 ? _e : (teacher.is_active ? "active" : "inactive") }), _jsx(AgentPageBar, { agentId: "vader", chatPlaceholder: "Ask Vader about this teacher\u2026", pageContext: { page: "teacher-profile", teacherId: id, teacherName: displayName, status: teacher.status, w9Status: teacher.w9_status, contractStatus: teacher.contract_status, ratePerBlock: teacher.rate_per_block } }), _jsx("div", { className: "flex gap-1 border-b border-[#1c1c1e] overflow-x-auto", children: TABS.map(t => (_jsxs("button", { onClick: () => setTab(t.id), className: `shrink-0 px-4 py-2.5 text-sm font-semibold transition-colors ${tab === t.id ? "border-b-2 border-[#00ff88] text-[#00ff88]" : "text-[#505055] hover:text-[#909098]"}`, children: [t.label, t.id === "w9" && teacher.w9_status !== "complete" && teacher.w9_status !== "signed" && (_jsx("span", { className: "ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-400 align-middle" }))] }, t.id))) }), tab === "profile" && _jsx(TeacherProfileView, { teacher: teacher, locations: allLocations.filter(l => assignedLocationIds.includes(l.id)), capacitySlots: capacitySlots, studentCount: studentCount }), tab === "edit" && _jsx(TeacherEditForm, { teacher: teacher, allLocations: allLocations, assignedLocationIds: assignedLocationIds, onSaved: () => { void load(); setTab("profile"); } }), tab === "w9" && _jsx(W9Module, { teacher: teacher }), tab === "contract" && _jsx(ContractModule, { teacher: teacher }), tab === "students" && _jsx(TeacherStudentsTab, { teacherId: id })] }))] }) }) }));
}
