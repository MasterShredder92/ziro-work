import { listContacts } from "@data/contacts";
import { searchCRM } from "@/lib/crm";
import { parseContactSortParams, sortContactsList } from "@/lib/crm/contactListSort";
import type { ContactKind } from "@/lib/types/crm";
import { getCRMTenantId } from "../_tenant";
import { CRMLayout, CRMNav, EmptyState } from "../_components";
import { ContactsListClient } from "./contacts-list-client";

export const dynamic = "force-dynamic";

type ContactListProps = {
  searchParams?: Promise<{
    search?: string;
    q?: string;
    kind?: string;
    status?: string;
    tag?: string;
    includeArchived?: string;
    /** When set to `contact`, unified search uses `searchCRM` (see GET /api/crm/search). */
    type?: string;
    sort?: string;
    dir?: string;
  }>;
};

export default async function ContactListPage({ searchParams }: ContactListProps) {
  const tenantId = await getCRMTenantId();
  const params = (await searchParams) ?? {};
  const kind = params.kind as ContactKind | undefined;
  const q = (params.q ?? params.search ?? "").trim();
  const useCrmSearch =
    q.length > 0 && (params.type === "contact" || params.type === undefined);
  const { sortKey, sortDir } = parseContactSortParams(
    params.sort,
    params.dir,
  );

  let contacts;
  if (useCrmSearch && q) {
    const result = await searchCRM(tenantId, q, { limit: 200 });
    contacts = result.contacts;
    if (kind && ["lead", "student", "family", "teacher"].includes(kind)) {
      contacts = contacts.filter((c) => c.kind === kind);
    }
  } else {
    contacts = await listContacts(
      tenantId,
      {
        search: (params.search ?? q) || undefined,
        kind:
          kind && ["lead", "student", "family", "teacher"].includes(kind)
            ? kind
            : undefined,
        status: params.status,
        tag: params.tag,
        includeArchived: params.includeArchived === "true",
      },
      200,
    );
  }

  contacts = sortContactsList(contacts, sortKey, sortDir);

  return (
    <CRMLayout
      title="Contacts"
      subtitle="Unified search across leads, students, families, and teachers."
    >
      <CRMNav current="contacts" />
      <form className="mb-4 flex flex-wrap gap-2" method="get">
        <input type="hidden" name="type" value="contact" />
        {params.sort ? (
          <input type="hidden" name="sort" value={params.sort} />
        ) : null}
        {params.dir ? (
          <input type="hidden" name="dir" value={params.dir} />
        ) : null}
        <input
          type="search"
          name="q"
          placeholder="Search name, email, phone…"
          defaultValue={params.q ?? params.search ?? ""}
          className="h-9 w-64 rounded-md border border-[#1c1c1e] bg-[#0a0a0c] px-3 text-sm text-[#f0f0f0] placeholder:text-[#606068]"
        />
        <select
          name="kind"
          defaultValue={params.kind ?? ""}
          className="h-9 rounded-md border border-[#1c1c1e] bg-[#0a0a0c] px-3 text-sm text-[#f0f0f0]"
        >
          <option value="">All roles</option>
          <option value="lead">Leads</option>
          <option value="student">Students</option>
          <option value="family">Families</option>
          <option value="teacher">Teachers</option>
        </select>
        <label className="inline-flex items-center gap-2 text-xs text-[#909098]">
          <input
            type="checkbox"
            name="includeArchived"
            value="true"
            defaultChecked={params.includeArchived === "true"}
          />
          Include archived
        </label>
        <button
          type="submit"
          className="h-9 rounded-md bg-[#c4f036]/10 px-3 text-sm font-semibold text-[#c4f036] hover:bg-[#c4f036]/20"
        >
          Search
        </button>
      </form>

      {contacts.length === 0 ? (
        <EmptyState
          title="No matching contacts"
          body={
            q
              ? "Try a different search term or clear filters."
              : "Add leads, students, and families to see them here."
          }
        />
      ) : (
        <ContactsListClient contacts={contacts} />
      )}
    </CRMLayout>
  );
}
