"use client";

import { useState } from "react";
import { Loader2, X, Check, AlertTriangle } from "lucide-react";

export interface ZirorbRecord {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  family: "core" | "vertical";
  accent_color: string;
  sort_order: number;
  board_x?: number | null;
  board_y?: number | null;
  created_at?: string;
  updated_at?: string;
}

export default function ZirorbFormModal({
  mode,
  zirorb,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  zirorb: ZirorbRecord | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(zirorb?.name || "");
  const [description, setDescription] = useState(zirorb?.description || "");
  const [family, setFamily] = useState<"core" | "vertical">(zirorb?.family || "vertical");
  const [accent_color, setAccentColor] = useState(zirorb?.accent_color || "#00ff88");
  const [sort_order, setSortOrder] = useState(String(zirorb?.sort_order ?? 100));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    const payload =
      mode === "create"
        ? {
            name: name.trim(),
            description: description.trim() || null,
            family,
            accent_color,
            sort_order: Number(sort_order) || 0,
          }
        : {
            id: zirorb!.id,
            name: name.trim(),
            description: description.trim() || null,
            family,
            accent_color,
            sort_order: Number(sort_order) || 0,
          };

    const res = await fetch("/api/zirorbs", {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const j = await res.json();
      setError(j.error || "Request failed");
      setSaving(false);
      return;
    }
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-start justify-center pt-6 md:pt-16 overflow-y-auto px-3">
      <div className="bg-[#0c0c0e] border border-[#232326] rounded-xl w-full max-w-md mb-10 shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1c1c1e]">
          <h3 className="text-base font-extrabold text-[#f0f0f0]">
            {mode === "create" ? "New Zirorb" : "Edit Zirorb"}
          </h3>
          <button type="button" onClick={onClose} className="text-[#606068] hover:text-[#f0f0f0]">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {error && (
            <div className="flex items-center gap-2 text-xs text-[#ff4444] bg-[#ff4444]/10 border border-[#ff4444]/20 rounded-lg px-3 py-2">
              <AlertTriangle size={12} />
              {error}
            </div>
          )}
          <div>
            <label className="block text-[11px] text-[#707078] uppercase tracking-wider mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0a0a0c] border border-[#232326] rounded-xl px-3 py-2 text-sm text-[#f0f0f0] outline-none focus:border-[#00ff88]/40"
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#707078] uppercase tracking-wider mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none bg-[#0a0a0c] border border-[#232326] rounded-xl px-3 py-2 text-sm text-[#f0f0f0] outline-none focus:border-[#00ff88]/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-[#707078] uppercase tracking-wider mb-1">Family</label>
              <select
                value={family}
                onChange={(e) => setFamily(e.target.value as "core" | "vertical")}
                className="w-full bg-[#0a0a0c] border border-[#232326] rounded-xl px-3 py-2 text-sm text-[#f0f0f0] outline-none"
              >
                <option value="core">Core</option>
                <option value="vertical">Vertical / business</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-[#707078] uppercase tracking-wider mb-1">Sort order</label>
              <input
                type="number"
                value={sort_order}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-[#232326] rounded-xl px-3 py-2 text-sm text-[#f0f0f0] outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-[#707078] uppercase tracking-wider mb-1">Accent</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={accent_color}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-9 w-12 rounded-lg border border-[#232326] bg-transparent cursor-pointer"
              />
              <input
                value={accent_color}
                onChange={(e) => setAccentColor(e.target.value)}
                className="flex-1 bg-[#0a0a0c] border border-[#232326] rounded-xl px-3 py-2 text-sm font-mono text-[#f0f0f0] outline-none"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-[#1c1c1e]">
          <button type="button" onClick={onClose} className="text-sm px-3 py-2 text-[#a0a0a8] hover:text-white">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl bg-[#00ff88] text-black font-medium disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
