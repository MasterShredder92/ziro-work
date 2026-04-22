"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

type Family = {
  id: string;
  name: string;
  primary_email: string | null;
  primary_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  notes: string | null;
  archived_at: string | null;
  created_at: string;
};

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  instrument: string | null;
  status: string | null;
};

type Invoice = {
  id: string;
  total_cents: number;
  status: string;
  due_date: string;
  is_recurring: boolean | null;
  live_url_token: string | null;
  invoice_month: string | null;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function statusBadge(status: string | null) {
  const s = (status ?? "").toLowerCase();
  if (s === "active") return "bg-[#00ff88]/10 text-[#00ff88]";
  if (s === "inactive" || s === "archived") return "bg-white/5 text-[#909098]";
  if (s === "trial") return "bg-amber-400/10 text-amber-400";
  return "bg-white/5 text-[#909098]";
}

function invoiceStatusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "paid") return "bg-[#00ff88]/10 text-[#00ff88]";
  if (s === "overdue") return "bg-red-400/10 text-red-400";
  if (s === "draft") return "bg-white/5 text-[#909098]";
  if (s === "sent") return "bg-blue-400/10 text-blue-400";
  return "bg-white/5 text-[#909098]";
}

export default function FamilyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const tenantId = DEFAULT_TENANT_ID;

  const [family, setFamily] = useState<Family | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/crm/families/${id}`, {
        headers: { "x-tenant-id": tenantId },
      }).then((r) => r.json()),
      fetch(`/api/students?family_id=${id}&page_size=50`, {
        headers: { "x-tenant-id": tenantId },
      }).then((r) => r.json()),
      fetch(`/api/billing/invoices?family_id=${id}&page_size=20`, {
        headers: { "x-tenant-id": tenantId },
      }).then((r) => r.json()).catch(() => ({ data: [] })),
    ])
      .then(([familyRes, studentsRes, invoicesRes]) => {
        if (familyRes?.data) setFamily(familyRes.data);
        else setError("Family not found.");
        if (studentsRes?.data?.items) setStudents(studentsRes.data.items);
        const invData = invoicesRes?.data;
        if (Array.isArray(invData)) setInvoices(invData);
        else if (Array.isArray(invData?.items)) setInvoices(invData.items);
      })
      .catch(() => setError("Failed to load family."))
      .finally(() => setLoading(false));
  }, [id, tenantId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-[#909098] text-sm">
        Loading…
      </div>
    );
  }

  if (error || !family) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-[#909098] text-sm">{error ?? "Family not found."}</p>
        <button
          onClick={() => router.back()}
          className="rounded-lg border border-[#2b2b2f] px-4 py-2 text-sm text-[#909098] hover:text-white transition-colors"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  const address = [
    family.address_line1,
    family.address_line2,
    family.city && family.state
      ? `${family.city}, ${family.state} ${family.postal_code ?? ""}`.trim()
      : family.city ?? family.state ?? null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      {/* Back */}
      <Link
        href="/crm/families"
        className="inline-flex items-center gap-1.5 text-sm text-[#909098] hover:text-[#00ff88] transition-colors"
      >
        ← All Families
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1a1a1e] text-lg font-bold text-[#00ff88] shrink-0">
          {initials(family.name)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--z-fg,#f0f0f0)]">{family.name}</h1>
          <p className="text-sm text-[#909098]">
            {family.archived_at ? "Archived" : "Active Family"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Contact Info */}
        <div className="rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] p-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#505055]">
            Contact
          </h2>
          {family.primary_email && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#505055]">Email</span>
              <a
                href={`mailto:${family.primary_email}`}
                className="text-[var(--z-fg,#f0f0f0)] hover:text-[#00ff88] transition-colors"
              >
                {family.primary_email}
              </a>
            </div>
          )}
          {family.primary_phone && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#505055]">Phone</span>
              <a
                href={`tel:${family.primary_phone}`}
                className="text-[var(--z-fg,#f0f0f0)] hover:text-[#00ff88] transition-colors"
              >
                {family.primary_phone}
              </a>
            </div>
          )}
          {address && (
            <div className="flex items-start gap-2 text-sm">
              <span className="text-[#505055] shrink-0">Address</span>
              <span className="text-[var(--z-fg,#f0f0f0)]">{address}</span>
            </div>
          )}
          {!family.primary_email && !family.primary_phone && !address && (
            <p className="text-sm text-[#505055]">No contact info on file.</p>
          )}
        </div>

        {/* Notes */}
        <div className="rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] p-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#505055]">
            Notes
          </h2>
          {family.notes ? (
            <p className="text-sm text-[var(--z-fg,#f0f0f0)] whitespace-pre-wrap leading-relaxed">
              {family.notes}
            </p>
          ) : (
            <p className="text-sm text-[#505055]">No notes.</p>
          )}
        </div>
      </div>

      {/* Invoices */}
      <div className="rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#505055]">
            Invoices ({invoices.length})
          </h2>
          <Link
            href={`/invoices?family_id=${family.id}`}
            className="text-xs font-semibold text-[#00ff88] hover:opacity-80 transition-opacity"
          >
            + New Invoice
          </Link>
        </div>
        {invoices.length === 0 ? (
          <p className="text-sm text-[#505055]">No invoices yet.</p>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-lg border border-[#1c1c1e] px-4 py-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--z-fg,#f0f0f0)]">
                      ${(inv.total_cents / 100).toFixed(2)}
                    </span>
                    {inv.is_recurring && (
                      <span className="text-[10px] text-[#505055]">🔁 Recurring</span>
                    )}
                  </div>
                  <div className="text-xs text-[#505055]">
                    Due {new Date(inv.due_date).toLocaleDateString()}
                    {inv.invoice_month && ` · ${inv.invoice_month}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${invoiceStatusBadge(inv.status)}`}>
                    {inv.status}
                  </span>
                  {inv.live_url_token && (
                    <a
                      href={`/invoice/${inv.live_url_token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#909098] hover:text-[#00ff88] transition-colors"
                    >
                      View →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Students */}
      <div className="rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] p-5 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#505055]">
          Students ({students.length})
        </h2>
        {students.length === 0 ? (
          <p className="text-sm text-[#505055]">No students linked to this family.</p>
        ) : (
          <div className="space-y-2">
            {students.map((s) => (
              <Link
                key={s.id}
                href={`/students/${s.id}`}
                className="flex items-center justify-between rounded-lg border border-[#1c1c1e] px-4 py-3 hover:border-[#2b2b2f] hover:bg-white/3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a1a1e] text-xs font-bold text-[#909098] shrink-0">
                    {initials(`${s.first_name} ${s.last_name}`)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--z-fg,#f0f0f0)]">
                      {s.first_name} {s.last_name}
                    </p>
                    {s.instrument && (
                      <p className="text-xs text-[#909098]">{s.instrument}</p>
                    )}
                  </div>
                </div>
                {s.status && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${statusBadge(s.status)}`}
                  >
                    {s.status}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Meta */}
      <p className="text-xs text-[#303035]">
        Family ID: {family.id} · Created{" "}
        {new Date(family.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}
