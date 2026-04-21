import { redirect } from "next/navigation";
export default function NewStudentPage({ searchParams, }) {
    const familyId = searchParams === null || searchParams === void 0 ? void 0 : searchParams.familyId;
    const target = familyId ? `/students?new=true&familyId=${familyId}` : "/students?new=true";
    redirect(target);
}
