/**
 * Push ZiroWork invoices into Square so Square handles charging + emails + retries.
 *
 * Flow:
 *   1. Create Order (with line items) → returns order_id
 *   2. Create Invoice (linked to order_id, customer_id, due_date)
 *   3. Publish Invoice → Square sends email + auto-charges card-on-file if available
 *
 * Returns the Square invoice id + public URL.
 *
 * If family has square_card_id → autocharge mode (CARD_ON_FILE)
 * Else → email mode (Square emails the family a "pay now" link, also stores card after first pay)
 */

const SQUARE_API = "https://connect.squareup.com";
const SQUARE_VERSION = "2024-01-17";

export type SquarePushInput = {
  squareCustomerId: string;
  squareLocationId: string;
  squareCardId: string | null;
  invoiceTitle: string;
  description: string | null;
  dueDate: string; // YYYY-MM-DD
  lineItems: Array<{
    name: string;
    quantity: number;
    unitPriceCents: number;
  }>;
  /** Stable idempotency key (use ZiroWork invoice.id). Square dedupes 24h. */
  idempotencyKey: string;
};

export type SquarePushResult = {
  squareInvoiceId: string;
  squareOrderId: string;
  publicUrl: string | null;
  status: string;
  autoCharge: boolean;
};

async function squareCall<T = unknown>(
  path: string,
  method: "POST" | "GET" | "PUT",
  body: unknown,
  token: string
): Promise<{ ok: boolean; status: number; body: T & { errors?: Array<{ detail: string; code: string }> } }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20_000);
  try {
    const res = await fetch(`${SQUARE_API}${path}`, {
      method,
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        "Square-Version": SQUARE_VERSION,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    let json: unknown = {};
    try {
      json = await res.json();
    } catch {
      json = {};
    }
    return { ok: res.ok, status: res.status, body: json as T & { errors?: Array<{ detail: string; code: string }> } };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Create a Square Order, then a Square Invoice, then publish it.
 */
export async function pushInvoiceToSquare(input: SquarePushInput): Promise<SquarePushResult> {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) {
    throw new Error("SQUARE_ACCESS_TOKEN not configured");
  }

  // ── 1. Create Order ──
  // Use stable, deterministic key so double-clicks / retries cannot double-bill
  const baseKey = input.idempotencyKey.slice(0, 40); // Square max 45 chars
  const orderRes = await squareCall<{ order: { id: string } }>(
    "/v2/orders",
    "POST",
    {
      idempotency_key: `ord-${baseKey}`,
      order: {
        location_id: input.squareLocationId,
        customer_id: input.squareCustomerId,
        line_items: input.lineItems.map((li) => ({
          name: li.name,
          quantity: String(li.quantity),
          base_price_money: {
            amount: li.unitPriceCents,
            currency: "USD",
          },
        })),
      },
    },
    token
  );
  if (!orderRes.ok || !orderRes.body.order?.id) {
    const err = orderRes.body.errors?.[0]?.detail || `Order create failed (${orderRes.status})`;
    throw new Error(`Square Order: ${err}`);
  }
  const orderId = orderRes.body.order.id;

  // ── 2. Create Invoice ──
  const autoCharge = !!input.squareCardId;
  const invoiceRes = await squareCall<{ invoice: { id: string; version: number; public_url?: string; status: string } }>(
    "/v2/invoices",
    "POST",
    {
      idempotency_key: `inv-${baseKey}`,
      invoice: {
        location_id: input.squareLocationId,
        order_id: orderId,
        primary_recipient: { customer_id: input.squareCustomerId },
        delivery_method: "EMAIL",
        title: input.invoiceTitle,
        description: input.description ?? "",
        scheduled_at: undefined, // null = publish immediately
        accepted_payment_methods: {
          card: true,
          square_gift_card: false,
          bank_account: false,
          buy_now_pay_later: false,
        },
        payment_requests: [
          {
            request_type: "BALANCE",
            due_date: input.dueDate,
            automatic_payment_source: autoCharge ? "CARD_ON_FILE" : "NONE",
            card_id: autoCharge ? input.squareCardId : undefined,
            // Have Square remind the customer if unpaid
            reminders: autoCharge
              ? []
              : [
                  { relative_scheduled_days: -1, message: "Reminder: your invoice is due tomorrow." },
                  { relative_scheduled_days: 3, message: "Your invoice is overdue. Please pay to keep your lessons active." },
                ],
          },
        ],
      },
    },
    token
  );
  if (!invoiceRes.ok || !invoiceRes.body.invoice?.id) {
    const err = invoiceRes.body.errors?.[0]?.detail || `Invoice create failed (${invoiceRes.status})`;
    throw new Error(`Square Invoice: ${err}`);
  }
  const sqInv = invoiceRes.body.invoice;

  // ── 3. Publish Invoice ──
  const publishRes = await squareCall<{ invoice: { id: string; status: string; public_url?: string } }>(
    `/v2/invoices/${sqInv.id}/publish`,
    "POST",
    {
      version: sqInv.version,
      idempotency_key: `pub-${baseKey}`,
    },
    token
  );
  if (!publishRes.ok) {
    const err = publishRes.body.errors?.[0]?.detail || `Publish failed (${publishRes.status})`;
    throw new Error(`Square Publish: ${err}`);
  }

  return {
    squareInvoiceId: sqInv.id,
    squareOrderId: orderId,
    publicUrl: publishRes.body.invoice?.public_url ?? sqInv.public_url ?? null,
    status: publishRes.body.invoice?.status ?? sqInv.status,
    autoCharge,
  };
}
