"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2,
  Sparkles,
  Orbit,
  Plus,
  Pencil,
  Trash2,
  GripHorizontal,
  ArrowLeft,
  AlertCircle,
  Bot,
  MessageSquare,
} from "lucide-react";
import clsx from "clsx";
import ZirorbFormModal, { type ZirorbRecord } from "@/components/ZirorbFormModal";

interface AgentRecord {
  id: string;
  slug: string;
  name: string;
  role: string;
  status: string;
  color: string;
  mode: string;
  zirorb_id: string | null;
  zirorb_sort?: number;
  purpose: string | null;
  is_archived: boolean;
}

const MOBILE_UNASSIGNED_Z: ZirorbRecord = {
  id: "__unassigned__",
  slug: "unassigned",
  name: "Unassigned",
  description: null,
  family: "vertical",
  accent_color: "#6b7280",
  sort_order: 99999,
};

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

/** Auto layout when board coords missing (0–100). */
function autoBoardXY(index: number, total: number, family: string): { x: number; y: number } {
  const coreBoost = family === "core" ? -0.08 : 0;
  const t = total <= 1 ? 0.5 : index / (total - 1);
  const angle = Math.PI * (0.25 + t * 0.5) + coreBoost * Math.PI;
  const r = 34;
  return {
    x: clamp(50 + Math.cos(angle) * r, 12, 88),
    y: clamp(42 + Math.sin(angle) * r * 0.85, 28, 82),
  };
}

function effectiveXY(
  z: ZirorbRecord,
  index: number,
  sorted: ZirorbRecord[]
): { x: number; y: number } {
  const bx = z.board_x;
  const by = z.board_y;
  if (bx != null && by != null && Number.isFinite(bx) && Number.isFinite(by)) {
    return { x: clamp(bx, 4, 96), y: clamp(by, 8, 92) };
  }
  return autoBoardXY(index, sorted.length, z.family);
}

const MIN_ZIRORB_SEP = 13; // percent space — keep clusters readable

/** Nudge one Zirorb away from peers so centers stay separated. */
function nudgeAgainstPeers(
  id: string,
  x: number,
  y: number,
  sorted: ZirorbRecord[]
): { x: number; y: number } {
  let cx = x;
  let cy = y;
  for (let pass = 0; pass < 5; pass++) {
    for (const o of sorted) {
      if (o.id === id) continue;
      const i = sorted.indexOf(o);
      const { x: ox, y: oy } = effectiveXY(o, i, sorted);
      const dx = cx - ox;
      const dy = cy - oy;
      const d = Math.hypot(dx, dy) || 0.001;
      if (d >= MIN_ZIRORB_SEP) continue;
      const push = (MIN_ZIRORB_SEP - d) * 0.5;
      cx += (dx / d) * push;
      cy += (dy / d) * push;
      cx = clamp(cx, 6, 94);
      cy = clamp(cy, 14, 90);
    }
  }
  return { x: cx, y: cy };
}

type ZirorbKey = string | "unassigned";

function zirorbKey(zid: string | null): ZirorbKey {
  return zid || "unassigned";
}

type AgentOrganizationBoardProps = {
  /** Opens the right chat panel (wired from app shell). */
  onOpenAgentChat?: (agent: AgentRecord) => void;
};

