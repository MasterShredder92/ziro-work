import { jsx as _jsx } from "react/jsx-runtime";
import { SignatureSignerFlow } from "../../components";
export const dynamic = "force-dynamic";
export default async function SignaturePublicPage({ params }) {
    const { token } = await params;
    return _jsx(SignatureSignerFlow, { token: token });
}
