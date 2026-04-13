"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle, Circle, Loader2 } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  result: string | null;
  created_at: string;
}

export default function TaskLog({ agentId }: { agentId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("agent_tasks")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setTasks(data || []);
        setLoading(false);
      });
  }, [agentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={18} className="animate-spin text-[#444]" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-[#555] text-sm">
        No tasks yet
      </div>
    );
  }

  return (
    <div className="space-y-2 p-3">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-start gap-2 p-2 rounded-lg bg-[#111] border border-[#1a1a1a]"
        >
          {task.status === "completed" ? (
            <CheckCircle size={14} className="text-[#00ff88] mt-0.5 shrink-0" />
          ) : task.status === "in_progress" ? (
            <Loader2 size={14} className="animate-spin text-[#f59e0b] mt-0.5 shrink-0" />
          ) : (
            <Circle size={14} className="text-[#444] mt-0.5 shrink-0" />
          )}
          <div className="min-w-0">
            <div className="text-xs font-medium text-[#ccc] truncate">
              {task.title}
            </div>
            {task.description && (
              <div className="text-[10px] text-[#666] mt-0.5 line-clamp-2">
                {task.description}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
