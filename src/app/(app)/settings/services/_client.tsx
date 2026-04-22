"use client";
import React from "react";
import Link from "next/link";

// ── Instrument options: Core 4 first, separator, then alphabetical ──
const CORE_INSTRUMENTS = ["Piano", "Guitar", "Vocals", "Drums"];
const OTHER_INSTRUMENTS = [
  "Banjo", "Bass Guitar", "Cello", "Clarinet", "Flute", "Harp",
  "Mandolin", "Saxophone", "Trumpet", "Ukulele", "Viola", "Violin",
].sort();

type Service = {
  id: string;
  name: string;
  sub_category: string | null;
  description: string | null;
  unit_price: number;
  unit_label: string;
  is_core: boolean;
  sort_order: number;
  active: boolean;
  taxable: boolean;
};

const EMPTY: Omit<Service, "id"> = {
  name: "Music Session",
  sub_category: null,
  description: "",
  unit_price: 0,
  unit_label: "session",
  is_core: false,
  sort_order: 0,
  active: true,
  taxable: false,
};

export function ServicesSettingsClient() {
  const [services, setServices] = React.useState<Service[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<Service | null>(null);
  const [form, setForm] = React.useState<Omit<Service, "id">>(EMPTY);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/settings/services");
    const j = await res.json();
    setServices(j.data ?? []);
    setLoading(false);
  }

  React.useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setError(null);
    setShowForm(true);
  }

  function openEdit(s: Service) {
    setEditing(s);
    setForm({
      name: s.name,
      sub_category: s.sub_category,
      description: s.description,
      unit_price: s.unit_price,
      unit_label: s.unit_label,
      is_core: s.is_core,
      sort_order: s.sort_order,
      active: s.active,
      taxable: s.taxable,
    });
    setError(null);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = editing ? `/api/settings/services/${editing.id}` : "/api/settings/services";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error ?? "Save failed"); return; }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(s: Service) {
    await fetch(`/api/settings/services/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !s.active }),
    });
    await load();
  }

  // Group: core first (sorted by sort_order), then non-core alphabetically
  const core = services.filter(s => s.is_core).sort((a, b) => a.sort_order - b.sort_order);
  const other = services.filter(s => !s.is_core).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/settings" className="text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]">← Settings</Link>
          <h1 className="text-xl font-bold text-[var(--z-fg)] mt-1">Services & Items</h1>
          <p className="text-xs text-[var(--z-muted)] mt-0.5">
            These appear in the Invoice Builder. "Music Session" + instrument sub-category is the standard.
          </p>
        </div>
        <button
          onClick={openNew}
          className="px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
          style={{ background: "var(--z-accent)", color: "var(--z-on-accent)" }}
        >
          + Add Service
        </button>
      </div>

      {/* Core 4 */}
      {core.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--z-muted)]">Core 4</div>
          {core.map(s => <ServiceRow key={s.id} s={s} onEdit={openEdit} onToggle={handleToggle} />)}
        </div>
      )}

      {/* Separator */}
      {core.length > 0 && other.length > 0 && (
        <div className="border-t border-[var(--z-border)]" />
      )}

      {/* Other services */}
      {other.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--z-muted)]">Additional Services</div>
          {other.map(s => <ServiceRow key={s.id} s={s} onEdit={openEdit} onToggle={handleToggle} />)}
        </div>
      )}

      {loading && (
        <div className="py-8 text-center text-sm text-[var(--z-muted)]">Loading…</div>
      )}

      {!loading && services.length === 0 && (
        <div className="rounded-xl border border-dashed border-[var(--z-border)] py-10 text-center">
          <div className="text-2xl mb-2">🎵</div>
          <div className="text-sm font-medium text-[var(--z-fg)]">No services yet</div>
          <div className="text-xs text-[var(--z-muted)] mt-1">Add your first service to start building invoices</div>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div
            className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
            style={{ background: "var(--z-surface)", borderColor: "var(--z-border)" }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--z-border)" }}>
              <div className="text-sm font-bold text-[var(--z-fg)]">
                {editing ? "Edit Service" : "New Service"}
              </div>
              <button onClick={() => setShowForm(false)} className="text-[var(--z-muted)] hover:text-[var(--z-fg)] text-xl">×</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Service name */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                  Service Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Music Session"
                  required
                  className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]"
                />
              </div>

              {/* Instrument sub-category */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                  Instrument / Sub-Category
                </label>
                <select
                  value={form.sub_category ?? ""}
                  onChange={e => setForm(f => ({ ...f, sub_category: e.target.value || null }))}
                  className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]"
                >
                  <option value="">— None —</option>
                  <optgroup label="Core 4">
                    {CORE_INSTRUMENTS.map(i => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Other Instruments">
                    {OTHER_INSTRUMENTS.map(i => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Price + unit */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                    Default Price ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.unit_price}
                    onChange={e => setForm(f => ({ ...f, unit_price: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                    Unit Label
                  </label>
                  <select
                    value={form.unit_label}
                    onChange={e => setForm(f => ({ ...f, unit_label: e.target.value }))}
                    className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]"
                  >
                    <option value="session">session</option>
                    <option value="month">month</option>
                    <option value="item">item</option>
                    <option value="hour">hour</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                  Description (optional)
                </label>
                <textarea
                  value={form.description ?? ""}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value || null }))}
                  rows={2}
                  className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)] resize-none"
                />
              </div>

              {/* Flags */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-[var(--z-fg)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_core}
                    onChange={e => setForm(f => ({ ...f, is_core: e.target.checked }))}
                    className="accent-[var(--z-accent)]"
                  />
                  Core service
                </label>
                <label className="flex items-center gap-2 text-sm text-[var(--z-fg)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.taxable}
                    onChange={e => setForm(f => ({ ...f, taxable: e.target.checked }))}
                    className="accent-[var(--z-accent)]"
                  />
                  Taxable
                </label>
              </div>

              {error && (
                <div className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold border border-[var(--z-border)] text-[var(--z-muted)] hover:text-[var(--z-fg)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ background: "var(--z-accent)", color: "var(--z-on-accent)" }}
                >
                  {saving ? "Saving…" : editing ? "Save Changes" : "Add Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ServiceRow({
  s,
  onEdit,
  onToggle,
}: {
  s: Service;
  onEdit: (s: Service) => void;
  onToggle: (s: Service) => void;
}) {
  const label = s.sub_category ? `${s.name} — ${s.sub_category}` : s.name;
  return (
    <div
      className="flex items-center gap-3 rounded-xl border px-4 py-3 transition-opacity"
      style={{
        borderColor: "var(--z-border)",
        background: "var(--z-surface)",
        opacity: s.active ? 1 : 0.5,
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-[var(--z-fg)] truncate">{label}</div>
        <div className="text-xs text-[var(--z-muted)]">
          {s.unit_price > 0 ? `$${s.unit_price.toFixed(2)} / ${s.unit_label}` : `Per ${s.unit_label} — price set on invoice`}
          {s.is_core && <span className="ml-2 text-[var(--z-accent)]">Core</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(s)}
          className="text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)] transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onToggle(s)}
          className="text-xs transition-colors"
          style={{ color: s.active ? "var(--z-muted)" : "var(--z-accent)" }}
        >
          {s.active ? "Deactivate" : "Activate"}
        </button>
      </div>
    </div>
  );
}
