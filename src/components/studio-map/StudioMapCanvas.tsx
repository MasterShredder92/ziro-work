"use client";

import * as React from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Teacher } from "@/lib/types/entities";
import type { ScheduleWindow } from "@/lib/schedule/window";
import {
  computeOpenSlotsForWindow,
  projectBlocksForWindow,
  type OpenSlot,
  type ProjectedBlock,
} from "@/lib/schedule/windowedClient";
import type { StudioMapLocationPayload } from "@/app/api/studio-map/location/route";
import type { StudioMapRosterStudent } from "@/app/api/studio-map/roster/route";
import {
  AgentsSatelliteNode,
  CompanyOrbNode,
  LocationOrbNode,
  StudentMiniNode,
  TeacherFlowOrbNode,
} from "./StudioMapNodes";

const NODE_TYPES = {
  company: CompanyOrbNode,
  location: LocationOrbNode,
  teacher: TeacherFlowOrbNode,
  student: StudentMiniNode,
  agents: AgentsSatelliteNode,
} satisfies NodeTypes;

const COMPANY_W = 120;
const COMPANY_H = 120;
const LOC_W = 96;
const LOC_H = 112;
const TE_W = 100;
const TE_H = 140;
const ST_W = 72;
const ST_H = 72;

function formatTeacherName(t: Teacher): string {
  const any = t as Teacher & { display_name?: string | null };
  if (any.display_name?.trim()) return any.display_name.trim();
  const first = (t.first_name ?? "").trim();
  const last = (t.last_name ?? "").trim();
  const combined = `${first} ${last}`.trim();
  return combined || "Teacher";
}

function teacherInitials(t: Teacher): string {
  const name = formatTeacherName(t);
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";
}

function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";
}

function uniqueStudentCount(projected: ProjectedBlock[], teacherId: string): number {
  const s = new Set<string>();
  for (const b of projected) {
    if (b.teacher_id === teacherId && b.student_id) s.add(b.student_id);
  }
  return s.size;
}

function openSlotsForTeacher(openSlots: OpenSlot[], teacherId: string): number {
  return openSlots.filter((o) => o.teacherId === teacherId).length;
}

function ringXY(
  index: number,
  total: number,
  cx: number,
  cy: number,
  radius: number,
  w: number,
  h: number,
): { x: number; y: number } {
  const n = Math.max(total, 1);
  const angle = (2 * Math.PI * index) / n - Math.PI / 2;
  return {
    x: cx + radius * Math.cos(angle) - w / 2,
    y: cy + radius * Math.sin(angle) - h / 2,
  };
}

function studentRingPositions(
  count: number,
  cx: number,
  cy: number,
): Array<{ x: number; y: number }> {
  const out: Array<{ x: number; y: number }> = [];
  const first = Math.min(count, 8);
  const second = Math.max(0, count - 8);
  const r1 = 125;
  const r2 = 195;
  for (let i = 0; i < first; i++) {
    out.push(ringXY(i, first, cx, cy, r1, ST_W, ST_H));
  }
  for (let i = 0; i < second; i++) {
    out.push(ringXY(i, second, cx, cy, r2, ST_W, ST_H));
  }
  return out;
}

type CanvasInnerProps = {
  companyName: string;
  vanityLine: string;
  locations: Array<{ id: string; name: string }>;
  scheduleWindow: ScheduleWindow;
  initialFocusLocationId: string | null;
};

