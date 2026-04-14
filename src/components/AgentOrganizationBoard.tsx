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
} from "lucide-react";
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

export default function AgentOrganizationBoard() {
  const boardRef = useRef<HTMLDivElement>(null);
  const [isMdUp, setIsMdUp] = useState(true);
  const [loading, setLoading] = useState(true);
  const [zirorbs, setZirorbs] = useState<ZirorbRecord[]>([]);
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [starAgent, setStarAgent] = useState<AgentRecord | null>(null);
  const [zirorbModal, setZirorbModal] = useState<"create" | ZirorbRecord | null>(null);
  const [focusedZirorbId, setFocusedZirorbId] = useState<string | "unassigned" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [dragAgentId, setDragAgentId] = useState<string | null>(null);
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
    for (const z of zirorbs) m.set(z.id, []);
    for (const a of agents) {
      const k = a.zirorb_id && m.has(a.zirorb_id) ? a.zirorb_id : "unassigned";
      if (!m.has(k)) m.set("unassigned", [...(m.get("unassigned") || []), a]);
      else (m.get(k) as AgentRecord[]).push(a);
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
      setZirorbs(Array.isArray(zData) ? zData : []);
      setAgents(Array.isArray(aData) ? aData : []);

      const starR = await fetch("/api/agents?context=music_school");
      const starList = await starR.json();
      const list = Array.isArray(starList) ? starList : [];
      setStarAgent((list as AgentRecord[]).find((x) => x.slug === "star") || null);
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

  async function moveAgentToZirorb(agentId: string, targetZirorbId: string | null) {
    const list = targetZirorbId ? agentsByZirorb.get(targetZirorbId) || [] : agentsByZirorb.get("unassigned") || [];
    const maxSort = list.reduce((m, a) => Math.max(m, a.zirorb_sort ?? 0), -1);
    const res = await fetch("/api/agents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: agentId,
        zirorb_id: targetZirorbId,
        zirorb_sort: maxSort + 1,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setToast(j.error || "Could not move agent.");
      return;
    }
    await loadAll();
  }

  function onZirorbPointerDown(e: React.PointerEvent, z: ZirorbRecord, x: number, y: number) {
    if (!isMdUp || focusedZirorbId) return;
    e.preventDefault();
    const el = boardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
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
    if (!d || !boardRef.current) return;
    const r = boardRef.current.getBoundingClientRect();
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
    if (!d) return;
    const z = zirorbsRef.current.find((x) => x.id === d.id);
    if (z && z.board_x != null && z.board_y != null) {
      void persistZirorbPos(z.id, z.board_x, z.board_y);
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

        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="animate-spin text-[#505055]" size={28} />
          </div>
        ) : (
          <>
            {/* Connection lines */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="ln" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#00ff88" stopOpacity="0.08" />
                </linearGradient>
              </defs>
              {sortedZirorbs.map((z) => {
                const { x, y } = effectiveXY(z, sortedZirorbs.indexOf(z), sortedZirorbs);
                return (
                  <line
                    key={z.id}
                    x1={50}
                    y1={14}
                    x2={x}
                    y2={y}
                    stroke="url(#ln)"
                    strokeWidth={0.12}
                    vectorEffect="non-scaling-stroke"
                    className="transition-all duration-500"
                  />
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
              className={`absolute left-[3%] bottom-[6%] z-10 w-[200px] max-w-[42vw] rounded-2xl border border-dashed p-3 transition-colors ${
                dragAgentId ? "border-[#00ff88]/50 bg-[#00ff88]/[0.06]" : "border-[#2a2a30] bg-[#08080c]/80"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("agentId");
                if (id) void moveAgentToZirorb(id, null);
                setDragAgentId(null);
              }}
            >
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#606068]">
                <Bot size={14} />
                Unassigned
              </div>
              <p className="mt-1 text-[10px] text-[#505055] leading-relaxed">
                Drop specialists here or leave legacy agents until placed.
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {unassigned.slice(0, 6).map((a) => (
                  <AgentChip key={a.id} agent={a} draggable={false} />
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
                  className="absolute z-10 w-[min(260px,22vw)] min-w-[200px] -translate-x-1/2 -translate-y-1/2 transition-transform duration-300"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <div
                    className="rounded-2xl border border-white/[0.08] bg-[#0a0a0e]/95 shadow-[0_24px_48px_rgba(0,0,0,0.5)] backdrop-blur-md ring-1 ring-white/[0.03]"
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
                        if (id) void moveAgentToZirorb(id, z.id);
                        setDragAgentId(null);
                      }}
                    >
                      {inside.length === 0 ? (
                        <p className="text-[11px] text-[#505055] px-1 py-2 text-center">Drop agents here</p>
                      ) : (
                        inside.map((a) => (
                          <AgentChip
                            key={a.id}
                            agent={a}
                            draggable
                            onDragStart={() => setDragAgentId(a.id)}
                            onDragEnd={() => setDragAgentId(null)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
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
          Spatial command map: drag Zirorbs to arrange, drag agents between clusters. Specialists tab keeps full CRUD.
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
            <p className="text-xs text-[#505055] py-2 text-center">No agents</p>
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
  draggable,
  onDragStart,
  onDragEnd,
}: {
  agent: AgentRecord;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  return (
    <div
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("agentId", agent.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.();
      }}
      onDragEnd={() => onDragEnd?.()}
      className={`flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#08080c]/90 px-2 py-1.5 text-left ${
        draggable ? "cursor-grab active:cursor-grabbing hover:border-[#00ff88]/25" : ""
      }`}
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: agent.color }} />
      <span className="truncate text-[11px] font-medium text-[#d8d8de]">{agent.name}</span>
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
}: {
  focusedId: string | "unassigned";
  zirorbs: ZirorbRecord[];
  agentsByZirorb: Map<string | "unassigned", AgentRecord[]>;
  onClose: () => void;
  onMoveAgent: (agentId: string, zid: string | null) => void;
  onEditZirorb: (z: ZirorbRecord) => void;
  onDeleteZirorb: (id: string) => void;
}) {
  const isUn = focusedId === "unassigned";
  const z = !isUn ? zirorbs.find((x) => x.id === focusedId) : null;
  const agents = agentsByZirorb.get(isUn ? "unassigned" : focusedId) || [];
  const title = isUn ? "Unassigned" : z?.name || "Zirorb";

  return (
    <div
      className="fixed inset-0 z-[50] flex items-center justify-center p-4 md:p-8"
      style={{ background: "rgba(2,2,6,0.88)" }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-3xl border border-white/[0.1] bg-[#0a0a0f]/98 shadow-[0_0_80px_rgba(0,0,0,0.85)] backdrop-blur-xl flex flex-col"
        style={{
          boxShadow: z ? `0 0 0 1px ${z.accent_color}33, 0 40px 100px rgba(0,0,0,0.6)` : undefined,
        }}
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-white/[0.06] shrink-0">
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
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex items-center gap-3 mb-2">
            {!isUn && z && <Orbit size={22} style={{ color: z.accent_color }} />}
            <h2 className="text-xl font-extrabold text-[#f4f4f5]">{title}</h2>
          </div>
          {!isUn && z?.description && (
            <p className="text-sm text-[#707078] mb-6 leading-relaxed">{z.description}</p>
          )}
          {isUn && (
            <p className="text-sm text-[#707078] mb-6">
              Specialists without a Zirorb. Assign them to a cluster below.
            </p>
          )}
          <div className="space-y-2">
            {agents.length === 0 ? (
              <p className="text-sm text-[#505055] py-8 text-center">No agents in this cluster.</p>
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
