/**
 * Push ZiroWork invoices into Square so Square handles charging + emails + retries.
 *
 * Flow:
 *   1. Create Order (with line items) -> returns order_id
 *   2. Create Invoice (linked to order_id, customer_id, due_date)
 *      - store_payment_method_enabled: ALWAYS true so the customer-facing Square
 *        invoice page shows the "Save this card for future payments" option.
 *        This is the SSOT card-on-file capture mechanism.
 *      - automatic_payment_source: CARD_ON_FILE only when family already has
 *        a Square card_id; otherwise NONE (Square emails the customer a pay link).
 *   3. Publish Invoice -> Square sends email and (if card-on-file) auto-charges.
 *
 * Returns the Square invoice id + public URL.
 *
 * Errors are tagged [STALE_CUSTOMER] when Square reports the cached square_customer_id
 * no longer exists, so the caller can null-and-retry the family resolver.
 */

const SQUARE_API = "https://connect.squareup.com";
const SQUARE_VERSION = "2024-01-17";

export type SquarePushInput = {
  squareCustomerId: string;
  squareLocationId: string;
  /** Square card_on_file id (NOT the saved card token). Null = no card on file yet. */
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
  /**
   * Optional. Defaults to true. Allows the customer to save their card to the
   * family on the Square pay-invoice page. Future invoices for that family
   * can then auto-charge via CARD_ON_FILE.
   */
  storePaymentMethodEnabled?: boolean;
};

export type SquarePushResult = {
  squareInvoiceId: string;
  squareOrderId: string;
  publicUrl: string | null;
  status: string;
  /** True when this push attached a stored card and will auto-charge. */
  autoCharge: boolean;
  /** True when Square will let the customer save card-on-file from the pay page. */
  storePaymentMethodEnabled: boolean;
};

type SquareError = { detail?: string; code?: string };

async function squareCall<T = unknown>(
  path: string,
  method: "POST" | "GET" | "PUT",
  body: unknown,
  token: string,
): Promise<{
  ok: boolean;
  status: number;
  body: T & { errors?: SquareError[] };
}> {
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
    return {
      ok: res.ok,
      status: res.status,
      body: json as T & { errors?: SquareError[] },
    };
  } finally {
    clearTimeout(timer);
  }
}

function tagStaleCustomer(err: string, code: string): string {
  if (code === "NOT_FOUND" || /Customer with id .* was not found/i.test(err)) {
    return " [STALE_CUSTOMER]";
  }
  return "";
}

/**
 * Create a Square Order, then a Square Invoice, then publish it.
 */
export async function pushInvoiceToSquare(
  input: SquarePushInput,
): Promise<SquarePushResult> {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) {
    throw new Error("SQUARE_ACCESS_TOKEN not configured");
  }

  // Card-on-file capture defaults ON. Caller can opt out only if explicitly false.
  const storePaymentMethodEnabled = input.storePaymentMethodEnabled !== false;
  const autoCharge = !!input.squareCardId;

  // ── 1. Create Order ──
  // Stable, deterministic key so double-clicks / retries cannot double-bill.
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
    token,
  );
  if (!orderRes.ok || !orderRes.body.order?.id) {
    const err =
      orderRes.body.errors?.[0]?.detail ||
      `Order create failed (${orderRes.status})`;
    const code = orderRes.body.errors?.[0]?.code || "";
    throw new Error(`Square Order: ${err}${tagStaleCustomer(err, code)}`);
  }
  const orderId = orderRes.body.order.id;

  // ── 2. Create Invoice ──
  const invoicePayload: Record<string, unknown> = {
    location_id: input.squareLocationId,
    order_id: orderId,
    primary_recipient: { customer_id: input.squareCustomerId },
    delivery_method: "EMAIL",
    title: input.invoiceTitle,
    description: input.description ?? "",
    accepted_payment_methods: {
      card: true,
      square_gift_card: false,
      bank_account: false,
      buy_now_pay_later: false,
    },
    // CRITICAL: enables "Save card on file" option on the Square pay page.
    store_payment_method_enabled: storePaymentMethodEnabled,
    payment_requests: [
      {
        request_type: "BALANCE",
        due_date: input.dueDate,
        automatic_payment_source: autoCharge ? "CARD_ON_FILE" : "NONE",
        ...(autoCharge ? { card_id: input.squareCardId } : {}),
        reminders: autoCharge
          ? []
          : [
              {
                relative_scheduled_days: -1,
                message: "Reminder: your invoice is due tomorrow.",
              },
              {
                relative_scheduled_days: 3,
                message:
                  "Your invoice is overdue. Please pay to keep your lessons active.",
              },
            ],
      },
    ],
  };

  const invoiceRes = await squareCall<{
    invoice: {
      id: string;
      version: number;
      public_url?: string;
      status: string;
    };
  }>(
    "/v2/invoices",
    "POST",
    {
      idempotency_key: `inv-${baseKey}`,
      invoice: invoicePayload,
    },
    token,
  );
  if (!invoiceRes.ok || !invoiceRes.body.invoice?.id) {
    const err =
      invoiceRes.body.errors?.[0]?.detail ||
      `Invoice create failed (${invoiceRes.status})`;
    const code = invoiceRes.body.errors?.[0]?.code || "";
    throw new Error(`Square Invoice: ${err}${tagStaleCustomer(err, code)}`);
  }
  const sqInv = invoiceRes.body.invoice;

  // ── 3. Publish Invoice ──
  const publishRes = await squareCall<{
    invoice: { id: string; status: string; public_url?: string };
  }>(
    `/v2/invoices/${sqInv.id}/publish`,
    "POST",
    {
      version: sqInv.version,
      idempotency_key: `pub-${baseKey}`,
    },
    token,
  );
  if (!publishRes.ok) {
    const err =
      publishRes.body.errors?.[0]?.detail ||
      `Publish failed (${publishRes.status})`;
    throw new Error(`Square Publish: ${err}`);
  }

  return {
    squareInvoiceId: sqInv.id,
    squareOrderId: orderId,
    publicUrl: publishRes.body.invoice?.public_url ?? sqInv.public_url ?? null,
    status: publishRes.body.invoice?.status ?? sqInv.status,
    autoCharge,
    storePaymentMethodEnabled,
  };
}
