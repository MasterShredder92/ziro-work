import { redirect } from "next/navigation";

export default function NewFamilyPage() {
  redirect("/families?new=true");
}
