import Papa from "papaparse";

export interface ParsedTransaction {
  date: string | null;
  description: string | null;
  amount: number | null;
  type: "debit" | "credit" | "unknown";
  raw: Record<string, string>;
}

/**
 * Parse a CSV file (Buffer or string) into an array of transactions.
 * Handles common bank/QuickBooks CSV export formats.
 */
export function parseCsvFile(content: string): ParsedTransaction[] {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  return (result.data ?? []).map((row) => {
    // Try common date column names
    const dateRaw =
      row["date"] ?? row["transaction_date"] ?? row["posted_date"] ?? row["trans_date"] ?? null;

    // Try common description column names
    const description =
      row["description"] ?? row["memo"] ?? row["payee"] ?? row["name"] ?? row["details"] ?? null;

    // Try common amount column names — some CSVs split debit/credit
    let amount: number | null = null;
    let type: "debit" | "credit" | "unknown" = "unknown";

    const amountRaw = row["amount"] ?? row["transaction_amount"] ?? row["net_amount"] ?? null;
    const debitRaw = row["debit"] ?? row["withdrawal"] ?? row["charges"] ?? null;
    const creditRaw = row["credit"] ?? row["deposit"] ?? row["payments"] ?? null;

    if (amountRaw != null && amountRaw !== "") {
      const n = parseFloat(amountRaw.replace(/[^0-9.\-]/g, ""));
      if (!isNaN(n)) {
        amount = n;
        type = n < 0 ? "debit" : "credit";
      }
    } else if (debitRaw && debitRaw !== "") {
      const n = parseFloat(debitRaw.replace(/[^0-9.]/g, ""));
      if (!isNaN(n) && n !== 0) { amount = -n; type = "debit"; }
    } else if (creditRaw && creditRaw !== "") {
      const n = parseFloat(creditRaw.replace(/[^0-9.]/g, ""));
      if (!isNaN(n) && n !== 0) { amount = n; type = "credit"; }
    }

    // Normalize date to YYYY-MM-DD
    let date: string | null = null;
    if (dateRaw) {
      try {
        const d = new Date(dateRaw);
        if (!isNaN(d.getTime())) {
          date = d.toISOString().split("T")[0];
        }
      } catch {
        date = dateRaw;
      }
    }

    return { date, description: description?.trim() ?? null, amount, type, raw: row };
  });
}

/**
 * Parse a QuickBooks Online (QBO/OFX) file into transactions.
 * QBO files are XML-like OFX format.
 */
export function parseQboFile(content: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];

  // Extract STMTTRN blocks
  const txnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match: RegExpExecArray | null;

  while ((match = txnRegex.exec(content)) !== null) {
    const block = match[1];

    const get = (tag: string): string | null => {
      const m = new RegExp(`<${tag}>([^<]+)`, "i").exec(block);
      return m ? m[1].trim() : null;
    };

    const trntype = get("TRNTYPE") ?? "";
    const dtposted = get("DTPOSTED");
    const trnamt = get("TRNAMT");
    const memo = get("MEMO") ?? get("NAME") ?? null;

    let date: string | null = null;
    if (dtposted && dtposted.length >= 8) {
      // OFX date format: YYYYMMDD or YYYYMMDDHHMMSS
      date = `${dtposted.slice(0, 4)}-${dtposted.slice(4, 6)}-${dtposted.slice(6, 8)}`;
    }

    let amount: number | null = null;
    let type: "debit" | "credit" | "unknown" = "unknown";
    if (trnamt) {
      const n = parseFloat(trnamt);
      if (!isNaN(n)) {
        amount = n;
        type = trntype.toUpperCase() === "DEBIT" || n < 0 ? "debit" : "credit";
      }
    }

    transactions.push({ date, description: memo, amount, type, raw: { TRNTYPE: trntype, DTPOSTED: dtposted ?? "", TRNAMT: trnamt ?? "", MEMO: memo ?? "" } });
  }

  return transactions;
}
