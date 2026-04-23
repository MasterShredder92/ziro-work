import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function StudentsIndexPage() {
  redirect("/crm/families");
}
