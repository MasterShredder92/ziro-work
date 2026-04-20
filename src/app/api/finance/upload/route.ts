import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseCsvFile, parseQboFile } from "@/lib/finance/parsers";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File;
  const bankAccountId = form.get("bankAccountId") as string;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  const fileType =
    ext === "csv" ? "csv" :
    ext === "qbo" ? "qbo" :
    "pdf";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const filePath = `bank-statements/${bankAccountId}/${year}/${month}/${file.name}`;

  // Upload file to Supabase Storage
  await supabase.storage
    .from("bank-statements")
    .upload(filePath, file, { upsert: true });

  // Insert statement record
  const { data: statement } = await supabase
    .from("bank_statements")
    .insert({
      bank_account_id: bankAccountId,
      file_type: fileType,
      file_path: filePath,
      statement_month: month,
      statement_year: year,
    })
    .select()
    .single();

  // Parse file
  const buffer = Buffer.from(await file.arrayBuffer());

  if (fileType === "csv") {
    await parseCsvFile(buffer, bankAccountId, statement.id);
  } else if (fileType === "qbo") {
    await parseQboFile(buffer, bankAccountId, statement.id);
  }

  return NextResponse.json({ success: true });
}
