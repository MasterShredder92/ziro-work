import { GET as apiGet, PATCH as apiPatch, DELETE as apiDelete, } from "@/app/api/templates/[id]/route";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req, ctx) {
    return apiGet(req, ctx);
}
export async function PATCH(req, ctx) {
    return apiPatch(req, ctx);
}
export async function DELETE(req, ctx) {
    return apiDelete(req, ctx);
}