function StudioMapCanvasInner({
  companyName,
  vanityLine,
  locations,
  scheduleWindow,
  initialFocusLocationId,
}: CanvasInnerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { fitView } = useReactFlow();

  const [expandedLocs, setExpandedLocs] = React.useState<Set<string>>(() => new Set());
  const [expandedTeachers, setExpandedTeachers] = React.useState<Set<string>>(() => new Set());
  const [locLoading, setLocLoading] = React.useState<string | null>(null);
  const [teacherLoading, setTeacherLoading] = React.useState<string | null>(null);
  const [locBundles, setLocBundles] = React.useState<Record<string, StudioMapLocationPayload>>({});
  const [rosters, setRosters] = React.useState<Record<string, StudioMapRosterStudent[]>>({});

  const cx = 520;
  const cy = 340;
  const rLoc = Math.min(300, 140 + locations.length * 28);

  const setLocationQuery = React.useCallback(
    (locationId: string) => {
      const p = new URLSearchParams(searchParams.toString());
      p.set("locationId", locationId);
      router.replace(`${pathname}?${p.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const fetchLocationBundle = React.useCallback(
    async (locationId: string) => {
      const { start, end } = scheduleWindow;
      const res = await fetch(
        `/api/studio-map/location?locationId=${encodeURIComponent(locationId)}&start=${start}&end=${end}`,
      );
      if (!res.ok) throw new Error(`Location bundle failed (${res.status})`);
      return (await res.json()) as StudioMapLocationPayload;
    },
    [scheduleWindow],
  );

  const fetchRoster = React.useCallback(
    async (locationId: string, teacherId: string) => {
      const { start, end } = scheduleWindow;
      const res = await fetch(
        `/api/studio-map/roster?locationId=${encodeURIComponent(locationId)}&teacherId=${encodeURIComponent(teacherId)}&start=${start}&end=${end}`,
      );
      if (!res.ok) throw new Error(`Roster failed (${res.status})`);
      const body = (await res.json()) as { students?: StudioMapRosterStudent[] };
      return body.students ?? [];
    },
    [scheduleWindow],
  );

  const toggleLocation = React.useCallback(
    async (locationId: string) => {
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
          setLocBundles((prev) => ({ ...prev, [locationId]: bundle }));
        } catch (e) {
          console.error(e);
          setExpandedLocs((prev) => {
            const next = new Set(prev);
            next.delete(locationId);
            return next;
          });
        } finally {
          setLocLoading(null);
        }
      }
    },
    [expandedLocs, fetchLocationBundle, locBundles, setLocationQuery],
  );

  const teacherKey = (locationId: string, teacherId: string) => `${locationId}::${teacherId}`;

  const toggleTeacher = React.useCallback(
    async (locationId: string, teacherId: string) => {
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
          setRosters((prev) => ({ ...prev, [key]: students }));
        } catch (e) {
          console.error(e);
          setExpandedTeachers((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        } finally {
          setTeacherLoading(null);
        }
      }
    },
    [expandedTeachers, fetchRoster, rosters],
  );

  const focusSeedRef = React.useRef(false);
  React.useEffect(() => {
    if (focusSeedRef.current) return;
    if (!initialFocusLocationId) return;
    if (!locations.some((l) => l.id === initialFocusLocationId)) return;
    focusSeedRef.current = true;
    void toggleLocation(initialFocusLocationId);
  }, [initialFocusLocationId, locations, toggleLocation]);

  const nodes: Node[] = React.useMemo(() => {
    const list: Node[] = [];
    list.push({
      id: "company",
      type: "company",
      position: { x: cx - COMPANY_W / 2, y: cy - COMPANY_H / 2 },
      data: {
        label: companyName,
        subtitle: vanityLine,
      },
      draggable: true,
    });

    list.push({
      id: "agents",
      type: "agents",
      position: { x: cx + 420, y: 40 },
      data: { href: "/automation" },
      draggable: true,
    });

    const nLocs = locations.length || 1;
    locations.forEach((loc, i) => {
      const pos = ringXY(i, nLocs, cx, cy, rLoc, LOC_W, LOC_H);
      const expanded = expandedLocs.has(loc.id);
      const loading = locLoading === loc.id;
      const bundle = locBundles[loc.id];
      const teacherCount = bundle?.teachers.length;

      list.push({
        id: `loc|${loc.id}`,
        type: "location",
        position: pos,
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

      if (!expanded || !bundle) return;

      const projected = projectBlocksForWindow(bundle.blocks, scheduleWindow.start, scheduleWindow.end);
      const openSlots = computeOpenSlotsForWindow({
        teacherIds: bundle.teachers.map((t) => t.id),
        availability: bundle.availability,
        projectedBlocks: projected,
        start: scheduleWindow.start,
        end: scheduleWindow.end,
      });

      const lx = pos.x + LOC_W / 2;
      const ly = pos.y + LOC_H / 2;
      const rTeach = Math.min(210, 110 + bundle.teachers.length * 14);
      const tCount = bundle.teachers.length;

      bundle.teachers.forEach((teacher, j) => {
        const tp = ringXY(j, tCount, lx, ly, rTeach, TE_W, TE_H);
        const tkey = teacherKey(loc.id, teacher.id);
        const tExpanded = expandedTeachers.has(tkey);
        const tLoad = teacherLoading === tkey;
        const roster = rosters[tkey];
        const stCount = uniqueStudentCount(projected, teacher.id);
        const openN = openSlotsForTeacher(openSlots, teacher.id);

        list.push({
          id: `teacher|${loc.id}|${teacher.id}`,
          type: "teacher",
          position: tp,
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

        if (!tExpanded || !roster) return;

        const tcx = tp.x + TE_W / 2;
        const tcy = tp.y + TE_H / 2;
        const coords = studentRingPositions(roster.length, tcx, tcy);
        roster.forEach((stu, k) => {
          const sp = coords[k] ?? { x: tcx + k * 8, y: tcy + 120 };
          list.push({
            id: `student|${loc.id}|${teacher.id}|${stu.id}`,
            type: "student",
            position: sp,
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
    cx,
    cy,
    rLoc,
    expandedLocs,
    locLoading,
    locBundles,
    expandedTeachers,
    teacherLoading,
    rosters,
    scheduleWindow,
    toggleLocation,
    toggleTeacher,
  ]);

  const edges: Edge[] = React.useMemo(() => {
    const e: Edge[] = [];
    e.push({
      id: "e-company-agents",
      source: "company",
      target: "agents",
      type: "smoothstep",
      style: {
        strokeDasharray: "5 5",
        stroke: "rgba(167,139,250,0.35)",
        strokeWidth: 1,
      },
    });
    for (const loc of locations) {
      const locColors: Record<string, string> = {
        "f7b52dd5-12ee-437f-9c60-f8adf454ac31": "rgba(124,58,237,",
        "40c67ffc-91b5-46a9-94bd-6ddffdfb7638": "rgba(22,163,74,",
        "cebd97d4-c241-4de2-8ade-49e5cc0070d5": "rgba(14,165,233,",
        "d48229c1-b70a-4d29-893e-5079887dab76": "rgba(220,38,38,",
      };
      const lc = locColors[loc.id] ?? "rgba(99,102,241,";
      e.push({
        id: `e-company-loc-${loc.id}`,
        source: "company",
        target: `loc|${loc.id}`,
        type: "smoothstep",
        animated: expandedLocs.has(loc.id),
        style: { stroke: `${lc}0.5)`, strokeWidth: 1.5 },
      });

      const bundle = locBundles[loc.id];
      if (!bundle || !expandedLocs.has(loc.id)) continue;

      for (const teacher of bundle.teachers) {
        e.push({
          id: `e-loc-t-${loc.id}-${teacher.id}`,
          source: `loc|${loc.id}`,
          target: `teacher|${loc.id}|${teacher.id}`,
          type: "smoothstep",
          style: { stroke: `${lc}0.35)`, strokeWidth: 1.25 },
        });

        const tkey = teacherKey(loc.id, teacher.id);
        if (!expandedTeachers.has(tkey)) continue;
        const roster = rosters[tkey];
        if (!roster) continue;

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
  }, [locations, expandedLocs, locBundles, expandedTeachers, rosters, scheduleWindow]);

  const [rfNodes, setNodes, onNodesChange] = useNodesState(nodes);
  const [rfEdges, setEdges, onEdgesChange] = useEdgesState(edges);

  React.useEffect(() => {
    setNodes(nodes);
  }, [nodes, setNodes]);

  React.useEffect(() => {
    setEdges(edges);
  }, [edges, setEdges]);

  const layoutTick = React.useMemo(
    () =>
      `${expandedLocs.size}:${expandedTeachers.size}:${Object.keys(locBundles).length}:${Object.keys(rosters).length}`,
    [expandedLocs, expandedTeachers, locBundles, rosters],
  );

  React.useEffect(() => {
    const t = window.setTimeout(() => {
      void fitView({ padding: 0.18, duration: 380 });
    }, 60);
    return () => window.clearTimeout(t);
  }, [layoutTick, fitView]);

  return (
    <div
      className="studio-map-flow relative h-[min(80vh,860px)] w-full overflow-hidden rounded-2xl border border-white/10 [&_.react-flow\_\_attribution]:hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 35%, #0f0f2e 0%, #060610 100%)' }}
    >
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={NODE_TYPES}
        fitView
        minZoom={0.35}
        maxZoom={1.65}
        proOptions={{ hideAttribution: true }}
        className="bg-transparent"
      >
        <Background gap={30} size={1} color="rgba(255,255,255,0.05)" />
        <Controls
          className="!m-3 !overflow-hidden !rounded-lg !border !border-white/10 !bg-black/60 !shadow-xl [&_button]:!text-white/70 [&_button:hover]:!text-white [&_button]:!bg-transparent"
          showInteractive={false}
        />
        <MiniMap
          className="!m-3 !overflow-hidden !rounded-lg !border !border-white/10 !bg-black/60"
          maskColor="rgba(6,6,16,0.7)"
          nodeStrokeWidth={2}
          nodeColor="rgba(255,255,255,0.15)"
        />
      </ReactFlow>
    </div>
  );
}

export type StudioMapCanvasProps = CanvasInnerProps;

export function StudioMapCanvas(props: StudioMapCanvasProps) {
  return (
    <ReactFlowProvider>
      <StudioMapCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
