import "server-only";
import { NextResponse } from "next/server";
import { AdminApiError } from "./_context";
import { serializeError } from "@/lib/http";
export function handleError(err) {
    if (err instanceof AdminApiError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
        return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    if (err instanceof Error && err.message === "UNAUTHENTICATED") {
        return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    return NextResponse.json(serializeError(err), { status: 500 });
}
