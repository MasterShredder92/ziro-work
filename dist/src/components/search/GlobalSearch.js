"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useStudents } from "@/hooks/data/useStudents";
import { useFamilies } from "@/hooks/data/useFamilies";
import { useTeachers } from "@/hooks/data/useTeachers";
import { useInvoices } from "@/hooks/data/useInvoices";
import { GlobalSearchInput } from "@/components/search/GlobalSearchInput";
import { GlobalSearchResults, } from "@/components/search/GlobalSearchResults";
import { bestFuzzyScore } from "@/lib/search/fuzzy";
const PAGE = { mode: "offset", page: 1, pageSize: 80 };
function studentFields(s) {
    var _a, _b, _c, _d;
    return [
        s.name,
        (_a = s.email) !== null && _a !== void 0 ? _a : "",
        (_b = s.phone) !== null && _b !== void 0 ? _b : "",
        s.status,
        (_c = s.onboarding_stage) !== null && _c !== void 0 ? _c : "",
        (_d = s.churn_risk) !== null && _d !== void 0 ? _d : "",
    ];
}
function familyFields(f) {
    var _a, _b;
    return [f.name, (_a = f.primary_email) !== null && _a !== void 0 ? _a : "", (_b = f.primary_phone) !== null && _b !== void 0 ? _b : ""];
}
function teacherFields(t) {
    var _a, _b;
    return [t.name, (_a = t.email) !== null && _a !== void 0 ? _a : "", (_b = t.phone) !== null && _b !== void 0 ? _b : "", t.status];
}
function invoiceFields(inv) {
    var _a, _b;
    return [
        (_a = inv.description) !== null && _a !== void 0 ? _a : "",
        inv.status,
        (_b = inv.external_ref) !== null && _b !== void 0 ? _b : "",
        String(inv.amount_cents),
        inv.id,
    ];
}
function formatMoney(cents, currency) {
    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: currency || "USD",
            maximumFractionDigits: 0,
        }).format(cents / 100);
    }
    catch (_a) {
        return `${(cents / 100).toFixed(0)} ${currency}`;
    }
}
export function GlobalSearch({ tenantId, onClose }) {
    var _a, _b, _c, _d, _e;
    const router = useRouter();
    const [query, setQuery] = React.useState("");
    const trimmed = query.trim();
    const studentParams = React.useMemo(() => ({
        tenantId,
        page: PAGE,
        search: trimmed.length ? trimmed : undefined,
    }), [tenantId, trimmed]);
    const familyParams = React.useMemo(() => ({
        tenantId,
        page: PAGE,
        search: trimmed.length ? trimmed : undefined,
    }), [tenantId, trimmed]);
    const teacherParams = React.useMemo(() => ({
        tenantId,
        page: PAGE,
        search: trimmed.length ? trimmed : undefined,
    }), [tenantId, trimmed]);
    const invoiceParams = React.useMemo(() => ({
        tenantId,
        page: PAGE,
        filters: undefined,
    }), [tenantId]);
    const fetchEnabled = trimmed.length > 0 && tenantId.length > 0;
    const students = useStudents(studentParams, { enabled: fetchEnabled });
    const families = useFamilies(familyParams, { enabled: fetchEnabled });
    const teachers = useTeachers(teacherParams, { enabled: fetchEnabled });
    const invoices = useInvoices(invoiceParams, { enabled: fetchEnabled });
    const loading = fetchEnabled &&
        (students.isLoading || families.isLoading || teachers.isLoading || invoices.isLoading);
    const results = React.useMemo(() => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        if (!trimmed.length)
            return [];
        const q = trimmed;
        const out = [];
        const st = (_b = (_a = students.data) === null || _a === void 0 ? void 0 : _a.items) !== null && _b !== void 0 ? _b : [];
        for (const s of st) {
            if (bestFuzzyScore(q, studentFields(s)) < 0.28)
                continue;
            out.push({
                id: `student:${s.id}`,
                group: "students",
                title: s.name,
                description: [s.email, s.phone].filter(Boolean).join(" · ") || s.status,
                href: `/students/${s.id}`,
                badge: s.status,
                badgeVariant: s.status === "active" ? "success" : "neutral",
            });
        }
        const fa = (_d = (_c = families.data) === null || _c === void 0 ? void 0 : _c.items) !== null && _d !== void 0 ? _d : [];
        for (const f of fa) {
            if (bestFuzzyScore(q, familyFields(f)) < 0.28)
                continue;
            out.push({
                id: `family:${f.id}`,
                group: "families",
                title: f.name,
                description: [f.primary_email, f.primary_phone].filter(Boolean).join(" · ") || undefined,
                href: "/families",
                badge: "Family",
                badgeVariant: "neutral",
            });
        }
        const te = (_f = (_e = teachers.data) === null || _e === void 0 ? void 0 : _e.items) !== null && _f !== void 0 ? _f : [];
        for (const t of te) {
            if (bestFuzzyScore(q, teacherFields(t)) < 0.28)
                continue;
            out.push({
                id: `teacher:${t.id}`,
                group: "teachers",
                title: t.name,
                description: [t.email, t.phone].filter(Boolean).join(" · ") || t.status,
                href: `/teachers/${t.id}`,
                badge: t.status,
                badgeVariant: t.status === "active" ? "success" : "neutral",
            });
        }
        const inv = (_h = (_g = invoices.data) === null || _g === void 0 ? void 0 : _g.items) !== null && _h !== void 0 ? _h : [];
        for (const row of inv) {
            if (bestFuzzyScore(q, invoiceFields(row)) < 0.28)
                continue;
            out.push({
                id: `invoice:${row.id}`,
                group: "invoices",
                title: ((_j = row.description) === null || _j === void 0 ? void 0 : _j.trim()) || `Invoice ${row.id.slice(0, 8)}`,
                description: `${formatMoney(row.amount_cents, row.currency)} · ${row.status}`,
                href: "/invoices",
                badge: row.status,
                badgeVariant: row.status === "overdue" ? "danger" : row.status === "paid" ? "success" : "warning",
            });
        }
        for (const s of st) {
            if (!s.onboarding_stage)
                continue;
            const stageScore = bestFuzzyScore(q, [
                s.name,
                s.onboarding_stage,
                "onboarding",
                "at risk",
                "lifecycle",
            ]);
            if (stageScore < 0.28)
                continue;
            out.push({
                id: `stage:${s.id}:${s.onboarding_stage}`,
                group: "stages",
                title: s.name,
                description: `Stage: ${s.onboarding_stage.replace(/_/g, " ")}`,
                href: `/students/${s.id}`,
                badge: s.onboarding_stage.replace(/_/g, " "),
                badgeVariant: s.onboarding_stage === "at_risk" ? "danger" : "success",
            });
        }
        return out;
    }, [trimmed, students.data, families.data, teachers.data, invoices.data]);
    const firstHref = (_a = results[0]) === null || _a === void 0 ? void 0 : _a.href;
    const error = ((_b = students.error) === null || _b === void 0 ? void 0 : _b.message) ||
        ((_c = families.error) === null || _c === void 0 ? void 0 : _c.message) ||
        ((_d = teachers.error) === null || _d === void 0 ? void 0 : _d.message) ||
        ((_e = invoices.error) === null || _e === void 0 ? void 0 : _e.message);
    return (_jsxs("div", { children: [_jsx(GlobalSearchInput, { value: query, onChange: setQuery, autoFocus: true, onSelect: () => {
                    if (firstHref) {
                        router.push(firstHref);
                        onClose === null || onClose === void 0 ? void 0 : onClose();
                    }
                } }), !trimmed.length ? (_jsx("p", { className: "mt-[var(--z-space-4)] text-xs text-[var(--z-muted)]", children: "Type a name, email, phone, status, or invoice detail. Results load as you type." })) : loading ? (_jsx("p", { className: "mt-[var(--z-space-4)] text-xs text-[var(--z-muted)]", children: "Searching\u2026" })) : error ? (_jsx("p", { className: "mt-[var(--z-space-4)] text-xs text-[var(--z-danger)]", children: error })) : results.length === 0 ? (_jsx("p", { className: "mt-[var(--z-space-4)] text-xs text-[var(--z-muted)]", children: "No matches yet." })) : (_jsx(GlobalSearchResults, { results: results }))] }));
}
