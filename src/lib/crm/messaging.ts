/**
 * Messaging OS integration for CRM contacts.
 * Returns the outbound channels available for a given contact.
 */
import { getContactById } from "@data/contacts";
import type { Contact } from "@/lib/types/crm";

export type ContactChannel =
  | { kind: "email"; address: string }
  | { kind: "sms"; number: string }
  | { kind: "phone"; number: string };

export async function listChannelsForContact(
  tenantId: string,
  contactId: string,
): Promise<{ contact: Contact | null; channels: ContactChannel[] }> {
  const contact = await getContactById(tenantId, contactId);
  if (!contact) return { contact: null, channels: [] };
  const channels: ContactChannel[] = [];
  if (contact.email) channels.push({ kind: "email", address: contact.email });
  if (contact.phone) {
    channels.push({ kind: "sms", number: contact.phone });
    channels.push({ kind: "phone", number: contact.phone });
  }
  return { contact, channels };
}
