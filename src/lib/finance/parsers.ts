import Papa from "papaparse";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export async function parseCsvFile(
  buffer: Buffer,
  bankAccountId: string,
  statementId: string
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const csv = buffer.toString("utf8");
  const parsed = Papa.parse(csv, { header: true });

  for (const row of parsed.data as any[]) {
    if (!row["Post Date"]) continue;

    const date = new Date(row["Post Date"]);
    const rawAmount = row["Amount"].replace(/[()$]/g, "");
    const amount = row["Amount"].includes("(")
      ? -Math.abs(parseFloat(rawAmount))
      : parseFloat(rawAmount);

    const description = `${row["Description"]} ${row["Text"] || ""}`.trim();

    const hash = crypto
      .createHash("sha256")
      .update(`${date}-${amount}-${description}-${row["Reference"]}`)
      .digest("hex");

    await supabase.from("bank_transactions").insert({
      bank_account_id: bankAccountId,
      source_statement_id: statementId,
      date,
      amount,
      description,
      type: row["Type"],
      hash,
    }).catch(() => {});
  }
}
