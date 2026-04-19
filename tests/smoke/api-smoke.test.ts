import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { POST as sendMessagePost } from "../../src/app/api/messages/send/route";
import { POST as filesUploadPost } from "../../src/app/api/files/upload/route";
import { POST as schedulingCreatePost } from "../../src/app/api/scheduling/create/route";
import { POST as billingSubscriptionsPost } from "../../src/app/api/billing/subscriptions/route";
import { POST as automationRunPost } from "../../src/app/api/automation/run/route";

function jsonRequest(url: string, payload: unknown): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

describe("API smoke checks", () => {
  it("POST /api/messages/send rejects invalid body safely", async () => {
    const res = await sendMessagePost(
      jsonRequest("http://localhost/api/messages/send", {}),
    );
    expect(res.status).toBe(400);
  });

  it("POST /api/files/upload rejects invalid body safely", async () => {
    const res = await filesUploadPost(
      jsonRequest("http://localhost/api/files/upload", {}),
    );
    expect(res.status).toBe(400);
  });

  it("POST /api/scheduling/create rejects invalid body safely", async () => {
    const res = await schedulingCreatePost(
      jsonRequest("http://localhost/api/scheduling/create", {}),
    );
    expect(res.status).toBe(400);
  });

  it("POST /api/billing/subscriptions handles unauthenticated request", async () => {
    const res = await billingSubscriptionsPost(
      jsonRequest("http://localhost/api/billing/subscriptions", {}),
    );
    expect([400, 401, 403, 500]).toContain(res.status);
  });

  it("POST /api/automation/run rejects invalid body safely", async () => {
    const res = await automationRunPost(
      jsonRequest("http://localhost/api/automation/run", {}),
    );
    expect(res.status).toBe(400);
  });
});
