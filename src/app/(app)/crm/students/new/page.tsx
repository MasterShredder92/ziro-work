import { redirect } from "next/navigation";

export default function NewStudentPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const familyId = searchParams?.familyId;
  const target = familyId ? `/students?new=true&familyId=${familyId}` : "/students?new=true";
  redirect(target);
}
