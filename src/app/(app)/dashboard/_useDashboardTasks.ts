"use client";

/**
 * Shared hook for /api/dashboard/tasks data.
 *
 * LeadsBox, ActionPanel, and InstrumentChart all need data from the same
 * endpoint. Without this hook they each fire an independent fetch on mount,
 * tripling the load time. This module-level cache ensures the request fires
 * once and all consumers share the result.
 */

import { useEffect, useState } from "react";

export type TasksData = {
  overdueInvoices: {
    invoiceId: string;
    familyId: string;
    familyName: string;
    balanceCents: number;
    dueDate: string;
    status: string;
  }[];
  uncontactedLeads: {
    leadId: string;
    name: string;
    instrument: string | null;
    source: string | null;
    createdAt: string;
  }[];
  capacitySignals: {
    locationId: string;
    locationName: string;
    locationColor: string | null;
    openSlots: number;
  }[];
  topInstruments: {
    instrument: string;
    studentCount: number;
  }[];
  hiringSignals: {
    dayOfWeek: number;
    dayName: string;
    sessions: number;
    uniqueTeachers: number;
  }[];
  mtd: { start: string; end: string; today: string };
};

// Module-level cache — shared across all component instances on the same page
let _cache: TasksData | null = null;
let _promise: Promise<TasksData> | null = null;

function fetchTasks(): Promise<TasksData> {
  if (_promise) return _promise;
  _promise = fetch("/api/dashboard/tasks", {
    // 30s browser cache — aligns with server-side Cache-Control
    next: { revalidate: 30 },
  })
    .then((r) => r.json())
    .then((json) => {
      _cache = json as TasksData;
      return _cache;
    })
    .catch(() => {
      _promise = null; // allow retry on error
      return {
        overdueInvoices: [],
        uncontactedLeads: [],
        capacitySignals: [],
        topInstruments: [],
        hiringSignals: [],
        mtd: { start: "", end: "", today: "" },
      } as TasksData;
    });
  return _promise;
}

export function useDashboardTasks(): TasksData | null {
  const [data, setData] = useState<TasksData | null>(_cache);

  useEffect(() => {
    if (_cache) {
      setData(_cache);
      return;
    }
    fetchTasks().then(setData);
  }, []);

  return data;
}
