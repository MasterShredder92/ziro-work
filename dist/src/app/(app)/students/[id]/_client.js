/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AgentPageBar } from "@/components/agentOS/AgentPageBar";
import { StudentTimeline } from "@/components/students/StudentTimeline";
import { ChampionshipReportCard } from "@/components/reports/ChampionshipReportCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { loadStudentSurface } from "./actions";
import { PageTransition } from "@/components/system/PageTransition";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
function invoiceStatusBadge(s) {
    const l = s.toLowerCase();
    if (l === "paid")
        return "bg-[#00ff88]/10 text-[#00ff88]";
    if (l === "overdue")
        return "bg-red-500/10 text-red-400";
    if (l === "pending")
        return "bg-amber-400/10 text-amber-400";
    return "bg-white/5 text-[#909098]";
}
function ReportsTab({ studentId, tenantId }) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [studentName, setStudentName] = useState("Student");
    useEffect(() => {
        Promise.all([
            fetch(`/api/students/${studentId}/reports`, {
                headers: { "x-tenant-id": tenantId },
            }).then((r) => r.json()),
            fetch(`/api/students/${studentId}`, {
                headers: { "x-tenant-id": tenantId },
            }).then((r) => r.json()),
        ])
            .then(([reportsRes, studentRes]) => {
            setReports(Array.isArray(reportsRes.data) ? reportsRes.data : []);
            if (studentRes.data) {
                const { first_name, last_name } = studentRes.data;
                setStudentName([first_name, last_name].filter(Boolean).join(" ") || "Student");
            }
            setLoading(false);
        })
            .catch(() => setLoading(false));
    }, [studentId, tenantId]);
    if (loading) {
        return (_jsx("div", { className: "space-y-2", children: [1, 2, 3].map((i) => _jsx("div", { className: "h-12 animate-pulse rounded-lg bg-white/5" }, i)) }));
    }
    if (reports.length === 0) {
        return (_jsxs("div", { className: "rounded-lg border border-dashed border-[#1c1c1e] bg-[#0a0a0c] p-6 text-center", children: [_jsx("p", { className: "text-sm text-[#505055]", children: "No Championship-Level reports found for this student." }), _jsx("p", { className: "text-xs text-[#303035] mt-1", children: "Reports will appear here as Stewie generates them." })] }));
    }
    return (_jsx("div", { className: "space-y-4", children: reports.map((report) => (_jsx(ChampionshipReportCard, { report: report, studentName: studentName }, report.id))) }));
}
function SessionsTab({ studentId }) {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetch(`/api/invoices?studentId=${studentId}`)
            .then((r) => r.json())
            .then((res) => {
            setInvoices(Array.isArray(res.data) ? res.data : []);
            setLoading(false);
        })
            .catch(() => setLoading(false));
    }, [studentId]);
    if (loading) {
        return (_jsx("div", { className: "space-y-2", children: [1, 2, 3].map((i) => _jsx("div", { className: "h-12 animate-pulse rounded-lg bg-white/5" }, i)) }));
    }
    if (invoices.length === 0) {
        return _jsx("div", { className: "text-sm text-[#505055]", children: "No sessions or invoices found for this student." });
    }
    const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
    const totalOutstanding = invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + i.amount, 0);
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-3", children: [_jsxs("div", { className: "rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-3", children: [_jsx("div", { className: "text-xs text-[#505055]", children: "Total Sessions" }), _jsx("div", { className: "text-xl font-bold text-white", children: invoices.length })] }), _jsxs("div", { className: "rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-3", children: [_jsx("div", { className: "text-xs text-[#505055]", children: "Total Paid" }), _jsxs("div", { className: "text-xl font-bold text-[#00ff88]", children: ["$", totalPaid.toFixed(2)] })] }), _jsxs("div", { className: "rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-3", children: [_jsx("div", { className: "text-xs text-[#505055]", children: "Outstanding" }), _jsxs("div", { className: `text-xl font-bold ${totalOutstanding > 0 ? "text-red-400" : "text-[#505055]"}`, children: ["$", totalOutstanding.toFixed(2)] })] })] }), _jsx("div", { className: "space-y-2", children: invoices.map((inv) => {
                    var _a, _b;
                    return (_jsxs("div", { className: "flex items-center gap-3 rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-3", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "text-sm font-semibold text-white", children: ["$", inv.amount.toFixed(2)] }), _jsxs("div", { className: "text-xs text-[#505055]", children: [(_a = inv.description) !== null && _a !== void 0 ? _a : "Session", " \u00B7 Due ", (_b = inv.due_date) !== null && _b !== void 0 ? _b : "—", inv.paid_date ? ` · Paid ${inv.paid_date}` : ""] })] }), _jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-semibold ${invoiceStatusBadge(inv.status)}`, children: inv.status })] }, inv.id));
                }) })] }));
}
// ─── Student Profile View ───────────────────────────────────────────────────────
function StudentProfileView({ studentId }) {
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetch(`/api/students/${studentId}`)
            .then((r) => r.json())
            .then((res) => {
            var _a, _b;
            setStudent((_b = (_a = res.data) !== null && _a !== void 0 ? _a : res) !== null && _b !== void 0 ? _b : null);
            setLoading(false);
        })
            .catch(() => setLoading(false));
    }, [studentId]);
    if (loading) {
        return _jsx("div", { className: "space-y-3", children: [1, 2, 3, 4].map(i => _jsx("div", { className: "h-10 animate-pulse rounded-lg bg-white/5" }, i)) });
    }
    if (!student) {
        return _jsx("div", { className: "text-sm text-[#505055]", children: "Student details unavailable." });
    }
    const rows = [
        { label: "Instrument", value: student.instrument },
        { label: "Status", value: student.status },
        { label: "Email", value: student.email },
        { label: "Phone", value: student.phone },
        { label: "Date of Birth", value: student.date_of_birth },
        { label: "Start Date", value: student.start_date },
        { label: "Rate / Session", value: student.rate_per_session != null ? `$${student.rate_per_session}` : null },
        { label: "Blocks / Week", value: student.blocks_per_week != null ? String(student.blocks_per_week) : null },
    ];
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] divide-y divide-[var(--z-border)]", children: rows.map(({ label, value }) => (_jsxs("div", { className: "flex items-center justify-between px-4 py-3", children: [_jsx("span", { className: "text-xs font-semibold uppercase tracking-widest text-[#505055]", children: label }), _jsx("span", { className: "text-sm text-[var(--z-fg)]", children: value !== null && value !== void 0 ? value : _jsx("span", { className: "text-[#303035]", children: "\u2014" }) })] }, label))) }), (student.bio || student.goals || student.learning_style || student.experience) && (_jsxs("div", { className: "rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-3", children: [_jsx("div", { className: "text-xs font-bold uppercase tracking-widest text-[#303035]", children: "Learning Profile" }), student.bio && _jsxs("div", { children: [_jsx("div", { className: "text-xs text-[#505055] mb-0.5", children: "Bio" }), _jsx("div", { className: "text-sm text-[var(--z-fg)]", children: student.bio })] }), student.goals && _jsxs("div", { children: [_jsx("div", { className: "text-xs text-[#505055] mb-0.5", children: "Goals" }), _jsx("div", { className: "text-sm text-[var(--z-fg)]", children: student.goals })] }), student.learning_style && _jsxs("div", { children: [_jsx("div", { className: "text-xs text-[#505055] mb-0.5", children: "Learning Style" }), _jsx("div", { className: "text-sm text-[var(--z-fg)]", children: student.learning_style })] }), student.experience && _jsxs("div", { children: [_jsx("div", { className: "text-xs text-[#505055] mb-0.5", children: "Prior Experience" }), _jsx("div", { className: "text-sm text-[var(--z-fg)]", children: student.experience })] })] })), (student.teacher_notes || student.notes) && (_jsxs("div", { className: "rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-3", children: [_jsx("div", { className: "text-xs font-bold uppercase tracking-widest text-[#303035]", children: "Notes" }), student.teacher_notes && _jsxs("div", { children: [_jsx("div", { className: "text-xs text-[#505055] mb-0.5", children: "Teacher Notes" }), _jsx("div", { className: "text-sm text-[var(--z-fg)]", children: student.teacher_notes })] }), student.notes && _jsxs("div", { children: [_jsx("div", { className: "text-xs text-[#505055] mb-0.5", children: "General Notes" }), _jsx("div", { className: "text-sm text-[var(--z-fg)]", children: student.notes })] })] }))] }));
}
// ─── Student Edit Form ────────────────────────────────────────────────────────
function StudentEditForm({ studentId, tenantId, onSaved }) {
    const [raw, setRaw] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState("idle");
    const [saveError, setSaveError] = useState(null);
    // Form fields
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [instrument, setInstrument] = useState("");
    const [status, setStatus] = useState("active");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [startDate, setStartDate] = useState("");
    const [ratePerSession, setRatePerSession] = useState("");
    const [blocksPerWeek, setBlocksPerWeek] = useState("");
    const [bio, setBio] = useState("");
    const [goals, setGoals] = useState("");
    const [learningStyle, setLearningStyle] = useState("");
    const [experience, setExperience] = useState("");
    const [teacherNotes, setTeacherNotes] = useState("");
    const [notes, setNotes] = useState("");
    useEffect(() => {
        fetch(`/api/students/${studentId}`, {
            headers: { "x-tenant-id": tenantId },
        })
            .then(r => r.json())
            .then(res => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
            const s = res.data;
            setRaw(s);
            setFirstName((_a = s.first_name) !== null && _a !== void 0 ? _a : "");
            setLastName((_b = s.last_name) !== null && _b !== void 0 ? _b : "");
            setInstrument((_c = s.instrument) !== null && _c !== void 0 ? _c : "");
            setStatus((_d = s.status) !== null && _d !== void 0 ? _d : "active");
            setEmail((_e = s.email) !== null && _e !== void 0 ? _e : "");
            setPhone((_f = s.phone) !== null && _f !== void 0 ? _f : "");
            setDateOfBirth((_g = s.date_of_birth) !== null && _g !== void 0 ? _g : "");
            setStartDate((_h = s.start_date) !== null && _h !== void 0 ? _h : "");
            setRatePerSession(s.rate_per_session != null ? String(s.rate_per_session) : "");
            setBlocksPerWeek(s.blocks_per_week != null ? String(s.blocks_per_week) : "");
            setBio((_j = s.bio) !== null && _j !== void 0 ? _j : "");
            setGoals((_k = s.goals) !== null && _k !== void 0 ? _k : "");
            setLearningStyle((_l = s.learning_style) !== null && _l !== void 0 ? _l : "");
            setExperience((_m = s.experience) !== null && _m !== void 0 ? _m : "");
            setTeacherNotes((_o = s.teacher_notes) !== null && _o !== void 0 ? _o : "");
            setNotes((_p = s.notes) !== null && _p !== void 0 ? _p : "");
            setLoading(false);
        })
            .catch(() => setLoading(false));
    }, [studentId, tenantId]);
    async function handleSave() {
        var _a;
        setSaving(true);
        setSaveStatus("idle");
        setSaveError(null);
        try {
            const patch = {
                first_name: firstName,
                last_name: lastName,
                instrument: instrument || null,
                status,
                email: email || null,
                phone: phone || null,
                date_of_birth: dateOfBirth || null,
                start_date: startDate || null,
                rate_per_session: ratePerSession ? parseFloat(ratePerSession) : undefined,
                blocks_per_week: blocksPerWeek ? parseInt(blocksPerWeek, 10) : undefined,
                bio: bio || null,
                goals: goals || null,
                learning_style: learningStyle || null,
                experience: experience || null,
                teacher_notes: teacherNotes || null,
                notes: notes || null,
            };
            const res = await fetch(`/api/students/${studentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "x-tenant-id": tenantId },
                body: JSON.stringify(patch),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error((_a = body.message) !== null && _a !== void 0 ? _a : `HTTP ${res.status}`);
            }
            setSaveStatus("success");
            setTimeout(() => { setSaveStatus("idle"); onSaved(); }, 2000);
        }
        catch (err) {
            setSaveStatus("error");
            setSaveError(err instanceof Error ? err.message : "Save failed");
        }
        finally {
            setSaving(false);
        }
    }
    if (loading) {
        return _jsx("div", { className: "space-y-3", children: [1, 2, 3, 4].map(i => _jsx("div", { className: "h-10 animate-pulse rounded-lg bg-white/5" }, i)) });
    }
    if (!raw) {
        return _jsx("div", { className: "text-sm text-red-400", children: "Could not load student data." });
    }
    const inputCls = "w-full rounded-lg border border-[#1c1c1e] bg-[#111113] px-3 py-2 text-sm text-white placeholder-[#404048] focus:border-[#00ff88]/30 focus:outline-none";
    const labelCls = "block text-xs font-semibold uppercase tracking-wider text-[#505055] mb-1";
    const sectionCls = "rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] p-4 space-y-3";
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: sectionCls, children: [_jsx("div", { className: "text-xs font-bold uppercase tracking-widest text-[#303035]", children: "Basic Info" }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: labelCls, children: "First Name" }), _jsx("input", { className: inputCls, value: firstName, onChange: e => setFirstName(e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Last Name" }), _jsx("input", { className: inputCls, value: lastName, onChange: e => setLastName(e.target.value) })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Instrument" }), _jsx("input", { className: inputCls, value: instrument, onChange: e => setInstrument(e.target.value), placeholder: "Guitar, Piano\u2026" })] }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Status" }), _jsxs("select", { className: inputCls, value: status, onChange: e => setStatus(e.target.value), children: [_jsx("option", { value: "active", children: "Active" }), _jsx("option", { value: "paused", children: "Paused" }), _jsx("option", { value: "inactive", children: "Inactive" }), _jsx("option", { value: "former", children: "Former" })] })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Email" }), _jsx("input", { className: inputCls, type: "email", value: email, onChange: e => setEmail(e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Phone" }), _jsx("input", { className: inputCls, type: "tel", value: phone, onChange: e => setPhone(e.target.value) })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Date of Birth" }), _jsx("input", { className: inputCls, type: "date", value: dateOfBirth, onChange: e => setDateOfBirth(e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Start Date" }), _jsx("input", { className: inputCls, type: "date", value: startDate, onChange: e => setStartDate(e.target.value) })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Rate / Session ($)" }), _jsx("input", { className: inputCls, type: "number", min: "0", step: "0.01", value: ratePerSession, onChange: e => setRatePerSession(e.target.value), placeholder: "0.00" })] }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Blocks / Week" }), _jsx("input", { className: inputCls, type: "number", min: "0", step: "1", value: blocksPerWeek, onChange: e => setBlocksPerWeek(e.target.value), placeholder: "1" })] })] })] }), _jsxs("div", { className: sectionCls, children: [_jsx("div", { className: "text-xs font-bold uppercase tracking-widest text-[#303035]", children: "Learning Profile" }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Bio" }), _jsx("textarea", { className: inputCls, rows: 2, value: bio, onChange: e => setBio(e.target.value), placeholder: "Brief student bio\u2026" })] }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Goals" }), _jsx("textarea", { className: inputCls, rows: 2, value: goals, onChange: e => setGoals(e.target.value), placeholder: "What does this student want to achieve?" })] }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Learning Style" }), _jsx("input", { className: inputCls, value: learningStyle, onChange: e => setLearningStyle(e.target.value), placeholder: "Visual, auditory, kinesthetic\u2026" })] }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Prior Experience" }), _jsx("input", { className: inputCls, value: experience, onChange: e => setExperience(e.target.value), placeholder: "Beginner, 2 years, etc." })] })] }), _jsxs("div", { className: sectionCls, children: [_jsx("div", { className: "text-xs font-bold uppercase tracking-widest text-[#303035]", children: "Teacher Notes" }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Private Teacher Notes" }), _jsx("textarea", { className: inputCls, rows: 3, value: teacherNotes, onChange: e => setTeacherNotes(e.target.value), placeholder: "Notes visible only to teachers and admins\u2026" })] }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "General Notes" }), _jsx("textarea", { className: inputCls, rows: 2, value: notes, onChange: e => setNotes(e.target.value), placeholder: "General notes\u2026" })] })] }), saveStatus === "success" && _jsx("p", { className: "text-sm text-green-500", children: "Student profile saved successfully." }), saveStatus === "error" && saveError && _jsxs("p", { className: "text-sm text-red-400", children: ["Error: ", saveError] }), _jsx("div", { className: "flex gap-3", children: _jsx("button", { onClick: handleSave, disabled: saving, className: "flex-1 rounded-xl bg-[#00ff88] py-3 text-sm font-bold text-black disabled:opacity-50", children: saving ? "Saving…" : "Save Profile" }) })] }));
}
function StudentDetailLoaded({ studentId }) {
    const [data, setData] = useState(null);
    const [err, setErr] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("profile");
    function reload() {
        setLoading(true);
        void loadStudentSurface(studentId, DEFAULT_TENANT_ID).then((res) => {
            setLoading(false);
            if (!res.ok) {
                setErr(res.error);
                setData(null);
            }
            else {
                setErr(null);
                setData(res.data);
            }
        });
    }
    useEffect(() => { reload(); }, [studentId]); // eslint-disable-line react-hooks/exhaustive-deps
    const agentStatus = useMemo(() => {
        if (!data)
            return "idle";
        if (data.blockers.length > 0)
            return "blocked";
        if (data.riskBand === "high")
            return "blocked";
        return "active";
    }, [data]);
    const TABS = [
        { id: "profile", label: "Profile" },
        { id: "edit", label: "Edit" },
        { id: "sessions", label: "Sessions" },
        { id: "timeline", label: "Timeline" },
        { id: "reports", label: "Reports" },
    ];
    return (_jsx(PageTransition, { children: _jsxs("div", { className: "mx-auto max-w-6xl space-y-4", "data-tour": "student-detail", children: [loading && _jsx("div", { className: "text-sm text-[var(--z-muted)]", children: "Loading\u2026" }), err && _jsx("div", { className: "text-sm text-[var(--z-danger)]", children: err }), data && (_jsxs(_Fragment, { children: [_jsx(PageHeader, { title: data.studentName, subtitle: `${data.stageName} · ${data.riskBand} risk` }), _jsx(AgentPageBar, { agentId: "sid", chatPlaceholder: "Ask Sid about this student\u2026", pageContext: {
                                page: "student-profile",
                                studentId,
                                studentName: data.studentName,
                                stageName: data.stageName,
                                riskBand: data.riskBand,
                                agentSummary: data.agentSummary,
                                nextActions: data.nextActions,
                                blockers: data.blockers,
                                agentStatus,
                            } }), _jsx("div", { className: "flex gap-1 border-b border-[#1c1c1e] overflow-x-auto", children: TABS.map((t) => (_jsx("button", { onClick: () => setTab(t.id), className: `shrink-0 px-4 py-2.5 text-sm font-semibold transition-colors ${tab === t.id
                                    ? "border-b-2 border-[#00ff88] text-[#00ff88]"
                                    : "text-[#505055] hover:text-[#909098]"}`, children: t.label }, t.id))) }), tab === "profile" && _jsx(StudentProfileView, { studentId: studentId }), tab === "edit" && (_jsx(StudentEditForm, { studentId: studentId, tenantId: DEFAULT_TENANT_ID, onSaved: () => { reload(); setTab("profile"); } })), tab === "sessions" && _jsx(SessionsTab, { studentId: studentId }), tab === "timeline" && _jsx(StudentTimeline, { events: data.timeline }), tab === "reports" && _jsx(ReportsTab, { studentId: studentId, tenantId: DEFAULT_TENANT_ID })] }))] }) }));
}
export function StudentDetailClient() {
    var _a;
    const params = useParams();
    const studentId = String((_a = params === null || params === void 0 ? void 0 : params.id) !== null && _a !== void 0 ? _a : "");
    if (!studentId) {
        return (_jsx("div", { className: "h-full overflow-y-auto overflow-x-hidden p-[var(--z-space-6)]", children: _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Missing student id." }) }));
    }
    return (_jsx("div", { className: "h-full overflow-y-auto overflow-x-hidden p-[var(--z-space-6)]", children: _jsx(StudentDetailLoaded, { studentId: studentId }, studentId) }));
}
