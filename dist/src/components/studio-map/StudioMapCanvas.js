"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Background, Controls, MiniMap, ReactFlow, ReactFlowProvider, useEdgesState, useNodesState, useReactFlow, } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { computeOpenSlotsForWindow, projectBlocksForWindow, } from "@/lib/schedule/windowedClient";
import { CompanyOrbNode, LocationOrbNode, StudentMiniNode, TeacherFlowOrbNode, } from "./StudioMapNodes";
const NODE_TYPES = {
    company: CompanyOrbNode,
    location: LocationOrbNode,
    teacher: TeacherFlowOrbNode,
    student: StudentMiniNode,
};
const COMPANY_H = 120;
// Tree layout constants
const TREE_ORIGIN_X = 80; // company orb left edge
const TREE_ORIGIN_Y = 60; // top padding
const LOC_COL_X = 280; // location orbs column x
const TEACHER_COL_X = 480; // teacher orbs column x
const STUDENT_COL_X = 660; // student orbs column x
const LOC_ROW_GAP = 160; // vertical gap between location rows
const TEACHER_ROW_GAP = 155; // vertical gap between teacher rows
const STUDENT_ROW_GAP = 90; // vertical gap between student rows
function formatTeacherName(t) {
    var _a, _b, _c;
    const any = t;
    if ((_a = any.display_name) === null || _a === void 0 ? void 0 : _a.trim())
        return any.display_name.trim();
    const first = ((_b = t.first_name) !== null && _b !== void 0 ? _b : "").trim();
    const last = ((_c = t.last_name) !== null && _c !== void 0 ? _c : "").trim();
    const combined = `${first} ${last}`.trim();
    return combined || "Teacher";
}
function teacherInitials(t) {
    const name = formatTeacherName(t);
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => { var _a; return (_a = p[0]) === null || _a === void 0 ? void 0 : _a.toUpperCase(); })
        .join("") || "?";
}
function initialsFromName(name) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => { var _a; return (_a = p[0]) === null || _a === void 0 ? void 0 : _a.toUpperCase(); })
        .join("") || "?";
}
function uniqueStudentCount(projected, teacherId) {
    const s = new Set();
    for (const b of projected) {
        if (b.teacher_id === teacherId && b.student_id)
            s.add(b.student_id);
    }
    return s.size;
}
function openSlotsForTeacher(openSlots, teacherId) {
    return openSlots.filter((o) => o.teacherId === teacherId).length;
}
function computeTreeLayout(locations, expandedLocs, locBundles, expandedTeachers, rosters, teacherKey) {
    const layout = { locations: {} };
    let cursor = TREE_ORIGIN_Y;
    for (const loc of locations) {
        const locY = cursor;
        layout.locations[loc.id] = { y: locY, teachers: {} };
        const expanded = expandedLocs.has(loc.id);
        const bundle = locBundles[loc.id];
        if (expanded && bundle && bundle.teachers.length > 0) {
            // Lay out teachers vertically
            let teacherCursor = locY;
            for (const teacher of bundle.teachers) {
                const tkey = teacherKey(loc.id, teacher.id);
                const tExpanded = expandedTeachers.has(tkey);
                const roster = rosters[tkey];
                const teacherY = teacherCursor;
                layout.locations[loc.id].teachers[teacher.id] = { y: teacherY, students: {} };
                if (tExpanded && roster && roster.length > 0) {
                    // Lay out students vertically
                    let studentCursor = teacherY;
                    for (const stu of roster) {
                        layout.locations[loc.id].teachers[teacher.id].students[stu.id] = studentCursor;
                        studentCursor += STUDENT_ROW_GAP;
                    }
                    // Teacher row height = max of its own height vs all its students
                    const teacherBlockHeight = Math.max(TEACHER_ROW_GAP, roster.length * STUDENT_ROW_GAP);
                    teacherCursor += teacherBlockHeight;
                }
                else {
                    teacherCursor += TEACHER_ROW_GAP;
                }
            }
            // Location row height = max of its own height vs all its teachers
            cursor = Math.max(locY + LOC_ROW_GAP, teacherCursor + 20);
        }
        else {
            cursor += LOC_ROW_GAP;
        }
    }
    return layout;
}
function StudioMapCanvasInner({ companyName, vanityLine, locations, scheduleWindow, initialFocusLocationId, }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { fitView } = useReactFlow();
    const [expandedLocs, setExpandedLocs] = React.useState(() => new Set());
    const [expandedTeachers, setExpandedTeachers] = React.useState(() => new Set());
    const [locLoading, setLocLoading] = React.useState(null);
    const [teacherLoading, setTeacherLoading] = React.useState(null);
    const [locBundles, setLocBundles] = React.useState({});
    const [rosters, setRosters] = React.useState({});
    const setLocationQuery = React.useCallback((locationId) => {
        const p = new URLSearchParams(searchParams.toString());
        p.set("locationId", locationId);
        router.replace(`${pathname}?${p.toString()}`, { scroll: false });
    }, [pathname, router, searchParams]);
    const fetchLocationBundle = React.useCallback(async (locationId) => {
        const { start, end } = scheduleWindow;
        const res = await fetch(`/api/studio-map/location?locationId=${encodeURIComponent(locationId)}&start=${start}&end=${end}`);
        if (!res.ok)
            throw new Error(`Location bundle failed (${res.status})`);
        return (await res.json());
    }, [scheduleWindow]);
    const fetchRoster = React.useCallback(async (locationId, teacherId) => {
        var _a;
        const { start, end } = scheduleWindow;
        const res = await fetch(`/api/studio-map/roster?locationId=${encodeURIComponent(locationId)}&teacherId=${encodeURIComponent(teacherId)}&start=${start}&end=${end}`);
        if (!res.ok)
            throw new Error(`Roster failed (${res.status})`);
        const body = (await res.json());
        return (_a = body.students) !== null && _a !== void 0 ? _a : [];
    }, [scheduleWindow]);
    const toggleLocation = React.useCallback(async (locationId) => {
        setLocationQuery(locationId);
        const wasOpen = expandedLocs.has(locationId);
        if (wasOpen) {
            setExpandedLocs((prev) => {
                const next = new Set(prev);
                next.delete(locationId);
                return next;
            });
            return;
        }
        setExpandedLocs((prev) => new Set(prev).add(locationId));
        if (!locBundles[locationId]) {
            setLocLoading(locationId);
            try {
                const bundle = await fetchLocationBundle(locationId);
                setLocBundles((prev) => (Object.assign(Object.assign({}, prev), { [locationId]: bundle })));
            }
            catch (e) {
                console.error(e);
                setExpandedLocs((prev) => {
                    const next = new Set(prev);
                    next.delete(locationId);
                    return next;
                });
            }
            finally {
                setLocLoading(null);
            }
        }
    }, [expandedLocs, fetchLocationBundle, locBundles, setLocationQuery]);
    const teacherKey = React.useCallback((locationId, teacherId) => `${locationId}::${teacherId}`, []);
    const toggleTeacher = React.useCallback(async (locationId, teacherId) => {
        const key = teacherKey(locationId, teacherId);
        const wasOpen = expandedTeachers.has(key);
        if (wasOpen) {
            setExpandedTeachers((prev) => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
            return;
        }
        setExpandedTeachers((prev) => new Set(prev).add(key));
        if (!rosters[key]) {
            setTeacherLoading(key);
            try {
                const students = await fetchRoster(locationId, teacherId);
                setRosters((prev) => (Object.assign(Object.assign({}, prev), { [key]: students })));
            }
            catch (e) {
                console.error(e);
                setExpandedTeachers((prev) => {
                    const next = new Set(prev);
                    next.delete(key);
                    return next;
                });
            }
            finally {
                setTeacherLoading(null);
            }
        }
    }, [expandedTeachers, fetchRoster, rosters]);
    const focusSeedRef = React.useRef(false);
    React.useEffect(() => {
        if (focusSeedRef.current)
            return;
        if (!initialFocusLocationId)
            return;
        if (!locations.some((l) => l.id === initialFocusLocationId))
            return;
        focusSeedRef.current = true;
        void toggleLocation(initialFocusLocationId);
    }, [initialFocusLocationId, locations, toggleLocation]);
    // Compute tree layout — no rings, no overlapping
    const treeLayout = React.useMemo(() => computeTreeLayout(locations, expandedLocs, locBundles, expandedTeachers, rosters, teacherKey), [locations, expandedLocs, locBundles, expandedTeachers, rosters, teacherKey]);
    // Total height of the tree for centering the company orb
    const treeHeight = React.useMemo(() => {
        const ys = Object.values(treeLayout.locations).map((l) => l.y);
        return ys.length ? Math.max(...ys) + LOC_ROW_GAP : LOC_ROW_GAP * 4;
    }, [treeLayout]);
    const nodes = React.useMemo(() => {
        const list = [];
        const companyCY = treeHeight / 2;
        list.push({
            id: "company",
            type: "company",
            position: { x: TREE_ORIGIN_X, y: companyCY - COMPANY_H / 2 },
            data: {
                label: companyName,
                subtitle: vanityLine,
            },
            draggable: true,
        });
        locations.forEach((loc) => {
            const locLayout = treeLayout.locations[loc.id];
            if (!locLayout)
                return;
            const expanded = expandedLocs.has(loc.id);
            const loading = locLoading === loc.id;
            const bundle = locBundles[loc.id];
            const teacherCount = bundle === null || bundle === void 0 ? void 0 : bundle.teachers.length;
            list.push({
                id: `loc|${loc.id}`,
                type: "location",
                position: { x: LOC_COL_X, y: locLayout.y },
                data: {
                    label: loc.name,
                    locationId: loc.id,
                    expanded,
                    loading,
                    teacherCount,
                    href: `/schedule?locationId=${encodeURIComponent(loc.id)}`,
                    onToggle: () => void toggleLocation(loc.id),
                },
                draggable: true,
            });
            if (!expanded || !bundle)
                return;
            const projected = projectBlocksForWindow(bundle.blocks, scheduleWindow.start, scheduleWindow.end);
            const openSlots = computeOpenSlotsForWindow({
                teacherIds: bundle.teachers.map((t) => t.id),
                availability: bundle.availability,
                projectedBlocks: projected,
                start: scheduleWindow.start,
                end: scheduleWindow.end,
            });
            bundle.teachers.forEach((teacher) => {
                const tLayout = locLayout.teachers[teacher.id];
                if (!tLayout)
                    return;
                const tkey = teacherKey(loc.id, teacher.id);
                const tExpanded = expandedTeachers.has(tkey);
                const tLoad = teacherLoading === tkey;
                const roster = rosters[tkey];
                const stCount = uniqueStudentCount(projected, teacher.id);
                const openN = openSlotsForTeacher(openSlots, teacher.id);
                list.push({
                    id: `teacher|${loc.id}|${teacher.id}`,
                    type: "teacher",
                    position: { x: TEACHER_COL_X, y: tLayout.y },
                    data: {
                        label: formatTeacherName(teacher),
                        initials: teacherInitials(teacher),
                        teacherId: teacher.id,
                        locationId: loc.id,
                        expanded: tExpanded,
                        loading: tLoad,
                        studentCount: stCount,
                        openSlotCount: openN,
                        href: `/teachers/${encodeURIComponent(teacher.id)}`,
                        onToggle: () => void toggleTeacher(loc.id, teacher.id),
                    },
                    draggable: true,
                });
                if (!tExpanded || !roster)
                    return;
                roster.forEach((stu) => {
                    const stuY = tLayout.students[stu.id];
                    if (stuY === undefined)
                        return;
                    list.push({
                        id: `student|${loc.id}|${teacher.id}|${stu.id}`,
                        type: "student",
                        position: { x: STUDENT_COL_X, y: stuY },
                        data: {
                            studentId: stu.id,
                            label: stu.name,
                            initials: initialsFromName(stu.name),
                            active: stu.status === "active",
                            href: `/students/${encodeURIComponent(stu.id)}`,
                        },
                        draggable: true,
                    });
                });
            });
        });
        return list;
    }, [
        companyName,
        vanityLine,
        locations,
        treeLayout,
        treeHeight,
        expandedLocs,
        locLoading,
        locBundles,
        expandedTeachers,
        teacherLoading,
        rosters,
        scheduleWindow,
        toggleLocation,
        toggleTeacher,
        teacherKey,
    ]);
    const edges = React.useMemo(() => {
        var _a;
        const e = [];
        for (const loc of locations) {
            const locColors = {
                "f7b52dd5-12ee-437f-9c60-f8adf454ac31": "rgba(124,58,237,",
                "40c67ffc-91b5-46a9-94bd-6ddffdfb7638": "rgba(22,163,74,",
                "cebd97d4-c241-4de2-8ade-49e5cc0070d5": "rgba(14,165,233,",
                "d48229c1-b70a-4d29-893e-5079887dab76": "rgba(220,38,38,",
            };
            const lc = (_a = locColors[loc.id]) !== null && _a !== void 0 ? _a : "rgba(99,102,241,";
            e.push({
                id: `e-company-loc-${loc.id}`,
                source: "company",
                target: `loc|${loc.id}`,
                type: "smoothstep",
                animated: expandedLocs.has(loc.id),
                style: { stroke: `${lc}0.5)`, strokeWidth: 1.5 },
            });
            const bundle = locBundles[loc.id];
            if (!bundle || !expandedLocs.has(loc.id))
                continue;
            for (const teacher of bundle.teachers) {
                e.push({
                    id: `e-loc-t-${loc.id}-${teacher.id}`,
                    source: `loc|${loc.id}`,
                    target: `teacher|${loc.id}|${teacher.id}`,
                    type: "smoothstep",
                    style: { stroke: `${lc}0.35)`, strokeWidth: 1.25 },
                });
                const tkey = teacherKey(loc.id, teacher.id);
                if (!expandedTeachers.has(tkey))
                    continue;
                const roster = rosters[tkey];
                if (!roster)
                    continue;
                for (const stu of roster) {
                    e.push({
                        id: `e-t-s-${loc.id}-${teacher.id}-${stu.id}`,
                        source: `teacher|${loc.id}|${teacher.id}`,
                        target: `student|${loc.id}|${teacher.id}|${stu.id}`,
                        type: "smoothstep",
                        style: { stroke: `${lc}0.2)`, strokeWidth: 1 },
                    });
                }
            }
        }
        return e;
    }, [locations, expandedLocs, locBundles, expandedTeachers, rosters, teacherKey]);
    const [rfNodes, setNodes, onNodesChange] = useNodesState(nodes);
    const [rfEdges, setEdges, onEdgesChange] = useEdgesState(edges);
    React.useEffect(() => {
        setNodes(nodes);
    }, [nodes, setNodes]);
    React.useEffect(() => {
        setEdges(edges);
    }, [edges, setEdges]);
    const layoutTick = React.useMemo(() => `${expandedLocs.size}:${expandedTeachers.size}:${Object.keys(locBundles).length}:${Object.keys(rosters).length}`, [expandedLocs, expandedTeachers, locBundles, rosters]);
    React.useEffect(() => {
        const t = window.setTimeout(() => {
            void fitView({ padding: 0.18, duration: 380 });
        }, 60);
        return () => window.clearTimeout(t);
    }, [layoutTick, fitView]);
    return (_jsx("div", { className: "studio-map-flow relative h-[min(80vh,860px)] w-full overflow-hidden rounded-2xl border border-white/10 [&_.react-flow\\_\\_attribution]:hidden", style: { background: 'radial-gradient(ellipse at 50% 35%, #0f0f2e 0%, #060610 100%)' }, children: _jsxs(ReactFlow, { nodes: rfNodes, edges: rfEdges, onNodesChange: onNodesChange, onEdgesChange: onEdgesChange, nodeTypes: NODE_TYPES, fitView: true, minZoom: 0.35, maxZoom: 1.65, proOptions: { hideAttribution: true }, className: "bg-transparent", children: [_jsx(Background, { gap: 30, size: 1, color: "rgba(255,255,255,0.05)" }), _jsx(Controls, { className: "!m-3 !overflow-hidden !rounded-lg !border !border-white/10 !bg-black/60 !shadow-xl [&_button]:!text-white/70 [&_button:hover]:!text-white [&_button]:!bg-transparent", showInteractive: false }), _jsx(MiniMap, { className: "!m-3 !overflow-hidden !rounded-lg !border !border-white/10 !bg-black/60", maskColor: "rgba(6,6,16,0.7)", nodeStrokeWidth: 2, nodeColor: "rgba(255,255,255,0.15)" })] }) }));
}
export function StudioMapCanvas(props) {
    return (_jsx(ReactFlowProvider, { children: _jsx(StudioMapCanvasInner, Object.assign({}, props)) }));
}
