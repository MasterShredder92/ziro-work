import Papa from "papaparse";
/**
 * Parse a CSV file (Buffer or string) into an array of transactions.
 * Handles common bank/QuickBooks CSV export formats.
 */
export function parseCsvFile(content) {
    var _a;
    const result = Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
    });
    return ((_a = result.data) !== null && _a !== void 0 ? _a : []).map((row) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
        // Try common date column names
        const dateRaw = (_d = (_c = (_b = (_a = row["date"]) !== null && _a !== void 0 ? _a : row["transaction_date"]) !== null && _b !== void 0 ? _b : row["posted_date"]) !== null && _c !== void 0 ? _c : row["trans_date"]) !== null && _d !== void 0 ? _d : null;
        // Try common description column names
        const description = (_j = (_h = (_g = (_f = (_e = row["description"]) !== null && _e !== void 0 ? _e : row["memo"]) !== null && _f !== void 0 ? _f : row["payee"]) !== null && _g !== void 0 ? _g : row["name"]) !== null && _h !== void 0 ? _h : row["details"]) !== null && _j !== void 0 ? _j : null;
        // Try common amount column names — some CSVs split debit/credit
        let amount = null;
        let type = "unknown";
        const amountRaw = (_m = (_l = (_k = row["amount"]) !== null && _k !== void 0 ? _k : row["transaction_amount"]) !== null && _l !== void 0 ? _l : row["net_amount"]) !== null && _m !== void 0 ? _m : null;
        const debitRaw = (_q = (_p = (_o = row["debit"]) !== null && _o !== void 0 ? _o : row["withdrawal"]) !== null && _p !== void 0 ? _p : row["charges"]) !== null && _q !== void 0 ? _q : null;
        const creditRaw = (_t = (_s = (_r = row["credit"]) !== null && _r !== void 0 ? _r : row["deposit"]) !== null && _s !== void 0 ? _s : row["payments"]) !== null && _t !== void 0 ? _t : null;
        if (amountRaw != null && amountRaw !== "") {
            const n = parseFloat(amountRaw.replace(/[^0-9.\-]/g, ""));
            if (!isNaN(n)) {
                amount = n;
                type = n < 0 ? "debit" : "credit";
            }
        }
        else if (debitRaw && debitRaw !== "") {
            const n = parseFloat(debitRaw.replace(/[^0-9.]/g, ""));
            if (!isNaN(n) && n !== 0) {
                amount = -n;
                type = "debit";
            }
        }
        else if (creditRaw && creditRaw !== "") {
            const n = parseFloat(creditRaw.replace(/[^0-9.]/g, ""));
            if (!isNaN(n) && n !== 0) {
                amount = n;
                type = "credit";
            }
        }
        // Normalize date to YYYY-MM-DD
        let date = null;
        if (dateRaw) {
            try {
                const d = new Date(dateRaw);
                if (!isNaN(d.getTime())) {
                    date = d.toISOString().split("T")[0];
                }
            }
            catch (_v) {
                date = dateRaw;
            }
        }
        return { date, description: (_u = description === null || description === void 0 ? void 0 : description.trim()) !== null && _u !== void 0 ? _u : null, amount, type, raw: row };
    });
}
/**
 * Parse a QuickBooks Online (QBO/OFX) file into transactions.
 * QBO files are XML-like OFX format.
 */
export function parseQboFile(content) {
    var _a, _b, _c;
    const transactions = [];
    // Extract STMTTRN blocks
    const txnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
    let match;
    while ((match = txnRegex.exec(content)) !== null) {
        const block = match[1];
        const get = (tag) => {
            const m = new RegExp(`<${tag}>([^<]+)`, "i").exec(block);
            return m ? m[1].trim() : null;
        };
        const trntype = (_a = get("TRNTYPE")) !== null && _a !== void 0 ? _a : "";
        const dtposted = get("DTPOSTED");
        const trnamt = get("TRNAMT");
        const memo = (_c = (_b = get("MEMO")) !== null && _b !== void 0 ? _b : get("NAME")) !== null && _c !== void 0 ? _c : null;
        let date = null;
        if (dtposted && dtposted.length >= 8) {
            // OFX date format: YYYYMMDD or YYYYMMDDHHMMSS
            date = `${dtposted.slice(0, 4)}-${dtposted.slice(4, 6)}-${dtposted.slice(6, 8)}`;
        }
        let amount = null;
        let type = "unknown";
        if (trnamt) {
            const n = parseFloat(trnamt);
            if (!isNaN(n)) {
                amount = n;
                type = trntype.toUpperCase() === "DEBIT" || n < 0 ? "debit" : "credit";
            }
        }
        transactions.push({ date, description: memo, amount, type, raw: { TRNTYPE: trntype, DTPOSTED: dtposted !== null && dtposted !== void 0 ? dtposted : "", TRNAMT: trnamt !== null && trnamt !== void 0 ? trnamt : "", MEMO: memo !== null && memo !== void 0 ? memo : "" } });
    }
    return transactions;
}
