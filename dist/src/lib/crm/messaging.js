/**
 * Messaging OS integration for CRM contacts.
 * Returns the outbound channels available for a given contact.
 */
import { getContactById } from "@data/contacts";
export async function listChannelsForContact(tenantId, contactId) {
    const contact = await getContactById(tenantId, contactId);
    if (!contact)
        return { contact: null, channels: [] };
    const channels = [];
    if (contact.email)
        channels.push({ kind: "email", address: contact.email });
    if (contact.phone) {
        channels.push({ kind: "sms", number: contact.phone });
        channels.push({ kind: "phone", number: contact.phone });
    }
    return { contact, channels };
}
