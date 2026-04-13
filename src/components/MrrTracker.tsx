"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

export default function MrrTracker() {
  const [mrr, setMrr] = useState<number>(0);
  const [target, setTarget] = useState<number>(1000000);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("settings")
        .select("key, value")
        .in("key", ["current_mrr", "target_mrr"]);

      if (data) {
        for (const row of data) {
          if (row.key === "current_mrr") setMrr(Number(row.value));
          if (row.key === "target_mrr") setTarget(Number(row.value));
        }
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  async function handleSave() {
    setEditing(false);
    await supabase
      .from("settings")
      .update({ value: String(mrr), updated_at: new Date().toISOString() })
      .eq("key", "current_mrr");
  }

  const pct = target > 0 ? Math.min((mrr / target) * 100, 100) : 0;

  return (
    <div>
      <div className="text-[11px] text-[#666] uppercase tracking-wider mb-1">
        Monthly Revenue
      </div>
      {editing ? (
        <input
          ref={inputRef}
          type="number"
          value={mrr}
          onChange={(e) => setMrr(Number(e.target.value))}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          className="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-lg font-bold text-[#00ff88] w-full outline-none focus:border-[#00ff88]"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="text-lg font-bold text-[#00ff88] hover:text-[#33ffaa] transition-colors cursor-pointer"
        >
          ${mrr.toLocaleString()}
        </button>
      )}
      {/* Progress bar */}
      <div className="mt-2 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#00ff88] rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-[10px] text-[#555] mt-1">
        ${mrr.toLocaleString()} / ${target.toLocaleString()}
      </div>
    </div>
  );
}