export default function AgentOrganizationBoard({ onOpenAgentChat }: AgentOrganizationBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isMdUp, setIsMdUp] = useState(true);
  const [loading, setLoading] = useState(true);
  const [zirorbs, setZirorbs] = useState<ZirorbRecord[]>([]);
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [starAgent, setStarAgent] = useState<AgentRecord | null>(null);
  const [zirorbModal, setZirorbModal] = useState<"create" | ZirorbRecord | null>(null);
  const [focusedZirorbId, setFocusedZirorbId] = useState<string | "unassigned" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [dragAgentId, setDragAgentId] = useState<string | null>(null);
  const [draggingZirorbNodeId, setDraggingZirorbNodeId] = useState<string | null>(null);
  /** Desktop viewport: pan (px) + zoom — transform on inner layer */
  const [vp, setVp] = useState({ s: 1, tx: 0, ty: 0 });
  const dragZirorbRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    w: number;
    h: number;
  } | null>(null);
  const zirorbsRef = useRef(zirorbs);
  zirorbsRef.current = zirorbs;

  const sortedZirorbs = useMemo(
    () => [...zirorbs].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
    [zirorbs]
  );

  const agentsByZirorb = useMemo(() => {
    const m = new Map<string | "unassigned", AgentRecord[]>();
    m.set("unassigned", []);
    for (const z of zirorbs) m.set(String(z.id), []);
    for (const a of agents) {
      const raw = a.zirorb_id;
      const rid = raw != null && String(raw).trim() !== "" ? String(raw).trim() : null;
      const k: ZirorbKey = rid && m.has(rid) ? rid : "unassigned";
      (m.get(k) as AgentRecord[]).push(a);
    }
    for (const [, list] of m) {
      list.sort((a, b) => (a.zirorb_sort ?? 0) - (b.zirorb_sort ?? 0) || a.name.localeCompare(b.name));
    }
    return m;
  }, [agents, zirorbs]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [zRes, aRes] = await Promise.all([
        fetch("/api/zirorbs"),
        fetch("/api/agents?context=music_school&exclude_star=true"),
      ]);
      const zData = await zRes.json();
      const aData = await aRes.json();
      if (!zRes.ok) {
        setToast((zData && typeof zData.error === "string" && zData.error) || "Could not load Zirorbs.");
        setZirorbs([]);
      } else {
        setZirorbs(Array.isArray(zData) ? zData : []);
      }
      if (!aRes.ok) {
        setToast((aData && typeof aData.error === "string" && aData.error) || "Could not load agents.");
        setAgents([]);
      } else {
        setAgents(Array.isArray(aData) ? aData : []);
      }

      const starR = await fetch("/api/agents?context=music_school");
      const starJson = await starR.json();
      if (!starR.ok) {
        setStarAgent(null);
      } else {
        const starList = Array.isArray(starJson) ? starJson : [];
        setStarAgent((starList as AgentRecord[]).find((x) => x.slug === "star") || null);
      }
    } catch {
      setToast("Failed to load organization data.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const fn = () => setIsMdUp(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function persistZirorbPos(id: string, x: number, y: number) {
    const res = await fetch("/api/zirorbs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, board_x: x, board_y: y }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setToast(j.error || "Could not save Zirorb position.");
      await loadAll();
    }
  }

  const applyAgentPatches = useCallback(
    async (rows: { id: string; zirorb_id: string | null; zirorb_sort: number }[]) => {
      const results = await Promise.all(
        rows.map((row) =>
          fetch("/api/agents", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: row.id,
              zirorb_id: row.zirorb_id,
              zirorb_sort: row.zirorb_sort,
            }),
          })
        )
      );
      const failed = results.find((r) => !r.ok);
      if (failed) {
        const j = await failed.json().catch(() => ({}));
        setToast(j.error || "Could not update agent order.");
        await loadAll();
        return false;
      }
      return true;
    },
    [loadAll]
  );

  async function moveAgentToZirorb(agentId: string, targetZirorbId: string | null) {
    const key = zirorbKey(targetZirorbId);
    const list = (agentsByZirorb.get(key === "unassigned" ? "unassigned" : key) || []).filter((a) => a.id !== agentId);
    const maxSort = list.reduce((m, a) => Math.max(m, a.zirorb_sort ?? 0), -1);
    const ok = await applyAgentPatches([
      { id: agentId, zirorb_id: targetZirorbId, zirorb_sort: maxSort + 1 },
    ]);
    if (ok) await loadAll();
  }

  /** Reorder within one cluster or move into cluster at a specific index (desktop DnD). */
  const reorderOrInsertAgent = useCallback(
    async (draggedId: string, fromKey: ZirorbKey, toKey: ZirorbKey, insertBeforeId: string | null) => {
      const getList = (k: ZirorbKey) => [...(agentsByZirorb.get(k === "unassigned" ? "unassigned" : k) || [])];
      const fromList = getList(fromKey);
      const dragged = fromList.find((a) => a.id === draggedId);
      if (!dragged) return;

      const fromWithout = fromList.filter((a) => a.id !== draggedId);
      const toZid = toKey === "unassigned" ? null : toKey;
      const patches: { id: string; zirorb_id: string | null; zirorb_sort: number }[] = [];

      if (fromKey === toKey) {
        let idx = fromWithout.length;
        if (insertBeforeId) {
          const i = fromWithout.findIndex((a) => a.id === insertBeforeId);
          if (i >= 0) idx = i;
        }
        const merged = [...fromWithout.slice(0, idx), { ...dragged, zirorb_id: toZid }, ...fromWithout.slice(idx)];
        merged.forEach((a, i) => patches.push({ id: a.id, zirorb_id: toZid, zirorb_sort: i }));
      } else {
        const toList = getList(toKey).filter((a) => a.id !== draggedId);
        let idx = toList.length;
        if (insertBeforeId) {
          const i = toList.findIndex((a) => a.id === insertBeforeId);
          if (i >= 0) idx = i;
        }
        const mergedTo = [...toList.slice(0, idx), { ...dragged, zirorb_id: toZid }, ...toList.slice(idx)];
        mergedTo.forEach((a, i) => patches.push({ id: a.id, zirorb_id: toZid, zirorb_sort: i }));
        fromWithout.forEach((a, i) =>
          patches.push({ id: a.id, zirorb_id: fromKey === "unassigned" ? null : fromKey, zirorb_sort: i })
        );
      }

      const ok = await applyAgentPatches(patches);
      if (ok) await loadAll();
    },
    [agentsByZirorb, applyAgentPatches, loadAll]
  );

  function handleBoardWheel(e: React.WheelEvent) {
    if (!isMdUp || focusedZirorbId) return;
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const factor = e.deltaY > 0 ? -0.06 : 0.06;
      setVp((p) => ({ ...p, s: clamp(p.s + factor, 0.72, 1.38) }));
      return;
    }
    if (e.shiftKey) {
      e.preventDefault();
      setVp((p) => ({ ...p, tx: clamp(p.tx - e.deltaY * 0.45, -220, 220) }));
      return;
    }
    if (e.altKey) {
      e.preventDefault();
      setVp((p) => ({ ...p, ty: clamp(p.ty - e.deltaY * 0.45, -180, 180) }));
    }
  }

  function resetViewport() {
    setVp({ s: 1, tx: 0, ty: 0 });
  }

  function onZirorbPointerDown(e: React.PointerEvent, z: ZirorbRecord, x: number, y: number) {
    if (!isMdUp || focusedZirorbId) return;
    e.preventDefault();
    const el = boardRef.current;
    if (!el) return;
    const r = (viewportRef.current ?? el).getBoundingClientRect();
    setDraggingZirorbNodeId(z.id);
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    dragZirorbRef.current = {
      id: z.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: x,
      origY: y,
      w: r.width,
      h: r.height,
    };
  }

  function onBoardPointerMove(e: React.PointerEvent) {
    const d = dragZirorbRef.current;
    if (!d) return;
    const el = viewportRef.current ?? boardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = ((e.clientX - d.startX) / r.width) * 100;
    const dy = ((e.clientY - d.startY) / r.height) * 100;
    const nx = clamp(d.origX + dx, 6, 94);
    const ny = clamp(d.origY + dy, 14, 90);
    setZirorbs((prev) =>
      prev.map((z) => (z.id === d.id ? { ...z, board_x: nx, board_y: ny } : z))
    );
  }

  function onBoardPointerUp(e: React.PointerEvent) {
    const d = dragZirorbRef.current;
    if (boardRef.current) {
      try {
        boardRef.current.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    dragZirorbRef.current = null;
    setDraggingZirorbNodeId(null);
    if (!d) return;
    const sorted = [...zirorbsRef.current].sort(
      (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)
    );
    const z = zirorbsRef.current.find((x) => x.id === d.id);
    if (z && z.board_x != null && z.board_y != null) {
      const { x: nx, y: ny } = nudgeAgainstPeers(z.id, z.board_x, z.board_y, sorted);
      if (nx !== z.board_x || ny !== z.board_y) {
        setZirorbs((prev) => prev.map((o) => (o.id === z.id ? { ...o, board_x: nx, board_y: ny } : o)));
      }
      void persistZirorbPos(z.id, nx, ny);
    }
  }

  async function deleteZirorb(id: string) {
    if (!confirm("Delete this Zirorb? Agents become Unassigned.")) return;
    const res = await fetch("/api/zirorbs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setToast(j.error || "Delete failed.");
      return;
    }
    setFocusedZirorbId(null);
    await loadAll();
  }

  const unassigned = agentsByZirorb.get("unassigned") || [];

  /* ─── Mobile: stacked by Zirorb ─── */
  if (!isMdUp) {
    return (
      <div className="h-full overflow-y-auto overflow-x-hidden bg-[#050508] pb-24">
        <OrgHeader onNewZirorb={() => setZirorbModal("create")} />
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-[#505055]" size={24} />
          </div>
        ) : (
          <div className="px-4 space-y-4">
            <StarMobileCard star={starAgent} />
            {sortedZirorbs.map((z) => (
              <MobileZirorbSection
                key={z.id}
                z={z}
                agents={agentsByZirorb.get(z.id) || []}
                onEdit={() => setZirorbModal(z)}
                onDelete={() => deleteZirorb(z.id)}
                onMoveAgent={moveAgentToZirorb}
                allZirorbs={sortedZirorbs}
              />
            ))}
            <MobileZirorbSection
              z={MOBILE_UNASSIGNED_Z}
              agents={unassigned}
              isUnassigned
              onMoveAgent={moveAgentToZirorb}
              allZirorbs={sortedZirorbs}
            />
          </div>
        )}
        {toast && (
          <div className="fixed bottom-6 left-4 right-4 z-[70] flex justify-center pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-[#ff4444]/30 bg-[#1a0a0a] px-4 py-2 text-sm text-[#ff9999]">
              <AlertCircle size={16} />
              {toast}
            </div>
          </div>
        )}
        {zirorbModal && (
          <ZirorbFormModal
            key={zirorbModal === "create" ? "create" : zirorbModal.id}
            mode={zirorbModal === "create" ? "create" : "edit"}
            zirorb={zirorbModal === "create" ? null : zirorbModal}
            onClose={() => setZirorbModal(null)}
            onSaved={() => {
              setZirorbModal(null);
              loadAll();
            }}
          />
        )}
      </div>
    );
  }

  /* ─── Desktop / tablet board ─── */
  return (
    <div className="h-full flex flex-col bg-[#050508] text-[#e8e8ec] overflow-hidden">
      <OrgHeader onNewZirorb={() => setZirorbModal("create")} />

      <div
        ref={boardRef}
        className="relative flex-1 min-h-[480px] mx-2 mb-2 md:mx-4 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[#0a0a10] via-[#06060a] to-[#030306] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden"
        onPointerMove={onBoardPointerMove}
        onPointerUp={onBoardPointerUp}
        onWheel={handleBoardWheel}
        onDoubleClick={(e) => {
          const el = e.target as HTMLElement;
          if (el.closest("[data-zirorb-card]") || el.closest("[data-unassigned-dock]")) return;
          resetViewport();
        }}
      >
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Loader2 className="animate-spin text-[#505055]" size={28} />
          </div>
        ) : (
          <div
            ref={viewportRef}
            className="absolute inset-0 will-change-transform"
            style={{
              transform: `translate(${vp.tx}px, ${vp.ty}px) scale(${vp.s})`,
              transformOrigin: "50% 42%",
            }}
          >
            {/* Atmospheric layers */}
            <div
              className="pointer-events-none absolute inset-0 opacity-90"
              style={{
                background:
                  "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(0,255,136,0.07), transparent 55%), radial-gradient(ellipse 80% 50% at 80% 100%, rgba(168,85,247,0.06), transparent 45%), radial-gradient(ellipse 60% 40% at 10% 80%, rgba(245,158,11,0.05), transparent 50%)",
              }}
            />
            <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.04%22/%3E%3C/svg%3E')]" />

            {/* Star → Zirorb routing links */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden
            >
              <defs>
                <filter id="org-star-line-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="0.9" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {sortedZirorbs.map((z) => {
                const { x, y } = effectiveXY(z, sortedZirorbs.indexOf(z), sortedZirorbs);
                const gid = `org-star-lg-${z.id}`;
                return (
                  <g key={z.id} className="transition-opacity duration-500">
                    <defs>
                      <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={50} y1={14} x2={x} y2={y}>
                        <stop offset="0%" stopColor="#fde68a" stopOpacity="1" />
                        <stop offset="35%" stopColor={z.accent_color} stopOpacity="0.92" />
                        <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0.7" />
                      </linearGradient>
                    </defs>
                    <line
                      x1={50}
                      y1={14}
                      x2={x}
                      y2={y}
                      stroke={z.accent_color}
                      strokeOpacity={0.35}
                      strokeWidth={3}
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                    <line
                      x1={50}
                      y1={14}
                      x2={x}
                      y2={y}
                      stroke={`url(#${gid})`}
                      strokeWidth={1.45}
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                      className="org-star-line"
                      filter="url(#org-star-line-glow)"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Star anchor */}
            <div
              className="absolute left-1/2 top-[10%] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1 pointer-events-none select-none"
              aria-hidden
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-[#f59e0b]/25 blur-xl scale-150" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-[#f59e0b]/35 bg-gradient-to-br from-[#1a1510] via-[#0c0c10] to-[#08080c] shadow-[0_0_40px_rgba(245,158,11,0.18)]">
                  <Sparkles className="text-[#f59e0b]" size={36} strokeWidth={1.2} />
                </div>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f59e0b]/80">
                Star
              </span>
              <span className="max-w-[200px] text-center text-xs text-[#707078] leading-snug px-2">
                {starAgent?.name || "Orchestrator"}
              </span>
            </div>

            {/* Unassigned drop dock */}
            <div
              data-unassigned-dock
              className={clsx(
                "absolute left-[3%] bottom-[6%] z-10 w-[200px] max-w-[42vw] rounded-2xl border border-dashed p-3 transition-all duration-300",
                dragAgentId ? "border-[#00ff88]/50 bg-[#00ff88]/[0.06] shadow-[0_0_28px_rgba(0,255,136,0.12)]" : "border-[#2a2a30] bg-[#08080c]/80 hover:border-[#3a3a44]"
              )}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("agentId");
                const from = (e.dataTransfer.getData("fromZirorb") || "unassigned") as ZirorbKey;
                if (id) void reorderOrInsertAgent(id, from, "unassigned", null);
                setDragAgentId(null);
              }}
            >
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#606068]">
                <Bot size={14} />
                Unassigned
              </div>
              <p className="mt-1 text-[10px] text-[#505055] leading-relaxed">
                Drop agents here when moving them off a Zirorb, or hold them until assigned.
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {unassigned.slice(0, 6).map((a) => (
                  <AgentChip
                    key={a.id}
                    agent={a}
                    clusterKey="unassigned"
                    draggable
                    onDragStart={() => setDragAgentId(a.id)}
                    onDragEnd={() => setDragAgentId(null)}
                    onDropReorder={(draggedId, fromKey, insertBeforeId) => {
                      void reorderOrInsertAgent(draggedId, fromKey, "unassigned", insertBeforeId);
                    }}
                    onOpenChat={onOpenAgentChat}
                  />
                ))}
                {unassigned.length > 6 && (
                  <span className="text-[10px] text-[#505055]">+{unassigned.length - 6}</span>
                )}
              </div>
            </div>

            {/* Zirorb nodes */}
            {sortedZirorbs.map((z, i) => {
              const { x, y } = effectiveXY(z, i, sortedZirorbs);
              const inside = agentsByZirorb.get(z.id) || [];
              return (
                <div
                  key={z.id}
                  data-zirorb-card
                  className={clsx(
                    "absolute z-10 w-[min(260px,22vw)] min-w-[200px] -translate-x-1/2 -translate-y-1/2 transition-[transform,opacity,filter] duration-500 ease-out",
                    draggingZirorbNodeId === z.id && "z-[40] scale-[1.04] duration-200 ease-out",
                    draggingZirorbNodeId && draggingZirorbNodeId !== z.id && "opacity-[0.48]"
                  )}
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <div
                    className="rounded-2xl border border-white/[0.08] bg-[#0a0a0e]/95 shadow-[0_24px_48px_rgba(0,0,0,0.5)] backdrop-blur-md ring-1 ring-white/[0.03] transition-[box-shadow,transform,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_28px_56px_rgba(0,0,0,0.55)]"
                    style={{ boxShadow: `0 0 0 1px ${z.accent_color}22, 0 20px 50px rgba(0,0,0,0.45)` }}
                  >
                    <div
                      className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2"
                      style={{ borderColor: `${z.accent_color}33` }}
                    >
                      <button
                        type="button"
                        className="touch-none cursor-grab active:cursor-grabbing p-1 rounded-md text-[#505058] hover:text-[#a0a0a8] hover:bg-white/5"
                        onPointerDown={(e) => onZirorbPointerDown(e, z, x, y)}
                        aria-label="Move Zirorb"
                      >
                        <GripHorizontal size={16} />
                      </button>
                      <button
                        type="button"
                        className="flex-1 min-w-0 text-left"
                        onClick={() => setFocusedZirorbId(z.id)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Orbit size={14} style={{ color: z.accent_color }} />
                          <span className="truncate text-sm font-bold text-[#f0f0f0]">{z.name}</span>
                        </div>
                        <div className="text-[10px] text-[#606068]">{inside.length} agents</div>
                      </button>
                      <div className="flex shrink-0 gap-0.5">
                        <button
                          type="button"
                          className="p-1.5 rounded-md text-[#707078] hover:bg-white/5 hover:text-[#f0f0f0]"
                          onClick={() => setZirorbModal(z)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 rounded-md text-[#707078] hover:bg-[#ff4444]/15 hover:text-[#ff8888]"
                          onClick={() => deleteZirorb(z.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div
                      className="max-h-[140px] overflow-y-auto p-2 space-y-1.5"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const id = e.dataTransfer.getData("agentId");
                        const from = (e.dataTransfer.getData("fromZirorb") || "unassigned") as ZirorbKey;
                        if (id) void reorderOrInsertAgent(id, from, z.id, null);
                        setDragAgentId(null);
                      }}
                    >
                      {inside.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-white/[0.1] bg-white/[0.02] px-3 py-3.5 text-center">
                          <p className="text-[11px] font-medium text-[#909098]">No agents yet</p>
                          <p className="mt-1 text-[10px] text-[#505055] leading-relaxed">
                            Ready for expansion. Pull from Unassigned or add in{" "}
                            <span className="text-[#707078]">Agents</span>.
                          </p>
                        </div>
                      ) : (
                        inside.map((a) => (
                          <AgentChip
                            key={a.id}
                            agent={a}
                            clusterKey={z.id}
                            draggable
                            onDragStart={() => setDragAgentId(a.id)}
                            onDragEnd={() => setDragAgentId(null)}
                            onDropReorder={(draggedId, fromKey, insertBeforeId) => {
                              void reorderOrInsertAgent(draggedId, fromKey, z.id, insertBeforeId);
                            }}
                            onOpenChat={onOpenAgentChat}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Focus overlay */}
      {focusedZirorbId && !loading && (
        <FocusOverlay
          focusedId={focusedZirorbId}
          zirorbs={sortedZirorbs}
          agentsByZirorb={agentsByZirorb}
          onClose={() => setFocusedZirorbId(null)}
          onMoveAgent={moveAgentToZirorb}
          onEditZirorb={(z) => setZirorbModal(z)}
          onDeleteZirorb={deleteZirorb}
          onOpenAgentChat={onOpenAgentChat}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 px-4 w-full max-w-md pointer-events-none flex justify-center">
          <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-[#ff4444]/30 bg-[#1a0a0a] px-4 py-2 text-sm text-[#ff9999]">
            <AlertCircle size={16} />
            {toast}
          </div>
        </div>
      )}

      {zirorbModal && (
        <ZirorbFormModal
          key={zirorbModal === "create" ? "create" : zirorbModal.id}
          mode={zirorbModal === "create" ? "create" : "edit"}
          zirorb={zirorbModal === "create" ? null : zirorbModal}
          onClose={() => setZirorbModal(null)}
          onSaved={() => {
            setZirorbModal(null);
            loadAll();
          }}
        />
      )}
    </div>
  );
}

function OrgHeader({ onNewZirorb }: { onNewZirorb: () => void }) {
  return (
    <header className="shrink-0 px-4 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/[0.06] bg-[#060608]/90 backdrop-blur-sm z-30">
      <div>
        <h1 className="text-lg font-extrabold tracking-tight text-[#f4f4f5]">Organization</h1>
        <p className="text-xs text-[#606068] mt-0.5 max-w-xl">
          Spatial command layer: how Star routes to each Zirorb. Drag Zirorbs, reorder agents on chips, move between
          clusters. Desktop: ⌃/⌘ + scroll to zoom, Shift or Alt + scroll to pan; double-click empty map to reset. Use
          Agents for profiles, lifecycle, and skills.
        </p>
      </div>
      <button
        type="button"
        onClick={onNewZirorb}
        className="inline-flex items-center gap-2 self-start rounded-xl border border-[#00ff88]/30 bg-[#00ff88]/10 px-4 py-2 text-sm font-semibold text-[#00ff88] hover:bg-[#00ff88]/18 transition-colors"
      >
        <Plus size={16} />
        New Zirorb
      </button>
    </header>
  );
}

function StarMobileCard({ star }: { star: AgentRecord | null }) {
  return (
    <div className="rounded-2xl border border-[#f59e0b]/25 bg-gradient-to-br from-[#141210] to-[#0a0a0c] p-4 text-center">
      <Sparkles className="mx-auto text-[#f59e0b] mb-2" size={28} />
      <div className="text-[10px] font-semibold uppercase tracking-widest text-[#f59e0b]/80">Star</div>
      <div className="text-base font-bold text-[#f0f0f0]">{star?.name || "Orchestrator"}</div>
      <p className="text-xs text-[#707078] mt-1">{star?.role || "Central routing and delegation."}</p>
    </div>
  );
}

function MobileZirorbSection({
  z,
  agents: agentList,
  isUnassigned,
  onEdit,
  onDelete,
  onMoveAgent,
  allZirorbs,
}: {
  z: ZirorbRecord;
  agents: AgentRecord[];
  isUnassigned?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onMoveAgent: (agentId: string, zid: string | null) => void;
  allZirorbs: ZirorbRecord[];
}) {
  const [open, setOpen] = useState(true);
  return (
    <div
      className="rounded-2xl border border-white/[0.08] bg-[#0c0c10]/95 overflow-hidden"
      style={{ boxShadow: `0 0 0 1px ${z.accent_color}18` }}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Orbit size={16} style={{ color: z.accent_color }} />
          <span className="font-bold text-[#f0f0f0] truncate">{z.name}</span>
          <span className="text-xs text-[#505055] shrink-0">({agentList.length})</span>
        </div>
        {!isUnassigned && (
          <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="p-2 text-[#707078]" onClick={onEdit}>
              <Pencil size={14} />
            </button>
            <button type="button" className="p-2 text-[#ff8888]" onClick={onDelete}>
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </button>
      {open && (
        <div className="border-t border-white/[0.06] px-3 py-2 space-y-2">
          {agentList.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/[0.08] bg-white/[0.02] px-3 py-3 text-center">
              <p className="text-xs font-medium text-[#909098]">No agents yet</p>
              <p className="mt-1 text-[10px] text-[#505055] leading-relaxed">Ready for expansion.</p>
            </div>
          ) : (
            agentList.map((a) => (
              <div key={a.id} className="flex items-center gap-2 rounded-lg bg-[#080808] px-2 py-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: a.color }}
                />
                <span className="flex-1 truncate text-sm text-[#e0e0e6]">{a.name}</span>
                <select
                  className="max-w-[130px] shrink-0 rounded-lg border border-[#232326] bg-[#0a0a0c] px-2 py-1 text-[11px] text-[#c0c0c8]"
                  value={a.zirorb_id || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    void onMoveAgent(a.id, v === "" ? null : v);
                  }}
                >
                  <option value="">Unassigned</option>
                  {allZirorbs.map((zz) => (
                    <option key={zz.id} value={zz.id}>
                      {zz.name}
                    </option>
                  ))}
                </select>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function AgentChip({
  agent,
  clusterKey,
  draggable,
  onDragStart,
  onDragEnd,
  onDropReorder,
  onOpenChat,
}: {
  agent: AgentRecord;
  clusterKey: ZirorbKey;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  /** Drop another agent before this chip to reorder within a cluster or insert from elsewhere. */
  onDropReorder?: (draggedId: string, fromKey: ZirorbKey, insertBeforeAgentId: string) => void;
  onOpenChat?: (agent: AgentRecord) => void;
}) {
  return (
    <div
      draggable={!!draggable}
      onDragStart={(e) => {
        if (!draggable) return;
        e.dataTransfer.setData("agentId", agent.id);
        e.dataTransfer.setData("fromZirorb", clusterKey);
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.();
      }}
      onDragEnd={() => onDragEnd?.()}
      onDragOver={(e) => {
        if (!draggable || !onDropReorder) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDrop={(e) => {
        if (!onDropReorder) return;
        e.stopPropagation();
        const dragId = e.dataTransfer.getData("agentId");
        const from = (e.dataTransfer.getData("fromZirorb") || "unassigned") as ZirorbKey;
        if (!dragId || dragId === agent.id) return;
        onDropReorder(dragId, from, agent.id);
      }}
      className={clsx(
        "group/chip flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-[#08080c]/90 px-2 py-1.5 text-left transition-[border-color,background-color,transform,box-shadow] duration-200",
        draggable && "cursor-grab active:cursor-grabbing hover:border-[#00ff88]/28 hover:bg-[#0c1210]/95 hover:shadow-[0_0_0_1px_rgba(0,255,136,0.08)]"
      )}
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: agent.color }} />
      <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-[#d8d8de]">{agent.name}</span>
      {onOpenChat && (
        <button
          type="button"
          draggable={false}
          onClick={(e) => {
            e.stopPropagation();
            onOpenChat(agent);
          }}
          className="shrink-0 rounded p-0.5 text-[#505058] opacity-0 transition-opacity hover:bg-white/10 hover:text-[#00ff88] group-hover/chip:opacity-100 md:opacity-100"
          aria-label={`Chat with ${agent.name}`}
        >
          <MessageSquare size={12} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

function FocusOverlay({
  focusedId,
  zirorbs,
  agentsByZirorb,
  onClose,
  onMoveAgent,
  onEditZirorb,
  onDeleteZirorb,
  onOpenAgentChat,
}: {
  focusedId: string | "unassigned";
  zirorbs: ZirorbRecord[];
  agentsByZirorb: Map<string | "unassigned", AgentRecord[]>;
  onClose: () => void;
  onMoveAgent: (agentId: string, zid: string | null) => void;
  onEditZirorb: (z: ZirorbRecord) => void;
  onDeleteZirorb: (id: string) => void;
  onOpenAgentChat?: (agent: AgentRecord) => void;
}) {
  const isUn = focusedId === "unassigned";
  const z = !isUn ? zirorbs.find((x) => x.id === focusedId) : null;
  const agents = agentsByZirorb.get(isUn ? "unassigned" : focusedId) || [];
  const title = isUn ? "Unassigned" : z?.name || "Zirorb";

  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const accent = z?.accent_color || "#6b7280";

  return (
    <div
      className={clsx(
        "fixed inset-0 z-[50] flex items-center justify-center p-4 md:p-8 transition-opacity duration-300 ease-out",
        entered ? "opacity-100" : "opacity-0"
      )}
      style={{
        background: `radial-gradient(ellipse 85% 70% at 50% 18%, ${accent}22, transparent 52%), rgba(2,2,8,0.92)`,
        backdropFilter: "blur(6px)",
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={clsx(
          "relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-3xl border border-white/[0.1] bg-[#07070c]/[0.97] shadow-[0_0_80px_rgba(0,0,0,0.85)] backdrop-blur-xl flex flex-col transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          entered ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        )}
        style={{
          boxShadow: z
            ? `0 0 0 1px ${z.accent_color}40, 0 0 120px ${z.accent_color}18, 0 40px 100px rgba(0,0,0,0.65)`
            : "0 0 0 1px rgba(255,255,255,0.06), 0 40px 100px rgba(0,0,0,0.65)",
        }}
      >
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[120%] -translate-x-1/2 opacity-50"
          style={{
            background: `radial-gradient(ellipse at center, ${accent}35, transparent 70%)`,
          }}
        />
        <div className="flex items-start justify-between gap-3 p-5 border-b border-white/[0.06] shrink-0 relative">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#2a2a30] px-3 py-1.5 text-xs text-[#a0a0a8] hover:bg-white/5"
          >
            <ArrowLeft size={14} />
            Map
          </button>
          {!isUn && z && (
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-lg border border-[#2a2a30] px-3 py-1.5 text-xs text-[#a0a0a8] hover:bg-white/5"
                onClick={() => onEditZirorb(z)}
              >
                Edit
              </button>
              <button
                type="button"
                className="rounded-lg border border-[#ff4444]/25 px-3 py-1.5 text-xs text-[#ff8888] hover:bg-[#ff4444]/10"
                onClick={() => onDeleteZirorb(z.id)}
              >
                Delete
              </button>
            </div>
          )}
        </div>
        <div className="p-6 overflow-y-auto flex-1 relative">
          <div className="flex items-center gap-3 mb-2">
            {!isUn && z && <Orbit size={22} style={{ color: z.accent_color }} />}
            <h2 className="text-xl font-extrabold tracking-tight text-[#f4f4f5]">{title}</h2>
          </div>
          {!isUn && z?.description && (
            <p className="text-sm text-[#707078] mb-6 leading-relaxed">{z.description}</p>
          )}
          {isUn && (
            <p className="text-sm text-[#707078] mb-6">
              Agents without a Zirorb. Assign them to a cluster below.
            </p>
          )}
          <div className="space-y-2">
            {agents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] px-6 py-10 text-center">
                <p className="text-sm font-medium text-[#909098]">No agents yet</p>
                <p className="mt-2 text-xs text-[#505055] leading-relaxed max-w-sm mx-auto">
                  This cluster is ready for expansion. Add agents from Unassigned or create them in Agents.
                </p>
              </div>
            ) : (
              agents.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.06] bg-[#060608] px-4 py-3"
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: a.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#e8e8ec] truncate">{a.name}</div>
                    <div className="text-xs text-[#606068] truncate">{a.purpose || a.role}</div>
                  </div>
                  {onOpenAgentChat && (
                    <button
                      type="button"
                      className="shrink-0 rounded-lg border border-[#2a2a30] p-2 text-[#909098] hover:border-[#00ff88]/30 hover:bg-[#00ff88]/10 hover:text-[#00ff88]"
                      aria-label={`Chat with ${a.name}`}
                      onClick={() => onOpenAgentChat(a)}
                    >
                      <MessageSquare size={16} strokeWidth={2} />
                    </button>
                  )}
                  <select
                    className="rounded-lg border border-[#232326] bg-[#0a0a0c] px-3 py-2 text-xs text-[#d0d0d8] min-w-[140px]"
                    value={a.zirorb_id || ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      void onMoveAgent(a.id, v === "" ? null : v);
                    }}
                  >
                    <option value="">Unassigned</option>
                    {zirorbs.map((zz) => (
                      <option key={zz.id} value={zz.id}>
                        {zz.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
