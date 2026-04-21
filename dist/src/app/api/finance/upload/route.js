import { NextResponse } from "next/server";
import { parseCsvFile, parseQboFile } from "@/lib/finance/parsers";
export const runtime = "nodejs";
export async function POST(req) {
    try {
        const form = await req.formData();
        const file = form.get("file");
        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }
        const content = await file.text();
        const name = file.name.toLowerCase();
        let transactions;
        if (name.endsWith(".qbo") || name.endsWith(".ofx")) {
            transactions = parseQboFile(content);
        }
        else if (name.endsWith(".csv")) {
            transactions = parseCsvFile(content);
        }
        else {
            return NextResponse.json({ error: "Unsupported file type. Please upload a .csv or .qbo file." }, { status: 400 });
        }
        return NextResponse.json({ success: true, count: transactions.length, transactions });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
